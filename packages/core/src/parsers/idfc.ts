import { parseSmsDate } from "../dates";
import { parseAmountToPaise } from "../money";
import type { SmsParser } from "./types";

// "Your A/c XX1234 debited by Rs. 20.00 on 08/10/26; SHARMA BAKERS credited. RRN 600000000001. ..."
const SAVINGS_UPI =
  /A\/c\s+[X*]*(\d{4})\s+(debited|credited)\s+by\s+(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s*;\s*(.+?)\s+(?:credited|debited)\.(?:\s*RRN\s+(\w+))?/i;

/** IDFC FIRST Bank savings account. */
export const idfcSavingsParser: SmsParser = {
  id: "idfc-savings",
  matches: ({ body, sender }) => /idfc/i.test(sender ?? "") || /IDFC FIRST/i.test(body),
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
