/** Converts "1,23,456.7" style rupee strings to integer paise. Returns null if not a plain amount. */
export function parseAmountToPaise(raw: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(raw.replace(/,/g, "").trim());
  if (!match?.[1]) return null;
  const rupees = Number(match[1]);
  const paise = Number((match[2] ?? "").padEnd(2, "0"));
  return rupees * 100 + paise;
}

const inrFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

/** Display only; never feed the result back into calculations. */
export function formatInr(paise: number): string {
  return inrFormatter.format(paise / 100);
}
