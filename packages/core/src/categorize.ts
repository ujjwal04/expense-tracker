import { normalizeMerchant } from "./dedup";

export const CATEGORIES = [
  "Food",
  "Groceries",
  "Shopping",
  "Travel",
  "Fuel",
  "Bills & Utilities",
  "Rent",
  "Subscriptions",
  "Entertainment",
  "Health",
  "Education",
  "Personal Care",
  "People",
  "Self transfer",
  "Cash",
  "Other",
] as const;

export interface CategoryRule {
  /** A normalized merchant (see normalizeMerchant) or a part of one. */
  pattern: string;
  category: string;
}

/** Common Indian merchants. User rules always win over these. */
export const DEFAULT_RULES: readonly CategoryRule[] = [
  ...rules("Food", ["swiggy", "zomato", "dominos", "mcdonald", "kfc", "starbucks", "pizza hut", "eatsure", "bakers", "bakery", "cafe", "restaurant"]),
  ...rules("Groceries", ["bigbasket", "blinkit", "zepto", "dmart", "jiomart", "instamart", "more retail", "reliance fresh"]),
  ...rules("Shopping", ["amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa", "tata cliq", "decathlon"]),
  ...rules("Travel", ["uber", "ola", "rapido", "irctc", "redbus", "makemytrip", "goibibo", "indigo", "metro", "fastag"]),
  ...rules("Fuel", ["indian oil", "iocl", "bharat petroleum", "bpcl", "hpcl", "hindustan petroleum", "shell"]),
  ...rules("Bills & Utilities", ["airtel", "jio", "vodafone", "bsnl", "electricity", "bescom", "tata power", "adani", "gas", "broadband", "act fibernet"]),
  ...rules("Subscriptions", ["netflix", "spotify", "hotstar", "prime video", "youtube", "apple com bill", "google play"]),
  ...rules("Entertainment", ["bookmyshow", "pvr", "inox", "district"]),
  ...rules("Health", ["apollo", "pharmeasy", "netmeds", "1mg", "practo", "pharmacy", "medical", "hospital", "clinic"]),
  ...rules("Education", ["udemy", "coursera", "byju", "unacademy"]),
  ...rules("Cash", ["atm"]),
];

function rules(category: string, patterns: readonly string[]): CategoryRule[] {
  return patterns.map((pattern) => ({ pattern, category }));
}

/**
 * Rules first (user rules, then defaults), longest match wins so "amazon prime" can beat "amazon".
 * Returns null when nothing matches; the AI gateway handles those later.
 */
export function categorize(
  merchant: string | null,
  userRules: readonly CategoryRule[] = [],
  defaultRules: readonly CategoryRule[] = DEFAULT_RULES,
): string | null {
  if (!merchant) return null;
  const name = ` ${normalizeMerchant(merchant)} `;
  for (const ruleSet of [userRules, defaultRules]) {
    const best = ruleSet
      .filter((rule) => rule.pattern && name.includes(` ${normalizeMerchant(rule.pattern)} `))
      .sort((a, b) => b.pattern.length - a.pattern.length)[0];
    if (best) return best.category;
  }
  return null;
}

/** Turns a user's correction into a rule for this merchant. Null if the merchant has no usable name. */
export function ruleFromCorrection(merchant: string | null, category: string): CategoryRule | null {
  const pattern = merchant ? normalizeMerchant(merchant) : "";
  return pattern ? { pattern, category } : null;
}
