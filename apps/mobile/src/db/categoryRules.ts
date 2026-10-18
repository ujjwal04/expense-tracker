import { categorize, type CategoryRule } from "@expense/core";
import type { SQLiteDatabase } from "expo-sqlite";

export async function listCategoryRules(db: SQLiteDatabase): Promise<CategoryRule[]> {
  return db.getAllAsync<CategoryRule>("SELECT pattern, category FROM category_rules");
}

/** Categorizes stored transactions that have no category yet, e.g. ones saved before a rule existed. */
export async function categorizeUncategorized(db: SQLiteDatabase): Promise<void> {
  const userRules = await listCategoryRules(db);
  const uncategorized = await db.getAllAsync<{ id: string; merchant: string }>(
    "SELECT id, merchant FROM transactions WHERE category IS NULL AND merchant IS NOT NULL",
  );
  await db.withTransactionAsync(async () => {
    for (const row of uncategorized) {
      const category = categorize(row.merchant, userRules);
      if (category) await db.runAsync("UPDATE transactions SET category = ? WHERE id = ?", [category, row.id]);
    }
  });
}

/**
 * Saves the rule and applies it to past uncategorized transactions from the same merchant.
 * Returns how many past transactions it categorized.
 */
export async function learnCategoryRule(db: SQLiteDatabase, rule: CategoryRule): Promise<number> {
  let updated = 0;
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO category_rules (pattern, category, created_at) VALUES (?, ?, ?)
       ON CONFLICT (pattern) DO UPDATE SET category = excluded.category`,
      [rule.pattern, rule.category, new Date().toISOString()],
    );
    const uncategorized = await db.getAllAsync<{ id: string; merchant: string }>(
      "SELECT id, merchant FROM transactions WHERE category IS NULL AND merchant IS NOT NULL",
    );
    for (const row of uncategorized) {
      // Only this rule, no defaults: a correction shouldn't recategorize unrelated merchants.
      if (categorize(row.merchant, [rule], []) !== rule.category) continue;
      await db.runAsync("UPDATE transactions SET category = ? WHERE id = ?", [rule.category, row.id]);
      updated++;
    }
  });
  return updated;
}
