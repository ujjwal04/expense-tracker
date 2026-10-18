import { categorize, type CategoryRule } from "./categorize";
import { classify, isOwnerName, type ClassifyOptions } from "./classify";
import { istDate } from "./dates";
import { parseSms, type RawSms, type SmsParser } from "./parsers";
import type { Transaction } from "./types";

export type NewTransaction = Omit<Transaction, "id">;

export interface SmsIngestOptions extends ClassifyOptions {
  /** Used as the date when the message doesn't contain one. */
  receivedAt: Date;
  parsers?: readonly SmsParser[];
  /** The user's learned rules; built-in defaults apply after these. */
  categoryRules?: readonly CategoryRule[];
}

export interface SmsIngestResult {
  transaction: NewTransaction;
  reference: string | null;
  parserId: string;
}

/** Parse + classify one bank SMS into a transaction ready to store. Null if it isn't a transaction. */
export function transactionFromSms(sms: RawSms, options: SmsIngestOptions): SmsIngestResult | null {
  const parsed = parseSms(sms, options.parsers);
  if (!parsed) return null;
  const { kind, fixed } = classify({ ...parsed, text: sms.body }, options);
  return {
    transaction: {
      amountPaise: parsed.amountPaise,
      direction: parsed.direction,
      kind,
      date: parsed.date ?? istDate(options.receivedAt),
      merchant: parsed.merchant,
      category: isOwnerName(parsed.merchant, options.ownerNames)
        ? "Self transfer"
        : (categorize(parsed.merchant, options.categoryRules) ??
          // An IMPS/NEFT payment to an unknown name is money sent to a person. UPI names are often shops, so not those.
          (kind === "EXPENSE" && parsed.channel === "NETBANKING" && parsed.merchant ? "People" : null)),
      accountType: parsed.accountType,
      accountLast4: parsed.accountLast4,
      channel: parsed.channel,
      source: "SMS",
      fixed,
    },
    reference: parsed.reference,
    parserId: parsed.parserId,
  };
}
