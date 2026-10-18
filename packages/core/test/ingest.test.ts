import { describe, expect, it } from "vitest";
import { transactionFromSms } from "../src";
import { IDFC_CARD_BILL_PAID, IDFC_UPI_PAYMENT } from "./fixtures/idfc-sms";

const receivedAt = new Date("2026-10-18T20:00:00Z");

describe("transactionFromSms", () => {
  it("builds a classified transaction from a bank SMS", () => {
    expect(transactionFromSms({ body: IDFC_UPI_PAYMENT.body }, { receivedAt })).toEqual({
      transaction: {
        amountPaise: 2000,
        direction: "DEBIT",
        kind: "EXPENSE",
        date: "2026-10-08",
        merchant: "SHARMA BAKERS",
        category: null,
        accountType: "SAVINGS",
        accountLast4: "1234",
        channel: "UPI",
        source: "SMS",
        fixed: false,
      },
      reference: "600000000001",
      parserId: "idfc-savings",
    });
  });

  it("classifies card bill payments as transfers", () => {
    expect(transactionFromSms({ body: IDFC_CARD_BILL_PAID.body }, { receivedAt })?.transaction.kind).toBe("TRANSFER");
  });

  it("falls back to the IST date the message arrived", () => {
    const result = transactionFromSms({ body: "Rs 120.00 debited from A/c XX4321 to VPA chai@okaxis." }, { receivedAt });
    expect(result?.transaction.date).toBe("2026-10-19");
  });

  it("returns null for messages that aren't transactions", () => {
    expect(transactionFromSms({ body: "123456 is your OTP for Rs 500.00" }, { receivedAt })).toBeNull();
  });
});
