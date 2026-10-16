// Budgets — EXACT Stitch screen a9409b1a (Monochrome Financial Atelier).
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { C, CATS, DS, fmt, font, T, monthKey, monthLong, shiftMonth, todayISO, daysLeftInMonth, uid, weekRange } from './theme';
import { inDateRange, sumAlloc } from './money';
import { Bento, Btn, Card, Chip, Empty, I, Label, MonthPill, Prog, Sheet, U, confirmAct, notify } from './ui';

function spentInWindow(b, txs, base, rates, today, mk) {
  const [f, t] = b.period === 'weekly' ? weekRange(today) : [`${mk}-01`, `${mk}-31`];
  return sumAlloc(txs, base, rates, (x) => x.type === 'expense' && inDateRange(x, f, t)).byCat[b.category] || 0;
}

function envIcon(cat = '') {
  const c = String(cat).toLowerCase();
  if (/hous|rent|util|bill/.test(c)) return 'home-work';
  if (/grocer|household|shop/.test(c)) return 'shopping-cart';
  if (/dining|food/.test(c)) return 'restaurant';
  if (/tech|sub|digital|device/.test(c)) return 'devices';
  if (/health|fitness|well/.test(c)) return 'fitness-center';
  if (/transport|travel/.test(c)) return 'flight-takeoff';
  return 'donut-small';
}

function envSub(b) {
  const c = String(b.category || '').toLowerCase();
  if (/hous|rent|util/.test(c)) return 'Fixed Recurring';
  if (/grocer/.test(c)) return 'Variable Essentials';
  if (/dining|food/.test(c)) return 'Lifestyle Discretionary';
  if (/tech|sub/.test(c)) return 'Digital Software';
  if (/health|fitness/.test(c)) return 'Wellness Memberships';
  return b.period === 'weekly' ? 'Weekly envelope' : 'Monthly envelope';
}

function BudgetForm({ initial, taken, onSave, onClose }) {
  const [category, setCategory] = useState(initial?.category || CATS.expense[0]);
  const [cap, setCap] = useState(initial?.cap != null ? String(initial.cap) : '');
  const [period, setPeriod] = useState(initial?.period || 'monthly');
  const save = () => {
    const n = Number(cap);
    if (!(n > 0)) return notify('Enter a cap greater than 0.');
    onSave({ id: initial?.id || uid(), category, cap: n, period });
    onClose();
  };
  return (
    <View>
      <Text style={U.label}>Category</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {CATS.expense.filter((c) => c === category || !taken.includes(c)).map((c) => (
          <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
        ))}
      </View>
      <Text style={[U.label, { marginTop: 8 }]}>Cap amount</Text>
      <TextInput
        style={U.input} placeholder="0.00" placeholderTextColor={DS.outline} keyboardType="numeric"
        value={cap} onChangeText={(v) => setCap(v.replace(/[^0-9.]/g, ''))}
      />
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        {['weekly', 'monthly'].map((p) => (
          <Chip key={p} label={p === 'weekly' ? 'Weekly' : 'Monthly'} active={period === p} onPress={() => setPeriod(p)} />
        ))}
      </View>
      <Btn title={initial ? 'Save budget' : 'Add budget'} onPress={save} />
    </View>
  );
}

