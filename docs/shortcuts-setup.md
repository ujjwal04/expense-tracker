# iOS Shortcuts setup: import bank SMS automatically

iOS doesn't let apps read SMS. Instead, a Shortcuts automation runs when a bank message arrives and hands
the text to the app's **Import Bank SMS** action. The action runs in the background without opening the
app; the transaction appears the next time you open Expense Tracker.

## Create the automation (once)

1. **Shortcuts** → **Automation** → **+** → **Message**.
2. **Message Contains**: a phrase every transaction SMS from your bank includes, e.g. `IDFC FIRST`.
   Leave **Sender** empty; bank sender IDs (like `AX-IDFCFB`) vary.
3. Choose **Run Automatically** (on older iOS: **Run Immediately**, and turn off **Notify When Run**).
4. Add the action **Import Bank SMS** (search for "Expense Tracker" or "Import Bank SMS").
5. Tap its **Message** field and pick the **Message** variable from the trigger. Done.

## How it works

- `apps/mobile/plugins/import-sms-intent/ImportBankSMSIntent.swift` is an App Intent compiled into the app.
  It appends `{ body, receivedAt }` as a JSON line to `Documents/sms-inbox.jsonl`.
- When the app opens or returns to the foreground, `src/ingest/inbox.ts` renames the inbox, then parses,
  classifies, dedups and stores each message with the shared `@expense/core` code.
- Messages that aren't transactions (OTPs, reminders) are ignored.

## Fallbacks

- **Paste bank SMS** on the home screen imports a message the automation missed.
- The deep link `expensetracker://add?sms=<url-encoded text>` still works, e.g. from an older automation.
