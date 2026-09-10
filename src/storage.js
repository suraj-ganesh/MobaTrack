import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  transactions: 'mobatrack_transactions_v1',
  goals: 'mobatrack_goals_v1',
  settings: 'mobatrack_settings_v1',
};

export async function loadAll() {
  const [tx, goals, settings] = await Promise.all([
    AsyncStorage.getItem(KEYS.transactions),
    AsyncStorage.getItem(KEYS.goals),
    AsyncStorage.getItem(KEYS.settings),
  ]);
  return {
    transactions: tx ? JSON.parse(tx) : [],
    goals: goals ? JSON.parse(goals) : [],
    settings: settings ? JSON.parse(settings) : { currency: 'Rs.', name: '' },
  };
}

export async function saveTransactions(list) {
  await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(list));
}

export async function saveGoals(list) {
  await AsyncStorage.setItem(KEYS.goals, JSON.stringify(list));
}

export async function saveSettings(s) {
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(s));
}

export async function clearAll() {
  await AsyncStorage.multiRemove([KEYS.transactions, KEYS.goals, KEYS.settings]);
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
