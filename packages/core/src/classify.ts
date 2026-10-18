import type { AccountType, Channel, Direction, TransactionKind } from "./types";

export interface ClassifyInput {
  direction: Direction;
  accountType: AccountType;
  accountLast4: string | null;
  channel: Channel;
  merchant: string | null;
  /** Raw SMS or statement line. */
  text: string;
}

export interface ClassifyOptions {
  /** Last 4 digits of all the user's own accounts and cards, for self-transfer detection. */
  ownAccountLast4?: readonly string[];
}

export interface Classification {
  kind: TransactionKind;
  fixed: boolean;
}

const REFUND = /\b(?:refund(?:ed)?|reversal|reversed)\b/i;
const CARD_BILL_PAYMENT = /credit\s*card\s*(?:bill\s*)?payment|\bcc\s*(?:bill\s*)?pay(?:ment)?\b|card\s*bill|\bcred\b/i;
const CARD_PAYMENT_RECEIVED = /payment\b.*\breceived|received\b.*\bpayment|thank you for (?:the |your )?payment/i;
const INVESTMENT = /\bsip\b|mutual\s*fund|indian clearing corp|\biccl\b|bse star|zerodha|groww|kuvera|\bnps\b|\bppf\b/i;
const WALLET_TOPUP = /\bwallet\b|add(?:ed)? money|top-?up/i;
const SELF_TRANSFER = /\bself\b|own account/i;
const FIXED = /mandate|autopay|auto-?debit|\bnach\b|\becs\b|standing instruction|\bemi\b|subscription/i;

/**
 * Decides whether money leaving an account is real spend. Card bill payments, self transfers,
 * wallet top-ups and ATM withdrawals only move money (TRANSFER), and investments aren't spend,
 * so the card swipes and cash entries are what get counted, never twice.
 */
export function classify(input: ClassifyInput, options: ClassifyOptions = {}): Classification {
  const text = `${input.text} ${input.merchant ?? ""}`;
  const otherAccounts = (options.ownAccountLast4 ?? []).filter((last4) => last4 !== input.accountLast4);

  if (input.direction === "CREDIT") {
    if (input.accountType === "CREDIT_CARD") {
      // A credit on a card is either the bill being paid or money coming back.
      return { kind: CARD_PAYMENT_RECEIVED.test(text) ? "TRANSFER" : "REFUND", fixed: false };
    }
    if (REFUND.test(text)) return { kind: "REFUND", fixed: false };
    if (isSelfTransfer(text, otherAccounts)) return { kind: "TRANSFER", fixed: false };
    return { kind: "INCOME", fixed: false };
  }

  const fixed = input.channel === "AUTOPAY" || FIXED.test(text);
  if (INVESTMENT.test(text)) return { kind: "INVESTMENT", fixed };
  if (input.accountType !== "CREDIT_CARD" && CARD_BILL_PAYMENT.test(text)) return { kind: "TRANSFER", fixed: false };
  if (input.channel === "ATM" || WALLET_TOPUP.test(text) || isSelfTransfer(text, otherAccounts)) {
    return { kind: "TRANSFER", fixed: false };
  }
  return { kind: "EXPENSE", fixed };
}

function isSelfTransfer(text: string, otherAccounts: readonly string[]): boolean {
  return (
    SELF_TRANSFER.test(text) ||
    otherAccounts.some((last4) =>
      new RegExp(String.raw`\b(?:to|from)\s+(?:a\/c|acct|account|card)?\s*[x*]*\d*${last4}\b`, "i").test(text),
    )
  );
}
