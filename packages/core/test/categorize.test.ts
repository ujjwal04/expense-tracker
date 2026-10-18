import { describe, expect, it } from "vitest";
import { categorize, ruleFromCorrection, transactionFromSms } from "../src";
import { IDFC_UPI_PAYMENT } from "./fixtures/idfc-sms";

describe("categorize", () => {
  it.each([
    ["swiggy@icici", "Food"],
    ["AMAZON PAY INDIA", "Shopping"],
    ["UBER INDIA SYSTEMS", "Travel"],
    ["NETFLIX", "Subscriptions"],
    ["SHARMA BAKERS", "Food"],
    ["ATM", "Cash"],
  ])("%s -> %s", (merchant, category) => {
    expect(categorize(merchant)).toBe(category);
  });

  it("matches whole words only", () => {
    // "ola" must not match inside "cola" or "kolar".
    expect(categorize("COCA COLA STORE")).toBeNull();
    expect(categorize("KOLAR TRADERS")).toBeNull();
  });

  it("returns null for unknown merchants", () => {
    expect(categorize("RAHUL KUMAR")).toBeNull();
    expect(categorize(null)).toBeNull();
  });

  it("prefers user rules over defaults", () => {
    expect(categorize("AMAZON PAY INDIA", [{ pattern: "amazon pay", category: "Bills & Utilities" }])).toBe(
      "Bills & Utilities",
    );
  });

  it("prefers the longest matching rule", () => {
    const userRules = [
      { pattern: "amazon", category: "Shopping" },
      { pattern: "amazon prime", category: "Subscriptions" },
    ];
    expect(categorize("AMAZON PRIME", userRules)).toBe("Subscriptions");
  });
});

describe("ruleFromCorrection", () => {
  it("learns a rule that categorizes the same merchant next time", () => {
    const rule = ruleFromCorrection("rahul.kumar@okaxis", "People");
    expect(rule).toEqual({ pattern: "rahul kumar", category: "People" });
    expect(categorize("RAHUL KUMAR", rule ? [rule] : [])).toBe("People");
  });

  it("can't learn from a missing merchant", () => {
    expect(ruleFromCorrection(null, "Food")).toBeNull();
  });
});

it("categorizes SMS as they're ingested", () => {
  const result = transactionFromSms({ body: IDFC_UPI_PAYMENT.body }, { receivedAt: new Date() });
  expect(result?.transaction.category).toBe("Food");
});
