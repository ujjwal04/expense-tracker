import type { SQLiteDatabase } from "expo-sqlite";

// Append-only: each entry runs once, tracked with SQLite's user_version. Never edit a shipped one.
const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE transactions (
    id TEXT PRIMARY KEY NOT NULL,
    amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
    direction TEXT NOT NULL,
    kind TEXT NOT NULL,
    date TEXT NOT NULL,
    merchant TEXT,
    category TEXT,
    account_type TEXT NOT NULL,
    account_last4 TEXT,
    channel TEXT NOT NULL,
    source TEXT NOT NULL,
    fixed INTEGER NOT NULL DEFAULT 0,
    reference TEXT,
    raw_text TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX idx_transactions_date ON transactions (date);
  CREATE INDEX idx_transactions_amount ON transactions (amount_paise);

  -- The user's own accounts and cards, learned from their SMS; used to detect self transfers.
  CREATE TABLE accounts (
    last4 TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL,
    label TEXT
  );

  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
  `
  -- Learned from the user's category corrections; checked before the built-in rules.
  CREATE TABLE category_rules (
    pattern TEXT PRIMARY KEY NOT NULL,
    category TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  `,
];

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync("PRAGMA journal_mode = WAL;");
  const current = (await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version ?? 0;
  for (const [index, sql] of MIGRATIONS.entries()) {
    if (index < current) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${index + 1}`);
    });
  }
}
