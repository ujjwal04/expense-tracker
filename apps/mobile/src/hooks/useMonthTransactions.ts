import type { Transaction } from "@expense/core";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { listTransactions } from "@/db/transactions";

/** Reloads whenever the screen comes into focus, so new SMS imports show up immediately. */
export function useMonthTransactions(month: string): { transactions: Transaction[]; error: string | null } {
  const db = useSQLiteContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listTransactions(db, month)
        .then((rows) => {
          if (!active) return;
          setTransactions(rows);
          setError(null);
        })
        .catch((e: unknown) => {
          if (active) setError(e instanceof Error ? e.message : String(e));
        });
      return () => {
        active = false;
      };
    }, [db, month]),
  );

  return { transactions, error };
}
