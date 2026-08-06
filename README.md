# SafeSpend

Use the eye control in the application header to blur or reveal sensitive financial amounts. The privacy preference is stored only in the current browser.

Private, single-user personal finance software. The application currently includes accounts, transactions, generic CSV and Excel imports, categorization rules, splits, linked transfers, an actuals dashboard, annual savings goals, expected-scenario forecasting, backup and restore, CSV export, and production container support. Multi-sheet Google Sheets workbook migration and budgets remain outside the implemented task set.

## Local setup

Requires Node.js 22 and npm. Native build tools may be needed if npm cannot download a prebuilt `better-sqlite3` binary.

```bash
nvm use
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run db:seed:demo
npm run dev
```

Open <http://localhost:3000>. The database defaults to `./data/safespend.db`; set `DATABASE_PATH` to an absolute or relative alternative.

## Progressive web app

SafeSpend can be installed as a standalone progressive web app. Installation requires HTTPS outside localhost; the recommended `tailscale serve 3000` deployment supplies a private HTTPS origin. A quiet installation control and iPhone/iPad instructions appear in Settings when applicable.

Offline behavior is intentionally limited: the service worker caches only a self-contained connection screen and public brand icons. It does not cache financial pages, React Server Component responses, API responses, exports, backups, imports, or form submissions, and it never queues writes. Reconnect before viewing current values or making changes.

To remove local PWA files, uninstall SafeSpend and clear the site data for its origin in the browser. Developers can enable service-worker registration outside production with `NEXT_PUBLIC_ENABLE_PWA=1`; leave it unset during ordinary local development to avoid stale workers.

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

`npm run db:seed` only applies migrations and required defaults. `npm run db:seed:demo` explicitly adds idempotent synthetic accounts, transactions, a goal, and forecast assumptions. Never run demo seeding against a real finance database unless that data is wanted.

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

## CSV and Excel imports

The Imports page accepts `.csv`, `.xls`, and `.xlsx` files up to 5 MB and 5,000 data rows. Excel imports use the first worksheet. CSV encoding and delimiter detection support common bank exports. The mapping step supports `YYYY-MM-DD`, `DD/MM/YYYY`, and `DD-MM-YYYY` dates plus decimal-comma and decimal-point amounts. Mappings may be saved as reusable profiles for files with matching headers.

Preview flags invalid and exact-duplicate rows before confirmation. Duplicate matching uses account, normalized date, integer-cent amount, and normalized description, with occurrence counts preserving legitimate repeated identical transactions even when CSV row positions change. Ready rows are selected by default and can be individually excluded before confirmation. Confirmation is transactional, skips invalid/duplicate/excluded rows, preserves the complete original row JSON, and stores stable SHA-256 source fingerprints. Positive amounts default to income and negative amounts to expenses; a matching categorization rule may override the category and type.

## Categorization rules

Rules match description, normalized description, or merchant using case-insensitive contains, starts-with, exact, or regular-expression matching. Lower priority numbers run first and the first enabled match wins. A rule assigns a category and may override transaction type.

Rule forms can preview current matches before saving. Enabled rules are applied during CSV preview and confirmation, and can be bulk-applied to active uncategorized transactions. Manually categorizing a transaction offers a prefilled rule suggestion. Deleting or disabling a rule does not undo categories previously assigned by it.

## Dashboard

The dashboard reports available cash from active accounts opted into that total, current-month income, net expenses after refunds, current-month savings, and year-to-date savings. Transfers and deleted transactions are excluded from actuals. The current-year chart shows monthly income, expenses, and savings through the current month.

Category spending shows a year total through the current month and a month-by-month breakdown from January onward. It uses transaction splits when present and otherwise uses the parent category. Refunds reduce the matching category, and uncategorized net spending is called out for review. Every category total and monthly amount links to the matching filtered transaction list, including transactions represented by splits.

Calculated dashboard values include an information tooltip with their formula, included inputs, and rounding behavior where relevant. Tooltips open on hover, keyboard focus, or tap.

Current-month totals include transactions dated anywhere in the calendar month. Year-to-date savings ends on the dashboard’s local “as of” date.

## Savings goal and forecast

The Forecast page manages one active annual savings goal, its starting saved amount, optional investment-transfer credit, and a minimum cash buffer. Expected income and planned expenses are editable dated one-time assumptions. Recurring income and expenses can be edited, removed, or filtered between monthly and yearly schedules; they support weekly, monthly, quarterly, and yearly frequencies with an optional end date.

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

