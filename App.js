// MobaTrack — Luminescent Precision shell (Stitch 1126451746754138922)
// Floating glass dock, Hanken Grotesk, offline-first. Logic unchanged.
import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Appearance, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { DS, C, fmt, font, todayISO, applyTheme, themeResolved } from './src/theme';
import {
  clearAll, loadAll, saveBudgets, saveGoals, saveLearned, savePlans,
  saveRecurring, saveSettings, saveTransactions, DEFAULT_SETTINGS, BASE_CURRENCY,
} from './src/storage';
import { findAnomalies } from './src/anomalies';
import { postDue } from './src/recurring';
import { learnMapping } from './src/categorize';
import { hashPin, verifyTotp } from './src/crypto';
import { SlimHeader, Btn, Card, FadeSlide, FloatingDock, ToastHost, Label, notify } from './src/ui';
import { TxEditor } from './src/tx_editor';
import { DashScreen } from './src/screen_dash';
import { TxScreen } from './src/screen_tx';
import { BudgetScreen } from './src/screen_budgets';
import { GoalScreen } from './src/screen_goals';
import { MoreScreen } from './src/screen_more';

const TABS = ['Home', 'Activity', 'Budgets', 'Goals', 'More'];

function LockScreen({ settings, onUnlock }) {
  const [pin, setPin] = useState('');
  const [pinOk, setPinOk] = useState(!settings.pinHash);
  const [code, setCode] = useState('');
  const L = useMemo(makeLockStyles, [themeResolved]);

  const press = (d) => setPin((p) => (p.length < 8 ? p + d : p));
  const back = () => setPin((p) => p.slice(0, -1));

  const submitPin = () => {
    if (hashPin(pin, settings.pinSalt) === settings.pinHash) {
      setPin('');
      if (settings.totpEnabled) setPinOk(true);
      else onUnlock();
    } else {
      setPin('');
      notify('Wrong PIN.');
    }
  };

  const submitCode = () => {
    if (verifyTotp(settings.totpSecret, code)) {
      setCode('');
      onUnlock();
    } else {
      setCode('');
      notify('Wrong code. Try the current one from your authenticator app.');
    }
  };

  return (
    <View style={L.wrap}>
      <View style={L.logo}>
        <Text style={L.logoText}>M</Text>
      </View>
      <Text style={L.title}>MobaTrack</Text>
      <Text style={L.sub}>Minimal glass finance · offline</Text>
      {!pinOk ? (
        <Card style={{ width: '100%', marginTop: 14 }}>
          <Label>Enter your PIN</Label>
          <Text style={L.dots}>{'●'.repeat(pin.length) || '–'}</Text>
          <View style={L.pad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <Pressable key={d} onPress={() => press(d)} style={L.key}>
                <Text style={L.keyText}>{d}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setPin('')} style={L.key}>
              <Text style={L.keyFn}>Clear</Text>
            </Pressable>
            <Pressable onPress={() => press('0')} style={L.key}>
              <Text style={L.keyText}>0</Text>
            </Pressable>
            <Pressable onPress={back} style={L.key}>
              <Text style={L.keyFn}>Del</Text>
            </Pressable>
          </View>
          <Btn title="Unlock" onPress={submitPin} />
        </Card>
      ) : (
        <Card style={{ width: '100%', marginTop: 14 }}>
          <Label>Two-factor code</Label>
          <TextInput
            style={L.code}
            keyboardType="numeric"
            value={code}
            maxLength={8}
            autoFocus
            onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ''))}
            onSubmitEditing={submitCode}
            placeholder="6-digit code"
            placeholderTextColor={C.faint}
          />
          <Btn title="Verify & unlock" onPress={submitCode} />
        </Card>
      )}
    </View>
  );
}

function makeLockStyles() {
  return StyleSheet.create({
    wrap: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: C.bg, alignItems: 'center' },
    logo: { width: 44, height: 44, borderRadius: 14, backgroundColor: DS.on, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    logoText: { color: DS.background, fontSize: 20, fontWeight: '700' },
    title: { fontSize: 22, fontWeight: '600', color: C.ink, letterSpacing: -0.4, fontFamily: font.bold },
    sub: { fontSize: 13, color: C.muted, marginTop: 2, fontFamily: font.regular },
    dots: { fontSize: 20, color: C.ink, textAlign: 'center', marginVertical: 12, letterSpacing: 4 },
    pad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    key: { width: '30%', aspectRatio: 1.6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 999, margin: 3, backgroundColor: DS.chipBase },
    keyText: { fontSize: 22, fontWeight: '600', color: C.ink, fontFamily: font.bold },
    keyFn: { fontSize: 13, fontWeight: '600', color: C.muted, fontFamily: font.bold },
    code: { borderWidth: 1, borderColor: C.line, backgroundColor: DS.inputBase, borderRadius: 999, padding: 13, fontSize: 20, color: C.ink, textAlign: 'center', letterSpacing: 4, marginVertical: 10 },
  });
}

