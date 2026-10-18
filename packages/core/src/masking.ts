// Privacy guard: text only leaves the device after maskSensitive, and the gateway
// re-checks it with findMaskingIssues before calling the LLM.

export interface MaskOptions {
  /** The user's own name(s); bank messages sometimes include them. */
  names?: readonly string[];
}

export type MaskingIssue = "LONG_NUMBER" | "EMAIL" | "BALANCE";

const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const BALANCE =
  /\b((?:avl|avbl|avail(?:able)?)\.?\s*(?:bal(?:ance)?|lmt|limit)|bal(?:ance)?|credit\s*limit)\b\.?\s*(?:is\s*)?[:-]?\s*(?:(?:rs\.?|inr)\s*|₹\s*)?[\d,]+(?:\.\d{1,2})?/gi;
/** 9+ digits, possibly spaced or dashed: account, card, phone and reference numbers. */
const LONG_NUMBER = /\d(?:[ -]?\d){8,}/g;
const GREETING = /\b(dear|hi|hello)\s+[A-Za-z]+/gi;

export function maskSensitive(text: string, options: MaskOptions = {}): string {
  let masked = text;
  for (const name of options.names ?? []) {
    if (name.trim()) masked = masked.replace(new RegExp(escapeRegExp(name.trim()), "gi"), "[NAME]");
  }
  return masked
    .replace(EMAIL, "[EMAIL]")
    .replace(BALANCE, "$1 [MASKED]")
    .replace(LONG_NUMBER, (digits) => `XX${digits.replace(/\D/g, "").slice(-4)}`)
    .replace(GREETING, "$1 [NAME]");
}

/** Empty when the text is safe to send. Names can't be detected here, only on device. */
export function findMaskingIssues(text: string): MaskingIssue[] {
  const issues: MaskingIssue[] = [];
  if (new RegExp(LONG_NUMBER.source).test(text)) issues.push("LONG_NUMBER");
  if (new RegExp(EMAIL.source).test(text)) issues.push("EMAIL");
  if (new RegExp(BALANCE.source, "i").test(text)) issues.push("BALANCE");
  return issues;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
