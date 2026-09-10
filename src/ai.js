// Local rule-based "AI" suggestions about balance.
// No network, no gateway. Pure heuristics like FinTrack's AI insights fallback.

export function getTotals(transactions) {
  let income = 0;
  let expenses = 0;
  for (const t of transactions) {
    const a = Number(t.amount) || 0;
    if (t.type === 'income') income += a;
    else expenses += a;
  }
  return { income, expenses, balance: income - expenses };
}

export function generateInsights(transactions, goals) {
  const insights = [];
  const { income, expenses, balance } = getTotals(transactions);

  if (transactions.length === 0) {
    return [
      { type: 'info', title: 'No data yet', description: 'Add your first income or expense to get balance suggestions.' },
      { type: 'tip', title: 'Start simple', description: 'Log Salary as income, then Food / Transport as expenses.' },
    ];
  }

  if (balance < 0) {
    insights.push({
      type: 'warning',
      title: 'Balance is negative',
      description: `You are overspending by ${Math.abs(balance).toFixed(2)}. Cut the top expense category this week.`,
    });
  } else if (income > 0 && balance / income < 0.1) {
    insights.push({
      type: 'warning',
      title: 'Low savings buffer',
      description: `Only ${((balance / income) * 100).toFixed(0)}% of income is left. Aim to keep at least 20% unspent.`,
    });
  } else if (balance >= 0) {
    insights.push({
      type: 'success',
      title: 'Healthy balance',
      description: `Balance is ${balance.toFixed(2)}. Consider moving some to a savings goal.`,
    });
  }

  if (income > 0) {
    const rate = ((income - expenses) / income) * 100;
    insights.push({
      type: rate >= 20 ? 'success' : 'tip',
      title: `Savings rate ${rate.toFixed(0)}%`,
      description: rate >= 20
        ? 'Great. You are saving above the 20% rule.'
        : 'Below the 20% rule. Reduce discretionary spending (Shopping, Entertainment, Food).',
    });
  }

  const byCat = {};
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount);
  }
  const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  if (top && expenses > 0) {
    const pct = ((top[1] / expenses) * 100).toFixed(0);
    insights.push({
      type: pct > 40 ? 'warning' : 'info',
      title: `Top spend: ${top[0]} (${pct}%)`,
      description: pct > 40
        ? `${top[0]} takes ${pct}% of all spending. Set a weekly cap for it.`
        : `${top[0]} is your largest category at ${pct}% of expenses.`,
    });
  }

  const days = new Set(transactions.map((t) => String(t.date).slice(0, 10))).size || 1;
  const dailyAvg = expenses / days;
  if (dailyAvg > 0) {
    const runway = balance > 0 ? Math.floor(balance / dailyAvg) : 0;
    insights.push({
      type: 'info',
      title: `Daily average ${dailyAvg.toFixed(2)}`,
      description: balance > 0
        ? `At this pace your balance covers ~${runway} more day(s).`
        : 'Daily spend tracked. Add income to rebuild balance.',
    });
  }

  for (const g of goals.slice(0, 3)) {
    const pct = g.target > 0 ? (g.saved / g.target) * 100 : 0;
    if (pct >= 100) {
      insights.push({ type: 'success', title: `Goal reached: ${g.name}`, description: 'Goal fully funded. Create a new one.' });
    } else if (balance > 0 && pct < 100) {
      const suggest = Math.min(balance * 0.2, g.target - g.saved).toFixed(2);
      insights.push({ type: 'tip', title: `Fund "${g.name}"`, description: `${pct.toFixed(0)}% funded. You could move ${suggest} (20% of balance) toward it.` });
    }
  }

  const recent = [...transactions]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 14);
  const recentExp = recent.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const older = transactions.slice(14, 28).filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  if (older > 0) {
    const chg = ((recentExp - older) / older) * 100;
    if (Math.abs(chg) >= 10) {
      insights.push({
        type: chg > 0 ? 'warning' : 'success',
        title: chg > 0 ? `Spending up ${chg.toFixed(0)}%` : `Spending down ${Math.abs(chg).toFixed(0)}%`,
        description: chg > 0 ? 'Recent spending is rising. Review last 5 transactions.' : 'Nice, spending trend is falling. Keep it up.',
      });
    }
  }

  return insights.slice(0, 8);
}
