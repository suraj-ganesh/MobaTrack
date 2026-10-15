// Smart auto-categorization: keyword rules + merchant memory.
// When a user corrects a category, the merchant→category mapping is learned
// and reused for future manual entries and CSV imports.

const RULES = [
  // income
  [/salary|payroll|paycheck/i, 'Salary', 'income'],
  [/freelance|upwork|fiverr|contract/i, 'Freelance', 'income'],
  [/dividend|interest|yield/i, 'Interest', 'income'],
  [/gift|bonus|reward/i, 'Gift', 'income'],
  // food & groceries
  [/starbucks|coffee|cafe|espresso|latte|bakery|restaurant|pizza|burger|sushi|diner|eatery|kitchen|grill|taco/i, 'Food & Drink', 'expense'],
  [/grocery|supermarket|mart|whole foods|aldi|lidl|tesco|carrefour|bhatbhateni|bigmart/i, 'Groceries', 'expense'],
  // transport & travel
  [/uber|lyft|taxi|bus|metro|subway|train|fuel|gas station|shell|parking|toll|airline|flight|hotel|airbnb/i, 'Transport', 'expense'],
  [/airbnb|hotel|hostel|resort|booking\.com|expedia|trip/i, 'Travel', 'expense'],
  // shopping & personal
  [/amazon|ebay|mall|store|shop|zara|h&m|nike|apple store|flipkart|daraz/i, 'Shopping', 'expense'],
  [/salon|barber|spa|gym|pharmacy|cvs|walgreens/i, 'Personal', 'expense'],
  // bills, rent, health, education, entertainment
  [/electric|water|internet|phone|mobile|utility|utilities|netflix|spotify|subscription/i, 'Bills & Utilities', 'expense'],
  [/rent|landlord|lease|apartment/i, 'Rent', 'expense'],
  [/hospital|clinic|doctor|dental|lab test|insurance|medic/i, 'Health', 'expense'],
  [/cinema|movie|theater|concert|game|steam|playstation|entertainment/i, 'Entertainment', 'expense'],
  [/school|college|university|course|udemy|coursera|tuition|book/i, 'Education', 'expense'],
];

export function suggestCategory(text, type, learned) {
  const t = String(text || '').toLowerCase().trim();
  if (!t) return null;
  if (learned && typeof learned === 'object') {
    for (const key of Object.keys(learned)) {
      if (key.length >= 3 && t.includes(key)) return learned[key];
    }
  }
  for (const [re, cat, ty] of RULES) {
    if (ty !== type) continue;
    if (re.test(t)) return cat;
  }
  return null;
}

/** Remember a manual correction so future entries auto-fill it. */
export function learnMapping(learned, merchant, note, category) {
  const key = String(merchant || note || '').toLowerCase().trim().slice(0, 60);
  if (!key || key.length < 3 || !category) return learned;
  return { ...learned, [key]: category };
}
