# iOS Shortcuts setup: import bank SMS automatically

iOS doesn't let apps read SMS. Instead, a Shortcuts automation runs when a bank message arrives and opens the app with the message text:

```
expensetracker://add?sms=<url-encoded message>
```

The app parses it on device, skips duplicates and non-transactions (OTPs, reminders), and saves it.

## Create the automation

1. **Shortcuts** → **Automation** → **+** → **Message**.
2. **Message Contains**: a phrase every transaction SMS from your bank includes, e.g. `IDFC FIRST`. Leave **Sender** empty; bank sender IDs (like `AX-IDFCFB`) vary.
3. Select **Run Immediately** and turn off **Notify When Run** → **Next** → **New Blank Automation**.

## Actions

1. **URL Encode**: tap **Shortcut Input** → choose **Content** (the message text).
2. **Text**: `expensetracker://add?sms=` followed by the **URL Encoded Text** variable.
3. **Open URLs**: uses the Text from step 2.

The first time it runs, allow Shortcuts to open Expense Tracker (**Always Allow**).

## Notes

- One automation per bank; repeat with that bank's phrase.
- The app comes to the foreground on each import. Silent background import needs a native module (planned).
- Messages that aren't transactions open the app with "Nothing to save" and store nothing.
