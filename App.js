import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BouncyPress, RiseIn, ScreenShell } from './src/smooth';
import { SmoothBar } from './src/notchbar';
import { C, DEFAULT_CATEGORIES, formatMoney } from './src/theme';
import { loadAll, saveTransactions, saveGoals, saveSettings, clearAll, uid } from './src/storage';
import { getTotals, generateInsights } from './src/ai';
import { CircleArrow, DecorBackground, PillButton, Stars, TinyIcon } from './src/retro';
import { AVATAR_IDS, AvatarBust, AvatarPhoto, avatarLabel, normAvatar } from './src/avatars';

function sanitizeAmount(v) {
  const n = Number(String(v).trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export default function App() {
  const [tab, setTab] = useState('Home');
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [settings, setSettings] = useState({ currency: 'Rs.', name: 'Parzavel', avatar: 'm1' });
  const [ready, setReady] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await loadAll();
        if (!mounted) return;
        setTransactions(d.transactions);
        setGoals(d.goals);
        setSettings(d.settings);
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const totals = useMemo(() => getTotals(transactions), [transactions]);
  const insights = useMemo(() => generateInsights(transactions, goals), [transactions, goals]);
  const currency = settings.currency?.trim() ? settings.currency : 'Rs.';
  const avatar = normAvatar(settings.avatar);
  const displayName = String(settings.name || '').trim().toUpperCase() || 'PARZAVEL';

  const addTx = useCallback(async ({ amount, type, category, note }) => {
    const clean = sanitizeAmount(amount);
    if (!clean) return false;
    const tx = {
      id: uid(),
      amount: clean,
      type: type === 'income' ? 'income' : 'expense',
      category: String(category || 'Other'),
      note: String(note || '').trim().slice(0, 120),
      date: new Date().toISOString().slice(0, 10),
    };
    setTransactions((prev) => {
      const next = [tx, ...prev];
      saveTransactions(next);
      return next;
    });
    return true;
  }, []);

  const delTx = useCallback((id) => {
    Alert.alert('Delete?', 'Remove this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          setTransactions((prev) => {
            const next = prev.filter((t) => t.id !== id);
            saveTransactions(next);
            return next;
          }),
      },
    ]);
  }, []);

  const addGoal = useCallback(async ({ name, target }) => {
    const cleanName = String(name || '').trim().slice(0, 60);
    const cleanTarget = sanitizeAmount(target);
    if (!cleanName || !cleanTarget) return false;
    const g = { id: uid(), name: cleanName, target: cleanTarget, saved: 0 };
    setGoals((prev) => {
      const next = [g, ...prev];
      saveGoals(next);
      return next;
    });
    return true;
  }, []);

  const addFunds = useCallback((id, amt) => {
    const clean = sanitizeAmount(amt);
    if (!clean) {
      Alert.alert('Enter a valid amount');
      return;
    }
    setGoals((prev) => {
      const next = prev.map((g) =>
        g.id === id ? { ...g, saved: Math.min(Number(g.target) || 0, (Number(g.saved) || 0) + clean) } : g
      );
      saveGoals(next);
      return next;
    });
  }, []);

  const delGoal = useCallback((id) => {
    Alert.alert('Delete?', 'Remove this goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          setGoals((prev) => {
            const next = prev.filter((g) => g.id !== id);
            saveGoals(next);
            return next;
          }),
      },
    ]);
  }, []);

  const updateSettings = useCallback(async (s) => {
    const clean = {
      currency: String(s.currency || 'Rs.').slice(0, 6) || 'Rs.',
      name: String(s.name || 'Parzavel').slice(0, 60) || 'Parzavel',
      avatar: normAvatar(s.avatar),
    };
    setSettings(clean);
    await saveSettings(clean);
  }, []);

  const resetAll = useCallback(() => {
    Alert.alert('Reset?', 'Delete all transactions and goals?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete all',
        style: 'destructive',
        onPress: async () => {
          await clearAll();
          setTransactions([]);
          setGoals([]);
        },
      },
    ]);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (filter !== 'all' && t.type !== filter) return false;
      if (!q) return true;
      return `${t.note || ''} ${t.category || ''} ${t.amount}`.toLowerCase().includes(q);
    });
  }, [transactions, query, filter]);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={S.loading} edges={['top', 'bottom']}>
          <Text style={S.loadTitle}>PARZAVEL</Text>
          <StatusBar style="dark" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={S.root} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="dark" />
        <DecorBackground />
        <View style={S.phone}>
          <View style={S.body}>
            <ScreenShell tabKey={tab}>
            {tab === 'Home' && (
              <HomeTab totals={totals} transactions={transactions} currency={currency} displayName={displayName} avatar={avatar} goTx={() => setTab('Tx')} />
            )}
            {tab === 'Tx' && (
              <TxTab list={filtered} currency={currency} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} onDelete={delTx} />
            )}
            {tab === 'AI' && <AITab insights={insights} totals={totals} currency={currency} avatar={avatar} />}
            {tab === 'More' && (
              <MoreTab settings={settings} avatar={avatar} onSettings={updateSettings} totals={totals} currency={currency} onReset={resetAll} goals={goals} onAddGoal={() => setShowGoalModal(true)} onFunds={addFunds} onDeleteGoal={delGoal} />
            )}
            </ScreenShell>
          </View>
          <SmoothBar tab={tab} setTab={setTab} onPlus={() => setShowTxModal(true)} />
        </View>
        <TxModal visible={showTxModal} onClose={() => setShowTxModal(false)} onSave={addTx} />
        <GoalModal visible={showGoalModal} onClose={() => setShowGoalModal(false)} onSave={addGoal} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function HomeTab({ totals, transactions, currency, displayName, avatar, goTx }) {
  const recent = transactions.slice(0, 3);
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled">
      <View style={S.heroCream}>
        <AvatarBust id={avatar} size={168} />
      </View>
      <View style={S.seamWrap}>
        <View style={S.seamBar} />
        <View style={S.seamThin} />
      </View>
      <LinearGradient colors={['rgba(219,210,205,0.30)', 'transparent']} style={S.fadeStrip} />
      <View style={S.heroDark}>
        <Text style={S.welcome}>WELCOME, {displayName}</Text>
        <Text style={S.heroDesc}>Money style is the final tip off whether or not you really know your balance.</Text>
        <Text style={S.balance}>{formatMoney(totals.balance, currency)}</Text>
        <View style={S.miniRow}>
          <Text style={S.mini}>+{formatMoney(totals.income, currency)}</Text>
          <Text style={S.miniDot}>·</Text>
          <Text style={S.mini}>−{formatMoney(totals.expenses, currency)}</Text>
        </View>
        <View style={S.recentBox}>
          {recent.length === 0 && <Text style={S.recentEmpty}>No transactions. Tap + to start.</Text>}
          {recent.map((t, i) => (
            <RiseIn key={t.id} index={i} style={S.recentLine}>
              <Text style={S.recentCat} numberOfLines={1}>{String(t.category).toUpperCase()}</Text>
              <Text style={S.recentAmt} numberOfLines={1}>{t.type === 'income' ? '+' : '−'}{formatMoney(t.amount, currency)}</Text>
            </RiseIn>
          ))}
        </View>
        <View style={S.centerRow}>
          <CircleArrow onPress={goTx} />
        </View>
      </View>
    </ScrollView>
  );
}

