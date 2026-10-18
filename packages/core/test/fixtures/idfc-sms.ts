import type { SmsFixture } from "./generic-sms";

// Real IDFC FIRST Bank formats. Account digits, merchant, RRN and balance are replaced.

export const IDFC_UPI_PAYMENT: SmsFixture = {
  name: "IDFC savings UPI payment",
  body: "Your A/c XX1234 debited by Rs. 20.00 on 08/10/26; SHARMA BAKERS credited. RRN 600000000001. Available balance Rs. 50,000.00. Team IDFC FIRST Bank",
  expected: {
    amountPaise: 2000,
    direction: "DEBIT",
    date: "2026-10-08",
    merchant: "SHARMA BAKERS",
    accountLast4: "1234",
    accountType: "SAVINGS",
    channel: "UPI",
    reference: "600000000001",
  },
};

export const IDFC_CARD_PURCHASE: SmsFixture = {
  name: "IDFC credit card purchase",
  body: "Delicious Purchase! INR 281.39 spent on your IDFC FIRST Bank Credit Card ending XX9876 at CAFE BLUE on 15 OCT 2026 at 08:47 PM Avbl Limit: INR 50000.00 If not done by you, call 180010888 for dispute or to block your card SMS CCBLOCK 9876 to 5676732",
  expected: {
    amountPaise: 28139,
    direction: "DEBIT",
    date: "2026-10-15",
    merchant: "CAFE BLUE",
    accountLast4: "9876",
    accountType: "CREDIT_CARD",
    channel: "CARD",
    reference: null,
  },
};

export const IDFC_CARD_BILL_PAID: SmsFixture = {
  name: "IDFC credit card bill payment received",
  body: "Thank you for payment of INR 5,000.00 towards your FIRST Select Credit Card XX9876 on 12 Aug 2026. IDFC FIRST Bank",
  expected: {
    amountPaise: 500000,
    direction: "CREDIT",
    date: "2026-08-12",
    merchant: null,
    accountLast4: "9876",
    accountType: "CREDIT_CARD",
    channel: "OTHER",
    reference: null,
  },
};

export const IDFC_FIXTURES: readonly SmsFixture[] = [IDFC_UPI_PAYMENT, IDFC_CARD_PURCHASE, IDFC_CARD_BILL_PAID];
