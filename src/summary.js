// Periodic summaries: monthly and yearly breakdowns + comparisons.

import { monthKey, shiftMonth } from './theme';
import { sumAlloc, toBase } from './money';

export function monthSummary(txs, mk, base, rates) {
  const inM = (txs || []).filter((t) => monthKey(t.date) === mk);
  const income = sumAlloc(inM, base, rates, (t) => t.type === 'income');
  const expense = sumAlloc(inM, base, rates, (t) => t.type === 'expense');
  const net = income.total - expense.total;
  const rate = income.total > 0 ? ((income.total - expense.total) / income.total) * 100 : 0;
  const topCats = Object.entries(expense.byCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([category, amount]) => ({ category, amount }));
  return {
    mk,
    income: income.total,
    expense: expense.total,
    net,
    rate,
    txCount: inM.length,
    topCats,
    maxCat: topCats.length ? topCats[0].amount : 0,
  };
}

export function compareMonths(cur, prev) {
  const d = (a, b) => a - b;
  const pct = (a, b) => (b > 0 ? ((a - b) / b) * 100 : a > 0 ? 100 : 0);
  return {
    dIncome: d(cur.income, prev.income),
    dExpense: d(cur.expense, prev.expense),
    dNet: d(cur.net, prev.net),
    pExpense: pct(cur.expense, prev.expense),
  };
}

export function yearSummary(txs, year, base, rates) {
  const months = [];
  let income = 0;
  let expense = 0;
  for (let m = 1; m <= 12; m++) {
    const mk = `${year}-${String(m).padStart(2, '0')}`;
    const s = monthSummary(txs, mk, base, rates);
    months.push(s);
    income += s.income;
    expense += s.expense;
  }
  const max = Math.max(1, ...months.map((m) => Math.max(m.income, m.expense)));
  return { year, months, income, expense, net: income - expense, max };
}

export function topMerchants(txs, mk, base, rates, n = 5) {
  const map = {};
  for (const t of txs || []) {
    if (t.type !== 'expense' || monthKey(t.date) !== mk) continue;
    const key = (t.merchant || t.note || t.category || 'Unknown').trim() || 'Unknown';
    map[key] = (map[key] || 0) + toBase(t.amount, t.currency, base, rates);
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([merchant, amount]) => ({ merchant, amount }));
}

export function prevMonthKey(mk) {
  return shiftMonth(mk, -1);
}
