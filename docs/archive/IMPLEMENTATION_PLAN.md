# Implementation plan

Build in small vertical slices. Every task must leave the repository runnable.

## Task 1 — Project foundation

- Next.js TypeScript project
- `.nvmrc` for Node 22
- Tailwind and shadcn/ui
- `better-sqlite3` connection
- Plain SQL migration runner and initial schema
- Dashboard shell
- Dockerfile and Docker Compose with persistent DB volume
- Lint, typecheck, test, build, migration, and seed scripts

Done when install, migration, dev, build, tests, and Docker startup work.

## Task 2 — Accounts

- List, create, edit, and archive accounts
- Available-cash and net-worth inclusion
- Current balances and summary
- Balance aggregation tests

## Task 3 — Categories and transactions

- Default category seed
- Searchable/filterable transaction list
- Create/edit/soft-delete transactions
- Category, type, and notes
- Monthly income and expense totals

## Task 4 — CSV import

- Generic upload and column mapping
- Reusable profiles
- Preview and validation
- Exact duplicate detection
- Result summary and original-row preservation
- Tests for `1.234,56`, `1,234.56`, `2026-07-21`, `21/07/2026`, and `21-07-2026`

## Task 5 — Google Sheets workbook migration

- `.xlsx` upload
- Select and import multiple monthly tabs
- Reuse mappings across compatible sheets
- Track source sheet and row
- Summary by sheet and month
- Do not assume fixed column names

## Task 6 — Categorization rules

- Rules page
- Contains, starts-with, exact, and regex
- Priority and match preview
- Apply during import
- Bulk apply to uncategorized transactions
- Suggest rules after manual edits

## Task 7 — Transfers and splits

- Mark and link transfers
- Exclude transfers from income/expense totals
- Split transactions and validate totals
- Explain credit-card payment treatment

## Task 8 — Dashboard

- Available cash
- Current-month income, expenses, and savings
- Year-to-date savings
- Monthly trend chart
- Category spending
- Drill-down links
- Empty and partial-data states

## Task 9 — Savings goal and forecast engine

- Annual goal and minimum buffer
- Expected income and planned expenses
- Recurring items
- Forecast service
- Safe-to-spend calculation
- Calculation explanation panel
- Tests for positive, zero, and negative outcomes

## Task 10 — Backup and release readiness

- Backup download and guarded restore
- CSV export
- Responsive pass
- Friendly errors and error boundaries
- Playwright tests for import, categorization, and forecast
- Production Docker docs
- Synthetic demo seed

## Codex working method

For each task:

1. Read all specification files.
2. Inspect the repository.
3. Give a concise implementation plan.
4. Implement only the requested task and required support.
5. Add migrations, validation, tests, and documentation.
6. Run lint, typecheck, tests, and build.
7. Report changes, assumptions, and risks.
8. Stop before the next task.
