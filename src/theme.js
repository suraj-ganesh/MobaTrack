export const C = {
  bg: '#FFFFFF',
  text: '#000000',
  muted: '#6B6B6B',
  border: '#000000',
  lightBorder: '#E5E5E5',
  card: '#FFFFFF',
  invertedBg: '#000000',
  invertedText: '#FFFFFF',
  grayBg: '#F5F5F5',
};

export const DEFAULT_CATEGORIES = [
  { name: 'Food', type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: 'Shopping', type: 'expense' },
  { name: 'Bills', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Salary', type: 'income' },
  { name: 'Freelance', type: 'income' },
  { name: 'Other', type: 'expense' },
];

export function formatMoney(amount, currency = 'Rs.') {
  const n = Number(amount) || 0;
  return `${currency} ${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}
