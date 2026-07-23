# SafeSpend

Private, single-user personal finance software. The application currently includes the project foundation, accounts, transactions, generic CSV imports, categorization rules, splits, linked transfers, an actuals dashboard, annual savings goals, and expected-scenario forecasting. Workbook imports, budgets, and backup/release features remain intentionally unimplemented.

## Local setup

Requires Node.js 22 and npm. Native build tools may be needed if npm cannot download a prebuilt `better-sqlite3` binary.

```bash
nvm use
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open <http://localhost:3000>. The database defaults to `./data/safespend.db`; set `DATABASE_PATH` to an absolute or relative alternative.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run db:migrate
npm run db:seed
```

Install Chromium once before E2E testing with `npx playwright install chromium`.

## Accounts

The Accounts page supports creating, editing, and archiving current, savings, cash, credit, and investment accounts. Balances accept exact two-decimal values, including negative balances, and are stored as integer cents. Inclusion switches determine the active available-cash and net-worth summaries. Initial balances and subsequent balance changes create manual balance snapshots; metadata-only edits do not.

Archived accounts retain their history and are excluded from active summary totals. Restoring archived accounts is not part of Task 2.

## Transactions and categories

The Transactions page supports paginated search and filtering by account, category, type, and date range. Manual transactions can be created, edited, categorized, annotated, and soft-deleted. Amounts are signed account movements: income and refunds are positive, expenses are negative, and transfers may use either sign.

Monthly totals exclude transfers and deleted rows. Refunds reduce expenses. The initial category set is installed idempotently by migration `0003`; category editing remains out of scope. Manual transaction changes do not alter the account balance entered on the Accounts page.

Transactions may be marked recurring, exceptional, or explicitly excluded from the forecast baseline. These flags do not change actual dashboard totals; they only prevent the transaction from shaping projected variable spending.

## Transfers and splits

The transaction edit page can divide a non-transfer transaction across two or more categories. Every split is a non-zero signed amount in the same direction as its parent, and the rows must add up exactly to the parent amount. Saving splits clears the parent category; removing all splits leaves it uncategorized until it is edited.

An outgoing transaction can be marked as a transfer and optionally linked to an unlinked incoming transaction in another owned account. Linked amounts must be exact opposites and both accounts must use the same currency. Each transaction can belong to at most one link. Linking classifies both sides as transfers; unlinking leaves both classifications intact for explicit review. Dates may differ.

When individual credit-card purchases are imported as expenses, classify the bank payment and matching card credit as a transfer. This keeps the payment out of expense totals and avoids counting the card spending twice. Automatic transfer matching and investment-transfer savings-goal treatment are not part of Task 7.

## CSV imports

The Imports page accepts UTF-8 CSV files up to 5 MB and 5,000 data rows. Comma, semicolon, and tab delimiters are detected automatically. The mapping step supports `YYYY-MM-DD`, `DD/MM/YYYY`, and `DD-MM-YYYY` dates plus decimal-comma and decimal-point amounts. Mappings may be saved as reusable profiles for files with matching headers.

Preview flags invalid and exact-duplicate rows before confirmation. Confirmation is transactional, skips invalid/duplicate rows, preserves the complete original row JSON, and stores stable SHA-256 source fingerprints. Re-importing the same mapped rows does not create duplicate transactions. Positive amounts default to income and negative amounts to expenses; a matching categorization rule may override the category and type.

## Categorization rules

Rules match description, normalized description, or merchant using case-insensitive contains, starts-with, exact, or regular-expression matching. Lower priority numbers run first and the first enabled match wins. A rule assigns a category and may override transaction type.

Rule forms can preview current matches before saving. Enabled rules are applied during CSV preview and confirmation, and can be bulk-applied to active uncategorized transactions. Manually categorizing a transaction offers a prefilled rule suggestion. Deleting or disabling a rule does not undo categories previously assigned by it.

## Dashboard

The dashboard reports available cash from active accounts opted into that total, current-month income, net expenses after refunds, current-month savings, and year-to-date savings. Transfers and deleted transactions are excluded from actuals. The current-year chart shows monthly income, expenses, and savings through the current month.

Category spending uses transaction splits when present and otherwise uses the parent category. Refunds reduce the matching category, and uncategorized net spending is called out for review. Metric and category links open the matching filtered transaction list, including transactions represented by splits.

Current-month totals include transactions dated anywhere in the calendar month. Year-to-date savings ends on the dashboard’s local “as of” date.

## Savings goal and forecast

The Forecast page manages one active annual savings goal, its starting saved amount, optional investment-transfer credit, and a minimum cash buffer. Expected income and planned expenses are dated one-time assumptions. Recurring income and expenses support weekly, monthly, quarterly, and yearly schedules with an optional end date.

Safe-to-spend is calculated in integer cents:

```text
available cash
+ expected and recurring income before month end
- recurring payments before month end
- planned expenses before month end
- required monthly savings allocation
- minimum cash buffer
```

Negative results remain visible. Weekly and daily figures never go below zero and divide the positive monthly result across the remaining calendar days, including today.

Savings credited combines the configured starting amount with actual income minus expenses from the goal start through the local “as of” date. Transfers are excluded, except that positive transfers entering investment accounts are credited when the goal opts in. The target-date expected scenario also includes future income, recurring items, planned expenses, and a variable-spending projection based on the prior three complete calendar months. The baseline excludes recurring, exceptional, explicitly forecast-excluded, deleted, and transfer transactions.

The dashboard exposes target progress, on-track status, upcoming recurring expenses, and the complete safe-to-spend derivation. Forecasts are planning estimates rather than guarantees; assumptions already represented by transactions should be removed to avoid counting them twice.

## Database

Plain numbered SQL migrations live in `src/db/migrations` and are tracked in `schema_migrations`. Each connection enables WAL, foreign keys, synchronous `NORMAL`, and a 5000 ms busy timeout. Synchronous database modules are server-only and must not be imported into client components.

## Docker

```bash
docker compose up --build
```

The container migrates before starting, and the `safespend-data` volume persists the SQLite database. Only one application process may use this deployment.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Repository tests use temporary SQLite databases and cover migrations, required pragmas, account and transaction mutations, balance snapshots, CSV parsing and normalization, import validation, categorization matching and precedence, rule previews and bulk application, import-time rules, profile persistence, exact duplicates, original-row preservation, soft deletion, filtering, deterministic monthly totals, exact split validation, transfer-link integrity, dashboard actuals, split-category spending, dashboard date validation, forecast persistence, recurrence expansion, baseline exclusions, investment-transfer credit, and positive/zero/negative safe-to-spend outcomes.