function TxTab({ list, currency, query, setQuery, filter, setFilter, onDelete }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled">
      <View style={S.topRow}>
        <TinyIcon glyph="☰" light />
        <TinyIcon glyph="♥" light />
      </View>
      <Text style={S.choose}>TRANS{'\n'}ACTIONS</Text>
      <TextInput
        style={S.searchPill}
        placeholder="Search notes, category..."
        placeholderTextColor={C.muted}
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
      />
      <View style={S.chipRow}>
        {['all', 'income', 'expense'].map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[S.chip, filter === f && S.chipActive]} activeOpacity={0.7}>
            <Text style={[S.chipText, filter === f && S.chipTextActive]}>{f.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
        <Text style={S.countMicro}>{list.length} ITEMS</Text>
      </View>
      {list.map((item, i) => (
        <RiseIn key={item.id} index={i} style={S.txCard}>
          <View style={S.txLine}>
            <Text style={S.txCat}>{String(item.date).slice(5)} · {String(item.category).toUpperCase()}</Text>
            <Text style={S.txAmt}>{item.type === 'income' ? '+' : '−'}{formatMoney(item.amount, currency)}</Text>
          </View>
          {!!item.note && <Text style={S.txNote} numberOfLines={1}>{item.note}</Text>}
          <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={8}>
            <Text style={S.delLink}>DELETE</Text>
          </TouchableOpacity>
        </RiseIn>
      ))}
      {list.length === 0 && <Text style={S.recentEmpty}>Nothing here. Tap + to add.</Text>}
      <View style={S.pad} />
    </ScrollView>
  );
}

