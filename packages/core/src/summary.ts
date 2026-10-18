import { monthOf } from "./dates";
import type { Transaction } from "./types";

export const UNCATEGORIZED = "Uncategorized";

export interface MonthlySummary {
  month: string;
  /** What the user actually spent: expenses (incl. cash) minus refunds. */
  spendPaise: number;
  fixedPaise: number;
  variablePaise: number;
  refundsPaise: number;
  byCategory: Record<string, number>;
  byAccount: Record<string, number>;
  /** Money that moved but isn't spend, shown for transparency. */
  excluded: { incomePaise: number; transfersPaise: number; investmentsPaise: number };
}

/**
 * Monthly spend = bank debits + card swipes − card bill payments − self transfers − investments (+ cash).
 * Classification has already marked bill payments, transfers and investments, so this is
 * the sum of EXPENSE minus REFUND.
 */
export function summarizeMonth(transactions: readonly Transaction[], month: string): MonthlySummary {
  const summary: MonthlySummary = {
    month,
    spendPaise: 0,
    fixedPaise: 0,
    variablePaise: 0,
    refundsPaise: 0,
    byCategory: {},
    byAccount: {},
    excluded: { incomePaise: 0, transfersPaise: 0, investmentsPaise: 0 },
  };

  const addSpend = (t: Transaction, signedPaise: number) => {
    summary.spendPaise += signedPaise;
    if (t.fixed) summary.fixedPaise += signedPaise;
    else summary.variablePaise += signedPaise;
    bump(summary.byCategory, t.category ?? UNCATEGORIZED, signedPaise);
    bump(summary.byAccount, accountKey(t), signedPaise);
  };

  for (const t of transactions) {
    if (monthOf(t.date) !== month) continue;
    switch (t.kind) {
      case "EXPENSE":
        addSpend(t, t.amountPaise);
        break;
      case "REFUND":
        summary.refundsPaise += t.amountPaise;
        addSpend(t, -t.amountPaise);
        break;
      case "INCOME":
        summary.excluded.incomePaise += t.amountPaise;
        break;
      case "TRANSFER":
        summary.excluded.transfersPaise += t.amountPaise;
        break;
      case "INVESTMENT":
        summary.excluded.investmentsPaise += t.amountPaise;
        break;
    }
  }
  return summary;
}

/** "CREDIT_CARD 9876", or just "CASH" for accounts without a number. */
export function accountKey(t: Pick<Transaction, "accountType" | "accountLast4">): string {
  return t.accountLast4 ? `${t.accountType} ${t.accountLast4}` : t.accountType;
}

function bump(totals: Record<string, number>, key: string, paise: number): void {
  totals[key] = (totals[key] ?? 0) + paise;
}
