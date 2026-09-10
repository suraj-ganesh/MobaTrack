import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { C, DEFAULT_CATEGORIES, formatMoney } from './src/theme';
import { loadAll, saveTransactions, saveGoals, saveSettings, clearAll, uid } from './src/storage';
import { getTotals, generateInsights } from './src/ai';

const TABS = ['Home', 'Tx', 'Goals', 'AI', 'More'];

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
    (async () => {
      const d = await loadAll();
      setTransactions(d.transactions);
      setGoals(d.goals);
      setSettings(d.settings);
      setReady(true);
    })();
  }, []);

  const totals = useMemo(() => getTotals(transactions), [transactions]);
  const insights = useMemo(() => generateInsights(transactions, goals), [transactions, goals]);

  const persistTx = async (next) => {
    setTransactions(next);
    await saveTransactions(next);
  };

  const persistGoals = async (next) => {
    setGoals(next);
    await saveGoals(next);
  };

  const addTx = async ({ amount, type, category, note, date }) => {
    const tx = { id: uid(), amount: Number(amount), type, category, note: note || '', date: date || new Date().toISOString().slice(0, 10) };
    await persistTx([tx, ...transactions]);
  };

  const delTx = (id) => persistTx(transactions.filter((t) => t.id !== id));

  const addGoal = async ({ name, target }) => {
    const g = { id: uid(), name, target: Number(target), saved: 0 };
    await persistGoals([g, ...goals]);
  };

  const addFunds = async (id, amt) => {
    const next = goals.map((g) => (g.id === id ? { ...g, saved: Math.min(g.target, g.saved + Number(amt)) } : g));
    await persistGoals(next);
  };

  const delGoal = (id) => persistGoals(goals.filter((g) => g.id !== id));

  const filtered = transactions.filter((t) => {
    if (filter !== 'all' && t.type !== filter) return false;
    if (!query) return true;
    return `${t.note} ${t.category} ${t.amount}`.toLowerCase().includes(query.toLowerCase());
  });

  if (!ready) {
    return (
      <SafeAreaView style={S.center}>
        <Text style={S.title}>MobaTrack</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.root}>
      <StatusBar style="dark" />
      <View style={S.header}>
        <Text style={S.brand}>MobaTrack</Text>
        <Text style={S.balance}>{formatMoney(totals.balance, settings.currency)}</Text>
        <Text style={S.sub}>balance</Text>
      </View>

      <View style={S.body}>
        {tab === 'Home' && (
          <HomeTab totals={totals} transactions={transactions} goals={goals} currency={settings.currency} onAdd={() => setShowTxModal(true)} />
        )}
        {tab === 'Tx' && (
          <TxTab list={filtered} currency={settings.currency} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} onDelete={delTx} onAdd={() => setShowTxModal(true)} />
        )}
        {tab === 'Goals' && (
          <GoalsTab goals={goals} currency={settings.currency} onAdd={() => setShowGoalModal(true)} onFunds={addFunds} onDelete={delGoal} />
        )}
        {tab === 'AI' && <AITab insights={insights} />}
        {tab === 'More' && (
          <MoreTab settings={settings} setSettings={async (s) => { setSettings(s); await saveSettings(s); }} totals={totals} onReset={async () => { await clearAll(); setTransactions([]); setGoals([]); }} />
        )}
      </View>

      <View style={S.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[S.tab, tab === t && S.tabActive]}>
            <Text style={[S.tabText, tab === t && S.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TxModal visible={showTxModal} onClose={() => setShowTxModal(false)} onSave={addTx} />
      <GoalModal visible={showGoalModal} onClose={() => setShowGoalModal(false)} onSave={addGoal} />
    </SafeAreaView>
  );
}

function Card({ children }) {
  return <View style={S.card}>{children}</View>;
}

