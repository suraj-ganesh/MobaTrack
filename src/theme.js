// Monochrome Financial Atelier — EXACT tokens from Stitch 1126451746754138922.
// What the four screens render: primary #000000, JetBrains Mono numerals,
// 12px cards / 8px panels / pills, hairline rgba(15,23,42,0.08).

export const DS = {
  surface: '#faf8ff',
  dim: '#d2d9f4',
  bright: '#faf8ff',
  lowest: '#ffffff',
  low: '#f2f3ff',
  container: '#eaedff',
  high: '#e2e7ff',
  highest: '#dae2fd',
  background: '#faf8ff',
  on: '#131b2e',
  onVariant: '#4c4546',
  onBackground: '#131b2e',
  primary: '#000000',
  onPrimary: '#ffffff',
  primaryContainer: '#1b1b1b',
  hairline: 'rgba(15,23,42,0.08)',
  rowLine: 'rgba(226,231,255,0.6)',
  outline: '#7e7576',
  outlineVariant: '#cfc4c5',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  glassCard: 'rgba(255,255,255,0.8)',
  glassDock: 'rgba(255,255,255,0.9)',
  inset: '#f4f5ff',
  inputBg: 'rgba(0,0,0,0.02)',
  radius: { xs: 4, sm: 8, card: 12, pill: 9999 },
};

// Back-compat aliases for More/editor/lock (same palette).
export const C = {
  bg: DS.surface,
  card: DS.lowest,
  ink: DS.on,
  black: DS.primary,
  muted: DS.onVariant,
  faint: '#94a3b8',
  line: '#e6e8f2',
  hairline: DS.hairline,
  accent: DS.primary,
  accentSoft: 'rgba(0,0,0,0.05)',
  success: DS.primary,
  danger: DS.error,
  warn: DS.onVariant,
  error: DS.error,
  greyLight: DS.low,
  greyMedium: DS.high,
  greyDark: DS.onVariant,
};

export const CATS = {
  expense: [
    'Food & Drink', 'Groceries', 'Transport', 'Shopping', 'Bills & Utilities',
    'Rent', 'Health', 'Entertainment', 'Travel', 'Education', 'Personal', 'Other',
  ],
  income: ['Salary', 'Freelance', 'Business', 'Interest', 'Gift', 'Other'],
};

// NPR-only app: a single currency, no exchange rates, no conversion.
export const CURRENCIES = ['NPR'];

export const DEFAULT_RATES = { NPR: 1 };

const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MNL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// All amounts are in Nepali rupees.
export const RS = 'Rs.';

export function fmt(amount) {
  const n = Number(amount) || 0;
  const s = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${RS} ${s}`;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function todayLabelLong() {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
}

export function monthLong(mk) {
  const [y, m] = String(mk || '').split('-').map(Number);
  return `${MNL[(m || 1) - 1]} ${y}`;
}

export function monthName(mk) {
  const [, m] = String(mk || '').split('-').map(Number);
  return MNL[(m || 1) - 1];
}

export function daysLeftInMonth(refISO) {
  const d = new Date((refISO || todayISO()) + 'T12:00:00');
  const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return Math.max(0, dim - d.getDate());
}

export function isISODate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))) return false;
  const d = new Date(String(s) + 'T12:00:00');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDaysISO(iso, n) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function addMonthsISO(iso, n) {
  const d = new Date(iso + 'T12:00:00');
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, dim));
  return d.toISOString().slice(0, 10);
}

export function monthKey(iso) {
  return String(iso || '').slice(0, 7);
}

export function shiftMonth(mk, delta) {
  const [y, m] = String(mk).split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(mk) {
  const [y, m] = String(mk).split('-').map(Number);
  return `${MN[(m || 1) - 1]} ${y}`;
}

export function weekRange(refISO) {
  const d = new Date(refISO + 'T12:00:00');
  const dow = (d.getDay() + 6) % 7; // Monday-first
  const mon = new Date(d);
  mon.setDate(d.getDate() - dow);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const f = (x) => x.toISOString().slice(0, 10);
  return [f(mon), f(sun)];
}

// Hanken Grotesk (UI) + JetBrains Mono (numerals) via expo-font. Loaded in App.js.
export const font = {
  regular: 'HankenGrotesk_400Regular',
  medium: 'HankenGrotesk_500Medium',
  bold: 'HankenGrotesk_600SemiBold',
  mono: 'JetBrainsMono_500Medium',
  monoReg: 'JetBrainsMono_400Regular',
};

// Exact Stitch type scale.
export const T = {
  display: { fontSize: 28, lineHeight: 34, letterSpacing: -0.8, fontWeight: '600', fontFamily: font.bold },
  hLg: { fontSize: 22, lineHeight: 28, letterSpacing: -0.4, fontWeight: '600', fontFamily: font.bold },
  hMd: { fontSize: 18, lineHeight: 24, letterSpacing: -0.3, fontWeight: '600', fontFamily: font.bold },
  hSm: { fontSize: 15, lineHeight: 20, letterSpacing: -0.2, fontWeight: '600', fontFamily: font.bold },
  bodyLg: { fontSize: 14, lineHeight: 20, fontWeight: '400', fontFamily: font.regular },
  bodyMd: { fontSize: 13, lineHeight: 18, fontWeight: '400', fontFamily: font.regular },
  bodySm: { fontSize: 12, lineHeight: 16, fontWeight: '400', fontFamily: font.regular },
  labelMd: { fontSize: 11, lineHeight: 14, letterSpacing: 0.4, fontWeight: '500', fontFamily: font.medium },
  labelSm: { fontSize: 10, lineHeight: 12, letterSpacing: 0.6, fontWeight: '600', fontFamily: font.bold },
  curLg: { fontSize: 24, lineHeight: 30, letterSpacing: -0.5, fontWeight: '500', fontFamily: font.mono },
  curMd: { fontSize: 16, lineHeight: 22, letterSpacing: -0.2, fontWeight: '500', fontFamily: font.mono },
  curSm: { fontSize: 12, lineHeight: 16, fontWeight: '500', fontFamily: font.mono },
};
