import { TransactionSchema, findDuplicate, type NewTransaction, type Transaction } from "@expense/core";
import { randomUUID } from "expo-crypto";
import type { SQLiteDatabase } from "expo-sqlite";

interface TransactionRow {
  id: string;
  amount_paise: number;
  direction: string;
  kind: string;
  date: string;
  merchant: string | null;
  category: string | null;
  account_type: string;
  account_last4: string | null;
  channel: string;
  source: string;
  fixed: number;
}

const COLUMNS =
  "id, amount_paise, direction, kind, date, merchant, category, account_type, account_last4, channel, source, fixed";

/** Rows are validated on the way out, so a bad row fails loudly instead of skewing totals. */
function fromRow(row: TransactionRow): Transaction {
  return TransactionSchema.parse({
    id: row.id,
    amountPaise: row.amount_paise,
    direction: row.direction,
    kind: row.kind,
    date: row.date,
    merchant: row.merchant,
    category: row.category,
    accountType: row.account_type,
    accountLast4: row.account_last4,
    channel: row.channel,
    source: row.source,
    fixed: row.fixed === 1,
  });
}

export interface StoredExtras {
  reference?: string | null;
  /** Original SMS/statement text, kept on device for re-parsing. */
  rawText?: string | null;
}

export async function insertTransaction(
  db: SQLiteDatabase,
  t: NewTransaction,
  extras: StoredExtras = {},
): Promise<Transaction> {
  const id = randomUUID();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO transactions (${COLUMNS}, reference, raw_text, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        t.amountPaise,
        t.direction,
        t.kind,
        t.date,
        t.merchant,
        t.category,
        t.accountType,
        t.accountLast4,
        t.channel,
        t.source,
        t.fixed ? 1 : 0,
        extras.reference ?? null,
        extras.rawText ?? null,
        new Date().toISOString(),
      ],
    );
    if (t.accountLast4) {
      await db.runAsync("INSERT OR IGNORE INTO accounts (last4, type) VALUES (?, ?)", [t.accountLast4, t.accountType]);
    }
  });
  return { id, ...t };
}

/** month is "YYYY-MM"; newest first. */
export async function listTransactions(db: SQLiteDatabase, month: string): Promise<Transaction[]> {
  const rows = await db.getAllAsync<TransactionRow>(
    `SELECT ${COLUMNS} FROM transactions WHERE date LIKE ? ORDER BY date DESC, created_at DESC`,
    [`${month}-%`],
  );
  return rows.map(fromRow);
}

/** An already-stored copy of the same payment: same bank reference, or a dedup match nearby. */
export async function findStoredDuplicate(
  db: SQLiteDatabase,
  t: NewTransaction,
  reference: string | null,
): Promise<Transaction | undefined> {
  if (reference) {
    const row = await db.getFirstAsync<TransactionRow>(`SELECT ${COLUMNS} FROM transactions WHERE reference = ?`, [
      reference,
    ]);
    if (row) return fromRow(row);
  }
  const nearby = await db.getAllAsync<TransactionRow>(
    `SELECT ${COLUMNS} FROM transactions
     WHERE amount_paise = ? AND date BETWEEN date(?, '-2 days') AND date(?, '+2 days')`,
    [t.amountPaise, t.date, t.date],
  );
  return findDuplicate(t, nearby.map(fromRow));
}

export async function listOwnAccountLast4(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ last4: string }>("SELECT last4 FROM accounts");
  return rows.map((row) => row.last4);
}
