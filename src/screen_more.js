// More: insights & summaries, recurring + forecast, bank sync, currencies, security.
import { useMemo, useState } from 'react';
import { Platform, Pressable, Share, Text, TextInput, View } from 'react-native';
import { C, CATS, CURRENCIES, fmt, font, monthKey, monthLabel, shiftMonth, todayISO, uid } from './theme';
import { balanceOf } from './money';
import { forecast, freqLabel, FREQS, upcomingBills } from './recurring';
import { compareMonths, monthSummary, prevMonthKey, topMerchants, yearSummary } from './summary';
import { buildCSV, rowsToItems, parseCSV } from './csv';
import { hashPin, newSalt, newSecret, otpauthURL, verifyTotp } from './crypto';
import { Bars, Btn, Card, Chip, Empty, Field, MonthNav, Section, Sheet, U, confirmAct, notify } from './ui';

/* ---------------- Insights ---------------- */

function Insights({ txs, settings }) {
  const base = settings.baseCurrency;
  const rates = settings.rates;
  const [mode, setMode] = useState('month');
  const [mk, setMk] = useState(monthKey(todayISO()));
  const [year, setYear] = useState(String(new Date().getFullYear()));

  if (mode === 'year') {
    const y = yearSummary(txs, year, base, rates);
    return (
      <View>
        <View style={{ flexDirection: 'row' }}>
          <Chip label="Monthly" active={false} onPress={() => setMode('month')} />
          <Chip label="Yearly" active={mode === 'year'} onPress={() => setMode('year')} />
        </View>
        <MonthNav label={year} onPrev={() => setYear(String(Number(year) - 1))} onNext={() => setYear(String(Number(year) + 1))} />
        <Card>
          <View style={U.hRow}><Text style={U.sub}>Income</Text><Text style={{ fontWeight: '800', color: C.accent, fontFamily: font.bold }}>{fmt(y.income, base)}</Text></View>
          <View style={[U.hRow, { marginTop: 4 }]}><Text style={U.sub}>Spending</Text><Text style={{ fontWeight: '800', color: C.ink, fontFamily: font.bold }}>{fmt(y.expense, base)}</Text></View>
          <View style={[U.hRow, { marginTop: 4 }]}><Text style={U.sub}>Net</Text><Text style={{ fontWeight: '800', color: y.net >= 0 ? C.accent : C.danger, fontFamily: font.bold }}>{fmt(y.net, base)}</Text></View>
        </Card>
        <Text style={U.sub}>Income by month</Text>
        <Bars rows={y.months.map((m) => ({ label: m.mk.slice(5), value: m.income, color: C.accent }))} format={(v) => fmt(v, base)} />
        <Text style={U.sub}>Spending by month</Text>
        <Bars rows={y.months.map((m) => ({ label: m.mk.slice(5), value: m.expense, color: C.ink }))} format={(v) => fmt(v, base)} />
      </View>
    );
  }

  const cur = monthSummary(txs, mk, base, rates);
  const prev = monthSummary(txs, prevMonthKey(mk), base, rates);
  const cmp = compareMonths(cur, prev);
  const tops = topMerchants(txs, mk, base, rates, 5);
  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <Chip label="Monthly" active={mode === 'month'} onPress={() => setMode('month')} />
        <Chip label="Yearly" active={false} onPress={() => setMode('year')} />
      </View>
      <MonthNav label={monthLabel(mk)} onPrev={() => setMk(shiftMonth(mk, -1))} onNext={() => setMk(shiftMonth(mk, 1))} />
      <Card>
        <View style={U.hRow}><Text style={U.sub}>Income</Text><Text style={{ fontWeight: '800', color: C.accent, fontFamily: font.bold }}>{fmt(cur.income, base)}</Text></View>
        <View style={[U.hRow, { marginTop: 4 }]}><Text style={U.sub}>Spending</Text><Text style={{ fontWeight: '800', color: C.ink, fontFamily: font.bold }}>{fmt(cur.expense, base)}</Text></View>
        <View style={[U.hRow, { marginTop: 4 }]}><Text style={U.sub}>Net · saving {cur.rate.toFixed(0)}%</Text><Text style={{ fontWeight: '800', color: cur.net >= 0 ? C.accent : C.danger, fontFamily: font.bold }}>{fmt(cur.net, base)}</Text></View>
        <View style={U.divider} />
        <Text style={{ fontSize: 12, color: C.muted, fontFamily: font.regular }}>
          vs {monthLabel(prevMonthKey(mk))}: spending {cmp.pExpense >= 0 ? 'up' : 'down'} {Math.abs(cmp.pExpense).toFixed(0)}% ({fmt(cmp.dExpense, base)})
        </Text>
        <Text style={U.sub}>Spending by category</Text>
        {cur.topCats.length === 0 && <Empty msg="No spending this month." />}
        <Bars rows={cur.topCats.map((c) => ({ label: c.category, value: c.amount }))} format={(v) => fmt(v, base)} />
        {tops.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={U.sub}>Top merchants</Text>
            {tops.map((m) => (
              <View key={m.merchant} style={[U.hRow, { paddingVertical: 4 }]}>
                <Text style={{ fontSize: 13, color: C.ink, flex: 1, fontFamily: font.regular }} numberOfLines={1}>{m.merchant}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: C.ink, fontFamily: font.bold }}>{fmt(m.amount, base)}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </View>
  );
}

/* ---------------- Recurring ---------------- */

function RecForm({ initial, base, onSave, onClose }) {
  const [label, setLabel] = useState(initial?.label || '');
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '');
  const [currency, setCurrency] = useState(initial?.currency || base);
  const [type, setType] = useState(initial?.type || 'expense');
  const [category, setCategory] = useState(initial?.category || 'Bills & Utilities');
  const [frequency, setFrequency] = useState(initial?.frequency || 'monthly');
  const [nextDate, setNextDate] = useState(initial?.nextDate || todayISO());
  const [active, setActive] = useState(initial?.active !== false);
  const cats = type === 'income' ? CATS.income : CATS.expense;
  const save = () => {
    const n = Number(amount);
    if (!label.trim()) return notify('Name this bill or income.');
    if (!(n > 0)) return notify('Enter an amount greater than 0.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) return notify('Next date must be YYYY-MM-DD.');
    onSave({
      id: initial?.id || uid(),
      label: label.trim().slice(0, 80),
      amount: n,
      currency: CURRENCIES.includes(currency) ? currency : base,
      type,
      category: cats.includes(category) ? category : cats[0],
      frequency, nextDate, active,
    });
    onClose();
  };
  return (
    <View>
      <Field label="Label" placeholder="e.g. Rent, Salary" value={label} onChangeText={setLabel} maxLength={80} />
      <Field label="Amount" placeholder="0.00" keyboardType="numeric" value={amount}
        onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))} />
      <View style={{ flexDirection: 'row' }}>
        {['expense', 'income'].map((t) => (
          <Chip key={t} label={t === 'expense' ? 'Bill (out)' : 'Income (in)'} active={type === t} onPress={() => setType(t)} />
        ))}
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: C.muted, marginTop: 6, fontFamily: font.medium }}>Currency</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
        {CURRENCIES.map((c) => <Chip key={c} label={c} active={currency === c} onPress={() => setCurrency(c)} />)}
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: C.muted, marginTop: 6, fontFamily: font.medium }}>Category</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
        {cats.map((c) => <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />)}
      </View>
      <Text style={{ fontSize: 12, fontWeight: '700', color: C.muted, marginTop: 6, fontFamily: font.medium }}>Repeats</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
        {FREQS.map((f) => <Chip key={f.id} label={f.label} active={frequency === f.id} onPress={() => setFrequency(f.id)} />)}
      </View>
      <Field label="Next date (YYYY-MM-DD)" value={nextDate} maxLength={10}
        onChangeText={(v) => setNextDate(v.replace(/[^0-9\-]/g, '').slice(0, 10))} />
      <Chip label={active ? 'Active' : 'Paused'} active={active} onPress={() => setActive((a) => !a)} />
      <Btn title={initial ? 'Save schedule' : 'Add schedule'} onPress={save} />
    </View>
  );
}

