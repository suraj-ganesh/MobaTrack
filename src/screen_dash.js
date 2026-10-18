// Home Dashboard - simple bento layout, NPR-only.
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { DS, fmt, font, T, monthKey, shiftMonth, todayISO, todayLabelLong } from './theme';
import { balanceOf, sumAlloc, toBase } from './money';
import { Bento, Card, I, Label, Prog, U } from './ui';

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



function MiniTile({ label, value, icon }) {
  return (
    <Card style={{ padding: 14, marginVertical: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 26, height: 26, borderRadius: 999, backgroundColor: DS.low, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
          <I name={icon} size={14} color={DS.on} />
        </View>
        <Label>{label}</Label>
      </View>
      <Text style={[T.curMd, { color: DS.primary, marginTop: 8 }]} numberOfLines={1}>{value}</Text>
    </Card>
  );
}

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

  const savedTotal = (goals || []).reduce((s, g) => s + (Number(g.saved) || 0), 0);

  const flagIds = Object.keys(flags || {});
  const firstFlagTx = flagIds.length ? txs.find((t) => t.id === flagIds[0]) : null;
  const dueCount = (recurrings || []).filter((r) => r.active !== false && r.nextDate <= today).length;
  const recent = [...txs].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 3);

  const banner = firstFlagTx
    ? {
        title: 'Unusual spending',
        meta: (firstFlagTx.merchant || firstFlagTx.category || 'Transaction'),
        desc: `${fmt(toBase(firstFlagTx.amount, firstFlagTx.currency, base, rates), base)} is much higher than usual`,
        btn: 'Review',
        act: () => onGo('Activity'),
      }
    : dueCount > 0
      ? {
          title: `${dueCount} bill${dueCount > 1 ? 's' : ''} due`,
          meta: 'Recurring',
          desc: 'Scheduled bills are ready to record',
          btn: 'Record',
          act: () => onPostDue(),
        }
      : null;

  return (
    <View>
      {/* Date */}
      <View style={[U.hRow, { paddingTop: 4 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: DS.primary, marginRight: 6 }} />
          <Text style={[T.labelSm, { color: DS.onVariant }]}>{todayLabelLong()}</Text>
        </View>
      </View>

      {/* Balance hero */}
      <Card>
        <Label>Balance</Label>
        <Text style={[T.curLg, { color: DS.primary, marginTop: 4 }]}>
          {balance < 0 ? '-' : ''}{fmt(Math.abs(balance), base)}
        </Text>
        <View style={[U.hRow, { marginTop: 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {showDelta && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: DS.primary, borderRadius: DS.radius.xs, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 }}>
                <I name="arrow-upward" size={10} color={DS.onPrimary} />
                <Text style={[T.labelSm, { color: DS.onPrimary, marginLeft: 2 }]}>{Math.abs(delta).toFixed(1)}%</Text>
              </View>
            )}
            <Text style={[T.bodySm, { color: DS.onVariant }]} numberOfLines={1}>
              {showDelta ? `vs ${fmt(Math.abs(prevNet), base)} last month` : 'Your money at a glance'}
            </Text>
          </View>
          <Svg width={64} height={16} viewBox="0 0 64 16">
            <Path d="M1 13L14 10L26 12L38 6L50 8L63 2" stroke={DS.primary} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        </View>
      </Card>

      {/* Bento: halves -> wide feature -> halves */}
      <Bento>
        <MiniTile label="Income" value={fmt(income, base)} icon="arrow-downward" />
        <MiniTile label="Expenses" value={fmt(expense, base)} icon="receipt-long" />
        <Card span={2} style={{ padding: 14, marginVertical: 0 }}>
          <View style={[U.hRow]}>
            <Label>Spent this month</Label>
            <Text style={[T.labelSm, { color: DS.onVariant }]}>{allocPct.toFixed(0)}% of plan</Text>
          </View>
          <Text style={[T.curMd, { color: DS.primary, marginTop: 6 }]} numberOfLines={1}>
            {fmt(spent, base)} <Text style={[T.bodySm, { color: DS.onVariant }]}>/ {fmt(planned, base)}</Text>
          </Text>
          <View style={{ marginTop: 8 }}>
            <Prog pct={allocPct} h={6} track={DS.highest} />
          </View>
        </Card>
        <MiniTile label="Saved" value={fmt(savedTotal, base)} icon="flag" />
        <MiniTile label="Goals" value={`${(goals || []).length} active`} icon="donut-small" />
      </Bento>

      {/* Alert banner */}
      {!!banner && (
        <Card style={{ padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: DS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <I name="warning" size={14} color={DS.onPrimary} />
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
              <Text style={[T.labelSm, { color: DS.onPrimary }]}>{banner.btn}</Text>
            </Pressable>
          </View>
        </Card>
      )}

      {/* Recent activity */}
      <View style={{ marginTop: 12 }}>
        <View style={[U.hRow, { paddingHorizontal: 4, marginBottom: 4 }]}>
          <Text style={[T.hSm, { color: DS.on }]}>Recent</Text>
          <Pressable onPress={() => onGo('Activity')} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[T.labelSm, { color: DS.onVariant }]}>See all</Text>
            <I name="chevron-right" size={12} color={DS.onVariant} />
          </Pressable>
        </View>
        <Card style={{ paddingHorizontal: 0, paddingVertical: 2 }}>
          {recent.length === 0 && (
            <Text style={[T.bodySm, { color: DS.onVariant, textAlign: 'center', paddingVertical: 18 }]}>
              Nothing yet - tap + to add your first entry.
            </Text>
          )}
          {recent.map((t, i) => (
            <View key={t.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: t.type === 'income' ? DS.primary : DS.high, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <I name={txIcon(t)} size={14} color={t.type === 'income' ? DS.onPrimary : DS.on} />
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
                    {t.type === 'income' ? '+' : '-'}{fmt(toBase(t.amount, t.currency, base, rates), base)}
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
