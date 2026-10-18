# Expense Tracker — Project Context

Personal expense tracker that answers one question exactly: **how much did I spend this month?**
It covers every money exit: savings account debits, credit cards, UPI, debit cards, mandates/autopay (EMI, SIP, subscriptions) and cash.
It's also a **resume showcase project**, so code quality, tests, a clean README and the architecture matter as much as the features.

Owner: Ujjwal Verma (backend engineer: Java/Spring and React/Node). He's new to Swift/iOS native; keep things in TypeScript.

## Decisions (already final, don't re-litigate)

- **Platform:** iPhone (primary). Android can come later from the same codebase.
- **Stack:** Full TypeScript monorepo (npm workspaces).
  - `apps/mobile`: **Expo (React Native) + TypeScript**, using a **development build** (not Expo Go). Run with `npx expo run:ios`.
  - `apps/gateway`: **Node + TypeScript AI gateway** (Fastify).
  - `packages/core`: shared types, parsers, rules engine and summary logic, used by both the app and the gateway.
- **Storage:** On-device only (`expo-sqlite`). No cloud database. The gateway is stateless and **never stores transaction data**.
- **Apple account:** Free provisioning (Mac + Xcode, no paid developer account). The app expires every 7 days; re-run `npx expo run:ios` to re-sign. The data survives. Don't use anything that requires a paid account (no push notifications, App Groups or widgets for now).
- **Editor:** VS Code.

## Data sources

1. **SMS (iOS):** iOS doesn't let apps read SMS. The user sets up an iOS Shortcuts automation ("When I receive a message from <bank sender>") that opens the deep link `<scheme>://add?sms=<url-encoded text>`. The app parses it and saves it. Later improvement: a native Expo Module for silent background ingest.
2. **Gmail statements:** Google OAuth in the app → fetch statement emails → unlock password-protected PDFs on device → parse. OAuth runs in testing mode (the token refreshes weekly, which is fine).
3. **PDF/CSV upload:** a manual import of bank or card statements.
4. **Manual cash entry.**
- Account Aggregator: **skipped** (it needs RBI FIU registration).

## Core engine rules (the most important logic)

- **No double counting:**
  - Credit card bill payment from savings = `TRANSFER`, not an expense (the card swipes are the expenses).
  - Transfers between own accounts = `TRANSFER`.
  - SIP / mutual funds / investments = `INVESTMENT`, not an expense.
  - Wallet top-ups = `TRANSFER`.
  - Cash is a user setting (`CashMode`, applied in the monthly summary, so switching recomputes past months). Default `WITHDRAWALS`: ATM withdrawals are spend, and manual cash entries only break it down. `ENTRIES`: cash entries are spend, and ATM withdrawals count as transfers.
  - Refunds/reversals offset the original expense.
- **Dedup:** the same transaction can arrive from SMS + statement + email. Match on amount + date window + account last4 + merchant similarity, and keep one.
- Mandates/autopay are tagged `FIXED` so fixed and variable spend show separately.
- **Monthly spend** = bank debits + card swipes − card bill payments − self transfers − investments (+ cash).
- Transaction kinds: `EXPENSE | INCOME | TRANSFER | INVESTMENT | REFUND`.

## AI features (via the gateway only)

1. **Smart parsing fallback:** when regex parsers fail, the LLM extracts structured JSON (amount, merchant, type, account last4, date) from raw SMS/statement text.
2. **Self-learning categorization:** rules first, then AI for unknown merchants. A user correction automatically becomes a local rule, so AI calls shrink over time.
3. **Chat with your money:** natural-language question → LLM generates **read-only SQL** against the local SQLite schema → the app runs it locally and shows the answer and a chart. Validate the SQL (SELECT only, known tables).
4. **Monthly insights and alerts:** new subscriptions detected, autopay amount changes, unusual spends and a month summary.

**Privacy rule:** only masked data goes to the gateway/LLM. Never send full account or card numbers, balances or personal names. The gateway re-checks the masking before calling the LLM.

## Gateway responsibilities

API key stays server-side only · masking guard · rate limiting · caching (merchant → category) · prompts versioned on the server · provider-agnostic LLM client (Claude by default) · schema-validated responses (zod). Endpoints: `/parse`, `/categorize`, `/ask`, `/insights`. Free-tier hosting (Render/Railway). Simple app-token auth.

## Build order

1. `packages/core`: types, SMS parsers for major Indian banks (HDFC, ICICI, SBI, Axis, Kotak + generic UPI), rules engine, dedup, transfer detection, monthly summary, masking. **Vitest unit tests with real-looking SMS fixtures.**
2. `apps/mobile`: SQLite schema, deep-link SMS ingest, dashboard (month total, by category, fixed vs variable, by account), transactions list with edit/recategorize, cash entry, CSV/PDF import.
3. `apps/gateway`: `/parse` + `/categorize` first, then `/ask` and `/insights`.
4. Gmail statement fetch.
5. Polish: README with an architecture diagram, a Shortcuts setup guide, GitHub Actions CI (typecheck, lint, test), and a demo GIF.

## Conventions

- Strict TypeScript, no `any`. zod at every boundary (deep link input, gateway requests/responses, LLM output).
- Money is stored as integer **paise**, never floats. Currency is INR.
- Dates are stored as ISO strings in IST-aware handling.
- Every parser gets fixtures + tests before it's wired in.
- Small, focused commits.

## Pending from the user

- Accounts: **IDFC FIRST Bank** (savings) and an **IDFC FIRST credit card** (his only card). IDFC parsers are first priority, and card bill payments from the savings account must be detected as `TRANSFER`. Still needed: masked sample SMS for both. Until then, build parsers for common formats and keep them easy to extend.
