import { istDate, monthOf, type TransactionKind } from "@expense/core";

export function currentMonth(): string {
  return monthOf(istDate(new Date()));
}

/** "2026-10" -> "October 2026" */
export function monthLabel(month: string): string {
  const [year = 0, monthNumber = 1] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "2026-10-08" -> "8 Oct" */
export function dayLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  SAVINGS: "Savings",
  CREDIT_CARD: "Credit card",
  CASH: "Cash",
  WALLET: "Wallet",
};

/** "CREDIT_CARD 9876" (from core's accountKey) -> "Credit card ••9876" */
export function accountLabel(key: string): string {
  const [type = "", last4] = key.split(" ");
  const name = ACCOUNT_TYPE_LABELS[type] ?? type;
  return last4 ? `${name} ••${last4}` : name;
}

export const KIND_LABELS: Record<TransactionKind, string> = {
  EXPENSE: "Expense",
  INCOME: "Income",
  TRANSFER: "Transfer",
  INVESTMENT: "Investment",
  REFUND: "Refund",
};
