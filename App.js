import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  FlatList,
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
import { C, DEFAULT_CATEGORIES, formatMoney } from './src/theme';
import { loadAll, saveTransactions, saveGoals, saveSettings, clearAll, uid } from './src/storage';
import { getTotals, generateInsights } from './src/ai';

const TABS = ['Home', 'Tx', 'Goals', 'AI', 'More'];

function sanitizeAmount(v) {
  const n = Number(String(v).trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export default function App() {
  const [tab, setTab] = useState('Home');
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [settings, setSettings] = useState({ currency: 'Rs.', name: '' });
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

  const persistTx = useCallback(async (updater) => {
    let next = [];
    setTransactions((prev) => {
      next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
    await new Promise((r) => setTimeout(r, 0));
    setTransactions((current) => {
      saveTransactions(current);
      return current;
    });
  }, []);

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
      name: String(s.name || '').slice(0, 60),
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
        <SafeAreaView style={S.center} edges={['top', 'bottom']}>
          <Text style={S.title}>MobaTrack</Text>
          <StatusBar style="dark" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={S.root} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <View style={S.header}>
          <Text style={S.brand}>MobaTrack{subName(settings.name)}</Text>
          <Text style={S.balance} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(totals.balance, currency)}
          </Text>
          <Text style={S.sub}>balance</Text>
        </View>

        <View style={S.body}>
          {tab === 'Home' && (
            <HomeTab totals={totals} transactions={transactions} goals={goals} currency={currency} onAdd={() => setShowTxModal(true)} />
          )}
          {tab === 'Tx' && (
            <TxTab list={filtered} currency={currency} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} onDelete={delTx} onAdd={() => setShowTxModal(true)} />
          )}
          {tab === 'Goals' && (
            <GoalsTab goals={goals} currency={currency} onAdd={() => setShowGoalModal(true)} onFunds={addFunds} onDelete={delGoal} />
          )}
          {tab === 'AI' && <AITab insights={insights} />}
          {tab === 'More' && (
            <MoreTab settings={settings} onSettings={updateSettings} totals={totals} onReset={resetAll} />
          )}
        </View>

        <View style={S.tabs}>
          {TABS.map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[S.tab, tab === t && S.tabActive]} activeOpacity={0.7}>
              <Text style={[S.tabText, tab === t && S.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TxModal visible={showTxModal} onClose={() => setShowTxModal(false)} onSave={addTx} persistHack={persistTx} />
        <GoalModal visible={showGoalModal} onClose={() => setShowGoalModal(false)} onSave={addGoal} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function subName(name) {
  const n = String(name || '').trim();
  return n ? ` · ${n}` : '';
}

function Card({ children }) {
  return <View style={S.card}>{children}</View>;
}

function Btn({ title, onPress, primary }) {
  return (
    <TouchableOpacity onPress={onPress} style={[S.btn, primary && S.btnPrimary]} activeOpacity={0.7}>
      <Text style={[S.btnText, primary && S.btnTextPrimary]}>{title}</Text>
    </TouchableOpacity>
  );
}

function HomeTab({ totals, transactions, goals, currency, onAdd }) {
  const recent = transactions.slice(0, 5);
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
      <View style={S.statRow}>
        <View style={S.stat}>
          <Text style={S.label}>INCOME</Text>
          <Text style={S.statVal} numberOfLines={1}>{formatMoney(totals.income, currency)}</Text>
        </View>
        <View style={S.statSpacer} />
        <View style={S.stat}>
          <Text style={S.label}>EXPENSE</Text>
          <Text style={S.statVal} numberOfLines={1}>{formatMoney(totals.expenses, currency)}</Text>
        </View>
      </View>
      <Card>
        <Text style={S.label}>RECENT</Text>
        {recent.length === 0 && <Text style={S.muted}>No transactions. Tap + Add.</Text>}
        {recent.map((t) => (
          <View key={t.id} style={S.line}>
            <Text style={S.lineText} numberOfLines={1}>
              {t.category} · {t.note || t.type}
            </Text>
            <Text style={S.lineText} numberOfLines={1}>
              {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount, currency)}
            </Text>
          </View>
        ))}
      </Card>
      <Card>
        <Text style={S.label}>GOALS ({goals.length})</Text>
        {goals.slice(0, 3).map((g) => {
          const pct = pctOf(g.saved, g.target);
          return (
            <View key={g.id} style={S.goalBlock}>
              <Text style={S.lineText} numberOfLines={1}>{g.name} — {pct.toFixed(0)}%</Text>
              <View style={S.bar}><View style={[S.barFill, { width: `${pct}%` }]} /></View>
            </View>
          );
        })}
        {goals.length === 0 && <Text style={S.muted}>No goals yet.</Text>}
      </Card>
      <Btn title="+ Add transaction" onPress={onAdd} primary />
    </ScrollView>
  );
}

function TxTab({ list, currency, query, setQuery, filter, setFilter, onDelete, onAdd }) {
  return (
    <View style={S.flex1}>
      <TextInput
        style={S.input}
        placeholder="Search..."
        placeholderTextColor={C.muted}
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
      />
      <View style={S.chipRow}>
        {['all', 'income', 'expense'].map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[S.chip, filter === f && S.chipActive]} activeOpacity={0.7}>
            <Text style={[S.chipText, filter === f && S.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        style={S.flex1}
        data={list}
        keyExtractor={(i) => String(i.id)}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.scrollPad}
        renderItem={({ item }) => (
          <View style={S.card}>
            <View style={S.line}>
              <Text style={S.lineText}>{item.date} · {item.category}</Text>
              <Text style={S.lineText}>
                {item.type === 'income' ? '+' : '-'}{formatMoney(item.amount, currency)}
              </Text>
            </View>
            {!!item.note && <Text style={S.muted}>{item.note}</Text>}
            <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={8}>
              <Text style={S.delete}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={S.muted}>Nothing here.</Text>}
      />
      <Btn title="+ Add" onPress={onAdd} primary />
    </View>
  );
}

function GoalsTab({ goals, currency, onAdd, onFunds, onDelete }) {
  const [amt, setAmt] = useState({});
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
      <Btn title="+ New goal" onPress={onAdd} primary />
      {goals.map((g) => {
        const pct = pctOf(g.saved, g.target);
        return (
          <View key={g.id} style={S.card}>
            <Text style={S.lineText} numberOfLines={1}>{g.name}</Text>
            <Text style={S.muted}>{formatMoney(g.saved, currency)} / {formatMoney(g.target, currency)} · {pct.toFixed(0)}%</Text>
            <View style={S.bar}><View style={[S.barFill, { width: `${pct}%` }]} /></View>
            <View style={S.fundsRow}>
              <TextInput
                style={[S.input, S.fundsInput]}
                placeholder="Amount"
                placeholderTextColor={C.muted}
                keyboardType="numeric"
                value={amt[g.id] || ''}
                onChangeText={(v) => setAmt((p) => ({ ...p, [g.id]: v.replace(/[^0-9.]/g, '') }))}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={S.smallBtn}
                activeOpacity={0.7}
                onPress={() => {
                  if (amt[g.id]) {
                    onFunds(g.id, amt[g.id]);
                    setAmt((p) => ({ ...p, [g.id]: '' }));
                  }
                }}
              >
                <Text style={S.btnText}>+ Funds</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => onDelete(g.id)} hitSlop={8}>
              <Text style={S.delete}>Delete</Text>
            </TouchableOpacity>
          </View>
        );
      })}
      {goals.length === 0 && <Text style={S.muted}>No goals. Create one.</Text>}
    </ScrollView>
  );
}

function pctOf(saved, target) {
  const s = Number(saved) || 0;
  const t = Number(target) || 0;
  if (t <= 0) return 0;
  return Math.min(100, Math.max(0, (s / t) * 100));
}

function AITab({ insights }) {
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
      <Text style={S.h2}>Balance suggestions</Text>
      <Text style={S.muted}>Local rules, offline. No gateway.</Text>
      <View style={S.spacer} />
      {insights.map((ins, i) => (
        <View key={`${ins.title}-${i}`} style={S.card}>
          <Text style={S.badge}>{String(ins.type || 'info').toUpperCase()}</Text>
          <Text style={S.lineText}>{ins.title}</Text>
          <Text style={S.muted}>{ins.description}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function MoreTab({ settings, onSettings, totals, onReset }) {
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={S.scrollPad} showsVerticalScrollIndicator={false}>
      <Text style={S.h2}>Settings</Text>
      <Text style={S.label}>CURRENCY SYMBOL</Text>
      <TextInput
        style={S.input}
        value={settings.currency}
        placeholderTextColor={C.muted}
        maxLength={6}
        onChangeText={(v) => onSettings({ ...settings, currency: v })}
      />
      <Text style={S.label}>NAME</Text>
      <TextInput
        style={S.input}
        value={settings.name}
        placeholder="Your name"
        placeholderTextColor={C.muted}
        maxLength={60}
        onChangeText={(v) => onSettings({ ...settings, name: v })}
      />
      <Card>
        <Text style={S.muted}>
          Income: {(Number(totals.income) || 0).toFixed(2)}{'\n'}
          Expenses: {(Number(totals.expenses) || 0).toFixed(2)}{'\n'}
          Balance: {(Number(totals.balance) || 0).toFixed(2)}
        </Text>
      </Card>
      <Btn title="Reset all data" onPress={onReset} />
      <Text style={S.muted}>MobaTrack v1 · React Native + Expo · B/W minimal · offline only</Text>
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
        <View style={S.modalWrap}>
          <View style={S.modal}>
            <Text style={S.h2}>{type === 'income' ? 'Add income' : 'Add expense'}</Text>
            <View style={S.chipRow}>
              {['expense', 'income'].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => { setType(t); setCategory(t === 'income' ? 'Salary' : 'Food'); }}
                  style={[S.chip, type === t && S.chipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[S.chipText, type === t && S.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={S.input}
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
                  style={[S.chip, S.chipMargin, category === c.name && S.chipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[S.chipText, category === c.name && S.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={S.input}
              placeholder="Note (optional)"
              placeholderTextColor={C.muted}
              value={note}
              onChangeText={(v) => setNote(v.slice(0, 120))}
              returnKeyType="done"
            />
            <Btn title="Save" primary onPress={handleSave} />
            <Btn title="Cancel" onPress={onClose} />
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
        <View style={S.modalWrap}>
          <View style={S.modal}>
            <Text style={S.h2}>New goal</Text>
            <TextInput
              style={S.input}
              placeholder="Goal name"
              placeholderTextColor={C.muted}
              value={name}
              maxLength={60}
              onChangeText={setName}
            />
            <TextInput
              style={S.input}
              placeholder="Target amount"
              placeholderTextColor={C.muted}
              keyboardType="numeric"
              value={target}
              onChangeText={(v) => setTarget(v.replace(/[^0-9.]/g, ''))}
              returnKeyType="done"
            />
            <Btn title="Save" primary onPress={handleSave} />
            <Btn title="Cancel" onPress={onClose} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const S = StyleSheet.create({
  flex1: { flex: 1 },
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  title: { fontSize: 28, fontWeight: '800', color: C.text },
  header: { padding: 16, borderBottomWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  brand: { fontSize: 14, fontWeight: '700', letterSpacing: 2, color: C.text },
  balance: { fontSize: 34, fontWeight: '800', color: C.text },
  sub: { color: C.muted },
  body: { flex: 1, padding: 12 },
  scrollPad: { paddingBottom: 24 },
  spacer: { height: 8 },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { backgroundColor: C.invertedBg },
  tabText: { color: C.text, fontWeight: '600' },
  tabTextActive: { color: C.invertedText },
  statRow: { flexDirection: 'row', marginBottom: 8 },
  stat: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12, backgroundColor: C.card },
  statSpacer: { width: 8 },
  statVal: { fontSize: 15, fontWeight: '800', color: C.text },
  label: { fontSize: 11, letterSpacing: 1, color: C.muted, fontWeight: '700', marginBottom: 2 },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  lineText: { color: C.text, fontWeight: '600', flexShrink: 1 },
  muted: { color: C.muted },
  card: { borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: C.card },
  goalBlock: { marginTop: 8 },
  bar: { height: 8, backgroundColor: C.grayBg, borderWidth: 1, borderColor: C.border, borderRadius: 4, marginTop: 6, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: C.text },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, marginBottom: 8, color: C.text, backgroundColor: C.bg },
  chipRow: { flexDirection: 'row', marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6 },
  chipMargin: { marginBottom: 6 },
  chipActive: { backgroundColor: C.invertedBg },
  chipText: { color: C.text },
  chipTextActive: { color: C.invertedText },
  btn: { borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 8, backgroundColor: C.bg },
  btnPrimary: { backgroundColor: C.invertedBg },
  btnText: { color: C.text, fontWeight: '700' },
  btnTextPrimary: { color: C.invertedText },
  smallBtn: { borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center', marginBottom: 8, backgroundColor: C.bg },
  fundsRow: { flexDirection: 'row', marginTop: 8 },
  fundsInput: { flex: 1, marginRight: 8 },
  delete: { color: C.muted, marginTop: 6, textDecorationLine: 'underline' },
  h2: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 6 },
  badge: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: C.muted, marginBottom: 2 },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: C.bg, borderTopWidth: 2, borderColor: C.border, padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
});
