// Simple NPR-only totals. Everything in the app is in rupees, so there is
// no currency conversion anywhere - what you enter is what gets counted.

export function toBase(amount) {
  return Number(amount) || 0;
}

/**
 * Split a transaction into {category, amount} parts.
 * Expense receipts with line items allocate each item to its own category;
 * any remainder stays under the transaction category.
 */
export function allocations(tx) {
  if (tx.type !== 'expense' || !Array.isArray(tx.items) || tx.items.length === 0) {
    return [{ category: tx.category, amount: Number(tx.amount) || 0 }];
  }
  const out = [];
  let itemSum = 0;
  for (const it of tx.items) {
    const a = Number(it.amount) || 0;
    if (a <= 0) continue;
    itemSum += a;
    out.push({ category: it.category || tx.category, amount: a });
  }
  const rest = Number(tx.amount) - itemSum;
  if (rest > 0.004) out.push({ category: tx.category, amount: rest });
  return out.length ? out : [{ category: tx.category, amount: Number(tx.amount) || 0 }];
}

/** Sum allocations of txs passing pred → {total, byCat} in rupees. */
export function sumAlloc(txList, _base, _rates, pred) {
  const byCat = {};
  let total = 0;
  for (const tx of txList || []) {
    if (pred && !pred(tx)) continue;
    for (const a of allocations(tx)) {
      byCat[a.category] = (byCat[a.category] || 0) + a.amount;
      total += a.amount;
    }
  }
  return { total, byCat };
}

export function balanceOf(txList) {
  let b = 0;
  for (const tx of txList || []) {
    const v = Number(tx.amount) || 0;
    b += tx.type === 'income' ? v : -v;
  }
  return b;
}

export function inDateRange(tx, from, to) {
  return tx.date >= from && tx.date <= to;
}
