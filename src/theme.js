export const C = {
  ink: '#F5F3EF',
  inkSoft: '#E7E0D8',
  cream: '#1D1E22',
  creamLight: '#1D1E22',
  gray: '#545452',
  graySoft: '#716D6C',
  textPrimary: '#1D1E22',
  textSecondary: '#5F5B59',
  muted: '#6E6A68',
  border: '#8B8784',
  white: '#FFFFFF',
  bg: '#F5F3EF',
  text: '#1D1E22',
  card: '#1D1E22',
  invertedBg: '#1D1E22',
  invertedText: '#F5F3EF',
  grayBg: 'rgba(29,30,34,0.06)',
};

export const R = {
  card: 14,
  small: 10,
  pill: 999,
};

export const DEFAULT_CATEGORIES = [
  { name: 'Food', type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: 'Shopping', type: 'expense' },
  { name: 'Bills', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Health', type: 'expense' },
  { name: 'Salary', type: 'income' },
  { name: 'Freelance', type: 'income' },
  { name: 'Other', type: 'expense' },
];

export function formatMoney(amount, currency = 'Rs.') {
  const n = Number(amount) || 0;
  return `${currency} ${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}
