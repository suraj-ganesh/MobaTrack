// Goals — EXACT Stitch screen ef4f399d (Monochrome Financial Atelier).
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { C, CURRENCIES, DS, fmt, font, T, uid } from './theme';
import { toBase } from './money';
import { Btn, Card, Chip, Empty, Field, Label, Prog, Sheet, Toggle, U, confirmAct, notify } from './ui';
import { I } from './ui';

export function projectFinish(goal) {
  const remaining = goal.target - goal.saved;
  if (remaining <= 0) return { done: true };
  const log = Array.isArray(goal.log) ? goal.log : [];
  const cutoff = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  const recent = log.filter((e) => e && e.date >= cutoff && Number(e.amount) > 0)
    .reduce((s, e) => s + Number(e.amount), 0);
  const perDay = recent / 60;
  if (!(perDay > 0)) return { done: false, eta: null };
  const days = Math.ceil(remaining / perDay);
  const d = new Date(Date.now() + days * 86400000);
  return { done: false, eta: d.toISOString().slice(0, 10), perDay };
}

function goalIcon(name = '') {
  const n = String(name).toLowerCase();
  if (/emergency|fund|reserve|shield|liquidity/.test(n)) return 'shield';
  if (/travel|japan|trip|flight|expedition/.test(n)) return 'flight-takeoff';
  if (/mac|studio|hardware|laptop|setup|workstation/.test(n)) return 'check';
  return 'flag';
}

function monthsUntil(deadline) {
  if (!deadline || !/^\d{4}-\d{2}$/.test(deadline)) return null;
  const now = new Date();
  return Math.max(0, (Number(deadline.slice(0, 4)) - now.getFullYear()) * 12 + (Number(deadline.slice(5)) - (now.getMonth() + 1)));
}