The dashboard exposes target progress, on-track status, upcoming recurring expenses, and the complete safe-to-spend derivation. Projected variable spending is included in target-date savings by default and can be persistently included or excluded from either the dashboard or Forecast page; the preference consistently updates target-date savings, on-track status, and shortfall. It does not change safe-to-spend, which does not use the historical variable baseline. Forecasts are planning estimates rather than guarantees; assumptions already represented by transactions should be removed to avoid counting them twice.

## Backup, restore, and export

The Settings page downloads a consistent SQLite snapshot through SQLite’s online backup API. Transaction CSV export includes active transactions, exact decimal amounts, categories, split JSON, forecast flags, transfer counterpart IDs, and import provenance.

Restore requires both a browser confirmation and the exact phrase `RESTORE`. Uploads are limited to 100 MB and must use `.db`, `.sqlite`, or `.sqlite3`. SafeSpend checks the SQLite header, integrity, required tables, and migration compatibility in a temporary location. Compatible older backups are migrated before use; backups from a newer unknown schema are rejected.

After validation, the current connection is closed and the uploaded database is atomically installed. The previous database remains beside `DATABASE_PATH` with a `.pre-restore-<timestamp>-<id>.db` name. Restore replaces all application data. Keep an external copy of important backups rather than relying only on the server volume.

## Database

Plain numbered SQL migrations live in `src/db/migrations` and are tracked in `schema_migrations`. Each connection enables WAL, foreign keys, synchronous `NORMAL`, and a 5000 ms busy timeout. Synchronous database modules are server-only and must not be imported into client components.

## Docker

```bash
docker compose up -d --build
docker compose ps
curl --fail http://127.0.0.1:3000/api/health
```

The container migrates before starting, includes an application/database health check, and stores SQLite in the `safespend-data` named volume. The published port binds only to host loopback. Docker named volumes persist independently of replaced containers, but `docker compose down -v` deletes the volume and must not be used unless data removal is intentional. See Docker’s [volume documentation](https://docs.docker.com/engine/storage/volumes/).

### Private Ubuntu deployment over Tailscale

1. Install current Docker Engine, the Compose plugin, and Tailscale on the private Ubuntu host.
2. Clone or copy this repository, then run `docker compose up -d --build`.
3. Confirm `docker compose ps` reports the application healthy and test `/api/health` locally.
4. Publish the loopback service only to the tailnet with `tailscale serve 3000`. Tailscale documents this as a private reverse proxy to `127.0.0.1:3000`; do not use Funnel for this unauthenticated application. See the official [Tailscale Serve documentation](https://tailscale.com/docs/features/tailscale-serve).
5. Restrict host SSH and administration using the tailnet and normal Ubuntu firewall policy.

SafeSpend is single-user and has no application authentication. Run exactly one application replica against the SQLite volume. Do not place it on the public internet.

### Updating

1. Download a backup from Settings and copy it off the host.
2. Pull or copy the new source.
3. Run `docker compose build --pull`.
4. Run `docker compose up -d`.
5. Check `docker compose ps`, `/api/health`, and the dashboard.

Container startup applies pending migrations. Roll back application code only together with a compatible database backup; newer migrations are not automatically reversed.

### Recovery

Prefer the guarded Settings restore. If the web application cannot start:

1. Stop it with `docker compose stop`.
2. Inspect the `safespend-data` volume and copy its contents before changing anything.
3. Replace `safespend.db` with a known-good backup while the container is stopped.
4. Preserve or remove matching `safespend.db-wal` and `safespend.db-shm` sidecars as part of the same recovery operation.
5. Start the application and verify `/api/health`.

Consult Docker’s [production Compose guidance](https://docs.docker.com/compose/how-tos/production/) when integrating SafeSpend with host-level monitoring or deployment automation.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Repository tests use temporary SQLite databases and cover migrations, required pragmas, account and transaction mutations, balance snapshots, CSV parsing and normalization, import validation, categorization matching and precedence, rule previews and bulk application, import-time rules, profile persistence, exact duplicates, original-row preservation, soft deletion, filtering, deterministic monthly totals, exact split validation, transfer-link integrity, dashboard actuals, split-category spending, dashboard date validation, forecast persistence, recurrence expansion, baseline exclusions, investment-transfer credit, positive/zero/negative safe-to-spend outcomes, backup integrity, restore compatibility, transaction export escaping, and idempotent demo data.
