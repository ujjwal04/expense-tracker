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

export const IDFC_FIXTURES: readonly SmsFixture[] = [IDFC_UPI_PAYMENT];