function RecurringSection({ txs, recurrings, settings, onSave, onDelete, onPostDue }) {
  const base = settings.baseCurrency;
  const rates = settings.rates;
  const today = todayISO();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const upcoming = upcomingBills(recurrings, 30, today);
  const due = recurrings.filter((r) => r.active !== false && r.nextDate <= today);
  const fc = useMemo(
    () => forecast(recurrings, balanceOf(txs, base, rates), base, rates, 90, today),
    [recurrings, txs, base, rates, today]
  );
  const rows = fc.points.filter((_, i) => i % 2 === 0).map((p) => ({
    label: p.date.slice(5), value: Math.max(0, p.balance - fc.min), color: C.accent,
  }));
  return (
    <View>
      <Card>
        <Text style={U.sub}>90-day forecast</Text>
        <Text style={U.bigNum}>{fmt(fc.end, base)}</Text>
        <Text style={[U.sub, { marginTop: 2 }]}>Projected balance in 90 days · lowest {fmt(fc.min, base)}</Text>
        <View style={{ marginTop: 8 }}>
          <Bars rows={rows} format={(v) => fmt(v + fc.min, base)} />
        </View>
      </Card>
      {due.length > 0 && <Btn title={`Record ${due.length} due now`} onPress={() => onPostDue(null)} />}
      {upcoming.length > 0 && (
        <View style={{ marginTop: 4 }}>
          <Text style={U.sub}>Coming in 30 days</Text>
          {upcoming.map(({ rec, date }) => (
            <View key={`${rec.id}-${date}`} style={[U.hRow, { paddingVertical: 4 }]}>
              <Text style={{ fontSize: 13, color: C.ink, flex: 1, fontFamily: font.regular }}>{date} · {rec.label} ({freqLabel(rec.frequency).toLowerCase()})</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.ink, fontFamily: font.bold }}>{rec.type === 'income' ? '+' : '−'}{fmt(rec.amount, rec.currency)}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={{ marginTop: 8 }}>
        {recurrings.map((r) => (
          <Card key={r.id}>
            <Pressable onPress={() => { setEditing(r); setShowForm(true); }}>
              <View style={U.hRow}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: C.ink, flex: 1, fontFamily: font.bold }} numberOfLines={1}>
                  {r.active === false ? '[paused] ' : ''}{r.label}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: C.ink, fontFamily: font.bold }}>{r.type === 'income' ? '+' : '−'}{fmt(r.amount, r.currency)}</Text>
              </View>
              <View style={[U.row, { marginTop: 6 }]}>
                {r.active !== false && r.nextDate <= today && (
                  <Pressable onPress={() => onPostDue(r.id)} style={{ marginRight: 14 }}>
                    <Text style={{ color: C.accent, fontWeight: '800', fontSize: 13, fontFamily: font.medium }}>Record due</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => confirmAct('Delete?', `Remove "${r.label}" schedule?`, 'Delete', () => onDelete(r.id))}>
                  <Text style={{ color: C.danger, fontWeight: '700', fontSize: 13, fontFamily: font.bold }}>Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          </Card>
        ))}
      </View>
      <Btn title="+ New bill / recurring income" kind="ghost" onPress={() => { setEditing(null); setShowForm(true); }} />
      <Sheet visible={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit schedule' : 'New schedule'}>
        <RecForm initial={editing} base={base} onSave={onSave} onClose={() => setShowForm(false)} />
      </Sheet>
    </View>
  );
}

/* ---------------- Bank sync (CSV) ---------------- */

function ImportSection({ txs, settings, learned, onImport }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [currency, setCurrency] = useState(settings.baseCurrency);
  const [preview, setPreview] = useState(null);
  const parse = () => {
    const items = rowsToItems(parseCSV(text), txs, currency, learned);
    if (!items.length) return notify('No valid rows found. Need date, merchant, amount.');
    setPreview(items);
  };
  const doImport = () => {
    const fresh = preview.filter((i) => !i.dupe);
    onImport(fresh);
    const skipped = preview.length - fresh.length;
    notify(`Imported ${fresh.length} transaction${fresh.length === 1 ? '' : 's'}${skipped ? `, skipped ${skipped} duplicate${skipped === 1 ? '' : 's'}` : ''}.`);
    setOpen(false); setText(''); setPreview(null);
  };
  return (
    <View>
      <Btn title="Import bank CSV" kind="ghost" onPress={() => setOpen(true)} />
      <Sheet visible={open} onClose={() => { setOpen(false); setPreview(null); }} title="Import bank CSV">
        <Text style={{ fontSize: 12, color: C.muted, fontFamily: font.regular }}>
          Paste statement rows as: date, merchant, amount, currency, type, category, note. Negative amounts count as expenses. Categories auto-fill when missing.
        </Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: C.line, backgroundColor: C.card, borderRadius: 10, padding: 10, fontSize: 13, color: C.ink, minHeight: 120, marginTop: 8, textAlignVertical: 'top' }}
          placeholder={'2026-09-01,Whole Foods,-84.20,USD\n2026-09-01,Employer,2500,USD,income,Salary'}
          placeholderTextColor={C.faint}
          multiline
          value={text}
          onChangeText={setText}
        />
        <Text style={{ fontSize: 12, fontWeight: '700', color: C.muted, marginTop: 8, fontFamily: font.medium }}>Default currency for rows without one</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
          {CURRENCIES.map((c) => <Chip key={c} label={c} active={currency === c} onPress={() => setCurrency(c)} />)}
        </View>
        <Btn title="Preview" onPress={parse} />
        {preview && (
          <View style={{ marginTop: 4 }}>
            {preview.slice(0, 60).map((p, i) => (
              <View key={i} style={[U.hRow, { paddingVertical: 4, opacity: p.dupe ? 0.45 : 1 }]}>
                <Text style={{ fontSize: 12, color: C.ink, flex: 1, fontFamily: font.regular }} numberOfLines={1}>
                  {p.dupe ? '[duplicate] ' : ''}{p.date} · {p.merchant || '(no merchant)'} · {p.category}{p.auto ? ' (auto)' : ''}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.ink, fontFamily: font.bold }}>{p.type === 'income' ? '+' : '−'}{p.amount} {p.currency}</Text>
              </View>
            ))}
            <Btn title={`Import ${preview.filter((p) => !p.dupe).length} transactions`} onPress={doImport} />
          </View>
        )}
      </Sheet>
    </View>
  );
}

