// Goals — EXACT Stitch screen ef4f399d (Monochrome Financial Atelier).
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { C, DS, fmt, font, T, isISODate, monthKey, monthLong, shiftMonth, todayISO, uid } from './theme';
import { toBase } from './money';
import { Bento, Btn, Card, Empty, Field, Label, Prog, Sheet, U, confirmAct, notify } from './ui';
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
  const mk = String(deadline || '').slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(mk)) return null;
  const now = new Date();
  return Math.max(0, (Number(mk.slice(0, 4)) - now.getFullYear()) * 12 + (Number(mk.slice(5)) - (now.getMonth() + 1)));
}

function fmtDay(iso) {
  if (!isISODate(iso)) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Native month-grid calendar (Monday-first). Tap a day to pick the date.
const WD = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function MonthCalendar({ value, onPick }) {
  const [view, setView] = useState(value && isISODate(value) ? value.slice(0, 7) : monthKey(todayISO()));
  const [y, m] = view.split('-').map(Number);
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const dim = new Date(y, m, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  const today = todayISO();
  const isoOf = (d) => `${view}-${String(d).padStart(2, '0')}`;
  return (
    <View style={{ backgroundColor: DS.lowest, borderWidth: 1, borderColor: DS.hairline, borderRadius: DS.radius.sm, padding: 10, marginTop: 6 }}>
      <View style={[U.hRow, { marginBottom: 8 }]}>
        <Pressable onPress={() => setView(shiftMonth(view, -1))} hitSlop={12} style={{ padding: 6 }}>
          <I name="chevron-left" size={18} color={DS.on} />
        </Pressable>
        <Text style={[T.hSm, { color: DS.on }]}>{monthLong(view)}</Text>
        <Pressable onPress={() => setView(shiftMonth(view, 1))} hitSlop={12} style={{ padding: 6 }}>
          <I name="chevron-right" size={18} color={DS.on} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {WD.map((w, i) => (
          <Text key={i} style={{ width: '14.28%', textAlign: 'center', fontSize: 10, fontWeight: '700', color: DS.onVariant, fontFamily: font.bold }}>{w}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => {
          if (d == null) return <View key={`b${i}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
          const iso = isoOf(d);
          const selected = iso === value;
          const isToday = iso === today;
          return (
            <Pressable key={iso} onPress={() => onPick(iso)} style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{
                width: 30, height: 30, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
                backgroundColor: selected ? DS.primary : 'transparent',
                borderWidth: !selected && isToday ? 1 : 0, borderColor: DS.primary,
              }}>
                <Text style={{ fontSize: 13, fontWeight: selected ? '700' : '400', color: selected ? DS.onPrimary : DS.on, fontFamily: selected ? font.bold : font.regular }}>
                  {d}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function GoalForm({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [target, setTarget] = useState(initial?.target != null ? String(initial.target) : '');
  const [deadline, setDeadline] = useState(isISODate(initial?.deadline) ? initial.deadline : '');
  const save = () => {
    const t = Number(target);
    if (!name.trim()) return notify('Give the goal a name.');
    if (!(t > 0)) return notify('Enter a target greater than 0.');
    if (!isISODate(deadline)) return notify('Pick a target date on the calendar.');
    onSave({
      id: initial?.id || uid(),
      name: name.trim().slice(0, 60),
      target: t,
      saved: initial?.saved || 0,
      currency: 'NPR',
      deadline,
      log: Array.isArray(initial?.log) ? initial.log : [],
    });
    onClose();
  };
  return (
    <View>
      <Field label="Goal name" placeholder="e.g. Emergency fund" value={name} onChangeText={setName} maxLength={60} />
      <Field label="Target amount (Rs.)" placeholder="0.00" keyboardType="numeric" value={target}
        onChangeText={(v) => setTarget(v.replace(/[^0-9.]/g, ''))} />
      <Text style={U.label}>Target date (required){deadline ? ` · ${fmtDay(deadline)}` : ''}</Text>
      <MonthCalendar value={deadline} onPick={setDeadline} />
      <View style={{ height: 8 }} />
      <Btn title={initial ? 'Save goal' : 'Add goal'} onPress={save} />
    </View>
  );
}

export function GoalScreen({ goals, settings, onSaveGoal, onDeleteGoal, onMoveFunds }) {
  const base = settings.baseCurrency;
  const rates = settings.rates;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [managing, setManaging] = useState(null);
  const [manageAmt, setManageAmt] = useState('');
  const [filter, setFilter] = useState('active');

  const list = goals || [];
  const active = list.filter((g) => g.saved < g.target);
  const done = list.filter((g) => g.saved >= g.target);
  const shown = filter === 'achieved' ? done : active;

  // Live copy of the goal open in the manage popup (refreshes after each move).
  const liveManaging = managing ? list.find((g) => g.id === managing) : null;

  const doMove = (sign) => {
    if (!liveManaging) return;
    const n = Number(manageAmt);
    if (!(n > 0)) return notify('Enter an amount first.');
    if (sign < 0 && n > liveManaging.saved) return notify('Cannot withdraw more than saved.');
    onMoveFunds(liveManaging.id, sign * n);
    setManageAmt('');
  };

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
        <Text style={[T.hMd, { color: DS.on }]}>Goals</Text>
        <Pressable
          onPress={() => { setEditing(null); setShowForm(true); }}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: DS.primary, borderRadius: 999, height: 28, paddingHorizontal: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 }}
        >
          <I name="add" size={14} color={DS.onPrimary} />
          <Text style={[{ fontSize: 11, lineHeight: 14, fontWeight: '600', fontFamily: font.bold, color: DS.onPrimary, marginLeft: 4 }]}>New Goal</Text>
        </Pressable>
      </View>

      {/* Total */}
      <Card>
        <Label>Saved</Label>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
          <Text style={[T.curLg, { color: DS.primary }]}>{fmt(totalSaved, base)}</Text>
          <Text style={[T.bodySm, { color: DS.onVariant, marginLeft: 6 }]}>/ {fmt(totalTarget, base)}</Text>
        </View>
        <View style={{ marginTop: 8 }}>
          <Prog pct={totalPct} h={6} track={DS.container} />
        </View>
        <Text style={[T.labelSm, { color: DS.onVariant, marginTop: 8 }]}>
          {totalPct.toFixed(0)}% saved{done.length ? ` · ${done.length} done` : ''}
        </Text>
      </Card>

      {/* Bento: halves -> wide pace feature */}
      <Bento>
        <Card style={{ padding: 14, marginVertical: 0 }}>
          <Label>Left</Label>
          <Text style={[T.curMd, { color: DS.primary, marginTop: 6 }]} numberOfLines={1}>{fmt(Math.max(0, totalTarget - totalSaved), base)}</Text>
        </Card>
        <Card style={{ padding: 14, marginVertical: 0 }}>
          <Label>Goals</Label>
          <Text style={[T.curMd, { color: DS.primary, marginTop: 6 }]} numberOfLines={1}>{active.length} active</Text>
        </Card>
        <Card span={2} style={{ padding: 14, marginVertical: 0 }}>
          <View style={[U.hRow]}>
            <Label>Year pace</Label>
            <Text style={[T.curSm, { color: DS.primary }]}>{fmt(totalTarget > 0 ? (totalTarget - totalSaved) / 12 : 0, base)}/mo</Text>
          </View>
          <Text style={[T.bodySm, { color: DS.onVariant, marginTop: 6 }]}>
            {totalTarget > 0 ? 'Monthly saving to finish everything in a year' : 'Add a goal to see your pace'}
          </Text>
        </Card>
      </Bento>

      {/* Filters */}
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        {[
          { id: 'active', label: `Active (${active.length})` },
          { id: 'achieved', label: `Done (${done.length})` },
        ].map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setFilter(f.id)}
            style={{
              height: 24, paddingHorizontal: 12, borderRadius: 999, justifyContent: 'center', marginRight: 6,
              backgroundColor: filter === f.id ? DS.primary : DS.container,
            }}
          >
            <Text style={[{ fontSize: 11, lineHeight: 14, fontWeight: filter === f.id ? '600' : '500', fontFamily: filter === f.id ? font.bold : font.medium, color: filter === f.id ? DS.onPrimary : DS.onVariant }]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {(
        <View style={{ marginTop: 8 }}>
          <View style={[U.hRow, { paddingHorizontal: 4, marginBottom: 2 }]}>
            <Text style={[T.labelSm, { color: DS.onVariant }]}>
              {filter === 'achieved' ? 'DONE' : 'SAVING'}
            </Text>
            <Text style={[{ fontSize: 11, lineHeight: 14, fontWeight: '500', fontFamily: font.medium, color: DS.onVariant }]}>
              {shown.length}
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
            return (
              <Pressable key={g.id} onPress={() => { setManaging(g.id); setManageAmt(''); }} style={({ pressed }) => [{ opacity: pressed ? 0.96 : 1 }]}>
                <Card style={{ padding: 16, opacity: isDone ? 0.95 : 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flexDirection: 'row', flex: 1, minWidth: 0 }}>
                      <View style={{ width: 32, height: 32, borderRadius: DS.radius.sm, backgroundColor: isDone ? DS.primary : DS.container, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                        <I name={goalIcon(g.name)} size={16} color={isDone ? DS.onPrimary : DS.primary} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[T.hSm, { color: DS.on }]} numberOfLines={1}>{g.name}</Text>
                        <Text style={[T.bodySm, { color: DS.onVariant }]} numberOfLines={1}>
                          Target {fmtDay(g.deadline)}
                          {ml != null && !isDone ? ` · ${ml} mo left` : ''}
                        </Text>
                      </View>
                    </View>
                    {isDone ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: DS.primary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 }}>
                        <I name="done-all" size={11} color={DS.onPrimary} />
                        <Text style={[T.labelSm, { color: DS.onPrimary, marginLeft: 3 }]}>100%</Text>
                      </View>
                    ) : (
                      <Text style={[T.curSm, { color: DS.primary, marginLeft: 8 }]}>{pct.toFixed(0)}%</Text>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
                    <Text style={[T.curMd, { color: DS.primary }]}>{fmt(toBase(g.saved, g.currency, base, rates), base)}</Text>
                    <Text style={[T.bodySm, { color: DS.onVariant, marginLeft: 5 }]}>of {fmt(toBase(g.target, g.currency, base, rates), base)}</Text>
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
                        {fmtDay(g.deadline)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {!isDone && <I name={proj.eta ? 'trending-up' : 'repeat'} size={13} color={DS.primary} />}
                      <Text style={[T.curSm, { color: DS.primary, marginLeft: 4 }]}>
                        {isDone ? '' : proj.done ? '' : proj.eta && proj.perDay ? `${fmt(toBase(proj.perDay * 30, g.currency, base, rates), base)}/mo` : 'Tap to manage'}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Manage popup: add / withdraw funds, edit details, delete */}
      <Sheet visible={!!liveManaging} onClose={() => setManaging(null)} title={liveManaging ? liveManaging.name : 'Goal'}>
        {liveManaging && (
          <View>
            <View style={[U.hRow]}>
              <Text style={[T.bodyMd, { color: DS.onVariant }]}>Saved</Text>
              <Text style={[{ fontSize: 14, fontWeight: '700', fontFamily: font.bold, color: DS.on }]}>
                {fmt(liveManaging.saved, base)} / {fmt(liveManaging.target, base)}
              </Text>
            </View>
            <View style={{ marginTop: 8 }}>
              <Prog pct={Math.min(100, (liveManaging.saved / liveManaging.target) * 100)} h={6} track={DS.container} />
            </View>
            <Text style={[T.bodySm, { color: DS.onVariant, marginTop: 6 }]}>
              Target {fmtDay(liveManaging.deadline)}
            </Text>
            <Field label="Amount (Rs.)" placeholder="0.00" keyboardType="numeric" value={manageAmt}
              onChangeText={(v) => setManageAmt(v.replace(/[^0-9.]/g, ''))} />
            <View style={{ flexDirection: 'row', marginTop: 2 }}>
              <Pressable onPress={() => doMove(1)} style={{ flex: 1, backgroundColor: DS.primary, borderRadius: DS.radius.sm, paddingVertical: 12, alignItems: 'center', marginRight: 6 }}>
                <Text style={{ color: DS.onPrimary, fontWeight: '600', fontSize: 13, fontFamily: font.bold }}>+ Add</Text>
              </Pressable>
              <Pressable onPress={() => doMove(-1)} style={{ flex: 1, borderWidth: 1, borderColor: DS.hairline, borderRadius: DS.radius.sm, paddingVertical: 12, alignItems: 'center', backgroundColor: DS.lowest }}>
                <Text style={{ color: DS.on, fontWeight: '600', fontSize: 13, fontFamily: font.bold }}>− Out</Text>
              </Pressable>
            </View>
            <Btn title="Edit details" kind="ghost" onPress={() => { setEditing(liveManaging); setManaging(null); setShowForm(true); }} />
            <Btn title="Delete goal" kind="danger" onPress={() => confirmAct('Delete?', `Remove the "${liveManaging.name}" goal?`, 'Delete', () => { onDeleteGoal(liveManaging.id); setManaging(null); })} />
          </View>
        )}
      </Sheet>

      <Sheet visible={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit goal' : 'New goal'}>
        <GoalForm initial={editing} onSave={onSaveGoal} onClose={() => setShowForm(false)} />
      </Sheet>
    </View>
  );
}