function HomeTab({ totals, transactions, goals, currency, onAdd }) {
  const recent = transactions.slice(0, 5);
  return (
    <ScrollView>
      <View style={S.row}>
        <View style={[S.stat, { flex: 1 }]}>
          <Text style={S.label}>INCOME</Text>
          <Text style={S.statVal}>{formatMoney(totals.income, currency)}</Text>
        </View>
        <View style={[S.stat, { flex: 1 }]}>
          <Text style={S.label}>EXPENSE</Text>
          <Text style={S.statVal}>{formatMoney(totals.expenses, currency)}</Text>
        </View>
      </View>
      <Card>
        <Text style={S.label}>RECENT</Text>
        {recent.length === 0 && <Text style={S.muted}>No transactions. Tap + Add.</Text>}
        {recent.map((t) => (
          <View key={t.id} style={S.line}>
            <Text style={S.lineText}>{t.category} · {t.note || t.type}</Text>
            <Text style={[S.lineText, t.type === 'income' ? S.plus : S.minus]}>
              {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount, currency)}
            </Text>
          </View>
        ))}
      </Card>
      <Card>
        <Text style={S.label}>GOALS ({goals.length})</Text>
        {goals.slice(0, 3).map((g) => {
          const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
          return (
            <View key={g.id} style={{ marginTop: 8 }}>
              <Text style={S.lineText}>{g.name} — {pct.toFixed(0)}%</Text>
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
    <View style={{ flex: 1 }}>
      <TextInput style={S.input} placeholder="Search..." value={query} onChangeText={setQuery} />
      <View style={S.row}>
        {['all', 'income', 'expense'].map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[S.chip, filter === f && S.chipActive]}>
            <Text style={[S.chipText, filter === f && S.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={S.card}>
            <View style={S.line}>
              <Text style={S.lineText}>{item.date} · {item.category}</Text>
              <Text style={item.type === 'income' ? S.plus : S.minus}>
                {item.type === 'income' ? '+' : '-'}{formatMoney(item.amount, currency)}
              </Text>
            </View>
            {!!item.note && <Text style={S.muted}>{item.note}</Text>}
            <TouchableOpacity onPress={() => onDelete(item.id)}>
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
    <ScrollView>
      <Btn title="+ New goal" onPress={onAdd} primary />
      {goals.map((g) => {
        const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
        return (
          <View key={g.id} style={S.card}>
            <Text style={S.lineText}>{g.name}</Text>
            <Text style={S.muted}>{formatMoney(g.saved, currency)} / {formatMoney(g.target, currency)} · {pct.toFixed(0)}%</Text>
            <View style={S.bar}><View style={[S.barFill, { width: `${pct}%` }]} /></View>
            <View style={S.row}>
              <TextInput
                style={[S.input, { flex: 1 }]}
                placeholder="Amount"
                keyboardType="numeric"
                value={amt[g.id] || ''}
                onChangeText={(v) => setAmt({ ...amt, [g.id]: v })}
              />
              <TouchableOpacity style={S.btn} onPress={() => { if (amt[g.id]) { onFunds(g.id, amt[g.id]); setAmt({ ...amt, [g.id]: '' }); } }}>
                <Text style={S.btnText}>+ Funds</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => onDelete(g.id)}><Text style={S.delete}>Delete</Text></TouchableOpacity>
          </View>
        );
      })}
      {goals.length === 0 && <Text style={S.muted}>No goals. Create one.</Text>}
    </ScrollView>
  );
}

function AITab({ insights }) {
  return (
    <ScrollView>
      <Text style={S.h2}>Balance suggestions</Text>
      <Text style={S.muted}>Local rules, offline. No gateway.</Text>
      {insights.map((ins, i) => (
        <View key={i} style={S.card}>
          <Text style={S.badge}>{ins.type.toUpperCase()}</Text>
          <Text style={S.lineText}>{ins.title}</Text>
          <Text style={S.muted}>{ins.description}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function MoreTab({ settings, setSettings, totals, onReset }) {
  return (
    <ScrollView>
      <Text style={S.h2}>Settings</Text>
      <Text style={S.label}>CURRENCY SYMBOL</Text>
      <TextInput style={S.input} value={settings.currency} onChangeText={(v) => setSettings({ ...settings, currency: v })} />
      <Text style={S.label}>NAME</Text>
      <TextInput style={S.input} value={settings.name} placeholder="Your name" onChangeText={(v) => setSettings({ ...settings, name: v })} />
      <Card>
        <Text style={S.muted}>Income: {totals.income.toFixed(2)}{'\n'}Expenses: {totals.expenses.toFixed(2)}{'\n'}Balance: {totals.balance.toFixed(2)}</Text>
      </Card>
      <Btn title="Reset all data" onPress={() => Alert.alert('Reset?', 'Delete everything?', [{ text: 'Cancel' }, { text: 'Delete', onPress: onReset }])} />
      <Text style={S.muted}>MobaTrack v1 · React Native + Expo · B/W minimal · offline only</Text>
    </ScrollView>
  );
}

function Btn({ title, onPress, primary }) {
  return (
    <TouchableOpacity onPress={onPress} style={[S.btn, primary && S.btnPrimary]}>
      <Text style={[S.btnText, primary && S.btnTextPrimary]}>{title}</Text>
    </TouchableOpacity>
  );
}

function TxModal({ visible, onClose, onSave }) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const cats = DEFAULT_CATEGORIES.filter((c) => c.type === type);
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={S.modalWrap}>
        <View style={S.modal}>
          <Text style={S.h2}>{type === 'income' ? 'Add income' : 'Add expense'}</Text>
          <View style={S.row}>
            {['expense', 'income'].map((t) => (
              <TouchableOpacity key={t} onPress={() => { setType(t); setCategory(t === 'income' ? 'Salary' : 'Food'); }} style={[S.chip, type === t && S.chipActive]}>
                <Text style={[S.chipText, type === t && S.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={S.input} placeholder="Amount" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          <View style={S.rowWrap}>
            {cats.map((c) => (
              <TouchableOpacity key={c.name} onPress={() => setCategory(c.name)} style={[S.chip, category === c.name && S.chipActive]}>
                <Text style={[S.chipText, category === c.name && S.chipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={S.input} placeholder="Note (optional)" value={note} onChangeText={setNote} />
          <Btn title="Save" primary onPress={() => {
            if (!Number(amount)) { Alert.alert('Enter valid amount'); return; }
            onSave({ amount, type, category, note });
            setAmount(''); setNote(''); onClose();
          }} />
          <Btn title="Cancel" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function GoalModal({ visible, onClose, onSave }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={S.modalWrap}>
        <View style={S.modal}>
          <Text style={S.h2}>New goal</Text>
          <TextInput style={S.input} placeholder="Goal name" value={name} onChangeText={setName} />
          <TextInput style={S.input} placeholder="Target amount" keyboardType="numeric" value={target} onChangeText={setTarget} />
          <Btn title="Save" primary onPress={() => {
            if (!name || !Number(target)) { Alert.alert('Enter name + amount'); return; }
            onSave({ name, target });
            setName(''); setTarget(''); onClose();
          }} />
          <Btn title="Cancel" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  title: { fontSize: 28, fontWeight: '800', color: C.text },
  header: { padding: 16, borderBottomWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  brand: { fontSize: 14, fontWeight: '700', letterSpacing: 2, color: C.text },
  balance: { fontSize: 36, fontWeight: '800', color: C.text },
  sub: { color: C.muted },
  body: { flex: 1, padding: 12 },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderColor: C.border },
  tab: { flex: 1, padding: 12, alignItems: 'center' },
  tabActive: { backgroundColor: C.invertedBg },
  tabText: { color: C.text, fontWeight: '600' },
  tabTextActive: { color: C.invertedText },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  card: { borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: C.card },
  stat: { borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12 },
  statVal: { fontSize: 16, fontWeight: '800', color: C.text },
  label: { fontSize: 11, letterSpacing: 1, color: C.muted, fontWeight: '700' },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  lineText: { color: C.text, fontWeight: '600' },
  muted: { color: C.muted },
  plus: { color: C.text, fontWeight: '800' },
  minus: { color: C.text, fontWeight: '800' },
  bar: { height: 8, backgroundColor: C.grayBg, borderWidth: 1, borderColor: C.border, borderRadius: 4, marginTop: 6 },
  barFill: { height: '100%', backgroundColor: C.text, borderRadius: 4 },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 10, marginBottom: 8, color: C.text, backgroundColor: C.bg },
  chip: { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6 },
  chipActive: { backgroundColor: C.invertedBg },
  chipText: { color: C.text },
  chipTextActive: { color: C.invertedText },
  btn: { borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 8 },
  btnPrimary: { backgroundColor: C.invertedBg },
  btnText: { color: C.text, fontWeight: '700' },
  btnTextPrimary: { color: C.invertedText },
  delete: { color: C.muted, marginTop: 6, textDecorationLine: 'underline' },
  h2: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 6 },
  badge: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: C.muted },
  modalWrap: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: C.bg, borderTopWidth: 2, borderColor: C.border, padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
});
