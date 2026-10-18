// More: insights, recurring bills, import/export, app lock, profile. NPR-only.
import { useMemo, useState } from 'react';
import { Platform, Pressable, Share, Text, TextInput, View } from 'react-native';
import { C, DS, CATS, fmt, font, monthKey, monthLabel, shiftMonth, themeResolved, todayISO, uid } from './theme';
import { balanceOf } from './money';
import { forecast, freqLabel, FREQS, upcomingBills } from './recurring';
import { compareMonths, monthSummary, prevMonthKey, topMerchants, yearSummary } from './summary';
import { buildCSV, rowsToItems, parseCSV } from './csv';
import { hashPin, newSalt } from './crypto';
import { Bars, Btn, Card, Chip, Empty, Field, I, MonthNav, Section, Sheet, U, confirmAct, notify } from './ui';

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

function RecForm({ initial, onSave, onClose }) {
  const [label, setLabel] = useState(initial?.label || '');
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '');
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
      currency: 'NPR',
      type,
      category: cats.includes(category) ? category : cats[0],
      frequency, nextDate, active,
    });
    onClose();
  };
  return (
    <View>
      <Field label="Label" placeholder="e.g. Rent, Salary" value={label} onChangeText={setLabel} maxLength={80} />
      <Field label="Amount (Rs.)" placeholder="0.00" keyboardType="numeric" value={amount}
        onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))} />
      <View style={{ flexDirection: 'row' }}>
        {['expense', 'income'].map((t) => (
          <Chip key={t} label={t === 'expense' ? 'Bill (out)' : 'Income (in)'} active={type === t} onPress={() => setType(t)} />
        ))}
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
        <RecForm initial={editing} onSave={onSave} onClose={() => setShowForm(false)} />
      </Sheet>
    </View>
  );
}

/* ---------------- Bank sync (CSV) ---------------- */

function ImportSection({ txs, learned, onImport }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);
  const parse = () => {
    const items = rowsToItems(parseCSV(text), txs, 'NPR', learned);
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
          Paste rows as: date, merchant, amount, type, category, note. Negative amounts count as expenses. Everything is in Rs.
        </Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: C.line, backgroundColor: C.card, borderRadius: 10, padding: 10, fontSize: 13, color: C.ink, minHeight: 120, marginTop: 8, textAlignVertical: 'top' }}
          placeholder={'2026-09-01,Bhat Bhateni,-840\n2026-09-01,Employer,25000,income,Salary'}
          placeholderTextColor={C.faint}
          multiline
          value={text}
          onChangeText={setText}
        />
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

function SecuritySection({ settings, onUpdate, onLockNow, verify }) {
  const [pinMode, setPinMode] = useState(null);
  const hasPin = !!settings.pinHash;
  return (
    <View>
      <Card>
        <View style={U.hRow}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.ink, fontFamily: font.bold }}>App lock (PIN)</Text>
            <Text style={{ fontSize: 12, color: C.muted, fontFamily: font.regular }}>{hasPin ? 'On' : 'Off'}</Text>
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
    </View>
  );
}

/* ---------------- More screen ---------------- */

const THEME_OPTIONS = [
  { id: 'light', icon: 'light-mode', label: 'Light' },
  { id: 'dark', icon: 'dark-mode', label: 'Dark' },
  { id: 'system', icon: 'brightness-auto', label: 'System' },
];

function AppearanceSection({ value, onPick }) {
  return (
    <Card>
      <Text style={{ fontSize: 14, fontWeight: '700', color: C.ink, fontFamily: font.bold }}>Theme</Text>
      <Text style={{ fontSize: 12, color: C.muted, fontFamily: font.regular, marginTop: 2 }}>
        Light · Dark (Night Press) · follow the phone
      </Text>
      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        {THEME_OPTIONS.map((o, i) => {
          const active = value === o.id;
          return (
            <Pressable
              key={o.id}
              onPress={() => onPick(o.id)}
              style={{
                flex: 1, height: 34, borderRadius: 999, flexDirection: 'row',
                alignItems: 'center', justifyContent: 'center',
                marginRight: i < THEME_OPTIONS.length - 1 ? 6 : 0,
                backgroundColor: active ? DS.primary : DS.container,
              }}
            >
              <I name={o.icon} size={14} color={active ? DS.onPrimary : DS.onVariant} />
              <Text style={{
                marginLeft: 5, fontSize: 11, lineHeight: 14,
                fontWeight: active ? '600' : '500',
                fontFamily: active ? font.bold : font.medium,
                color: active ? DS.onPrimary : DS.onVariant,
              }}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ fontSize: 11, color: C.faint, fontFamily: font.medium, marginTop: 8 }}>
        {value === 'system'
          ? `Following the phone — currently showing ${themeResolved}.`
          : `Forced ${value} — currently showing the ${themeResolved} palette.`}
      </Text>
    </Card>
  );
}

export function MoreScreen(props) {
  const { settings, onUpdateSettings, onReset, onLockNow } = props;
  const [name, setName] = useState(settings.name);
  return (
    <View>
      <Section title="Appearance">
        <AppearanceSection
          value={settings.theme || 'system'}
          onPick={(id) => {
            const label = THEME_OPTIONS.find((o) => o.id === id)?.label || id;
            onUpdateSettings({ theme: id });
            notify(`Theme set to ${label}.`, { kind: 'info', title: 'Appearance updated' });
          }}
        />
      </Section>

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

      <Section title="Import & data">
        <ImportSection txs={props.txs} learned={props.learned} onImport={props.onImport} />
        <ExportSection txs={props.txs} />
        <Btn title="Delete all data" kind="danger" onPress={() => confirmAct('Delete everything?', 'Transactions, budgets, goals and schedules will be removed.', 'Delete all', onReset)} />
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