import { isOwnerName } from "@expense/core";
import type { SQLiteDatabase } from "expo-sqlite";
import { z } from "zod";

const OWNER_NAMES_KEY = "owner_names";
const OwnerNamesSchema = z.array(z.string());

export async function getOwnerNames(db: SQLiteDatabase): Promise<string[]> {
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = ?", [OWNER_NAMES_KEY]);
  if (!row) return [];
  const parsed = OwnerNamesSchema.safeParse(JSON.parse(row.value));
  return parsed.success ? parsed.data : [];
}

/**
 * Saves the user's name(s) and turns past payments to/from them into self transfers.
 * Returns how many past transactions changed.
 */
export async function saveOwnerNames(db: SQLiteDatabase, names: readonly string[]): Promise<number> {
  const cleaned = names.map((name) => name.trim()).filter(Boolean);
  let updated = 0;
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
      [OWNER_NAMES_KEY, JSON.stringify(cleaned)],
    );
    const candidates = await db.getAllAsync<{ id: string; merchant: string }>(
      "SELECT id, merchant FROM transactions WHERE merchant IS NOT NULL AND kind IN ('EXPENSE', 'INCOME')",
    );
    for (const row of candidates) {
      if (!isOwnerName(row.merchant, cleaned)) continue;
      await db.runAsync("UPDATE transactions SET kind = 'TRANSFER', category = 'Self transfer', fixed = 0 WHERE id = ?", [
        row.id,
      ]);
      updated++;
    }
  });
  return updated;
}
