const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Builds "YYYY-MM-DD", or null if the day doesn't exist (e.g. 31 Feb). */
export function toIsoDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

/** Parses the date formats Indian banks use in SMS. Numeric dates are always day-first. */
export function parseSmsDate(raw: string): string | null {
  const text = raw.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (iso) return toIsoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const match = /^(\d{1,2})[-/ ]([A-Za-z]{3}|\d{1,2})[-/ ](\d{4}|\d{2})$/.exec(text);
  if (!match) return null;
  const monthRaw = match[2] ?? "";
  const month = /^\d+$/.test(monthRaw) ? Number(monthRaw) : MONTHS.indexOf(monthRaw.toLowerCase()) + 1;
  if (month === 0) return null;
  const yearRaw = match[3] ?? "";
  const year = yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw);
  return toIsoDate(year, month, Number(match[1]));
}

const DATE_IN_TEXT = /\b(\d{4}-\d{2}-\d{2}|\d{1,2}[-/ ](?:[A-Za-z]{3}|\d{1,2})[-/ ](?:\d{4}|\d{2}))\b/g;

/** Returns the first valid date found anywhere in the text. */
export function findDateInText(text: string): string | null {
  for (const match of text.matchAll(DATE_IN_TEXT)) {
    const date = match[1] ? parseSmsDate(match[1]) : null;
    if (date) return date;
  }
  return null;
}

/** The calendar date in India for a given instant. */
export function istDate(instant: Date): string {
  return new Date(instant.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** "2026-10-18" -> "2026-10" */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

/** shiftMonth("2026-01", -1) -> "2025-12" */
export function shiftMonth(month: string, delta: number): string {
  const [year = 0, monthNumber = 1] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + delta, 1)).toISOString().slice(0, 7);
}

export function daysBetween(a: string, b: string): number {
  return Math.abs(Date.parse(a) - Date.parse(b)) / DAY_MS;
}