function pctOf(saved, target) {
  const s = Number(saved) || 0;
  const t = Number(target) || 0;
  if (t <= 0) return 0;
  return Math.min(100, Math.max(0, (s / t) * 100));
}

function AITab({ insights, totals, currency, avatar }) {
  const score = totals.income > 0 ? Math.max(0, Math.min(100, ((totals.income - totals.expenses) / totals.income) * 100)) : 0;
  const stars = score >= 40 ? 5 : score >= 20 ? 4 : score >= 0 ? 3 : 2;
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled">
      <View style={S.detailCream}>
        <View style={S.heroTopRow}>
          <TinyIcon glyph="✦" />
          <TinyIcon glyph="🔖" />
        </View>
        <AvatarBust id={avatar} size={130} />
      </View>
      <LinearGradient colors={['rgba(219,210,205,0.30)', 'transparent']} style={S.fadeStrip} />
      <View style={S.detailDark}>
        <Text style={S.detailTitle}>AI FINANCE REPORT</Text>
        <Stars value={stars} />
        <Text style={S.detailDesc}>Parzavel's auto-read of your money. Offline rules, no gateway. Savings rate {score.toFixed(0)}% · balance {formatMoney(totals.balance, currency)}.</Text>
        <Text style={S.detailNums}>{formatMoney(totals.income, currency)} IN · {formatMoney(totals.expenses, currency)} OUT</Text>
        <View style={S.track}><View style={[S.fill, { width: `${Math.max(0, Math.min(100, score))}%` }]} /></View>
      </View>
      <View style={S.pad} />
      {insights.map((ins, i) => (
        <RiseIn key={`${ins.title}-${i}`} index={i} style={S.aiCard}>
          <Text style={S.cardLabel}>{String(ins.type || 'info').toUpperCase()}</Text>
          <Text style={S.aiTitle}>{ins.title}</Text>
          <Text style={S.aiDesc}>{ins.description}</Text>
        </RiseIn>
      ))}
      <View style={S.pad} />
    </ScrollView>
  );
}