function GoalForm({ initial, base, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [target, setTarget] = useState(initial?.target != null ? String(initial.target) : '');
  const [currency, setCurrency] = useState(initial?.currency || base);
  const [deadline, setDeadline] = useState(initial?.deadline || '');
  const save = () => {
    const t = Number(target);
    if (!name.trim()) return notify('Give the goal a name.');
    if (!(t > 0)) return notify('Enter a target greater than 0.');
    if (deadline && !/^\d{4}-\d{2}$/.test(deadline)) return notify('Deadline must be YYYY-MM.');
    onSave({
      id: initial?.id || uid(),
      name: name.trim().slice(0, 60),
      target: t,
      saved: initial?.saved || 0,
      currency: CURRENCIES.includes(currency) ? currency : base,
      deadline: deadline || null,
      log: Array.isArray(initial?.log) ? initial.log : [],
    });
    onClose();
  };
  return (
    <View>
      <Field label="Goal name" placeholder="e.g. Emergency fund" value={name} onChangeText={setName} maxLength={60} />
      <Field label="Target amount" placeholder="0.00" keyboardType="numeric" value={target}
        onChangeText={(v) => setTarget(v.replace(/[^0-9.]/g, ''))} />
      <Text style={U.label}>Currency</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {CURRENCIES.map((c) => (
          <Chip key={c} label={c} active={currency === c} onPress={() => setCurrency(c)} />
        ))}
      </View>
      <Field label="Deadline YYYY-MM (optional)" placeholder="2026-12" value={deadline} maxLength={7}
        onChangeText={(v) => setDeadline(v.replace(/[^0-9\-]/g, '').slice(0, 7))} />
      <Btn title={initial ? 'Save goal' : 'Add goal'} onPress={save} />
    </View>
  );
}

export function GoalScreen({ goals, settings, onSaveGoal, onDeleteGoal, onMoveFunds }) {
  const base = settings.baseCurrency;
  const rates = settings.rates;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [amt, setAmt] = useState({});
  const [filter, setFilter] = useState('active');
  const [roundUps, setRoundUps] = useState(true);
  const [payday, setPayday] = useState(true);

  const list = goals || [];
  const active = list.filter((g) => g.saved < g.target);
  const done = list.filter((g) => g.saved >= g.target);
  const shown = filter === 'achieved' ? done : active;

  const totalSaved = list.reduce((s, g) => s + toBase(g.saved, g.currency, base, rates), 0);
  const totalTarget = list.reduce((s, g) => s + toBase(g.target, g.currency, base, rates), 0);
  const totalPct = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

  const etas = active.map((g) => projectFinish(g).eta).filter(Boolean).sort();
  const latestEta = etas.length ? etas[etas.length - 1] : null;
  const etaLabel = latestEta
    ? new Date(latestEta + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <View>
      {/* Title + New Goal */}
      <View style={[U.hRow, { marginTop: 2 }]}>
        <View>
          <Text style={[T.labelSm, { color: DS.onVariant }]}>PROJECTION ENGINE</Text>
          <Text style={[T.hMd, { color: DS.on, marginTop: 2 }]}>Goals & Milestones</Text>
        </View>
        <Pressable
          onPress={() => { setEditing(null); setShowForm(true); }}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: DS.primary, borderRadius: 999, height: 28, paddingHorizontal: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 }}
        >
          <I name="add" size={14} color="#fff" />
          <Text style={[{ fontSize: 11, lineHeight: 14, fontWeight: '600', fontFamily: font.bold, color: '#fff', marginLeft: 4 }]}>New Goal</Text>
        </Pressable>
      </View>

      {/* Total allocated */}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Label>Total Capital Allocated</Label>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
              <Text style={[T.curLg, { color: DS.primary }]}>{fmt(totalSaved, base)}</Text>
              <Text style={[T.bodySm, { color: DS.onVariant, marginLeft: 6 }]}>/ {fmt(totalTarget, base)}</Text>
            </View>
          </View>
          <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: DS.container, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
            <Text style={[T.curSm, { color: DS.primary }]}>{totalPct.toFixed(0)}%</Text>
          </View>
        </View>
        <View style={{ marginTop: 8 }}>
          <Prog pct={totalPct} h={6} track={DS.container} />
        </View>
        <View style={[U.hRow, { marginTop: 8 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <I name="autorenew" size={14} color={DS.primary} />
            <Text style={[T.bodySm, { color: DS.onVariant, marginLeft: 4 }]}>
              {fmt(totalTarget > 0 ? (totalTarget - totalSaved) / 12 : 0, base)}/mo pace needed
            </Text>
          </View>
          <Text style={[{ fontSize: 11, lineHeight: 14, fontWeight: '500', fontFamily: font.medium, color: DS.primary }]}>
            {done.length ? `${done.length} funded` : 'On Track'}
          </Text>
        </View>
      </Card>

      {/* Filters */}
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        {[
          { id: 'active', label: `Active (${active.length})` },
          { id: 'achieved', label: `Achieved (${done.length})` },
          { id: 'auto', label: 'Automations' },
        ].map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setFilter(f.id)}
            style={{
              height: 24, paddingHorizontal: 12, borderRadius: 999, justifyContent: 'center', marginRight: 6,
              backgroundColor: filter === f.id ? DS.primary : DS.container,
            }}
          >
            <Text style={[{ fontSize: 11, lineHeight: 14, fontWeight: filter === f.id ? '600' : '500', fontFamily: filter === f.id ? font.bold : font.medium, color: filter === f.id ? '#fff' : DS.onVariant }]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Milestones */}
      {filter !== 'auto' && (
        <View style={{ marginTop: 8 }}>
          <View style={[U.hRow, { paddingHorizontal: 4, marginBottom: 2 }]}>
            <Text style={[T.labelSm, { color: DS.onVariant }]}>
              {filter === 'achieved' ? 'FUNDED' : 'ACTIVE MILESTONES'}
            </Text>
            <Text style={[{ fontSize: 11, lineHeight: 14, fontWeight: '500', fontFamily: font.medium, color: DS.onVariant }]}>
              {shown.length} targets
            </Text>
          </View>
          {shown.length === 0 && (
            <Card style={{ alignItems: 'center' }}>
              <Empty msg={filter === 'achieved' ? 'Nothing funded yet.' : 'No active goals. Tap New Goal to start.'} />
            </Card>
          )}
          {shown.map((g) => {
            const pct = Math.min(100, (g.saved / g.target) * 100);
            const proj = projectFinish(g);
            const isDone = g.saved >= g.target;
            const ml = monthsUntil(g.deadline);
            const draft = amt[g.id] || '';
            const move = (sign) => {
              const n = Number(draft);
              if (!(n > 0)) return notify('Enter an amount first.');
              if (sign < 0 && n > g.saved) return notify('Cannot withdraw more than saved.');
              onMoveFunds(g.id, sign * n);
              setAmt((p) => ({ ...p, [g.id]: '' }));
            };
            return (
              <Card key={g.id} style={{ padding: 16, opacity: isDone ? 0.95 : 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flexDirection: 'row', flex: 1, minWidth: 0 }}>
                    <View style={{ width: 32, height: 32, borderRadius: DS.radius.sm, backgroundColor: isDone ? DS.primary : DS.container, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <I name={goalIcon(g.name)} size={16} color={isDone ? '#fff' : DS.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Pressable onPress={() => { setEditing(g); setShowForm(true); }}>
                        <Text style={[T.hSm, { color: DS.on }]}>{g.name}</Text>
                      </Pressable>
                      <Text style={[T.bodySm, { color: DS.onVariant }]} numberOfLines={1}>
                        {g.deadline ? `Target: ${g.deadline}` : isDone ? 'Production workstation' : 'Savings target'}
                        {ml != null && !isDone ? ` · ${ml} mo left` : ''}
                      </Text>
                    </View>
                  </View>
                  {isDone ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: DS.primary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 }}>
                      <I name="done-all" size={11} color="#fff" />
                      <Text style={[T.labelSm, { color: '#fff', marginLeft: 3 }]}>100%</Text>
                    </View>
                  ) : (
                    <Text style={[T.curSm, { color: DS.primary, marginLeft: 8 }]}>{pct.toFixed(0)}%</Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
                  <Text style={[T.curMd, { color: DS.primary }]}>{fmt(toBase(g.saved, g.currency, base, rates))}</Text>
                  <Text style={[T.bodySm, { color: DS.onVariant, marginLeft: 5 }]}>of {fmt(toBase(g.target, g.currency, base, rates))}</Text>
                  <View style={{ flex: 1 }} />
                  {!isDone && ml != null && (
                    <Text style={[{ fontSize: 11, lineHeight: 14, fontWeight: '500', fontFamily: font.medium, color: DS.onVariant }]}>{ml} months left</Text>
                  )}
                  {isDone && (
                    <Text style={[{ fontSize: 11, lineHeight: 14, fontWeight: '500', fontFamily: font.medium, color: DS.primary }]}>Achieved</Text>
                  )}
                </View>
                <View style={{ marginTop: 6 }}>
                  <Prog pct={pct} h={4} track={DS.container} />
                </View>
                <View style={[U.hRow, { marginTop: 8 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <I name="calendar-today" size={13} color={DS.onVariant} />
                    <Text style={[T.bodySm, { color: DS.onVariant, marginLeft: 4 }]}>
                      {g.deadline ? `Target: ${g.deadline}` : proj.done ? 'Funded' : 'No deadline'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {!isDone && <I name={proj.eta ? 'trending-up' : 'repeat'} size={13} color={DS.primary} />}
                    <Text style={[T.curSm, { color: DS.primary, marginLeft: 4 }]}>
                      {isDone ? '' : proj.done ? '' : proj.eta && proj.perDay ? `${fmt(toBase(proj.perDay * 30, g.currency, base, rates))}/mo` : '—'}
                    </Text>
                  </View>
                </View>
                {!isDone && (
                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <TextInput
                      style={{ flex: 1, borderWidth: 1, borderColor: DS.hairline, borderRadius: DS.radius.sm, marginRight: 8, paddingHorizontal: 12, height: 40, fontSize: 14, color: DS.on, backgroundColor: '#fff', fontFamily: font.mono }}
                      placeholder="Amount" placeholderTextColor={DS.outline} keyboardType="numeric"
                      value={draft} onChangeText={(v) => setAmt((p) => ({ ...p, [g.id]: v.replace(/[^0-9.]/g, '') }))}
                    />
                    <Pressable onPress={() => move(1)} style={{ backgroundColor: DS.primary, borderRadius: DS.radius.sm, paddingHorizontal: 15, justifyContent: 'center', marginRight: 6 }}>
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13, fontFamily: font.bold }}>+ Add</Text>
                    </Pressable>
                    <Pressable onPress={() => move(-1)} style={{ borderWidth: 1, borderColor: DS.hairline, borderRadius: DS.radius.sm, paddingHorizontal: 13, justifyContent: 'center', backgroundColor: '#fff' }}>
                      <Text style={{ color: DS.on, fontWeight: '600', fontSize: 13, fontFamily: font.bold }}>− Out</Text>
                    </Pressable>
                  </View>
                )}
                <Pressable onPress={() => confirmAct('Delete?', `Remove the "${g.name}" goal?`, 'Delete', () => onDeleteGoal(g.id))}>
                  <Text style={[{ fontSize: 12, fontWeight: '600', fontFamily: font.bold, color: DS.error, marginTop: 8 }]}>Delete goal</Text>
                </Pressable>
              </Card>
            );
          })}
        </View>
      )}

      {/* Automations */}
      <View style={{ marginTop: 14 }}>
        <View style={[U.hRow, { paddingHorizontal: 4, marginBottom: 4 }]}>
          <Text style={[T.labelSm, { color: DS.onVariant }]}>AUTOMATED SAVINGS RULES</Text>
          <Text style={[{ fontSize: 11, lineHeight: 14, fontWeight: '500', fontFamily: font.medium, color: DS.primary }]}>
            {(roundUps ? 1 : 0) + (payday ? 1 : 0)} Active
          </Text>
        </View>
        <Card style={{ paddingHorizontal: 0, paddingVertical: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
            <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: DS.container, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <I name="toll" size={15} color={DS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[T.hSm, { color: DS.on }]}>Round-ups</Text>
              <Text style={[T.bodySm, { color: DS.onVariant }]}>Spare change rounded to nearest Rs. 100</Text>
            </View>
            <Toggle value={roundUps} onChange={setRoundUps} />
          </View>
          <View style={{ height: 1, backgroundColor: DS.container, marginHorizontal: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
            <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: DS.container, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <I name="call-split" size={15} color={DS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[T.hSm, { color: DS.on }]}>Payday Split</Text>
              <Text style={[T.bodySm, { color: DS.onVariant }]}>15% auto-diverted to {(active[0]?.name) || 'top goal'}</Text>
            </View>
            <Toggle value={payday} onChange={setPayday} />
          </View>
        </Card>
      </View>

      {/* Projection footer */}
      <Card style={{ backgroundColor: DS.low, padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <I name="insights" size={18} color={DS.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[T.hSm, { color: DS.on }]}>Projected Completion</Text>
            <Text style={[T.bodySm, { color: DS.onVariant }]}>
              {etaLabel ? `All targets funded by ${etaLabel} at current velocity` : 'Add goals to project completion'}
            </Text>
          </View>
          <I name="chevron-right" size={16} color={DS.onVariant} />
        </View>
      </Card>

      <Sheet visible={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit goal' : 'New goal'}>
        <GoalForm initial={editing} base={base} onSave={onSaveGoal} onClose={() => setShowForm(false)} />
      </Sheet>
    </View>
  );
}
