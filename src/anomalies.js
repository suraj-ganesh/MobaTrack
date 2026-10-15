// Spending anomaly flags: possible duplicates + unusual spikes.
// Pure heuristics, fully offline.

import { toBase } from './money';

function dayDiff(a, b) {
  const ms = new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00');
  return Math.round(ms / 86400000);
}

/** Returns {txId: [{kind, msg}]}. */
export function findAnomalies(txs, base, rates) {
  const flags = {};
  const add = (id, kind, msg) => {
    (flags[id] = flags[id] || []).push({ kind, msg });
  };
  const exp = (txs || [])
    .filter((t) => t.type === 'expense')
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  // 1) Duplicates: same merchant + amount + currency within 3 days.
  for (let i = 0; i < exp.length; i++) {
    for (let j = i + 1; j < exp.length; j++) {
      const a = exp[i];
      const b = exp[j];
      if (dayDiff(a.date, b.date) > 3) break;
      const sameWho =
        String(a.merchant || '').toLowerCase().trim() ===
          String(b.merchant || '').toLowerCase().trim() && a.merchant;
      if (sameWho && Number(a.amount) === Number(b.amount) && a.currency === b.currency) {
        add(a.id, 'duplicate', `Possible duplicate charge of ${a.amount} ${a.currency}`);
        add(b.id, 'duplicate', `Possible duplicate charge of ${b.amount} ${b.currency}`);
      }
    }
  }

  // 2) Spikes: amount > 2.5× running category average (needs 3+ prior samples).
  const hist = {};
  for (const t of exp) {
    const cat = t.category;
    const v = toBase(t.amount, t.currency, base, rates);
    const h = hist[cat] || { sum: 0, n: 0 };
    if (h.n >= 3) {
      const avg = h.sum / h.n;
      if (avg > 0 && v > avg * 2.5) {
        add(t.id, 'spike', `Unusual for ${cat}: ${Math.round((v / avg) * 10) / 10}× your average`);
      }
    }
    h.sum += v;
    h.n += 1;
    hist[cat] = h;
  }
  return flags;
}