// Rebuilt with the logo, lock sheet, and body so static StyleSheet entries
// never go stale on a theme flip.
function makeRootStyles() {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
    loadLogo: { width: 48, height: 48, borderRadius: 16, backgroundColor: DS.on, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    loadLogoText: { color: DS.background, fontSize: 22, fontWeight: '700' },
    loadText: { fontSize: 20, fontWeight: '600', color: C.ink, letterSpacing: -0.4, fontFamily: font.bold },
    body: { flex: 1 },
    scroll: { padding: 16, paddingBottom: 8, paddingTop: 4 },
  });
}

export default function App() {
  const [fontsLoaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
  const [tab, setTab] = useState('Home');
  const [txs, setTxs] = useState([]);
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [plans, setPlans] = useState({});
  const [recurrings, setRecurrings] = useState([]);
  const [learned, setLearned] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [editor, setEditor] = useState({ open: false, initial: null });

  // Theme: applied before the first paint (useState initializer), then re-applied
  // whenever the stored preference or the OS scheme changes. `tick` forces
  // one full re-render so every inline DS read picks up the new palette.
  const systemScheme = useColorScheme();
  const [tick, setTick] = useState(() => {
    applyTheme('system', Appearance.getColorScheme() || 'light');
    return 0;
  });
  const S = useMemo(makeRootStyles, [tick]);

  useEffect(() => {
    const changed = applyTheme(
      settings.theme || 'system',
      systemScheme || Appearance.getColorScheme() || 'light'
    );
    if (changed) setTick((t) => t + 1);
  }, [settings.theme, systemScheme]);

  useEffect(() => {
    let on = true;
    (async () => {
      const d = await loadAll();
      if (!on) return;
      setTxs(d.transactions);
      setGoals(d.goals);
      setBudgets(d.budgets);
      setPlans(d.plans);
      setRecurrings(d.recurring);
      setLearned(d.learned);
      setSettings(d.settings);
      setLocked(!!d.settings.pinHash);
      setReady(true);
    })();
    return () => { on = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveTransactions(txs);
    saveGoals(goals);
    saveBudgets(budgets);
    savePlans(plans);
    saveRecurring(recurrings);
    saveLearned(learned);
    saveSettings(settings);
  }, [ready, txs, goals, budgets, plans, recurrings, learned, settings]);

  const base = BASE_CURRENCY;
  const flags = useMemo(
    () => findAnomalies(txs, base, settings.rates),
    [txs, base, settings.rates]
  );

  const saveTx = (tx) => {
    const isNew = !txs.some((t) => t.id === tx.id);
    setTxs((prev) => (prev.some((t) => t.id === tx.id) ? prev.map((t) => (t.id === tx.id ? tx : t)) : [tx, ...prev]));
    notify(isNew ? `Added ${fmt(tx.amount)} ${tx.type}.` : 'Transaction updated.');
  };
  const deleteTx = (id) => {
    setTxs((prev) => prev.filter((t) => t.id !== id));
    notify('Transaction deleted.');
  };
  const importTxs = (items) => {
    const full = items.map((i) => ({
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}${i.date}${i.amount}`.slice(0, 24),
      amount: i.amount, currency: BASE_CURRENCY, type: i.type, category: i.category,
      merchant: i.merchant, note: i.note, date: i.date, items: [],
    }));
    setTxs((prev) => [...full, ...prev]);
  };
  const addLearned = (merchant, note, category) =>
    setLearned((prev) => learnMapping(prev, merchant, note, category));

  const saveBudget = (b) =>
    setBudgets((prev) => (prev.some((x) => x.id === b.id) ? prev.map((x) => (x.id === b.id ? b : x)) : [...prev, b]));
  const deleteBudget = (id) => setBudgets((prev) => prev.filter((b) => b.id !== id));
  const savePlan = (mk, draft) => {
    const clean = {};
    for (const [k, v] of Object.entries(draft)) {
      const n = Number(v);
      if (n > 0) clean[k] = Math.round(n * 100) / 100;
    }
    setPlans((prev) => ({ ...prev, [mk]: clean }));
  };

  const saveGoal = (g) =>
    setGoals((prev) => (prev.some((x) => x.id === g.id) ? prev.map((x) => (x.id === g.id ? { ...g, saved: x.saved, log: x.log } : x)) : [...prev, g]));
  const deleteGoal = (id) => setGoals((prev) => prev.filter((g) => g.id !== id));
  const moveFunds = (id, delta) =>
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const saved = Math.min(g.target, Math.max(0, g.saved + delta));
        return { ...g, saved, log: [...(g.log || []), { date: todayISO(), amount: delta }] };
      })
    );

  // NOTE: named upsertRecurring (not saveRecurring) to avoid shadowing the
  // storage import of the same name — the persist effect below must call the
  // storage saver, not this state updater (that was an infinite-update loop).
  const upsertRecurring = (r) =>
    setRecurrings((prev) => (prev.some((x) => x.id === r.id) ? prev.map((x) => (x.id === r.id ? r : x)) : [...prev, r]));
  const deleteRecurring = (id) => setRecurrings((prev) => prev.filter((r) => r.id !== id));
  const doPostDue = (id) => {
    const target = id ? recurrings.filter((r) => r.id === id) : recurrings;
    const { created, updated } = postDue(target);
    if (!created.length) {
      notify('Nothing due right now.');
      return;
    }
    const upd = new Map(updated.map((r) => [r.id, r]));
    setRecurrings((prev) => prev.map((r) => upd.get(r.id) || r));
    setTxs((prev) => [...created, ...prev]);
    notify(`Recorded ${created.length} transaction${created.length === 1 ? '' : 's'}.`);
  };

  // NPR-only: currency and rates are locked. Theme / name / lock settings change.
  const updateSettings = (patch) => setSettings((prev) => {
    const { baseCurrency, rates, ...rest } = patch || {};
    void baseCurrency;
    void rates;
    return {
      ...prev,
      ...rest,
      baseCurrency: BASE_CURRENCY,
      rates: { [BASE_CURRENCY]: 1 },
    };
  });
  const verifyPin = (pin) => !!settings.pinHash && hashPin(pin, settings.pinSalt) === settings.pinHash;
  const resetAll = () => {
    clearAll();
    setTxs([]); setGoals([]); setBudgets([]); setPlans({});
    setRecurrings([]); setLearned({}); setSettings({ ...DEFAULT_SETTINGS });
    setLocked(false); setTab('Home');
  };

  const statusBar = themeResolved === 'dark' ? 'light' : 'dark';

  if (!ready || !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={S.loading}>
          <View style={S.loadLogo}><Text style={S.loadLogoText}>M</Text></View>
          <Text style={S.loadText}>MobaTrack</Text>
          <StatusBar style={statusBar} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (locked) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <StatusBar style={statusBar} />
          <ToastHost top={24} />
          <LockScreen settings={settings} onUnlock={() => setLocked(false)} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={S.root} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style={statusBar} />
        <ToastHost />
        <SlimHeader
          name={settings.name}
          onBell={() => (Object.keys(flags || {}).length ? setTab('Activity') : notify('You are all caught up. No new alerts.'))}
          onSettings={() => setTab('More')}
        />
        <View style={S.body}>
          <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <FadeSlide id={tab}>
              {tab === 'Home' && (
                <DashScreen
                  txs={txs} goals={goals} budgets={budgets} recurrings={recurrings}
                  settings={settings} flags={flags}
                  onQuickAdd={() => setEditor({ open: true, initial: null })}
                  onGo={setTab}
                  onPostDue={() => doPostDue(null)}
                />
              )}
              {tab === 'Activity' && (
                <TxScreen
                  txs={txs} flags={flags} base={base} settings={settings}
                  onAdd={() => setEditor({ open: true, initial: null })}
                  onEdit={(t) => setEditor({ open: true, initial: t })}
                />
              )}
              {tab === 'Budgets' && (
                <BudgetScreen
                  txs={txs} budgets={budgets} plans={plans} settings={settings}
                  onSaveBudget={saveBudget} onDeleteBudget={deleteBudget} onSavePlan={savePlan}
                />
              )}
              {tab === 'Goals' && (
                <GoalScreen
                  goals={goals} settings={settings}
                  onSaveGoal={saveGoal} onDeleteGoal={deleteGoal} onMoveFunds={moveFunds}
                />
              )}
              {tab === 'More' && (
                <MoreScreen
                  txs={txs} goals={goals} budgets={budgets} recurrings={recurrings}
                  learned={learned} settings={settings}
                  onImport={importTxs}
                  onSaveRecurring={upsertRecurring}
                  onDeleteRecurring={deleteRecurring}
                  onPostDue={doPostDue}
                  onUpdateSettings={updateSettings}
                  onReset={resetAll}
                  onLockNow={() => (settings.pinHash ? setLocked(true) : notify('Set an app PIN first (Security section).'))}
                  verifyPin={verifyPin}
                />
              )}
            </FadeSlide>
            <View style={{ height: 140 }} />
          </ScrollView>
        </View>
        <FloatingDock
          tab={tab}
          onGo={setTab}
          onAdd={() => setEditor({ open: true, initial: null })}
        />
        <TxEditor
          visible={editor.open}
          initial={editor.initial}
          learned={learned}
          onClose={() => setEditor({ open: false, initial: null })}
          onSave={saveTx}
          onDelete={deleteTx}
          onLearn={addLearned}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
