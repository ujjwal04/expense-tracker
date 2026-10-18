import { describe, expect, it } from "vitest";
import { parseSms, type SmsParser } from "../src";
import { NON_TRANSACTIONS, TRANSACTION_FIXTURES } from "./fixtures/generic-sms";

describe("parseSms with the generic parser", () => {
  it.each(TRANSACTION_FIXTURES)("parses $name", ({ body, expected }) => {
    expect(parseSms({ body })).toEqual({ ...expected, parserId: "generic" });
  });

  it.each(NON_TRANSACTIONS)("ignores $name", ({ body }) => {
    expect(parseSms({ body })).toBeNull();
  });
});

describe("parser registry", () => {
  const stub = (id: string, amountPaise: number, matches = true): SmsParser => ({
    id,
    matches: () => matches,
    parse: () => ({
      amountPaise,
      direction: "DEBIT",
      date: null,
      merchant: null,
      accountLast4: null,
      accountType: "SAVINGS",
      channel: "OTHER",
      reference: null,
    }),
  });

  it("uses the first matching parser", () => {
    expect(parseSms({ body: "x" }, [stub("skipped", 100, false), stub("bank", 200), stub("later", 300)])).toMatchObject({
      parserId: "bank",
      amountPaise: 200,
    });
  });

  it("falls through when a parser's output fails validation", () => {
    expect(parseSms({ body: "x" }, [stub("broken", 0), stub("fallback", 100)])?.parserId).toBe("fallback");
  });
});
