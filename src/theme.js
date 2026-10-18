// Monochrome Financial Atelier — EXACT tokens from Stitch 1126451746754138922.
// Light theme from the original spec; dark theme is its true inverse:
// deep ink surfaces, white-as-accent, white hairlines, dark blurred glass.
//
// Theme engine: DS and C are live ES-module bindings (export let). applyTheme()
// swaps them and notifies subscribers (ui.js rebuilds its stylesheet) — App.js
// then forces one re-render so every inline DS reference re-evaluates.

const MODES = ['light', 'dark', 'system'];
export const THEME_MODES = MODES;

const LIGHT_TOKENS = {
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
  // theme-specific composites
  sheen: 'rgba(255,255,255,0.95)',
  chipBase: 'rgba(255,255,255,0.85)',
  sheetBase: 'rgba(255,255,255,0.94)',
  inputBase: '#ffffff',
  knob: '#ffffff',
  blurTint: 'light',
  radius: { xs: 4, sm: 8, card: 12, pill: 9999 },
};

// Dark: "Monochrome Financial Atelier — Night Press".
// Same architecture: glass cards r12, hairlines, black-pill accents inverted
// to white. Cool blue-ink undertone, no pure black (contrast with cards).
const DARK_TOKENS = {
  surface: '#0b0d13',
  dim: '#141823',
  bright: '#0b0d13',
  lowest: '#12151d',
  low: '#171b25',
  container: '#1c212d',
  high: '#232834',
  highest: '#2b3140',
  background: '#0b0d13',
  on: '#eceef6',
  onVariant: '#9aa0ae',
  onBackground: '#eceef6',
  primary: '#ffffff',
  onPrimary: '#0b0d13',
  primaryContainer: '#e8eaf2',
  hairline: 'rgba(255,255,255,0.07)',
  rowLine: 'rgba(255,255,255,0.09)',
  outline: '#6b7080',
  outlineVariant: '#39404e',
  error: '#ff6b6b',
  errorContainer: '#2e1515',
  glassCard: 'rgba(20,24,33,0.82)',
  glassDock: 'rgba(15,18,26,0.88)',
  inset: '#10131b',
  inputBg: 'rgba(255,255,255,0.05)',
  sheen: 'rgba(255,255,255,0.07)',
  chipBase: 'rgba(24,29,40,0.9)',
  sheetBase: 'rgba(19,23,32,0.96)',
  inputBase: '#1c212d',
  knob: '#0b0d13',
  blurTint: 'dark',
  radius: { xs: 4, sm: 8, card: 12, pill: 9999 },
};

function tokens(s) {
  const t = { ...s };
  t.radius = { ...s.radius };
  return t;
}

// Back-compat aliases for More/editor/lock (same palette).
function aliases(T) {
  const dark = T.blurTint === 'dark';
  return dark
    ? {
        bg: '#0b0d13',
        card: T.lowest,
        ink: T.on,
        black: T.primary,
        muted: T.onVariant,
        faint: '#6b7080',
        line: 'rgba(255,255,255,0.08)',
        hairline: T.hairline,
        accent: T.primary,
        accentSoft: 'rgba(255,255,255,0.08)',
        success: T.primary,
        danger: T.error,
        warn: T.onVariant,
        error: T.error,
        greyLight: T.low,
        greyMedium: T.high,
        greyDark: T.onVariant,
      }
    : {
        bg: T.surface,
        card: T.lowest,
        ink: T.on,
        black: T.primary,
        muted: T.onVariant,
        faint: '#94a3b8',
        line: '#e6e8f2',
        hairline: T.hairline,
        accent: T.primary,
        accentSoft: 'rgba(0,0,0,0.05)',
        success: T.primary,
        danger: T.error,
        warn: T.onVariant,
        error: T.error,
        greyLight: T.low,
        greyMedium: T.high,
        greyDark: T.onVariant,
      };
}

export let themeMode = 'system';
export let themeResolved = 'light';
export let DS = tokens(LIGHT_TOKENS);
export let C = aliases(DS);

const listeners = new Set();
export function onThemeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resolvedScheme(mode, systemScheme) {
  const m = MODES.includes(mode) ? mode : 'system';
  return m === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : m;
}

export function applyTheme(mode, systemScheme) {
  const r = resolvedScheme(mode, systemScheme);
  if (r === themeResolved && (mode || 'system') === themeMode) return false;
  themeMode = MODES.includes(mode) ? mode : 'system';
  themeResolved = r;
  DS = tokens(r === 'dark' ? DARK_TOKENS : LIGHT_TOKENS);
  C = aliases(DS);
  for (const fn of Array.from(listeners)) {
    try { fn(); } catch {}
  }
  return true;
}

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
