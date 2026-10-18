import { transactionFromSms, type Transaction } from "@expense/core";
import type { SQLiteDatabase } from "expo-sqlite";
import { listCategoryRules } from "@/db/categoryRules";
import { getOwnerNames } from "@/db/settings";
import { findStoredDuplicate, insertTransaction, listOwnAccountLast4 } from "@/db/transactions";

export type SmsIngestOutcome =
  | { status: "saved"; transaction: Transaction }
  | { status: "duplicate"; existing: Transaction }
  | { status: "not-a-transaction" };

/** Parse, classify, dedup and store one bank SMS. */
export async function ingestSms(db: SQLiteDatabase, body: string, receivedAt = new Date()): Promise<SmsIngestOutcome> {
  const result = transactionFromSms(
    { body },
    {
      receivedAt,
      ownAccountLast4: await listOwnAccountLast4(db),
      ownerNames: await getOwnerNames(db),
      categoryRules: await listCategoryRules(db),
    },
  );
  if (!result) return { status: "not-a-transaction" };

  const existing = await findStoredDuplicate(db, result.transaction, result.reference, body);
  if (existing) return { status: "duplicate", existing };

  const transaction = await insertTransaction(db, result.transaction, { reference: result.reference, rawText: body });
  return { status: "saved", transaction };
}
