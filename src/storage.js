import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  transactions: 'mobatrack_transactions_v1',
  goals: 'mobatrack_goals_v1',
  settings: 'mobatrack_settings_v1',
};

function safeParse(raw, fallback) {
  try {
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export async function loadAll() {
  try {
    const [tx, goals, settings] = await Promise.all([
      AsyncStorage.getItem(KEYS.transactions),
      AsyncStorage.getItem(KEYS.goals),
      AsyncStorage.getItem(KEYS.settings),
    ]);
    const transactions = safeParse(tx, []);
    const goalsList = safeParse(goals, []);
    const parsedSettings = safeParse(settings, null);
    return {
      transactions: Array.isArray(transactions) ? transactions : [],
      goals: Array.isArray(goalsList) ? goalsList : [],
      settings:
        parsedSettings && typeof parsedSettings === 'object'
          ? { currency: String(parsedSettings.currency || 'Rs.'), name: String(parsedSettings.name || '') }
          : { currency: 'Rs.', name: '' },
    };
  } catch {
    return { transactions: [], goals: [], settings: { currency: 'Rs.', name: '' } };
  }
}

export async function saveTransactions(list) {
  try {
    await AsyncStorage.setItem(KEYS.transactions, JSON.stringify(list));
  } catch {}
}

export async function saveGoals(list) {
  try {
    await AsyncStorage.setItem(KEYS.goals, JSON.stringify(list));
  } catch {}
}

export async function saveSettings(s) {
  try {
    await AsyncStorage.setItem(KEYS.settings, JSON.stringify(s));
  } catch {}
}

export async function clearAll() {
  try {
    await AsyncStorage.multiRemove([KEYS.transactions, KEYS.goals, KEYS.settings]);
  } catch {}
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
