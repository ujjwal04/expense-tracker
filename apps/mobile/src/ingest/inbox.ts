import { File, Paths } from "expo-file-system";
import type { SQLiteDatabase } from "expo-sqlite";
import { z } from "zod";
import { ingestSms } from "@/ingest/sms";

// Written by the "Import Bank SMS" Shortcuts action (plugins/import-sms-intent), one JSON object per line.
const INBOX_NAME = "sms-inbox.jsonl";
const PROCESSING_SUFFIX = ".processing";

const InboxEntrySchema = z.object({
  body: z.string().trim().min(1).max(2000),
  receivedAt: z.iso.datetime({ offset: true }),
});

export interface InboxImportResult {
  saved: number;
  duplicates: number;
}

let running: Promise<InboxImportResult> | null = null;

/**
 * Imports every SMS waiting in the inbox. The file is renamed first, so messages arriving meanwhile
 * go to a fresh inbox instead of being lost. Returns how many were saved and how many were skipped as already recorded.
 * Several screens call this on focus; overlapping calls share one run so no batch is read twice.
 */
export function importSmsInbox(db: SQLiteDatabase): Promise<InboxImportResult> {
  running ??= importPending(db).finally(() => {
    running = null;
  });
  return running;
}

async function importPending(db: SQLiteDatabase): Promise<InboxImportResult> {
  const inbox = new File(Paths.document, INBOX_NAME);
  // move() is async: finish the rename before listing, or this run would miss the batch.
  if (inbox.exists) await inbox.move(new File(Paths.document, `${INBOX_NAME}.${Date.now()}${PROCESSING_SUFFIX}`));

  const result: InboxImportResult = { saved: 0, duplicates: 0 };
  // Includes batches left behind if the app was closed mid-import.
  for (const batch of pendingBatches()) {
    for (const line of (await batch.text()).split("\n")) {
      const entry = parseLine(line);
      if (!entry) continue;
      const outcome = await ingestSms(db, entry.body, new Date(entry.receivedAt));
      if (outcome.status === "saved") result.saved++;
      if (outcome.status === "duplicate") result.duplicates++;
    }
    batch.delete();
  }
  return result;
}

function pendingBatches(): File[] {
  return new File(Paths.document, INBOX_NAME).parentDirectory
    .list()
    .filter((item): item is File => item instanceof File && item.name.endsWith(PROCESSING_SUFFIX))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function parseLine(line: string): z.infer<typeof InboxEntrySchema> | null {
  if (!line.trim()) return null;
  try {
    const result = InboxEntrySchema.safeParse(JSON.parse(line));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