function MoreTab({ settings, avatar, onSettings, totals, currency, onReset, goals, onAddGoal, onFunds, onDeleteGoal }) {
  const [amt, setAmt] = useState({});
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled">
      <View style={S.topRow}>
        <TinyIcon glyph="☰" light />
        <TinyIcon glyph="♥" light />
      </View>
      <Text style={S.choose}>MEET{'\n'}PARZAVEL</Text>
      <View style={S.heroCream}>
        <AvatarBust id={avatar} size={140} />
        <Text style={S.cardLabel}>{String(settings.name || 'Parzavel').toUpperCase()}</Text>
      </View>
      <LinearGradient colors={['rgba(219,210,205,0.30)', 'transparent']} style={S.fadeStrip} />
      <Text style={S.fieldLabel}>CHOOSE CHARACTER</Text>
      <View style={S.avatarGrid}>
        {AVATAR_IDS.map((v, i) => (
          <RiseIn key={v} index={i} style={[S.avatarCard, avatar === v && S.avatarActive]}>
            <BouncyPress onPress={() => onSettings({ ...settings, avatar: v })} style={S.avatarTouch}>
              <AvatarPhoto id={v} mini />
              <Text style={S.cardMicro}>{avatarLabel(v)}</Text>
            </BouncyPress>
          </RiseIn>
        ))}
      </View>
      <Text style={S.fieldLabel}>NAME</Text>
      <TextInput
        style={S.field}
        value={settings.name}
        placeholder="Parzavel"
        placeholderTextColor={C.muted}
        maxLength={60}
        onChangeText={(v) => onSettings({ ...settings, name: v })}
      />
      <Text style={S.fieldLabel}>CURRENCY SYMBOL</Text>
      <TextInput
        style={S.field}
        value={settings.currency}
        maxLength={6}
        onChangeText={(v) => onSettings({ ...settings, currency: v })}
      />
      <Text style={S.fieldLabel}>GOALS ({goals.length})</Text>
      {goals.map((g, gi) => {
        const pct = pctOf(g.saved, g.target);
        return (
          <RiseIn key={g.id} index={gi} style={S.txCard}>
            <View style={S.txLine}>
              <Text style={S.txCat} numberOfLines={1}>{String(g.name).toUpperCase()}</Text>
              <Text style={S.txAmt}>{pct.toFixed(0)}%</Text>
            </View>
            <Text style={S.txNote}>{formatMoney(g.saved, currency)} / {formatMoney(g.target, currency)}</Text>
            <View style={S.track}><View style={[S.fill, { width: `${pct}%` }]} /></View>
            <View style={S.fundRow}>
              <TextInput
                style={[S.searchPill, S.fundInput]}
                placeholder="Amount"
                placeholderTextColor={C.muted}
                keyboardType="numeric"
                value={amt[g.id] || ''}
                onChangeText={(v) => setAmt((p) => ({ ...p, [g.id]: v.replace(/[^0-9.]/g, '') }))}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={S.fundBtn}
                activeOpacity={0.8}
                onPress={() => {
                  if (amt[g.id]) {
                    onFunds(g.id, amt[g.id]);
                    setAmt((p) => ({ ...p, [g.id]: '' }));
                  }
                }}
              >
                <Text style={S.fundBtnText}>FUND</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => onDeleteGoal(g.id)} hitSlop={8}>
              <Text style={S.delLink}>DELETE GOAL</Text>
            </TouchableOpacity>
          </RiseIn>
        );
      })}
      <PillButton title="+ New goal" onPress={onAddGoal} />
      <View style={S.pad} />
      <View style={S.sumBox}>
        <Text style={S.sumText}>INCOME  {formatMoney(totals.income, currency)}{'\n'}EXPENSE  {formatMoney(totals.expenses, currency)}{'\n'}BALANCE  {formatMoney(totals.balance, currency)}</Text>
      </View>
      <PillButton title="Reset all data" onPress={onReset} />
      <Text style={S.micro}>PARZAVEL · RETRO EDITORIAL · OFFLINE ONLY</Text>
      <View style={S.pad} />
    </ScrollView>
  );
}

