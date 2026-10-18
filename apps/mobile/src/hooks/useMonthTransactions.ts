import type { CashMode, Transaction } from "@expense/core";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { AppState } from "react-native";
import { DEFAULT_CASH_MODE, getCashMode } from "@/db/settings";
import { listTransactions } from "@/db/transactions";
import { importSmsInbox, type InboxImportResult } from "@/ingest/inbox";

/**
 * Loads a month's transactions whenever the screen is focused or the app returns to the foreground,
 * first importing any bank SMS the Shortcuts action saved while the app was in the background.
 */
export function useMonthTransactions(month: string): {
  transactions: Transaction[];
  error: string | null;
  /** The last background import that found something, for a short note on screen. */
  lastImport: InboxImportResult | null;
  cashMode: CashMode;
} {
  const db = useSQLiteContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastImport, setLastImport] = useState<InboxImportResult | null>(null);
  const [cashMode, setCashMode] = useState<CashMode>(DEFAULT_CASH_MODE);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = () =>
        importSmsInbox(db)
          .then((imported) => {
            if (active && imported.saved + imported.duplicates > 0) setLastImport(imported);
            return Promise.all([listTransactions(db, month), getCashMode(db)]);
          })
          .then(([rows, mode]) => {
            if (!active) return;
            setTransactions(rows);
            setCashMode(mode);
            setError(null);
          })
          .catch((e: unknown) => {
            if (active) setError(e instanceof Error ? e.message : String(e));
          });

      load();
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") load();
      });
      return () => {
        active = false;
        subscription.remove();
      };
    }, [db, month]),
  );

  return { transactions, error, lastImport, cashMode };
}
