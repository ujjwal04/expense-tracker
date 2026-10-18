import { describe, expect, it } from "vitest";
import { findDuplicate, isLikelyDuplicate, merchantSimilarity, type DedupCandidate } from "../src";

const fromSms: DedupCandidate = { amountPaise: 25000, date: "2026-10-14", accountLast4: "4321", merchant: "swiggy@icici" };
const fromStatement: DedupCandidate = {
  amountPaise: 25000,
  date: "2026-10-15",
  accountLast4: "4321",
  merchant: "UPI/628712345678/SWIGGY/Bundl Technologies",
};

describe("isLikelyDuplicate", () => {
  it("matches the same payment seen in an SMS and a statement", () => {
    expect(isLikelyDuplicate(fromSms, fromStatement)).toBe(true);
  });

  it("rejects a different amount", () => {
    expect(isLikelyDuplicate(fromSms, { ...fromStatement, amountPaise: 25100 })).toBe(false);
  });

  it("rejects dates outside the window", () => {
    expect(isLikelyDuplicate(fromSms, { ...fromStatement, date: "2026-10-17" })).toBe(false);
  });

  it("rejects a different account", () => {
    expect(isLikelyDuplicate(fromSms, { ...fromStatement, accountLast4: "9876" })).toBe(false);
  });

  it("rejects a different merchant", () => {
    expect(isLikelyDuplicate(fromSms, { ...fromStatement, merchant: "ZOMATO LTD" })).toBe(false);
  });

  it("needs an exact date when a merchant is missing", () => {
    expect(isLikelyDuplicate(fromSms, { ...fromSms, merchant: null })).toBe(true);
    expect(isLikelyDuplicate(fromSms, { ...fromStatement, merchant: null })).toBe(false);
  });
});

describe("findDuplicate", () => {
  it("returns the matching existing transaction", () => {
    const other = { ...fromStatement, amountPaise: 99900, id: "a" };
    const match = { ...fromStatement, id: "b" };
    expect(findDuplicate(fromSms, [other, match])?.id).toBe("b");
  });
});

describe("merchantSimilarity", () => {
  it("scores near-identical names highly", () => {
    expect(merchantSimilarity("AMAZON PAY INDIA", "Amazon Pay India Pvt Ltd")).toBe(1);
    expect(merchantSimilarity("BIGBASKET", "BIG BASKET")).toBe(1);
  });

  it("scores unrelated names low", () => {
    expect(merchantSimilarity("NETFLIX", "UBER")).toBeLessThan(0.5);
  });
});