function TxModal({ visible, onClose, onSave }) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setAmount('');
      setNote('');
      setType('expense');
      setCategory('Food');
    }
  }, [visible]);

  const cats = DEFAULT_CATEGORIES.filter((c) => c.type === type);

  const handleSave = async () => {
    const ok = await onSave({ amount, type, category, note });
    if (!ok) {
      Alert.alert('Enter a valid amount greater than 0');
      return;
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.flex1}>
        <View style={S.sheetWrap}>
          <View style={S.sheet}>
            <Text style={S.sheetTitle}>{type === 'income' ? 'ADD INCOME' : 'ADD EXPENSE'}</Text>
            <View style={S.chipRow}>
              {['expense', 'income'].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => { setType(t); setCategory(t === 'income' ? 'Salary' : 'Food'); }}
                  style={[S.chipDark, type === t && S.chipDarkActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[S.chipDarkText, type === t && S.chipDarkTextActive]}>{t.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={S.field}
              placeholder="Amount"
              placeholderTextColor={C.muted}
              keyboardType="numeric"
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
              returnKeyType="done"
            />
            <View style={S.chipWrap}>
              {cats.map((c) => (
                <TouchableOpacity
                  key={c.name}
                  onPress={() => setCategory(c.name)}
                  style={[S.chipDark, S.chipGap, category === c.name && S.chipDarkActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[S.chipDarkText, category === c.name && S.chipDarkTextActive]}>{c.name.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={S.field}
              placeholder="Note (optional)"
              placeholderTextColor={C.muted}
              value={note}
              onChangeText={(v) => setNote(v.slice(0, 120))}
              returnKeyType="done"
            />
            <PillButton title="Save entry" onPress={handleSave} dark />
            <View style={S.pad} />
            <PillButton title="Cancel" onPress={onClose} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function GoalModal({ visible, onClose, onSave }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
      setTarget('');
    }
  }, [visible]);

  const handleSave = async () => {
    const ok = await onSave({ name, target });
    if (!ok) {
      Alert.alert('Enter a name and amount greater than 0');
      return;
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.flex1}>
        <View style={S.sheetWrap}>
          <View style={S.sheet}>
            <Text style={S.sheetTitle}>NEW GOAL</Text>
            <TextInput
              style={S.field}
              placeholder="Goal name"
              placeholderTextColor={C.muted}
              value={name}
              maxLength={60}
              onChangeText={setName}
            />
            <TextInput
              style={S.field}
              placeholder="Target amount"
              placeholderTextColor={C.muted}
              keyboardType="numeric"
              value={target}
              onChangeText={(v) => setTarget(v.replace(/[^0-9.]/g, ''))}
              returnKeyType="done"
            />
            <PillButton title="Save goal" onPress={handleSave} dark />
            <View style={S.pad} />
            <PillButton title="Cancel" onPress={onClose} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const S = StyleSheet.create({
  flex1: { flex: 1 },
  root: { flex: 1, backgroundColor: C.ink },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.ink },
  loadTitle: { fontSize: 24, fontWeight: '800', letterSpacing: 3, color: C.creamLight },
  phone: { flex: 1, backgroundColor: C.ink },
  body: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 28 },
  heroCream: { backgroundColor: C.cream, borderRadius: 24, borderCurve: 'continuous', padding: 14, alignItems: 'center', paddingBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  heroTopRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  heroDark: { paddingTop: 20, paddingHorizontal: 4 },
  welcome: { fontSize: 22, fontWeight: '800', lineHeight: 24, letterSpacing: -0.5, color: C.creamLight, textTransform: 'uppercase', textAlign: 'center' },
  heroDesc: { fontSize: 12, lineHeight: 17, color: C.muted, textAlign: 'center', marginTop: 8, paddingHorizontal: 12 },
  balance: { fontSize: 30, fontWeight: '800', color: C.creamLight, textAlign: 'center', marginTop: 12, letterSpacing: -1 },
  miniRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  mini: { color: C.muted, fontSize: 11, fontWeight: '600' },
  miniDot: { color: C.muted, marginHorizontal: 6 },
  recentBox: { marginTop: 12, marginBottom: 16 },
  recentLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderColor: 'rgba(29,30,34,0.14)' },
  recentCat: { color: C.creamLight, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  recentAmt: { color: C.cream, fontSize: 11, fontWeight: '700' },
  recentEmpty: { color: C.muted, fontSize: 12, textAlign: 'center', marginVertical: 8 },
  centerRow: { alignItems: 'center', marginBottom: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  choose: { fontSize: 24, fontWeight: '800', lineHeight: 26, letterSpacing: -0.5, color: C.creamLight, marginTop: 12, marginBottom: 14, textTransform: 'uppercase' },
  cardLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5, color: C.ink, textTransform: 'uppercase', textAlign: 'center' },
  cardMicro: { fontSize: 8, fontWeight: '700', color: C.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },
  searchPill: { backgroundColor: C.creamLight, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, marginTop: 14, color: C.ink, fontSize: 12 },
  chipRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 10, gap: 6, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderColor: 'rgba(29,30,34,0.35)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { backgroundColor: C.creamLight, borderColor: C.creamLight },
  chipText: { color: C.creamLight, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  chipTextActive: { color: C.ink },
  countMicro: { color: C.muted, fontSize: 8, fontWeight: '700', marginLeft: 6, letterSpacing: 0.5 },
  txCard: { backgroundColor: 'rgba(29,30,34,0.05)', borderRadius: 18, borderCurve: 'continuous', padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(29,30,34,0.12)', overflow: 'hidden' },
  txLine: { flexDirection: 'row', justifyContent: 'space-between' },
  txCat: { color: C.creamLight, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  txAmt: { color: C.creamLight, fontSize: 12, fontWeight: '800' },
  txNote: { color: C.muted, fontSize: 11, marginTop: 2 },
  delLink: { color: C.graySoft, fontSize: 8, fontWeight: '800', letterSpacing: 1, marginTop: 6, textDecorationLine: 'underline' },
  pad: { height: 12 },
  seamWrap: { alignItems: 'center', gap: 6, marginTop: -13, marginBottom: 2 },
  seamBar: { width: 120, height: 12, borderRadius: 999, borderCurve: 'continuous', backgroundColor: C.creamLight, borderWidth: 2, borderColor: C.ink },
  seamThin: { width: 200, height: 5, borderRadius: 999, borderCurve: 'continuous', backgroundColor: 'rgba(29,30,34,0.25)' },
  fadeStrip: { height: 16, marginHorizontal: 26, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderCurve: 'continuous', overflow: 'hidden' },
  detailCream: { backgroundColor: C.cream, borderRadius: 24, borderCurve: 'continuous', padding: 14, alignItems: 'center', paddingBottom: 26, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  detailDark: { backgroundColor: C.inkSoft, borderRadius: 22, borderCurve: 'continuous', padding: 16, marginTop: -12, overflow: 'hidden' },
  detailTitle: { fontSize: 22, fontWeight: '800', color: C.creamLight, lineHeight: 24, letterSpacing: -0.5, textTransform: 'uppercase' },
  detailDesc: { fontSize: 12, lineHeight: 17, color: C.muted, marginTop: 10 },
  detailNums: { color: C.creamLight, fontSize: 11, fontWeight: '700', marginTop: 10 },
  track: { height: 10, backgroundColor: 'rgba(29,30,34,0.15)', borderRadius: 999, borderCurve: 'continuous', marginTop: 8, marginBottom: 14, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: C.creamLight, borderRadius: 999, borderCurve: 'continuous' },
  fundRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  fundInput: { flex: 1, marginTop: 0 },
  fundBtn: { backgroundColor: C.creamLight, borderRadius: 999, paddingHorizontal: 18, justifyContent: 'center' },
  fundBtnText: { color: C.ink, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  aiCard: { backgroundColor: C.cream, borderRadius: 20, borderCurve: 'continuous', padding: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  aiTitle: { color: C.ink, fontSize: 13, fontWeight: '800', marginTop: 4 },
  aiDesc: { color: C.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 4 },
  fieldLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: C.muted, marginTop: 14, marginBottom: 6, textAlign: 'center' },
  field: { backgroundColor: C.creamLight, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, color: C.ink, fontSize: 13, marginBottom: 4 },
  sumBox: { borderWidth: 1, borderColor: 'rgba(29,30,34,0.2)', borderRadius: 18, borderCurve: 'continuous', padding: 14, marginVertical: 14, overflow: 'hidden' },
  sumText: { color: C.muted, fontSize: 11, lineHeight: 18, fontWeight: '600' },
  micro: { color: C.muted, fontSize: 8, letterSpacing: 1, textAlign: 'center', marginTop: 12, fontWeight: '700' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  avatarCard: { width: '31%', backgroundColor: C.cream, borderRadius: 20, borderCurve: 'continuous', padding: 8, alignItems: 'center', gap: 4, overflow: 'hidden' },
  avatarActive: { backgroundColor: '#2A2C31', borderWidth: 2, borderColor: '#F5F3EF' },
  avatarTouch: { alignItems: 'center', gap: 4 },
  sheetWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderCurve: 'continuous', padding: 20, paddingBottom: 34, overflow: 'hidden' },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: C.ink, letterSpacing: -0.5, textTransform: 'uppercase', marginBottom: 12 },
  chipDark: { borderWidth: 1, borderColor: C.ink, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, marginRight: 6 },
  chipDarkActive: { backgroundColor: C.ink },
  chipDarkText: { color: C.ink, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  chipDarkTextActive: { color: C.creamLight },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chipGap: { marginBottom: 6 },
});