function ExportSection({ txs }) {
  const csv = useMemo(() => buildCSV(txs), [txs]);
  const [show, setShow] = useState(false);
  const share = async () => {
    if (Platform.OS === 'web') {
      setShow((s) => !s);
      return;
    }
    try {
      await Share.share({ message: csv, title: 'transactions.csv' });
    } catch {}
  };
  return (
    <View>
      <Card>
        <View style={U.hRow}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.ink, fontFamily: font.bold }}>{txs.length} transactions ready</Text>
          <Pressable onPress={share}>
            <Text style={{ color: C.accent, fontWeight: '800', fontFamily: font.bold }}>{Platform.OS === 'web' ? 'Copy CSV' : 'Share CSV'}</Text>
          </Pressable>
        </View>
        {show && (
          <TextInput
            style={{ borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 8, fontSize: 11, color: C.ink, marginTop: 8, maxHeight: 160 }}
            multiline
            editable={false}
            value={csv.slice(0, 4000)}
          />
        )}
      </Card>
    </View>
  );
}

/* ---------------- Currencies ---------------- */

function CurrencySection({ settings, onUpdate }) {
  const base = settings.baseCurrency;
  const rates = settings.rates;
  const [draft, setDraft] = useState(null);
  const working = draft || rates;
  const dirty = !!draft;
  return (
    <View>
      <Text style={[U.sub, { marginTop: 4 }]}>Base currency — all totals convert to this</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
        {CURRENCIES.map((c) => (
          <Chip key={c} label={c} active={base === c} onPress={() => onUpdate({ baseCurrency: c })} />
        ))}
      </View>
      <Text style={[U.sub, { marginTop: 8 }]}>Rates (units per 1 {base}) — edit to match current rates</Text>
      {CURRENCIES.filter((c) => c !== base).map((c) => (
        <View key={c} style={[U.hRow, { paddingVertical: 4 }]}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.ink, width: 52, fontFamily: font.medium }}>{c}</Text>
          <TextInput
            style={{ flex: 1, borderWidth: 1, borderColor: C.line, backgroundColor: C.card, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: C.ink, textAlign: 'right' }}
            keyboardType="numeric"
            value={String(working[c] ?? '')}
            onChangeText={(v) => setDraft({ ...working, [c]: v.replace(/[^0-9.]/g, '') })}
          />
        </View>
      ))}
      {dirty && (
        <Btn title="Save rates" onPress={() => {
          const clean = { ...rates };
          for (const c of CURRENCIES) {
            const n = Number(working[c]);
            if (c !== base && Number.isFinite(n) && n > 0) clean[c] = n;
          }
          onUpdate({ rates: clean });
          setDraft(null);
        }} />
      )}
    </View>
  );
}

