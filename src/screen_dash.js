// Home Dashboard — EXACT Stitch screen 9ab1b6eb (Monochrome Financial Atelier).
// Same structure, copy, tokens, metrics. Only numbers come from live data.
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DS, fmt, font, T, monthKey, shiftMonth, todayISO, todayLabelLong } from './theme';
import { balanceOf, sumAlloc, toBase } from './money';
import { Card, I, Label, Prog, U } from './ui';

function txIcon(t) {
  const s = `${t.merchant || ''} ${t.note || ''} ${t.category || ''}`.toLowerCase();
  if (t.type === 'income') {
    if (/salary|payroll|paycheck|deposit/.test(s)) return 'account-balance';
    return 'arrow-downward';
  }
  if (/apple|laptop|mac|hardware/.test(s)) return 'laptop-mac';
  if (/gym|fitness|health|wellness/.test(s)) return 'fitness-center';
  if (/coffee|cafe|starbucks|bottle|dining|restaurant/.test(s)) return 'local-cafe';
  if (/aws|cloud|server|dns|hosting/.test(s)) return 'dns';
  if (/github|git|code|terminal|dev/.test(s)) return 'terminal';
  if (/grocery|market|mart|whole foods|shop/.test(s)) return 'shopping-bag';
  return 'receipt-long';
}

const QUICK = [
  { label: 'Transfer', icon: 'sync-alt', go: 'add' },
  { label: 'Import', icon: 'file-upload', go: 'More' },
  { label: 'Audit', icon: 'fact-check', go: 'Activity' },
  { label: 'Reports', icon: 'insights', go: 'More' },
];

