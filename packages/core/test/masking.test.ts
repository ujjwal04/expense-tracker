import { describe, expect, it } from "vitest";
import { findMaskingIssues, maskSensitive } from "../src";
import { CARD_BILL_PAYMENT, CARD_SWIPE, TRANSACTION_FIXTURES, UPI_PAYMENT } from "./fixtures/generic-sms";

describe("maskSensitive", () => {
  it("keeps only the last 4 digits of long numbers", () => {
    expect(maskSensitive(UPI_PAYMENT.body)).toBe(
      "Rs.250.00 debited from A/c XX4321 on 14-10-26 to VPA swiggy@icici (UPI Ref No XX5678). Not you? Call XX6161",
    );
  });

  it("hides balances and available limits", () => {
    expect(maskSensitive(CARD_BILL_PAYMENT.body)).toContain("Avl Bal [MASKED]");
    expect(maskSensitive(CARD_SWIPE.body)).toContain("Avl Lmt [MASKED]");
  });

  it("keeps the transaction amount and merchant", () => {
    expect(maskSensitive(CARD_SWIPE.body)).toContain("INR 1,499.00 spent on Credit Card XX9876 at AMAZON PAY INDIA");
  });

  it("hides card numbers written with spaces", () => {
    expect(maskSensitive("Card 4111 1111 1111 1234 used")).toBe("Card XX1234 used");
  });

  it("hides emails, greetings and known names", () => {
    expect(maskSensitive("Dear Asha, Rs 500 sent to Asha Rao. Statement sent to asha.rao@mail.com", { names: ["Asha Rao"] })).toBe(
      "Dear [NAME], Rs 500 sent to [NAME]. Statement sent to [EMAIL]",
    );
  });
});

describe("findMaskingIssues", () => {
  it("flags unmasked text", () => {
    expect(findMaskingIssues(CARD_BILL_PAYMENT.body)).toEqual(["LONG_NUMBER", "BALANCE"]);
  });

  it.each(TRANSACTION_FIXTURES)("passes masked $name", ({ body }) => {
    expect(findMaskingIssues(maskSensitive(body))).toEqual([]);
  });
});
