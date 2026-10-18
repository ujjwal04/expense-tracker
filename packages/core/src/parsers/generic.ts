import { findDateInText } from "../dates";
import {
  NOT_A_TRANSACTION,
  extractAccount,
  extractAmountPaise,
  extractChannel,
  extractDirection,
  extractMerchant,
  extractReference,
} from "./extract";
import type { SmsParser } from "./types";

/** Fallback for any bank that writes the usual "Rs X debited from A/c XX1234 ..." style. */
export const genericParser: SmsParser = {
  id: "generic",
  matches: () => true,
  parse({ body }) {
    if (NOT_A_TRANSACTION.test(body)) return null;
    const amountPaise = extractAmountPaise(body);
    const direction = extractDirection(body);
    if (amountPaise === null || direction === null) return null;

    const { last4, accountType } = extractAccount(body);
    return {
      amountPaise,
      direction,
      date: findDateInText(body),
      merchant: extractMerchant(body, direction),
      accountLast4: last4,
      accountType,
      channel: extractChannel(body, accountType),
      reference: extractReference(body),
    };
  },
};
