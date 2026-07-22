# SafeSpend

Private, single-user personal finance software. The application currently includes the project foundation, accounts, default categories, and manual transaction management through Task 3. Imports, rules, splits, budgets, and forecasting remain intentionally unimplemented.

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

Monthly totals exclude transfers and deleted rows. Refunds reduce expenses. The initial category set is installed idempotently by migration `0003`; category editing, automatic rules, splits, and linked transfers are later tasks. Manual transaction changes do not alter the account balance entered on the Accounts page.

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

Repository tests use temporary SQLite databases and cover migrations, required pragmas, account and transaction mutations, balance snapshots, soft deletion, exact money handling, filtering, and deterministic monthly totals.
