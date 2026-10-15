// Bank-sync stand-in: CSV import (paste or statement export) + CSV export.
// Expected columns: date, merchant, amount, currency, type, category, note
// Amount may be signed (negative = expense) when type is omitted.

import { CURRENCIES, isISODate, todayISO } from './theme';
import { suggestCategory } from './categorize';

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQ = false;
  const push = () => { row.push(cur); cur = ''; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') push();
    else if (ch === '\n') { push(); rows.push(row); row = []; }
    else if (ch === '\r') { /* skip */ }
    else cur += ch;
  }
  push();
  rows.push(row);
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ''));
}

function isHeader(r) {
  const joined = r.join(' ').toLowerCase();
  return /date/.test(joined) && /amount|debit|credit/.test(joined);
}

function normDate(raw) {
  const s = String(raw || '').trim();
  if (isISODate(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    let [, a, b, y] = m;
    if (y.length === 2) y = '20' + y;
    // Assume MM/DD/YYYY (bank-statement default)
    const iso = `${y}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
    // Heuristic: if month invalid, try DD/MM/YYYY
    if (Number(b) >= 1 && Number(b) <= 12 && isISODate(iso)) return iso;
    const alt = `${y}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
    if (isISODate(alt)) return alt;
  }
  return todayISO();
}

export function dupeKey(date, amount, currency, merchant) {
  return `${date}|${Number(amount).toFixed(2)}|${currency}|${String(merchant || '').toLowerCase().trim()}`;
}

/** Turn raw rows into importable items with auto-categories + dupe flags. */
export function rowsToItems(rows, existing, defaultCurrency, learned) {
  const data = rows.length && isHeader(rows[0]) ? rows.slice(1) : rows;
  const seen = new Set(
    (existing || []).map((t) =>
      dupeKey(t.date, t.amount, t.currency, t.merchant || t.note)
    )
  );
  return data.map((r) => {
    const [dateRaw, merchantRaw, amountRaw, curRaw, typeRaw, catRaw, noteRaw] = r;
    let amount = Number(String(amountRaw ?? '').replace(/[^0-9.\-]/g, ''));
    if (!Number.isFinite(amount) || amount === 0) return null;
    let type = /^(income|credit|in)$/i.test(String(typeRaw || '').trim())
      ? 'income'
      : /^(expense|debit|out)$/i.test(String(typeRaw || '').trim())
        ? 'expense'
        : amount < 0 ? 'expense' : 'income';
    amount = Math.abs(amount);
    const merchant = String(merchantRaw ?? '').slice(0, 80);
    const currency = CURRENCIES.includes(String(curRaw || '').toUpperCase())
      ? String(curRaw).toUpperCase()
      : defaultCurrency;
    const suggested = suggestCategory(`${merchant} ${noteRaw || ''}`, type, learned);
    const item = {
      date: normDate(dateRaw),
      merchant,
      amount,
      currency,
      type,
      category: String(catRaw || '').trim() || suggested || (type === 'income' ? 'Other' : 'Other'),
      auto: !String(catRaw || '').trim(),
      note: String(noteRaw ?? '').slice(0, 140),
    };
    item.dupe = seen.has(dupeKey(item.date, item.amount, item.currency, item.merchant));
    return item;
  }).filter(Boolean);
}

const esc = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function buildCSV(txs) {
  const head = 'date,merchant,amount,currency,type,category,note';
  const lines = [...txs]
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((t) =>
      [t.date, t.merchant, t.amount, t.currency, t.type, t.category, t.note].map(esc).join(',')
    );
  return [head, ...lines].join('\n');
}
