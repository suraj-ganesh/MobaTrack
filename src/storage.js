// Offline persistence (AsyncStorage). All slices validated on load.
// NPR-only: every amount is in rupees, no currencies or exchange rates.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATS, isISODate, todayISO, uid } from './theme';

export const BASE_CURRENCY = 'NPR';

const K = {
  transactions: 'fintrack_tx_v2',
  goals: 'fintrack_goals_v2',
  budgets: 'fintrack_budgets_v2',
  plans: 'fintrack_plans_v2',
  recurring: 'fintrack_recurring_v2',
  learned: 'fintrack_learned_v2',
  settings: 'fintrack_settings_v2',
};

export const DEFAULT_SETTINGS = {
  name: 'Suraj',
  baseCurrency: BASE_CURRENCY,
  rates: { [BASE_CURRENCY]: 1 },
  pinHash: null,
  pinSalt: null,
  totpSecret: null,
  totpEnabled: false,
};

function parse(raw, fb) {
  try {
    if (!raw) return fb;
    const v = JSON.parse(raw);
    return v ?? fb;
  } catch {
    return fb;
  }
}

function cleanCat(c, type) {
  const list = type === 'income' ? CATS.income : CATS.expense;
  return list.includes(c) ? c : type === 'income' ? 'Other' : 'Other';
}

export function cleanTransactions(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const t of list) {
    if (!t || typeof t !== 'object') continue;
    const amount = Number(t.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const type = t.type === 'income' ? 'income' : 'expense';
    const items = Array.isArray(t.items)
      ? t.items
          .filter((i) => i && Number(i.amount) > 0)
          .map((i) => ({
            label: String(i.label ?? '').slice(0, 60),
            amount: Number(i.amount),
            category: cleanCat(i.category, 'expense'),
          }))
      : [];
    out.push({
      id: String(t.id ?? uid()),
      amount,
      currency: BASE_CURRENCY,
      type,
      category: cleanCat(t.category, type),
      merchant: String(t.merchant ?? '').slice(0, 80),
      note: String(t.note ?? '').slice(0, 140),
      date: isISODate(t.date) ? t.date : todayISO(),
      items,
    });
  }
  return out;
}

export function cleanGoals(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const g of list) {
    if (!g || typeof g !== 'object') continue;
    const name = String(g.name ?? '').trim().slice(0, 60);
    const target = Number(g.target);
    if (!name || !Number.isFinite(target) || target <= 0) continue;
    const saved = Number(g.saved);
    const rawDl = String(g.deadline ?? '');
    // Full-date deadlines (YYYY-MM-DD); legacy month-only ones become the 1st.
    const deadline = isISODate(rawDl) ? rawDl : (/^\d{4}-\d{2}$/.test(rawDl) ? `${rawDl}-01` : null);
    out.push({
      id: String(g.id ?? uid()),
      name,
      target,
      saved: Number.isFinite(saved) ? Math.min(target, Math.max(0, saved)) : 0,
      currency: BASE_CURRENCY,
      deadline,
    });
  }
  return out;
}

export function cleanBudgets(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const b of list) {
    if (!b || typeof b !== 'object') continue;
    const cap = Number(b.cap);
    if (!CATS.expense.includes(b.category) || !Number.isFinite(cap) || cap <= 0) continue;
    out.push({
      id: String(b.id ?? uid()),
      category: b.category,
      cap,
      period: b.period === 'weekly' ? 'weekly' : 'monthly',
    });
  }
  return out;
}

export function cleanPlans(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  for (const [mk, plan] of Object.entries(obj)) {
    if (!/^\d{4}-\d{2}$/.test(mk) || !plan || typeof plan !== 'object') continue;
    const p = {};
    for (const [cat, amt] of Object.entries(plan)) {
      if (CATS.expense.includes(cat) && Number.isFinite(Number(amt)) && Number(amt) > 0) {
        p[cat] = Number(amt);
      }
    }
    out[mk] = p;
  }
  return out;
}

const FREQS = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];

export function cleanRecurring(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const r of list) {
    if (!r || typeof r !== 'object') continue;
    const amount = Number(r.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !isISODate(r.nextDate)) continue;
    const type = r.type === 'income' ? 'income' : 'expense';
    out.push({
      id: String(r.id ?? uid()),
      label: String(r.label ?? '').trim().slice(0, 80) || 'Recurring',
      amount,
      currency: BASE_CURRENCY,
      type,
      category: cleanCat(r.category, type),
      frequency: FREQS.includes(r.frequency) ? r.frequency : 'monthly',
      nextDate: r.nextDate,
      active: r.active !== false,
    });
  }
  return out;
}

export function cleanLearned(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = String(k || '').toLowerCase().trim().slice(0, 60);
    if (key && [...CATS.expense, ...CATS.income].includes(v)) out[key] = v;
  }
  return out;
}

// NPR-only: the base currency is always locked. Old installs may have stored
// foreign base currencies or exchange-rate tables - those are ignored.
export function cleanSettings(v) {
  const d = DEFAULT_SETTINGS;
  if (!v || typeof v !== 'object') return { ...d, rates: { [BASE_CURRENCY]: 1 } };
  return {
    name: String(v.name ?? '').slice(0, 60),
    baseCurrency: BASE_CURRENCY,
    rates: { [BASE_CURRENCY]: 1 },
    pinHash: typeof v.pinHash === 'string' ? v.pinHash : null,
    pinSalt: typeof v.pinSalt === 'string' ? v.pinSalt : null,
    totpSecret: typeof v.totpSecret === 'string' ? v.totpSecret : null,
    totpEnabled: v.totpEnabled === true && typeof v.totpSecret === 'string',
  };
}

export async function loadAll() {
  try {
    const [tx, goals, budgets, plans, recurring, learned, settings] = await Promise.all([
      AsyncStorage.getItem(K.transactions),
      AsyncStorage.getItem(K.goals),
      AsyncStorage.getItem(K.budgets),
      AsyncStorage.getItem(K.plans),
      AsyncStorage.getItem(K.recurring),
      AsyncStorage.getItem(K.learned),
      AsyncStorage.getItem(K.settings),
    ]);
    return {
      transactions: cleanTransactions(parse(tx, [])),
      goals: cleanGoals(parse(goals, [])),
      budgets: cleanBudgets(parse(budgets, [])),
      plans: cleanPlans(parse(plans, {})),
      recurring: cleanRecurring(parse(recurring, [])),
      learned: cleanLearned(parse(learned, {})),
      settings: cleanSettings(parse(settings, null)),
    };
  } catch {
    return {
      transactions: [], goals: [], budgets: [], plans: {},
      recurring: [], learned: {}, settings: cleanSettings(null),
    };
  }
}

async function save(key, val) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export const saveTransactions = (l) => save(K.transactions, l);
export const saveGoals = (l) => save(K.goals, l);
export const saveBudgets = (l) => save(K.budgets, l);
export const savePlans = (o) => save(K.plans, o);
export const saveRecurring = (l) => save(K.recurring, l);
export const saveLearned = (o) => save(K.learned, o);
export const saveSettings = (s) => save(K.settings, cleanSettings(s));

export async function clearAll() {
  try {
    await AsyncStorage.multiRemove(Object.values(K));
  } catch {}
}
