import { describe, expect, it } from "vitest";
import { classify, findMaskingIssues, maskSensitive, parseSms } from "../src";
import { IDFC_FIXTURES, IDFC_UPI_PAYMENT } from "./fixtures/idfc-sms";

describe("IDFC FIRST Bank", () => {
  it.each(IDFC_FIXTURES)("parses $name", ({ body, expected }) => {
    expect(parseSms({ body })).toEqual({ ...expected, parserId: "idfc-savings" });
  });

  it("classifies a UPI payment as an expense", () => {
    const parsed = parseSms({ body: IDFC_UPI_PAYMENT.body });
    expect(parsed && classify({ ...parsed, text: IDFC_UPI_PAYMENT.body }).kind).toBe("EXPENSE");
  });

  it("masks the RRN and balance before anything leaves the device", () => {
    const masked = maskSensitive(IDFC_UPI_PAYMENT.body);
    expect(masked).toContain("RRN XX0001. Available balance [MASKED].");
    expect(findMaskingIssues(masked)).toEqual([]);
  });

  it("leaves non-IDFC messages to the other parsers", () => {
    expect(parseSms({ body: "Rs.500 withdrawn at ATM from A/c XX4321 on 16-10-26." })?.parserId).toBe("generic");
  });
});
