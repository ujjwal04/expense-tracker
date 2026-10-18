import { parseAmountToPaise } from "../money";
import type { AccountType, Channel, Direction } from "../types";

// Building blocks shared by the generic parser and bank-specific parsers.

/** OTPs, upcoming-debit notices and UPI collect requests mention amounts but aren't transactions. */
export const NOT_A_TRANSACTION =
  /\botp\b|one[- ]time password|will be debited|\bis due\b|due (?:on|by)\b|has requested|collect request|request(?:ed)? money/i;

const AMOUNT = /(?:\b(?:rs\.?|inr)|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;

export function extractAmountPaise(text: string): number | null {
  const raw = AMOUNT.exec(text)?.[1];
  return raw ? parseAmountToPaise(raw) : null;
}

const DEBIT_WORDS = /\b(?:debited|spent|paid|sent|withdrawn|purchase)\b/i;
const CREDIT_WORDS = /\b(?:credited|received|refund(?:ed)?|reversed|deposited)\b/i;

/** Whichever keyword comes first wins: debit SMS often end with "...; Merchant credited". */
export function extractDirection(text: string): Direction | null {
  const debitAt = DEBIT_WORDS.exec(text)?.index ?? Infinity;
  const creditAt = CREDIT_WORDS.exec(text)?.index ?? Infinity;
  if (debitAt === Infinity && creditAt === Infinity) return null;
  return debitAt < creditAt ? "DEBIT" : "CREDIT";
}

const ACCOUNT =
  /\b(credit\s*card|debit\s*card|card|a\/c|acct|account)\b\.?\s*(?:no\.?\s*)?(?:ending\s*(?:with|in)?\s*)?[x*\d]*?(\d{4})\b/i;

export function extractAccount(text: string): { last4: string | null; accountType: AccountType } {
  const match = ACCOUNT.exec(text);
  return {
    last4: match?.[2] ?? null,
    accountType: match?.[1] && /credit/i.test(match[1]) ? "CREDIT_CARD" : "SAVINGS",
  };
}

export function extractChannel(text: string, accountType: AccountType): Channel {
  if (/mandate|autopay|auto-?debit|\bnach\b|\becs\b|standing instruction/i.test(text)) return "AUTOPAY";
  if (/\batm\b|withdrawn/i.test(text)) return "ATM";
  if (/\bupi\b|\bvpa\b/i.test(text)) return "UPI";
  if (accountType === "CREDIT_CARD" || /debit\s*card|\bpos\b|\bspent\b/i.test(text)) return "CARD";
  if (/\b(?:neft|imps|rtgs)\b|net\s*banking/i.test(text)) return "NETBANKING";
  return "OTHER";
}

const VPA = /\b([\w.-]+@[a-z][a-z0-9]*)\b(?!\.)/i;
const NAME = String.raw`([A-Za-z0-9][^;,()\n]*?)`;
const STOP = String.raw`(?=\s+(?:on|via|ref|upi|txn|from|using|avl|dated|is|for)\b|\s*[;,(]|\.(?:\s|$)|$)`;
const after = (keyword: string) => new RegExp(String.raw`\b${keyword}\s+${NAME}${STOP}`, "i");

const DEBIT_COUNTERPARTY = [after(String.raw`to(?!\s+your\b)`), after("towards"), after("at"), after("for")];
const CREDIT_COUNTERPARTY = [after("from"), after("by")];

/** The other side of the transaction: merchant for debits, payer for credits. */
export function extractMerchant(text: string, direction: Direction): string | null {
  const vpa = VPA.exec(text)?.[1];
  if (vpa) return vpa;
  for (const pattern of direction === "DEBIT" ? DEBIT_COUNTERPARTY : CREDIT_COUNTERPARTY) {
    const name = pattern.exec(text)?.[1]?.trim().replace(/\s+/g, " ");
    if (name) return name.slice(0, 60);
  }
  return null;
}

const REFERENCE = /\b(?:ref(?:erence)?|rrn|utr|txn\s*id)\b\.?\s*(?:no\.?|id|#)?\s*[:.]?\s*([A-Za-z0-9]{6,})/i;

export function extractReference(text: string): string | null {
  return REFERENCE.exec(text)?.[1] ?? null;
}