export function BudgetScreen({ txs, budgets, plans, settings, onSaveBudget, onDeleteBudget, onSavePlan }) {
  const base = settings.baseCurrency;
  const rates = settings.rates;
  const [mk, setMk] = useState(monthKey(todayISO()));
  const [showForm, setShowForm] = useState(false);
  const [showMonths, setShowMonths] = useState(false);
  const [editing, setEditing] = useState(null);
  const today = todayISO();

  // Month picker options: past 11 months + current + next month.
  const monthOptions = useMemo(() => {
    const baseMk = monthKey(todayISO());
    const out = [];
    for (let i = -11; i <= 1; i++) out.push(shiftMonth(baseMk, i));
    return out;
  }, []);

  const rows = useMemo(() => {
    return (budgets || []).map((b) => {
      const spent = spentInWindow(b, txs, base, rates, today, mk);
      const pct = b.cap > 0 ? (spent / b.cap) * 100 : 0;
      return { b, spent, pct };
    });
  }, [txs, budgets, mk, base, rates, today]);

  const plan = plans[mk] || {};
  const [draft, setDraft] = useState(null);
  const working = draft || plan;
  const plannedTotal = Object.values(working).reduce((s, v) => s + (Number(v) || 0), 0);
  const monthIncome = sumAlloc(txs, base, rates, (t) => t.type === 'income' && monthKey(t.date) === mk).total;
  const monthSpent = sumAlloc(txs, base, rates, (t) => t.type === 'expense' && monthKey(t.date) === mk).total;
  const capTotal = (budgets || []).reduce((s, b) => s + (Number(b.cap) || 0), 0);
  const burnBase = capTotal > 0 ? capTotal : Math.max(monthIncome, plannedTotal, 0);
  const burnPct = burnBase > 0 ? Math.min(100, (monthSpent / burnBase) * 100) : 0;
  const unspent = Math.max(0, burnBase - monthSpent);
  const leftDays = daysLeftInMonth(today);
  const overRows = rows.filter((r) => r.pct > 100);

  const setCell = (cat, v) => {
    const clean = v.replace(/[^0-9.]/g, '');
    setDraft({ ...working, [cat]: clean === '' ? 0 : Number(clean) });
  };

  return (
    <View>
      {/* Period switcher */}
      <View style={[U.hRow, { marginTop: 2 }]}>
        <MonthPill label={monthLong(mk)} onPrev={() => { setMk(shiftMonth(mk, -1)); setDraft(null); }} onNext={() => { setMk(shiftMonth(mk, 1)); setDraft(null); }} onPress={() => setShowMonths(true)} />
        <View style={{ flexDirection: 'row' }}>
          <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: DS.low, alignItems: 'center', justifyContent: 'center', marginLeft: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 }}>
            <I name="tune" size={16} color={DS.onVariant} />
          </View>
          <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: DS.low, alignItems: 'center', justifyContent: 'center', marginLeft: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 }}>
            <I name="history" size={16} color={DS.onVariant} />
          </View>
        </View>
      </View>

      {/* Zero-based hero */}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: DS.primary, marginRight: 6 }} />
              <Label>Allocation Cadence</Label>
            </View>
            <Text style={[T.hLg, { color: DS.on }]}>
              {overRows.length ? 'Over budget' : 'On track'}
            </Text>
          </View>
        </View>
        <Text style={[T.bodyMd, { color: DS.onVariant, lineHeight: 20, marginTop: 8 }]}>
          <Text style={[T.curSm, { color: DS.on }]}>{fmt(monthSpent, base)}</Text> spent of{' '}
          <Text style={[T.curSm, { color: DS.on }]}>{fmt(burnBase, base)}</Text> planned.
        </Text>
        <View style={{ backgroundColor: DS.low, borderRadius: DS.radius.sm, padding: 12, marginTop: 12 }}>
          <View style={[U.hRow]}>
            <Text style={[{ fontSize: 11, lineHeight: 14, fontWeight: '500', fontFamily: font.medium, color: DS.onVariant }]}>Monthly Burn Rate</Text>
            <Text style={[T.hMd, { color: DS.on }]}>
              {burnPct.toFixed(0)}% <Text style={[T.bodySm, { color: DS.onVariant }]}>utilized</Text>
            </Text>
          </View>
          <View style={{ marginTop: 8 }}>
            <Prog pct={burnPct} h={8} track={DS.highest} />
          </View>
          <View style={[U.hRow, { marginTop: 8 }]}>
            <Text style={[T.bodySm, { color: DS.onVariant }]}>{fmt(Math.max(0, burnBase - monthSpent), base)} left</Text>
            <Text style={[T.labelSm, { color: DS.onVariant }]}>{leftDays} days left</Text>
          </View>
        </View>
      </Card>

      {/* Envelopes bento */}
      <View style={{ marginTop: 16 }}>
        <View style={[U.hRow, { paddingHorizontal: 4, marginBottom: 4 }]}>
          <Text style={[T.hSm, { color: DS.on }]}>Envelopes</Text>
          <Pressable onPress={() => { setEditing(null); setShowForm(true); }}>
            <Text style={[T.labelSm, { color: DS.onVariant }]}>+ New</Text>
          </Pressable>
        </View>
        {rows.length === 0 && (
          <Card style={{ padding: 12, borderRadius: DS.radius.sm }}>
            <Empty msg="No envelopes yet. Cap a category to start." />
          </Card>
        )}
        <Bento>
          {[...rows].sort((a, b) => b.spent - a.spent).map(({ b, spent, pct }, idx, arr) => {
            const over = pct > 100;
            const featured = idx === 0 && arr.length > 2;
            return (
              <Pressable key={b.id} span={featured ? 2 : undefined} onPress={() => { setEditing(b); setShowForm(true); }}>
                <Card style={{ padding: 12, borderRadius: DS.radius.sm, marginVertical: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 26, height: 26, borderRadius: 999, backgroundColor: over ? DS.primary : DS.low, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                      <I name={envIcon(b.category)} size={14} color={over ? '#fff' : DS.on} />
                    </View>
                    <Text style={[T.hSm, { color: DS.on, flex: 1 }]} numberOfLines={1}>{b.category}</Text>
                  </View>
                  <Text style={[T.curMd, { color: DS.on, marginTop: 8 }]} numberOfLines={1}>{fmt(spent, base)}</Text>
                  <Text style={[T.labelSm, { color: DS.onVariant }]}>of {fmt(b.cap, base)}</Text>
                  <View style={{ height: 6, borderRadius: 999, backgroundColor: DS.high, overflow: 'hidden', marginTop: 8 }}>
                    <View style={{ height: '100%', width: `${Math.min(100, pct)}%`, backgroundColor: over ? DS.error : DS.primary, borderRadius: 999 }} />
                  </View>
                  <Text style={[T.labelSm, { color: over ? DS.error : DS.onVariant, marginTop: 6 }]}>
                    {over ? `Over by ${fmt(spent - b.cap, base)}` : `${pct.toFixed(0)}% used`}
                  </Text>
                </Card>
              </Pressable>
            );
          })}
        </Bento>
      </View>

      {/* Month plan */}
      <View style={{ marginTop: 16 }}>
        <View style={[U.hRow, { paddingHorizontal: 4, marginBottom: 4 }]}>
          <Text style={[T.labelSm, { color: DS.onVariant }]}>PLAN · {monthLong(mk).toUpperCase()}</Text>
        </View>
        <Card style={{ padding: 12 }}>
          <View style={U.hRow}>
            <Text style={[T.bodyMd, { color: DS.onVariant }]}>Month income</Text>
            <Text style={[{ fontSize: 14, fontWeight: '600', fontFamily: font.bold, color: DS.on }]}>{fmt(monthIncome, base)}</Text>
          </View>
          <View style={[U.hRow, { marginTop: 4 }]}>
            <Text style={[T.bodyMd, { color: DS.onVariant }]}>Planned</Text>
            <Text style={[{ fontSize: 14, fontWeight: '600', fontFamily: font.bold, color: DS.on }]}>{fmt(plannedTotal, base)}</Text>
          </View>
          <View style={[U.hRow, { marginTop: 4 }]}>
            <Text style={[{ fontSize: 13, fontWeight: '600', fontFamily: font.bold, color: monthIncome - plannedTotal < 0 ? DS.error : DS.primary }]}>
              {monthIncome - plannedTotal < 0 ? 'Over-allocated' : 'Left to assign'}
            </Text>
            <Text style={[{ fontSize: 14, fontWeight: '600', fontFamily: font.bold, color: monthIncome - plannedTotal < 0 ? DS.error : DS.primary }]}>
              {monthIncome - plannedTotal < 0 ? '-' : ''}{fmt(Math.abs(monthIncome - plannedTotal), base)}
            </Text>
          </View>
        </Card>
        {CATS.expense.map((c) => {
          const planned = Number(working[c]) || 0;
          const spent = sumAlloc(txs, base, rates, (t) => t.type === 'expense' && monthKey(t.date) === mk).byCat[c] || 0;
          return (
            <View key={c} style={[U.hRow, { paddingVertical: 6, paddingHorizontal: 4 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[{ fontSize: 13, fontWeight: '600', fontFamily: font.medium, color: DS.on }]}>{c}</Text>
                <Text style={[T.bodySm, { color: spent > planned && planned > 0 ? DS.error : DS.onVariant }]}>
                  {fmt(spent, base)} spent{planned > 0 ? ` of ${fmt(planned, base)} planned` : ' · no plan'}
                </Text>
              </View>
              <TextInput
                style={{ width: 96, borderWidth: 1, borderColor: DS.hairline, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: DS.on, textAlign: 'right', fontFamily: font.mono }}
                placeholder="0" placeholderTextColor={DS.outline} keyboardType="numeric"
                value={working[c] ? String(working[c]) : ''}
                onChangeText={(v) => setCell(c, v)}
              />
            </View>
          );
        })}
        {draft && (
          <Btn title="Save monthly plan" onPress={() => { onSavePlan(mk, draft); setDraft(null); }} />
        )}
      </View>

      <Sheet visible={showMonths} onClose={() => setShowMonths(false)} title="Pick a month">
        {monthOptions.map((m) => (
          <Pressable key={m} onPress={() => { setMk(m); setDraft(null); setShowMonths(false); }} style={[U.hRow, { paddingVertical: 10, paddingHorizontal: 4 }]}>
            <Text style={[{ fontSize: 14, fontWeight: m === mk ? '700' : '400', fontFamily: m === mk ? font.bold : font.regular, color: m === mk ? DS.primary : DS.on }]}>
              {monthLong(m)}
            </Text>
            {m === mk && <I name="check" size={16} color={DS.primary} />}
          </Pressable>
        ))}
      </Sheet>

      <Sheet visible={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit budget' : 'New budget'}>
        <BudgetForm initial={editing} taken={(budgets || []).map((b) => b.category)} onSave={onSaveBudget} onClose={() => setShowForm(false)} />
      </Sheet>
    </View>
  );
}
