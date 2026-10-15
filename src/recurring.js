// Recurring bills/income: schedules, upcoming bills, cash-flow forecast.

import { addDaysISO, addMonthsISO, todayISO, uid } from './theme';
import { toBase } from './money';

export const FREQS = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Every 2 weeks' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly', label: 'Yearly' },
];

export function freqLabel(id) {
  return (FREQS.find((f) => f.id === id) || {}).label || id;
}

export function stepDate(iso, freq) {
  switch (freq) {
    case 'weekly': return addDaysISO(iso, 7);
    case 'biweekly': return addDaysISO(iso, 14);
    case 'monthly': return addMonthsISO(iso, 1);
    case 'quarterly': return addMonthsISO(iso, 3);
    case 'yearly': return addMonthsISO(iso, 12);
    default: return addMonthsISO(iso, 1);
  }
}

/** All occurrence dates of rec within [fromISO, toISO]. */
export function occurrences(rec, fromISO, toISO, max = 500) {
  const out = [];
  let d = rec.nextDate;
  let guard = 0;
  while (d < fromISO && guard++ < 2000) d = stepDate(d, rec.frequency);
  guard = 0;
  while (d <= toISO && guard++ < max) {
    out.push(d);
    d = stepDate(d, rec.frequency);
  }
  return out;
}

/** Next upcoming occurrence per active schedule inside `days`. */
export function upcomingBills(recs, days = 30, today = todayISO()) {
  const end = addDaysISO(today, days);
  const out = [];
  for (const r of recs || []) {
    if (r.active === false) continue;
    const occ = occurrences(r, today, end, 1);
    if (occ.length) out.push({ rec: r, date: occ[0] });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** Overdue occurrences (nextDate <= today). Returns {dates, newNext}. */
export function dueOccurrences(rec, today = todayISO()) {
  const dates = [];
  let d = rec.nextDate;
  let guard = 0;
  while (d <= today && guard++ < 500) {
    dates.push(d);
    d = stepDate(d, rec.frequency);
  }
  return { dates, newNext: d };
}

/** Post all due occurrences as transactions; advance schedules. */
export function postDue(recs, today = todayISO()) {
  const created = [];
  const updated = (recs || []).map((r) => {
    if (r.active === false) return r;
    const { dates, newNext } = dueOccurrences(r, today);
    for (const d of dates) {
      created.push({
        id: uid(),
        amount: r.amount,
        currency: r.currency,
        type: r.type,
        category: r.category,
        merchant: r.label,
        note: `Recurring · ${freqLabel(r.frequency).toLowerCase()}`,
        date: d,
        items: [],
      });
    }
    return dates.length ? { ...r, nextDate: newNext } : r;
  });
  return { created, updated };
}

/**
 * Cash-flow forecast: starting balance + expected recurring flows per day.
 * Returns {points: [{date, balance}], end, min} over `days`.
 */
export function forecast(recs, startBalance, base, rates, days = 90, today = todayISO()) {
  const end = addDaysISO(today, days);
  const delta = {};
  for (const r of recs || []) {
    if (r.active === false) continue;
    for (const d of occurrences(r, today, end)) {
      const v = toBase(r.amount, r.currency, base, rates);
      delta[d] = (delta[d] || 0) + (r.type === 'income' ? v : -v);
    }
  }
  const points = [];
  let bal = startBalance;
  let min = bal;
  for (let i = 0; i <= days; i++) {
    const d = addDaysISO(today, i);
    bal += delta[d] || 0;
    if (bal < min) min = bal;
    if (i % 3 === 0 || i === days) points.push({ date: d, balance: Math.round(bal * 100) / 100 });
  }
  return { points, end: Math.round(bal * 100) / 100, min: Math.round(min * 100) / 100 };
}
