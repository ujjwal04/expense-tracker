import { describe, expect, it } from "vitest";
import { classify, findMaskingIssues, maskSensitive, parseSms } from "../src";
import { IDFC_CARD_BILL_PAID, IDFC_CARD_PURCHASE, IDFC_FIXTURES, IDFC_SALARY, IDFC_UPI_PAYMENT } from "./fixtures/idfc-sms";

describe("IDFC FIRST Bank", () => {
  it.each(IDFC_FIXTURES)("parses $name", ({ body, expected }) => {
    const parserId = expected.accountType === "CREDIT_CARD" ? "idfc-credit-card" : "idfc-savings";
    expect(parseSms({ body })).toEqual({ ...expected, parserId });
  });

  it.each([
    { fixture: IDFC_UPI_PAYMENT, kind: "EXPENSE" },
    { fixture: IDFC_CARD_PURCHASE, kind: "EXPENSE" },
    // The swipes are the spend; paying the bill only moves money, so it must not count again.
    { fixture: IDFC_CARD_BILL_PAID, kind: "TRANSFER" },
    { fixture: IDFC_SALARY, kind: "INCOME" },
  ])("classifies $fixture.name as $kind", ({ fixture, kind }) => {
    const parsed = parseSms({ body: fixture.body });
    expect(parsed && classify({ ...parsed, text: fixture.body }).kind).toBe(kind);
  });

  it("masks the RRN and balance before anything leaves the device", () => {
    const masked = maskSensitive(IDFC_UPI_PAYMENT.body);
    expect(masked).toContain("RRN XX0001. Available balance [MASKED].");
    expect(findMaskingIssues(masked)).toEqual([]);
  });

  it("masks the available credit limit", () => {
    const masked = maskSensitive(IDFC_CARD_PURCHASE.body);
    expect(masked).toContain("Avbl Limit [MASKED]");
    expect(findMaskingIssues(masked)).toEqual([]);
  });

  it("masks the new balance and NEFT reference", () => {
    const masked = maskSensitive(IDFC_SALARY.body);
    expect(masked).toContain("New bal [MASKED].");
    expect(findMaskingIssues(masked)).toEqual([]);
  });

  it("leaves non-IDFC messages to the other parsers", () => {
    expect(parseSms({ body: "Rs.500 withdrawn at ATM from A/c XX4321 on 16-10-26." })?.parserId).toBe("generic");
  });
});
