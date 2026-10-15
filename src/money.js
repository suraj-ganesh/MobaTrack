// Multi-currency conversion + category allocation (receipt splits).
// All totals in the app flow through these helpers so every figure is in
// the user's base currency.

export function toBase(amount, code, base, rates) {
  const n = Number(amount) || 0;
  if (!n) return 0;
  if (!code || code === base) return n;
  const r = Number(rates?.[code]);
  if (!Number.isFinite(r) || r <= 0) return n;
  return n / r;
}

/**
 * Split a transaction into {category, amount(base)} parts.
 * Expense receipts with line items allocate each item to its own category;
 * any remainder stays under the transaction category.
 */
export function allocations(tx, base, rates) {
  const conv = (a) => toBase(a, tx.currency, base, rates);
  if (tx.type !== 'expense' || !Array.isArray(tx.items) || tx.items.length === 0) {
    return [{ category: tx.category, amount: conv(tx.amount) }];
  }
  const out = [];
  let itemSum = 0;
  for (const it of tx.items) {
    const a = Number(it.amount) || 0;
    if (a <= 0) continue;
    itemSum += a;
    out.push({ category: it.category || tx.category, amount: conv(a) });
  }
  const rest = Number(tx.amount) - itemSum;
  if (rest > 0.004) out.push({ category: tx.category, amount: conv(rest) });
  return out.length ? out : [{ category: tx.category, amount: conv(tx.amount) }];
}

/** Sum allocations of txs passing pred → {total, byCat} in base currency. */
export function sumAlloc(txList, base, rates, pred) {
  const byCat = {};
  let total = 0;
  for (const tx of txList || []) {
    if (pred && !pred(tx)) continue;
    for (const a of allocations(tx, base, rates)) {
      byCat[a.category] = (byCat[a.category] || 0) + a.amount;
      total += a.amount;
    }
  }
  return { total, byCat };
}

export function balanceOf(txList, base, rates) {
  let b = 0;
  for (const tx of txList || []) {
    const v = toBase(tx.amount, tx.currency, base, rates);
    b += tx.type === 'income' ? v : -v;
  }
  return b;
}

export function inDateRange(tx, from, to) {
  return tx.date >= from && tx.date <= to;
}
