import { describe, expect, it } from "vitest";
import { classify, parseSms, type ClassifyOptions } from "../src";
import * as sms from "./fixtures/generic-sms";

function classifySms(body: string, options?: ClassifyOptions) {
  const parsed = parseSms({ body });
  if (!parsed) throw new Error(`fixture did not parse: ${body}`);
  return classify({ ...parsed, text: body }, options);
}

describe("classify", () => {
  const cases = [
    [sms.UPI_PAYMENT, "EXPENSE", false],
    [sms.CARD_SWIPE, "EXPENSE", false],
    [sms.SUBSCRIPTION_AUTOPAY, "EXPENSE", true],
    [sms.CARD_BILL_PAYMENT, "TRANSFER", false],
    [sms.CARD_PAYMENT_RECEIVED, "TRANSFER", false],
    [sms.ATM_WITHDRAWAL, "EXPENSE", false],
    [sms.SIP_MANDATE, "INVESTMENT", true],
    [sms.SALARY, "INCOME", false],
    [sms.CARD_REFUND, "REFUND", false],
  ] as const;

  it.each(cases.map(([fixture, kind, fixed]) => ({ name: fixture.name, body: fixture.body, kind, fixed })))(
    "$name -> $kind",
    ({ body, kind, fixed }) => {
      expect(classifySms(body)).toEqual({ kind, fixed });
    },
  );

  it("treats wallet top-ups as transfers", () => {
    expect(classifySms("Rs 500.00 debited from A/c XX4321 on 11-10-26 for Paytm wallet top-up.").kind).toBe("TRANSFER");
  });

  describe("self transfers", () => {
    const body = "Rs 3,000.00 debited from A/c XX4321 on 11-10-26 to A/c XX1111 via IMPS.";

    it("is a transfer when the other account is the user's own", () => {
      expect(classifySms(body, { ownAccountLast4: ["4321", "1111"] }).kind).toBe("TRANSFER");
    });

    it("is an expense when the other account belongs to someone else", () => {
      expect(classifySms(body, { ownAccountLast4: ["4321"] }).kind).toBe("EXPENSE");
    });
  });
});