export function DashScreen({ txs, goals, budgets, recurrings, settings, flags, onQuickAdd, onGo, onPostDue }) {
  const base = settings.baseCurrency;
  const rates = settings.rates;
  const today = todayISO();
  const mk = monthKey(today);

  const income = sumAlloc(txs, base, rates, (t) => t.type === 'income' && monthKey(t.date) === mk).total;
  const expense = sumAlloc(txs, base, rates, (t) => t.type === 'expense' && monthKey(t.date) === mk).total;
  const balance = balanceOf(txs, base, rates);

  const pmk = shiftMonth(mk, -1);
  const prevNet =
    sumAlloc(txs, base, rates, (t) => t.type === 'income' && monthKey(t.date) === pmk).total -
    sumAlloc(txs, base, rates, (t) => t.type === 'expense' && monthKey(t.date) === pmk).total;
  const showDelta = prevNet !== 0;
  const delta = showDelta ? ((income - expense - prevNet) / Math.abs(prevNet)) * 100 : 0;

  const capTotal = (budgets || []).reduce((s, b) => s + (Number(b.cap) || 0), 0);
  const monthSpentByCat = sumAlloc(txs, base, rates, (t) => t.type === 'expense' && monthKey(t.date) === mk).byCat;
  const spent = capTotal > 0
    ? (budgets || []).reduce((s, b) => s + (monthSpentByCat[b.category] || 0), 0)
    : expense;
  const planned = capTotal > 0 ? capTotal : Math.max(income, expense, 0);
  const allocPct = planned > 0 ? Math.min(100, (spent / planned) * 100) : 0;

  const flagIds = Object.keys(flags || {});
  const firstFlagTx = flagIds.length ? txs.find((t) => t.id === flagIds[0]) : null;
  const dueCount = (recurrings || []).filter((r) => r.active !== false && r.nextDate <= today).length;
  const recent = [...txs].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 3);

  const banner = firstFlagTx
    ? {
        title: '1 Outlier Detected',
        meta: (firstFlagTx.merchant || firstFlagTx.category || 'Transaction'),
          desc: `Spike detected (${fmt(toBase(firstFlagTx.amount, firstFlagTx.currency, base, rates))} vs baseline)`,
        btn: 'Review',
        act: () => onGo('Activity'),
      }
    : dueCount > 0
      ? {
          title: `${dueCount} Bill${dueCount > 1 ? 's' : ''} Due`,
          meta: 'Recurring',
          desc: 'Scheduled bills are ready to record',
          btn: 'Record',
          act: () => onPostDue(),
        }
      : null;

  const goQuick = (q) => {
    if (q.go === 'add') onQuickAdd();
    else onGo(q.go);
  };

  return (
    <View>
      {/* Date + status */}
      <View style={[U.hRow, { paddingTop: 4 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: DS.primary, marginRight: 6 }} />
          <Text style={[T.labelSm, { color: DS.onVariant }]}>{todayLabelLong()}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: DS.low, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
          <I name="lock" size={12} color={DS.onVariant} />
          <Text style={[T.labelSm, { color: DS.onVariant, marginLeft: 4 }]}>SYNCHRONIZED</Text>
        </View>
      </View>

      {/* Total balance hero */}
      <Card>
        <View style={U.hRow}>
          <Label>Total Balance</Label>
          <View style={{ backgroundColor: DS.high, borderRadius: DS.radius.xs, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={[T.labelSm, { color: DS.on }]}>LEDGER 01</Text>
          </View>
        </View>
        <Text style={[T.curLg, { color: DS.primary, marginTop: 4 }]}>
          {balance < 0 ? '-' : ''}{fmt(Math.abs(balance), base)}
        </Text>
        <View style={[U.hRow, { marginTop: 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {showDelta && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: DS.primary, borderRadius: DS.radius.xs, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 }}>
                <I name="arrow-upward" size={10} color="#fff" />
                <Text style={[T.labelSm, { color: '#fff', marginLeft: 2 }]}>{Math.abs(delta).toFixed(1)}%</Text>
              </View>
            )}
            <Text style={[T.bodySm, { color: DS.onVariant }]} numberOfLines={1}>
              {showDelta ? `vs. ${fmt(Math.abs(prevNet), base)} last month` : 'vs. no prior month'}
            </Text>
          </View>
          <Svg width={64} height={16} viewBox="0 0 64 16">
            <Path d="M1 13L14 10L26 12L38 6L50 8L63 2" stroke={DS.primary} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        </View>
        <Text style={[T.labelSm, { color: DS.onVariant, opacity: 0.8, marginTop: 8 }]}>
          Audited live • Zero discrepancies
        </Text>
      </Card>

      {/* Outlier / due banner */}
      {!!banner && (
        <Card style={{ padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: DS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <I name="warning" size={14} color="#fff" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[T.hSm, { color: DS.on }]} numberOfLines={1}>{banner.title}</Text>
                <View style={{ width: 4, height: 4, borderRadius: 999, backgroundColor: DS.onVariant, marginHorizontal: 4 }} />
                <Text style={[T.labelSm, { color: DS.onVariant, flexShrink: 1 }]} numberOfLines={1}>{banner.meta}</Text>
              </View>
              <Text style={[T.bodySm, { color: DS.onVariant, marginTop: 2 }]} numberOfLines={1}>{banner.desc}</Text>
            </View>
            <Pressable onPress={banner.act} style={{ backgroundColor: DS.primary, borderRadius: DS.radius.xs, paddingHorizontal: 12, paddingVertical: 4, marginLeft: 8 }}>
              <Text style={[T.labelSm, { color: '#fff' }]}>{banner.btn}</Text>
            </Pressable>
          </View>
        </Card>
      )}

      {/* Monthly allocation */}
      <Card>
        <View style={U.hRow}>
          <Label>Monthly Allocation</Label>
          <View style={{ backgroundColor: DS.high, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={[T.curSm, { color: DS.on }]}>{allocPct.toFixed(0)}%</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
          <Text style={[T.curMd, { color: DS.primary }]}>{fmt(spent, base)}</Text>
          <Text style={[T.bodySm, { color: DS.onVariant }]}> / {fmt(planned, base)}</Text>
          <View style={{ flex: 1 }} />
          <Text style={[T.labelSm, { color: DS.onVariant }]}>ENVELOPE ACTIVE</Text>
        </View>
        <View style={{ marginTop: 8 }}>
          <Prog pct={allocPct} h={6} track={DS.highest} />
        </View>
        <View style={[U.hRow, { marginTop: 8 }]}>
          <Text style={[T.bodySm, { color: DS.onVariant }]}>{fmt(Math.max(0, planned - spent), base)} remaining</Text>
          <Text style={[T.labelSm, { color: DS.onVariant }]}>Zero-base budget</Text>
        </View>
      </Card>

      {/* Quick tools */}
      <View style={{ flexDirection: 'row', marginHorizontal: -2, marginTop: 6 }}>
        {QUICK.map((q) => (
          <View key={q.label} style={{ flex: 1, marginHorizontal: 2 }}>
            <Pressable onPress={() => goQuick(q)} style={{ backgroundColor: DS.glassCard, borderWidth: 1, borderColor: DS.hairline, borderTopColor: 'rgba(255,255,255,0.95)', borderRadius: DS.radius.sm, padding: 6, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
              <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: DS.low, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                <I name={q.icon} size={16} color={DS.on} />
              </View>
              <Text style={[T.labelSm, { color: DS.on }]}>{q.label}</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {/* Recent activity */}
      <View style={{ marginTop: 16 }}>
        <View style={[U.hRow, { paddingHorizontal: 4, marginBottom: 4 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[T.hSm, { color: DS.on }]}>Recent Activity</Text>
            {recent.length > 0 && (
              <View style={{ backgroundColor: DS.high, borderRadius: DS.radius.xs, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 6 }}>
                <Text style={[T.labelSm, { color: DS.onVariant }]}>{recent.length} NEW</Text>
              </View>
            )}
          </View>
          <Pressable onPress={() => onGo('Activity')} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[T.labelSm, { color: DS.onVariant }]}>See All</Text>
            <I name="chevron-right" size={12} color={DS.onVariant} />
          </Pressable>
        </View>
        <Card style={{ paddingHorizontal: 0, paddingVertical: 2 }}>
          {recent.length === 0 && (
            <Text style={[T.bodySm, { color: DS.onVariant, textAlign: 'center', paddingVertical: 18 }]}>
              No transactions yet — tap + to add your first one.
            </Text>
          )}
          {recent.map((t, i) => (
            <View key={t.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: t.type === 'income' ? DS.primary : DS.high, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <I name={txIcon(t)} size={14} color={t.type === 'income' ? '#fff' : DS.on} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 13, lineHeight: 18, fontWeight: '500', color: DS.primary, fontFamily: font.medium }} numberOfLines={1}>
                    {t.merchant || t.note || t.category}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
                    <Text style={[T.labelSm, { color: DS.onVariant }]} numberOfLines={1}>{t.category}</Text>
                    <View style={{ width: 2, height: 2, borderRadius: 999, backgroundColor: DS.onVariant, marginHorizontal: 6 }} />
                    <Text style={[T.labelSm, { color: DS.onVariant }]} numberOfLines={1}>{t.date}</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                  <Text style={[T.curMd, { color: DS.primary }]} numberOfLines={1}>
                    {t.type === 'income' ? '+' : '-'}{fmt(toBase(t.amount, t.currency, base, rates))}
                  </Text>
                  <Text style={[T.labelSm, { color: DS.onVariant, marginTop: 2 }]}>
                    {t.type === 'income' ? 'CLEARED' : 'POSTED'}
                  </Text>
                </View>
              </View>
              {i < recent.length - 1 && <View style={{ height: 1, backgroundColor: DS.rowLine, marginLeft: 50, marginRight: 12 }} />}
            </View>
          ))}
        </Card>
      </View>
    </View>
  );
}
