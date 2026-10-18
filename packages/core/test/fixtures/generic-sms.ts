import type { ParsedSms } from "../../src";

// Synthetic messages in the common Indian bank format. Bank-specific fixtures
// (starting with IDFC FIRST) are added once real masked samples are available.

export interface SmsFixture {
  name: string;
  body: string;
  expected: ParsedSms;
}

export const UPI_PAYMENT: SmsFixture = {
  name: "UPI payment to a merchant VPA",
  body: "Rs.250.00 debited from A/c XX4321 on 14-10-26 to VPA swiggy@icici (UPI Ref No 628712345678). Not you? Call 18002586161",
  expected: {
    amountPaise: 25000,
    direction: "DEBIT",
    date: "2026-10-14",
    merchant: "swiggy@icici",
    accountLast4: "4321",
    accountType: "SAVINGS",
    channel: "UPI",
    reference: "628712345678",
  },
};

export const CARD_SWIPE: SmsFixture = {
  name: "credit card purchase",
  body: "INR 1,499.00 spent on Credit Card XX9876 at AMAZON PAY INDIA on 12-Oct-26. Avl Lmt: INR 48,501.00",
  expected: {
    amountPaise: 149900,
    direction: "DEBIT",
    date: "2026-10-12",
    merchant: "AMAZON PAY INDIA",
    accountLast4: "9876",
    accountType: "CREDIT_CARD",
    channel: "CARD",
    reference: null,
  },
};

export const CARD_BILL_PAYMENT: SmsFixture = {
  name: "credit card bill paid from savings",
  body: "Rs 10,000.00 debited from A/c XX4321 on 05/10/2026 towards CREDIT CARD PAYMENT Ref 9988776655. Avl Bal Rs 25,000.00",
  expected: {
    amountPaise: 1000000,
    direction: "DEBIT",
    date: "2026-10-05",
    merchant: "CREDIT CARD PAYMENT",
    accountLast4: "4321",
    accountType: "SAVINGS",
    channel: "OTHER",
    reference: "9988776655",
  },
};

export const SALARY: SmsFixture = {
  name: "salary credit by NEFT",
  body: "Your A/c XX4321 is credited with Rs.45,000.00 on 01-10-26 by NEFT from ACME TECH PVT LTD. Avl Bal: Rs.70,000.00",
  expected: {
    amountPaise: 4500000,
    direction: "CREDIT",
    date: "2026-10-01",
    merchant: "ACME TECH PVT LTD",
    accountLast4: "4321",
    accountType: "SAVINGS",
    channel: "NETBANKING",
    reference: null,
  },
};

export const SIP_MANDATE: SmsFixture = {
  name: "SIP debit by e-mandate",
  body: "Rs 2,000.00 debited from A/c XX4321 on 10-10-26 for e-Mandate SIP to Indian Clearing Corp.",
  expected: {
    amountPaise: 200000,
    direction: "DEBIT",
    date: "2026-10-10",
    merchant: "Indian Clearing Corp",
    accountLast4: "4321",
    accountType: "SAVINGS",
    channel: "AUTOPAY",
    reference: null,
  },
};

export const SUBSCRIPTION_AUTOPAY: SmsFixture = {
  name: "subscription autopay",
  body: "Rs.649.00 debited via AutoPay/e-mandate from A/c XX4321 on 08-10-26 to NETFLIX.",
  expected: {
    amountPaise: 64900,
    direction: "DEBIT",
    date: "2026-10-08",
    merchant: "NETFLIX",
    accountLast4: "4321",
    accountType: "SAVINGS",
    channel: "AUTOPAY",
    reference: null,
  },
};

export const CARD_REFUND: SmsFixture = {
  name: "refund on credit card",
  body: "Refund of Rs 300.00 credited to your Credit Card XX9876 on 15-10-26 from MYNTRA.",
  expected: {
    amountPaise: 30000,
    direction: "CREDIT",
    date: "2026-10-15",
    merchant: "MYNTRA",
    accountLast4: "9876",
    accountType: "CREDIT_CARD",
    channel: "CARD",
    reference: null,
  },
};

export const CARD_PAYMENT_RECEIVED: SmsFixture = {
  name: "bill payment received on credit card",
  body: "Payment of Rs 10,000.00 received on your Credit Card XX9876 on 06-10-26. Thank you.",
  expected: {
    amountPaise: 1000000,
    direction: "CREDIT",
    date: "2026-10-06",
    merchant: null,
    accountLast4: "9876",
    accountType: "CREDIT_CARD",
    channel: "CARD",
    reference: null,
  },
};

export const ATM_WITHDRAWAL: SmsFixture = {
  name: "ATM cash withdrawal",
  body: "Rs.500 withdrawn at ATM from A/c XX4321 on 16-10-26.",
  expected: {
    amountPaise: 50000,
    direction: "DEBIT",
    date: "2026-10-16",
    merchant: "ATM",
    accountLast4: "4321",
    accountType: "SAVINGS",
    channel: "ATM",
    reference: null,
  },
};

export const TRANSACTION_FIXTURES: readonly SmsFixture[] = [
  UPI_PAYMENT,
  CARD_SWIPE,
  CARD_BILL_PAYMENT,
  SALARY,
  SIP_MANDATE,
  SUBSCRIPTION_AUTOPAY,
  CARD_REFUND,
  CARD_PAYMENT_RECEIVED,
  ATM_WITHDRAWAL,
];

/** Mention money but must not become transactions. */
export const NON_TRANSACTIONS: readonly { name: string; body: string }[] = [
  { name: "OTP", body: "123456 is your OTP for txn of Rs 500.00 at AMAZON. Do not share." },
  { name: "upcoming mandate notice", body: "Rs 649.00 will be debited from A/c XX4321 on 08-11-26 towards NETFLIX e-mandate." },
  { name: "UPI collect request", body: "JOHN has requested money of Rs 200.00 from you via UPI." },
  { name: "loan promo", body: "Get a pre-approved loan of Rs 5,00,000 today!" },
];
