import { parseSmsDate } from "../dates";
import { parseAmountToPaise } from "../money";
import type { Channel } from "../types";
import type { SmsParser } from "./types";

// "Your A/c XX1234 debited by Rs. 20.00 on 08/10/26; SHARMA BAKERS credited. RRN 600000000001. ..."
const SAVINGS_UPI =
  /A\/c\s+[X*]*(\d{4})\s+(debited|credited)\s+by\s+(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s*;\s*(.+?)\s+(?:credited|debited)\.(?:\s*RRN\s+(\w+))?/i;

// "Your A/c XXXXXXX1234 has been credited with Rs. 85,000.00 on 30-09-2026. Info: NEFT/ABCD12345678901/ACME TECH PL."
const SAVINGS_INFO =
  /A\/c\s+[X*]*(\d{4})\s+has been\s+(debited|credited)\s+with\s+(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s+on\s+(\d{1,2}-\d{1,2}-\d{2,4})\.\s*Info:\s*([^\n]+?)\.?\s*(?:\n|New bal\b|Team\b|$)/i;

// "INR 281.39 spent on your IDFC FIRST Bank Credit Card ending XX9876 at CAFE BLUE on 15 OCT 2026 at 08:47 PM ..."
const CARD_PURCHASE =
  /(?:INR|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)\s+spent on your IDFC FIRST Bank Credit Card ending\s+[X*]*(\d{4})\s+at\s+(.+?)\s+on\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/i;

// "Thank you for payment of INR 5,000.00 towards your FIRST Select Credit Card XX9876 on 12 Aug 2026."
const CARD_BILL_PAID =
  /payment of\s+(?:INR|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)\s+towards your\b.*?Credit Card\s+[X*]*(\d{4})\s+on\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/i;

const isIdfc: SmsParser["matches"] = ({ body, sender }) => /idfc/i.test(sender ?? "") || /IDFC FIRST/i.test(body);

/** IDFC FIRST Bank credit card: purchases and bill payments received. */
export const idfcCreditCardParser: SmsParser = {
  id: "idfc-credit-card",
  matches: isIdfc,
  parse({ body }) {
    const purchase = CARD_PURCHASE.exec(body);
    const purchasePaise = purchase?.[1] ? parseAmountToPaise(purchase[1]) : null;
    if (purchase && purchasePaise !== null) {
      return {
        amountPaise: purchasePaise,
        direction: "DEBIT",
        date: parseSmsDate(purchase[4] ?? ""),
        merchant: purchase[3]?.trim() ?? null,
        accountLast4: purchase[2] ?? null,
        accountType: "CREDIT_CARD",
        channel: "CARD",
        reference: null,
      };
    }

    const payment = CARD_BILL_PAID.exec(body);
    const paymentPaise = payment?.[1] ? parseAmountToPaise(payment[1]) : null;
    if (payment && paymentPaise !== null) {
      return {
        amountPaise: paymentPaise,
        direction: "CREDIT",
        date: parseSmsDate(payment[3] ?? ""),
        merchant: null,
        accountLast4: payment[2] ?? null,
        accountType: "CREDIT_CARD",
        channel: "OTHER",
        reference: null,
      };
    }
    return null;
  },
};

/** IDFC FIRST Bank savings account. */
export const idfcSavingsParser: SmsParser = {
  id: "idfc-savings",
  matches: isIdfc,
  parse({ body }) {
    const upi = SAVINGS_UPI.exec(body);
    const upiPaise = upi?.[3] ? parseAmountToPaise(upi[3]) : null;
    if (upi && upiPaise !== null) {
      const reference = upi[6] ?? null;
      return {
        amountPaise: upiPaise,
        direction: upi[2]?.toLowerCase() === "debited" ? "DEBIT" : "CREDIT",
        date: parseSmsDate(upi[4] ?? ""),
        merchant: upi[5]?.trim() ?? null,
        accountLast4: upi[1] ?? null,
        accountType: "SAVINGS",
        // The RRN is the UPI reference number.
        channel: reference ? "UPI" : "OTHER",
        reference,
      };
    }

    const info = SAVINGS_INFO.exec(body);
    const infoPaise = info?.[3] ? parseAmountToPaise(info[3]) : null;
    if (info && infoPaise !== null) {
      // "NEFT/ABCD12345678901/ACME TECH PL" -> channel / reference / counterparty
      const [method = "", reference, ...name] = (info[5] ?? "").split("/").map((part) => part.trim());
      const hasParts = reference !== undefined;
      return {
        amountPaise: infoPaise,
        direction: info[2]?.toLowerCase() === "debited" ? "DEBIT" : "CREDIT",
        date: parseSmsDate(info[4] ?? ""),
        merchant: (hasParts ? name.join("/") : method) || null,
        accountLast4: info[1] ?? null,
        accountType: "SAVINGS",
        channel: hasParts ? methodChannel(method) : "OTHER",
        reference: hasParts && reference ? reference : null,
      };
    }
    return null;
  },
};

function methodChannel(method: string): Channel {
  if (/^upi$/i.test(method)) return "UPI";
  if (/^(?:neft|imps|rtgs)$/i.test(method)) return "NETBANKING";
  return "OTHER";
}
