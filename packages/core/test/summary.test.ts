import { describe, expect, it } from "vitest";
import { summarizeMonth, type Transaction } from "../src";

let nextId = 0;
function txn(overrides: Partial<Transaction> & Pick<Transaction, "amountPaise" | "kind">): Transaction {
  return {
    id: String(++nextId),
    direction: overrides.kind === "INCOME" || overrides.kind === "REFUND" ? "CREDIT" : "DEBIT",
    date: "2026-10-10",
    merchant: null,
    category: null,
    accountType: "SAVINGS",
    accountLast4: "4321",
    channel: "UPI",
    source: "SMS",
    fixed: false,
    ...overrides,
  };
}

const card = { accountType: "CREDIT_CARD", accountLast4: "9876", channel: "CARD" } as const;

describe("summarizeMonth", () => {
  const october = [
    txn({ amountPaise: 6_000_00, kind: "EXPENSE", category: "Shopping", ...card }),
    txn({ amountPaise: 4_000_00, kind: "EXPENSE", category: "Food", ...card }),
    txn({ amountPaise: 10_000_00, kind: "TRANSFER" }), // card bill paid from savings
    txn({ amountPaise: 500_00, kind: "EXPENSE", category: "Food" }),
    txn({ amountPaise: 649_00, kind: "EXPENSE", category: "Subscriptions", fixed: true, channel: "AUTOPAY" }),
    txn({ amountPaise: 2_000_00, kind: "INVESTMENT", fixed: true }),
    txn({ amountPaise: 3_000_00, kind: "TRANSFER" }), // to own account
    txn({ amountPaise: 200_00, kind: "EXPENSE", category: "Food", accountType: "CASH", accountLast4: null, channel: "CASH" }),
    txn({ amountPaise: 1_000_00, kind: "REFUND", category: "Shopping", ...card }),
    txn({ amountPaise: 45_000_00, kind: "INCOME" }),
    txn({ amountPaise: 2_000_00, kind: "EXPENSE", category: "Cash", channel: "ATM" }),
  ];
  const september = txn({ amountPaise: 99_999_00, kind: "EXPENSE", date: "2026-09-30" });
  const transactions = [...october, september];

  describe("counting ATM withdrawals as spend (default)", () => {
    const summary = summarizeMonth(transactions, "2026-10");

    it("counts card swipes, debits and withdrawals once, minus refunds", () => {
      // 6000 + 4000 + 500 + 649 + 2000 - 1000
      expect(summary.spendPaise).toBe(12_149_00);
      expect(summary.refundsPaise).toBe(1_000_00);
    });

    it("splits fixed and variable spend", () => {
      expect(summary.fixedPaise).toBe(649_00);
      expect(summary.variablePaise).toBe(11_500_00);
    });

    it("groups by category and account", () => {
      expect(summary.byCategory).toEqual({ Shopping: 5_000_00, Food: 4_500_00, Subscriptions: 649_00, Cash: 2_000_00 });
      expect(summary.byAccount).toEqual({ "CREDIT_CARD 9876": 9_000_00, "SAVINGS 4321": 3_149_00 });
    });

    it("shows cash entries as a breakdown without adding them again", () => {
      expect(summary.cashBreakdown).toEqual({ Food: 200_00 });
    });

    it("reports money that moved but isn't spend", () => {
      expect(summary.excluded).toEqual({ incomePaise: 45_000_00, transfersPaise: 13_000_00, investmentsPaise: 2_000_00 });
    });
  });

  describe("counting cash entries as spend", () => {
    const summary = summarizeMonth(transactions, "2026-10", { cashMode: "ENTRIES" });

    it("counts each cash entry and treats the withdrawal as a transfer", () => {
      // 6000 + 4000 + 500 + 649 + 200 - 1000
      expect(summary.spendPaise).toBe(10_349_00);
      expect(summary.excluded.transfersPaise).toBe(15_000_00);
    });

    it("groups cash entries with everything else", () => {
      expect(summary.byCategory).toEqual({ Shopping: 5_000_00, Food: 4_700_00, Subscriptions: 649_00 });
      expect(summary.byAccount).toEqual({ "CREDIT_CARD 9876": 9_000_00, "SAVINGS 4321": 1_149_00, CASH: 200_00 });
      expect(summary.cashBreakdown).toEqual({});
    });
  });
});