/* ---------------- Security ---------------- */

function PinSheet({ mode, onClose, onSet, verify }) {
  const [current, setCurrent] = useState('');
  const [npw, setNpw] = useState('');
  const [repeat, setRepeat] = useState('');
  const reset = () => { setCurrent(''); setNpw(''); setRepeat(''); };
  const close = () => { reset(); onClose(); };
  const digits = (v) => v.replace(/[^0-9]/g, '');

  const submit = () => {
    if (mode !== 'setup' && !verify(current)) {
      notify('Wrong current PIN.');
      return;
    }
    if (mode === 'disable') {
      onSet(null);
      notify('App lock disabled.');
      close();
      return;
    }
    if (!/^\d{4,8}$/.test(npw)) {
      notify('New PIN must be 4–8 digits.');
      return;
    }
    if (npw !== repeat) {
      notify('New PINs do not match.');
      return;
    }
    onSet(npw);
    notify(mode === 'setup' ? 'App lock enabled.' : 'PIN changed.');
    close();
  };

  return (
    <Sheet
      visible={!!mode}
      onClose={close}
      title={mode === 'setup' ? 'Set app PIN' : mode === 'change' ? 'Change PIN' : 'Disable app lock'}
    >
      {mode !== 'setup' && (
        <Field label="Current PIN" keyboardType="numeric" secureTextEntry value={current} maxLength={8}
          onChangeText={(v) => setCurrent(digits(v))} />
      )}
      {mode !== 'disable' && (
        <View>
          <Field label="New PIN (4–8 digits)" keyboardType="numeric" secureTextEntry value={npw} maxLength={8}
            onChangeText={(v) => setNpw(digits(v))} />
          <Field label="Repeat new PIN" keyboardType="numeric" secureTextEntry value={repeat} maxLength={8}
            onChangeText={(v) => setRepeat(digits(v))} />
        </View>
      )}
      <Btn
        title={mode === 'setup' ? 'Enable lock' : mode === 'change' ? 'Save new PIN' : 'Disable lock'}
        kind={mode === 'disable' ? 'danger' : 'primary'}
        onPress={submit}
      />
    </Sheet>
  );
}

