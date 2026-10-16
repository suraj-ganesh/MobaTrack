// Activity — EXACT Stitch screen 5ec1e189 (Monochrome Financial Atelier).
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Share } from 'react-native';
import { DS, fmt, font, T, monthKey, monthName, todayISO, addDaysISO } from './theme';
import { sumAlloc, toBase } from './money';
import { buildCSV } from './csv';
import { Bento, Card, Chip, I, Label, SearchBar, U, notify } from './ui';

function glyphFor(t) {
  const s = `${t.merchant || ''} ${t.note || ''} ${t.category || ''}`.toLowerCase();
  if (/apple|laptop|mac|hardware/.test(s)) return 'laptop-mac';
  if (/payroll|salary|bank|deposit|balance/.test(s)) return 'account-balance';
  if (/coffee|cafe|starbucks|bottle|dining/.test(s)) return 'local-cafe';
  if (/aws|cloud|server|dns|hosting|infra/.test(s)) return 'dns';
  if (/gym|fitness|health/.test(s)) return 'fitness-center';
  if (/grocery|market|mart|whole foods|shop|bag/.test(s)) return 'shopping-bag';
  if (t.type === 'income') return 'arrow-downward';
  return 'receipt-long';
}

export function TxScreen({ txs, flags, base, settings, onAdd, onEdit }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');

  const rates = settings?.rates || { [base]: 1 };
  const today = todayISO();
  const yesterday = addDaysISO(today, -1);
  const mk = monthKey(today);

  const inflow = sumAlloc(txs, base, rates, (t) => t.type === 'income' && monthKey(t.date) === mk).total;
  const outflow = sumAlloc(txs, base, rates, (t) => t.type === 'expense' && monthKey(t.date) === mk).total;
  const net = inflow - outflow;
  const flowPct = outflow > 0 ? ((net / outflow) * 100).toFixed(1) : '0.0';

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = (txs || []).filter((t) => {
      if (type !== 'all' && t.type !== type) return false;
      if (!needle) return true;
      return `${t.merchant || ''} ${t.note || ''} ${t.category} ${t.amount}`.toLowerCase().includes(needle);
    });
    out.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return out;
  }, [txs, q, type]);

  const groups = useMemo(() => {
    const g = [
      { id: 'today', label: 'Today', items: [] },
      { id: 'yesterday', label: 'Yesterday', items: [] },
      { id: 'earlier', label: 'Earlier this week', items: [] },
    ];
    for (const t of list) {
      if (t.date === today) g[0].items.push(t);
      else if (t.date === yesterday) g[1].items.push(t);
      else g[2].items.push(t);
    }
    return g.filter((x) => x.items.length);
  }, [list, today, yesterday]);

  const groupTotal = (items) => items.reduce((s, t) => {
    const v = toBase(t.amount, t.currency, base, rates);
    return s + (t.type === 'income' ? v : -v);
  }, 0);

  const doExport = async () => {
    const csv = buildCSV(txs || []);
    if (!csv) {
      notify('Nothing to export yet.');
      return;
    }
    try {
      await Share.share({ message: csv, title: 'transactions.csv' });
    } catch {}
    notify('Report generated');
  };

  return (
    <View>
      {/* Net flow hero */}
      <Card>
        <View style={U.hRow}>
          <Label>{monthName(mk)} Net Flow</Label>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: DS.high, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
            <I name="trending-up" size={13} color={DS.on} />
            <Text style={[{ fontSize: 11, lineHeight: 14, fontWeight: '500', fontFamily: font.medium, color: DS.on, marginLeft: 3 }]}>
              +{flowPct}%
            </Text>
          </View>
        </View>
        <View style={[U.hRow, { marginTop: 8, alignItems: 'flex-end' }]}>
          <Text style={[T.curLg, { color: DS.primary }]}>
            {net >= 0 ? '+' : '-'}{fmt(Math.abs(net), base)}
          </Text>
          <Svg width={80} height={28} viewBox="0 0 80 28">
            <Path d="M2 22 L16 19 L32 21 L46 11 L60 14 L78 3" stroke={DS.primary} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Circle cx={78} cy={3} r={2} fill={DS.primary} />
          </Svg>
        </View>
      </Card>

      {/* Bento: halves -> wide feature */}
      <Bento>
        <Card style={{ padding: 14, marginVertical: 0 }}>
          <Label>In</Label>
          <Text style={[T.curMd, { color: DS.primary, marginTop: 6 }]} numberOfLines={1}>{fmt(inflow, base)}</Text>
        </Card>
        <Card style={{ padding: 14, marginVertical: 0 }}>
          <Label>Out</Label>
          <Text style={[T.curMd, { color: DS.primary, marginTop: 6 }]} numberOfLines={1}>{fmt(outflow, base)}</Text>
        </Card>
        <Card span={2} style={{ padding: 14, marginVertical: 0 }}>
          <View style={[U.hRow]}>
            <Label>Entries this month</Label>
            <Text style={[T.curSm, { color: DS.primary }]}>{(txs || []).filter((t) => monthKey(t.date) === mk).length}</Text>
          </View>
          <Text style={[T.bodySm, { color: DS.onVariant, marginTop: 6 }]}>
            {net >= 0 ? `Keeping ${fmt(net, base)} this month` : `Over by ${fmt(Math.abs(net), base)} this month`}
          </Text>
        </Card>
      </Bento>

      {/* Search + filters */}
      <SearchBar value={q} onChange={setQ} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <Chip label="All" active={type === 'all'} onPress={() => setType('all')} />
        <Chip label="Expenses" active={type === 'expense'} onPress={() => setType('expense')} />
        <Chip label="Income" active={type === 'income'} onPress={() => setType('income')} />
        <View style={{ width: 1, height: 14, backgroundColor: DS.outlineVariant, opacity: 0.4, marginHorizontal: 4 }} />
        <Chip label="Export" icon="download" active={false} onPress={doExport} />
      </View>

      {/* Grouped ledger */}
      {list.length === 0 && (
        <Card style={{ alignItems: 'center', paddingVertical: 40, marginTop: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: DS.high, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <I name="filter-alt-off" size={20} color={DS.onVariant} />
          </View>
          <Text style={[T.hSm, { color: DS.primary }]}>No transactions found</Text>
          <Text style={[T.bodySm, { color: DS.onVariant, marginTop: 4 }]}>Try tweaking your search or active filters.</Text>
        </Card>
      )}
      {groups.map((g) => {
        const tot = groupTotal(g.items);
        return (
          <View key={g.id} style={{ marginTop: 14 }}>
            <View style={[U.hRow, { paddingHorizontal: 6, paddingVertical: 4, marginBottom: 2 }]}>
              <Text style={[T.labelSm, { color: DS.onVariant }]}>{g.label.toUpperCase()}</Text>
              <Text style={[T.curSm, { color: DS.primary }]}>
                {tot >= 0 ? '+' : '-'}{fmt(Math.abs(tot), base)}
              </Text>
            </View>
            <Card style={{ paddingHorizontal: 0, paddingVertical: 2 }}>
              {g.items.map((t, i) => {
                const flagged = ((flags || {})[t.id] || []).length > 0;
                return (
                  <View key={t.id}>
                    <Pressable onPress={() => onEdit(t)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: DS.high, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <I name={glyphFor(t)} size={14} color={DS.on} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 13, lineHeight: 18, fontWeight: '500', color: DS.primary, fontFamily: font.medium, flexShrink: 1 }} numberOfLines={1}>
                            {t.merchant || t.note || t.category}
                          </Text>
                          {flagged && (
                            <View style={{ backgroundColor: DS.high, borderRadius: DS.radius.xs, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 }}>
                              <Text style={{ fontSize: 10, fontWeight: '500', color: DS.on }}>Review</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[T.bodySm, { color: DS.onVariant, marginTop: 1 }]} numberOfLines={1}>
                          {t.category}{t.note && t.merchant ? ` · ${t.note}` : ''} · {t.date === today ? 'Today' : t.date === yesterday ? 'Yesterday' : t.date}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                        <Text style={[T.curMd, { color: DS.primary }]} numberOfLines={1}>
                          {t.type === 'income' ? '+' : '-'}{fmt(toBase(t.amount, t.currency, base, rates), base)}
                        </Text>
                        <Text style={[T.labelMd, { color: DS.onVariant, marginTop: 2 }]}>
                          {t.type === 'income' ? 'Cleared' : t.date === today ? 'Today' : t.date === yesterday ? 'Yesterday' : t.date}
                        </Text>
                      </View>
                    </Pressable>
                    {i < g.items.length - 1 && <View style={{ height: 1, backgroundColor: DS.rowLine, marginLeft: 52, marginRight: 12 }} />}
                  </View>
                );
              })}
            </Card>
          </View>
        );
      })}
    </View>
  );
}
