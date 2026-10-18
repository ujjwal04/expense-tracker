import { parseSmsDate } from "../dates";
import { parseAmountToPaise } from "../money";
import type { SmsParser } from "./types";

// "Your A/c XX1234 debited by Rs. 20.00 on 08/10/26; SHARMA BAKERS credited. RRN 600000000001. ..."
const SAVINGS_UPI =
  /A\/c\s+[X*]*(\d{4})\s+(debited|credited)\s+by\s+(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s*;\s*(.+?)\s+(?:credited|debited)\.(?:\s*RRN\s+(\w+))?/i;

// "INR 281.39 spent on your IDFC FIRST Bank Credit Card ending XX9876 at CAFE BLUE on 15 OCT 2026 at 08:47 PM ..."
const CARD_PURCHASE =
  /(?:INR|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)\s+spent on your IDFC FIRST Bank Credit Card ending\s+[X*]*(\d{4})\s+at\s+(.+?)\s+on\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/i;

const isIdfc: SmsParser["matches"] = ({ body, sender }) => /idfc/i.test(sender ?? "") || /IDFC FIRST/i.test(body);

/** IDFC FIRST Bank credit card. */
export const idfcCreditCardParser: SmsParser = {
  id: "idfc-credit-card",
  matches: isIdfc,
  parse({ body }) {
    const match = CARD_PURCHASE.exec(body);
    const amountPaise = match?.[1] ? parseAmountToPaise(match[1]) : null;
    if (!match || amountPaise === null) return null;
    return {
      amountPaise,
      direction: "DEBIT",
      date: parseSmsDate(match[4] ?? ""),
      merchant: match[3]?.trim() ?? null,
      accountLast4: match[2] ?? null,
      accountType: "CREDIT_CARD",
      channel: "CARD",
      reference: null,
    };
  },
};

/** IDFC FIRST Bank savings account. */
export const idfcSavingsParser: SmsParser = {
  id: "idfc-savings",
  matches: isIdfc,
  parse({ body }) {
    const match = SAVINGS_UPI.exec(body);
    const amountPaise = match?.[3] ? parseAmountToPaise(match[3]) : null;
    if (!match || amountPaise === null) return null;
    const reference = match[6] ?? null;
    return {
      amountPaise,
      direction: match[2]?.toLowerCase() === "debited" ? "DEBIT" : "CREDIT",
      date: parseSmsDate(match[4] ?? ""),
      merchant: match[5]?.trim() ?? null,
      accountLast4: match[1] ?? null,
      accountType: "SAVINGS",
      // The RRN is the UPI reference number.
      channel: reference ? "UPI" : "OTHER",
      reference,
    };
  },
};