function TotpSheet({ visible, settings, name, onClose, onUpdate }) {
  const [secret, setSecret] = useState(settings.totpSecret || newSecret());
  const [code, setCode] = useState('');
  const enabled = settings.totpEnabled;
  const enable = () => {
    if (!verifyTotp(secret, code)) return notify('Code does not match. Check the secret and try again.');
    onUpdate({ totpSecret: secret, totpEnabled: true });
    setCode('');
    onClose();
    notify('Two-factor authentication enabled.');
  };
  const disable = () => {
    if (!verifyTotp(settings.totpSecret, code)) return notify('Wrong code.');
    onUpdate({ totpEnabled: false });
    setCode('');
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={onClose} title="Two-factor authentication">
      {enabled ? (
        <View>
          <Text style={{ fontSize: 13, color: C.muted, fontFamily: font.regular }}>
            2FA is on. Enter a code from your authenticator app to turn it off.
          </Text>
          <Field label="6-digit code" keyboardType="numeric" value={code} maxLength={8}
            onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ''))} />
          <Btn title="Disable 2FA" kind="danger" onPress={disable} />
        </View>
      ) : (
        <View>
          <Text style={{ fontSize: 13, color: C.muted, fontFamily: font.regular }}>
            1. Open Google Authenticator / Authy / 1Password.{'\n'}
            2. Add an account and type this secret:{'\n'}
          </Text>
          <Text selectable style={{ fontSize: 18, fontWeight: '800', letterSpacing: 2, color: C.ink, textAlign: 'center', marginVertical: 6, fontFamily: font.bold }}>{secret}</Text>
          <Text selectable style={{ fontSize: 11, color: C.muted, textAlign: 'center', fontFamily: font.regular }}>
            {otpauthURL(secret, name || 'user')}
          </Text>
          <Field label="6-digit code to confirm" keyboardType="numeric" value={code} maxLength={8}
            onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ''))} />
          <Btn title="Enable 2FA" onPress={enable} />
        </View>
      )}
    </Sheet>
  );
}

