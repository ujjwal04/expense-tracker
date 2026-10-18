import { daysBetween } from "./dates";

export interface DedupCandidate {
  amountPaise: number;
  date: string;
  accountLast4: string | null;
  merchant: string | null;
}

export interface DedupOptions {
  dateWindowDays?: number;
  minMerchantSimilarity?: number;
}

/**
 * The same payment can arrive by SMS, statement and email with slightly different dates and
 * merchant text. Same amount + nearby date + same account + similar merchant = one transaction.
 */
export function isLikelyDuplicate(a: DedupCandidate, b: DedupCandidate, options: DedupOptions = {}): boolean {
  const { dateWindowDays = 2, minMerchantSimilarity = 0.5 } = options;
  if (a.amountPaise !== b.amountPaise) return false;
  if (a.accountLast4 && b.accountLast4 && a.accountLast4 !== b.accountLast4) return false;

  const days = daysBetween(a.date, b.date);
  if (days > dateWindowDays) return false;
  // Without a merchant to compare, only trust an exact date match.
  if (a.merchant === null || b.merchant === null) return days === 0;
  return merchantSimilarity(a.merchant, b.merchant) >= minMerchantSimilarity;
}

export function findDuplicate<T extends DedupCandidate>(
  candidate: DedupCandidate,
  existing: readonly T[],
  options: DedupOptions = {},
): T | undefined {
  return existing.find((other) => isLikelyDuplicate(candidate, other, options));
}

const NOISE_TOKENS = new Set([
  "upi", "pos", "vpa", "payment", "payments", "pvt", "ltd", "private", "limited",
  "india", "in", "com", "www", "the", "technologies", "services",
]);

/** "UPI/628712345678/SWIGGY/Bundl Technologies" -> "swiggy bundl" */
export function normalizeMerchant(name: string): string {
  return name
    .toLowerCase()
    .replace(/@[a-z0-9]+/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token && !NOISE_TOKENS.has(token) && !/^\d+$/.test(token))
    .join(" ");
}

/** 0..1, using containment first and then the Dice coefficient over character bigrams. */
export function merchantSimilarity(a: string, b: string): number {
  const x = normalizeMerchant(a).replace(/ /g, "");
  const y = normalizeMerchant(b).replace(/ /g, "");
  if (!x || !y) return 0;
  const [shorter, longer] = x.length <= y.length ? [x, y] : [y, x];
  if (shorter.length >= 3 && longer.includes(shorter)) return 1;

  const counts = new Map<string, number>();
  for (const gram of bigrams(x)) counts.set(gram, (counts.get(gram) ?? 0) + 1);
  let shared = 0;
  for (const gram of bigrams(y)) {
    const left = counts.get(gram) ?? 0;
    if (left > 0) {
      shared++;
      counts.set(gram, left - 1);
    }
  }
  return (2 * shared) / (x.length - 1 + (y.length - 1) || 1);
}

function bigrams(text: string): string[] {
  const grams: string[] = [];
  for (let i = 0; i < text.length - 1; i++) grams.push(text.slice(i, i + 2));
  return grams;
}
