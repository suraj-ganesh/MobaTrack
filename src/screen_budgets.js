// Budgets — EXACT Stitch screen a9409b1a (Monochrome Financial Atelier).
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { C, CATS, DS, fmt, font, T, monthKey, monthLong, shiftMonth, todayISO, daysLeftInMonth, uid, weekRange } from './theme';
import { inDateRange, sumAlloc } from './money';
import { Btn, Card, Chip, Empty, I, Label, MonthPill, Prog, Sheet, U, confirmAct, notify } from './ui';

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
  const [editing, setEditing] = useState(null);
  const today = todayISO();

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
        <MonthPill label={monthLong(mk)} onPrev={() => { setMk(shiftMonth(mk, -1)); setDraft(null); }} onNext={() => { setMk(shiftMonth(mk, 1)); setDraft(null); }} />
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
              {overRows.length ? 'Rebalance Needed' : 'All Income Allocated'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: DS.primary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 }}>
            <I name="check-circle" size={14} color="#fff" />
            <Text style={[T.labelSm, { color: '#fff', marginLeft: 4 }]}>ZERO-BASED</Text>
          </View>
        </View>
        <Text style={[T.bodyMd, { color: DS.onVariant, lineHeight: 20, marginTop: 8 }]}>
          Every rupee has a defined job this month.{' '}
          <Text style={[T.curSm, { color: DS.on }]}>{fmt(monthSpent, base)}</Text> spent of{' '}
          <Text style={[T.curSm, { color: DS.on }]}>{fmt(burnBase, base)}</Text> planned allocation.
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
            <Text style={[T.curSm, { color: DS.onVariant }]}>{fmt(0, base)}</Text>
            <Text style={[T.labelSm, { color: DS.onVariant }]}>{leftDays} days remaining</Text>
            <Text style={[T.curSm, { color: DS.on }]}>{fmt(unspent, base)} unspent</Text>
          </View>
        </View>
      </Card>

      {/* Envelopes */}
      <View style={{ marginTop: 16 }}>
        <View style={[U.hRow, { paddingHorizontal: 4, marginBottom: 4 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[T.hSm, { color: DS.on }]}>Envelopes</Text>
            <View style={{ backgroundColor: DS.high, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 }}>
              <Text style={[T.labelSm, { color: DS.on }]}>{rows.length} Active</Text>
            </View>
          </View>
          <Text style={[T.labelSm, { color: DS.onVariant }]}>Tap to inspect ledger</Text>
        </View>
        <Pressable onPress={() => { setEditing(null); setShowForm(true); }} style={{ paddingHorizontal: 4, marginBottom: 2 }}>
          <Text style={[{ fontSize: 12, fontWeight: '600', fontFamily: font.bold, color: DS.onVariant }]}>+ New envelope</Text>
        </Pressable>
        {rows.length === 0 && (
          <Card style={{ padding: 12, borderRadius: DS.radius.sm }}>
            <Empty msg="No envelopes yet. Cap a category to start allocating." />
          </Card>
        )}
        {rows.map(({ b, spent, pct }) => {
          const over = pct > 100;
          return (
            <Pressable key={b.id} onPress={() => { setEditing(b); setShowForm(true) }}>
              <Card style={{ padding: 12, borderRadius: DS.radius.sm, marginVertical: 3 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: over ? DS.primary : DS.low, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <I name={envIcon(b.category)} size={15} color={over ? '#fff' : DS.on} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[T.hSm, { color: DS.on, flexShrink: 1 }]} numberOfLines={1}>{b.category}</Text>
                        {over && (
                          <View style={{ backgroundColor: DS.primary, borderRadius: DS.radius.xs, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 }}>
                            <Text style={[T.labelSm, { color: '#fff' }]}>SURPLUS DEFICIT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[T.bodySm, { color: DS.onVariant }]}>{envSub(b)}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                    <Text style={[T.curMd, { color: DS.on }]}>{fmt(spent, base)}</Text>
                    <Text style={[T.labelSm, { color: DS.onVariant }]}>of {fmt(b.cap, base)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <View style={{ flex: 1, height: 6, borderRadius: 999, backgroundColor: DS.high, overflow: 'hidden', marginRight: 10 }}>
                    <View style={{ height: '100%', width: `${Math.min(100, pct)}%`, backgroundColor: DS.primary, borderRadius: 999 }} />
                  </View>
                  {over ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: DS.high, borderRadius: DS.radius.xs, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <I name="priority-high" size={13} color={DS.on} />
                      <Text style={[{ fontSize: 11, lineHeight: 14, fontWeight: '700', fontFamily: font.bold, color: DS.on, marginLeft: 2 }]}>
                        Over by {fmt(spent - b.cap, base)}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[T.labelSm, { color: DS.onVariant }]}>
                      {pct.toFixed(0)}% · {fmt(Math.max(0, b.cap - spent), base)} {pct >= 96 ? 'left' : 'remaining'}
                    </Text>
                  )}
                </View>
                <Pressable onPress={() => confirmAct('Delete?', `Remove the ${b.category} budget?`, 'Delete', () => onDeleteBudget(b.id))}>
                  <Text style={[{ fontSize: 12, fontWeight: '600', fontFamily: font.bold, color: DS.error, marginTop: 8 }]}>Delete</Text>
                </Pressable>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {/* Rebalance */}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', flex: 1, minWidth: 0 }}>
            <View style={{ width: 32, height: 32, borderRadius: DS.radius.sm, backgroundColor: DS.low, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <I name="account-balance-wallet" size={18} color={DS.on} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[T.hSm, { color: DS.on }]}>Zero-Base Envelope Savings</Text>
              <Text style={[T.bodySm, { color: DS.onVariant }]}>Unutilized allocation buffer</Text>
            </View>
          </View>
          <Text style={[T.curMd, { color: DS.on, marginLeft: 8 }]}>{fmt(unspent, base)}</Text>
        </View>
        <Text style={[T.bodySm, { color: DS.onVariant, lineHeight: 17, marginTop: 8 }]}>
          {overRows.length
            ? `Cover the ${overRows[0].b.category} deficit from unspent envelopes without changing your baseline target.`
            : 'You have headroom across categories. Rebalancing keeps every envelope at zero.'}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <Pressable
            onPress={() => notify(overRows.length ? 'Move unspent cover to the over-budget envelope in the plan below.' : 'Envelopes already balance to zero.')}
            style={{ flex: 1, height: 40, borderRadius: DS.radius.sm, backgroundColor: DS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
          >
            <I name="sync-alt" size={16} color="#fff" />
            <Text style={[T.hSm, { color: '#fff', marginLeft: 6 }]}>Rebalance Envelopes</Text>
          </Pressable>
          <Pressable
            onPress={() => notify('Tap an envelope to edit its cap, or set monthly targets below.')}
            style={{ width: 46, height: 40, borderRadius: DS.radius.sm, backgroundColor: DS.low, alignItems: 'center', justifyContent: 'center' }}
          >
            <I name="settings" size={16} color={DS.on} />
          </Pressable>
        </View>
      </Card>

      {/* Zero-based plan editor */}
      <View style={{ marginTop: 16 }}>
        <View style={[U.hRow, { paddingHorizontal: 4, marginBottom: 4 }]}>
          <Text style={[T.labelSm, { color: DS.onVariant }]}>ZERO-BASED PLAN · {monthLong(mk).toUpperCase()}</Text>
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

      <Sheet visible={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit budget' : 'New budget'}>
        <BudgetForm initial={editing} taken={(budgets || []).map((b) => b.category)} onSave={onSaveBudget} onClose={() => setShowForm(false)} />
      </Sheet>
    </View>
  );
}