function SecuritySection({ settings, onUpdate, onLockNow, verify }) {
  const [pinMode, setPinMode] = useState(null);
  const [totpOpen, setTotpOpen] = useState(false);
  const hasPin = !!settings.pinHash;
  return (
    <View>
      <Card>
        <View style={U.hRow}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.ink, fontFamily: font.bold }}>App lock (PIN)</Text>
            <Text style={{ fontSize: 12, color: C.muted, fontFamily: font.regular }}>{hasPin ? 'Enabled — required on launch' : 'Off'}</Text>
          </View>
          {!hasPin && <Pressable onPress={() => setPinMode('setup')}><Text style={{ color: C.accent, fontWeight: '800', fontFamily: font.bold }}>Set up</Text></Pressable>}
          {hasPin && (
            <View style={{ flexDirection: 'row' }}>
              <Pressable onPress={() => setPinMode('change')} style={{ marginRight: 14 }}>
                <Text style={{ color: C.accent, fontWeight: '800', fontFamily: font.bold }}>Change</Text>
              </Pressable>
              <Pressable onPress={() => setPinMode('disable')}>
                <Text style={{ color: C.danger, fontWeight: '700', fontFamily: font.bold }}>Off</Text>
              </Pressable>
            </View>
          )}
        </View>
        <View style={[U.hRow, { marginTop: 10 }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.ink, fontFamily: font.bold }}>Two-factor (TOTP)</Text>
            <Text style={{ fontSize: 12, color: C.muted, fontFamily: font.regular }}>{settings.totpEnabled ? 'Enabled' : 'Off'}</Text>
          </View>
          <Pressable onPress={() => setTotpOpen(true)}>
            <Text style={{ color: C.accent, fontWeight: '800', fontFamily: font.bold }}>{settings.totpEnabled ? 'Manage' : 'Set up'}</Text>
          </Pressable>
        </View>
        {hasPin && (
          <View style={{ marginTop: 8 }}>
            <Btn title="Lock now" kind="ghost" onPress={onLockNow} />
          </View>
        )}
      </Card>
      <PinSheet
        mode={pinMode}
        onClose={() => setPinMode(null)}
        verify={verify}
        onSet={(pin) => {
          if (pin == null) {
            onUpdate({ pinHash: null, pinSalt: null });
          } else {
            const salt = newSalt();
            onUpdate({ pinHash: hashPin(pin, salt), pinSalt: salt });
          }
        }}
      />
      <TotpSheet visible={totpOpen} settings={settings} name={settings.name} onClose={() => setTotpOpen(false)} onUpdate={onUpdate} />
    </View>
  );
}

/* ---------------- More screen ---------------- */

export function MoreScreen(props) {
  const { settings, onUpdateSettings, onReset, onLockNow } = props;
  const [name, setName] = useState(settings.name);
  return (
    <View>
      <Section title="Insights & trends">
        <Insights txs={props.txs} settings={settings} />
      </Section>

      <Section title="Bills & forecast">
        <RecurringSection
          txs={props.txs}
          recurrings={props.recurrings}
          settings={settings}
          onSave={props.onSaveRecurring}
          onDelete={props.onDeleteRecurring}
          onPostDue={props.onPostDue}
        />
      </Section>

      <Section title="Bank sync & data">
        <ImportSection txs={props.txs} settings={settings} learned={props.learned} onImport={props.onImport} />
        <ExportSection txs={props.txs} />
        <Btn title="Delete all data" kind="danger" onPress={() => confirmAct('Delete everything?', 'Transactions, budgets, goals and schedules will be removed.', 'Delete all', onReset)} />
      </Section>

      <Section title="Currencies">
        <CurrencySection settings={settings} onUpdate={onUpdateSettings} />
      </Section>

      <Section title="Security">
        <SecuritySection settings={settings} onUpdate={onUpdateSettings} onLockNow={onLockNow} verify={props.verifyPin} />
      </Section>

      <Section title="Profile">
        <Field label="Display name" placeholder="Your name" value={name} maxLength={60} onChangeText={setName} />
        {name !== settings.name && (
          <Btn title="Save name" onPress={() => onUpdateSettings({ name: name.trim().slice(0, 60) })} />
        )}
      </Section>
    </View>
  );
}