# AGENTS.md

## Project

Build a private, single-user personal finance web app that replaces a Google Sheets workbook with monthly expense tabs and dashboards.

Core product question:

> How much can I safely spend this month and still reach my annual savings target?

## Required stack

- Node.js 22
- Next.js App Router
- Strict TypeScript
- React
- Tailwind CSS
- shadcn/ui
- SQLite with `better-sqlite3`
- Plain numbered SQL migrations
- Zod
- Recharts
- Vitest
- Playwright for critical flows

Do not add Prisma, Drizzle, TypeORM, Redis, Express, Fastify, Supabase, Firebase, or a separate API server unless explicitly requested.

## Runtime

- Single user; no authentication for MVP.
- Runs locally and in Docker.
- Intended deployment: private Ubuntu server over Tailscale.
- Financial data stays local.

## Engineering rules

- Use server components by default.
- Keep database access on the server.
- Put financial logic in domain modules, not React components.
- Store money as integer cents; never use floating point for currency.
- Store dates as `YYYY-MM-DD`; timestamps as UTC ISO strings.
- Use database transactions for multi-step writes.
- Make imports idempotent and detect duplicates.
- Transfers between owned accounts do not count as income or expenses.
- Investment contributions are transfers to investment accounts and may count toward savings goals.
- Forecast calculations must be deterministic and unit-tested.
- Prefer explicit, simple code over premature abstractions.

## Suggested structure

```text
src/
├── app/
│   ├── dashboard/
│   ├── transactions/
│   ├── accounts/
│   ├── budgets/
│   ├── forecasts/
│   ├── imports/
│   └── settings/
├── features/
│   ├── accounts/
│   ├── transactions/
│   ├── categorization/
│   ├── imports/
│   ├── budgeting/
│   ├── forecasting/
│   └── savings-goals/
├── db/
│   ├── migrations/
│   ├── queries/
│   ├── connection.ts
│   └── migrate.ts
├── components/
├── lib/
└── test/
```

## UI rules

- Make safe-to-spend the main dashboard figure.
- Show how calculated values were derived.
- Add drill-down links from totals to matching transactions.
- Provide clear empty, loading, validation, and error states.
- Support desktop and mobile browsers.

## Required commands

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

## Before changing code

1. Read `PRODUCT_SPEC.md`.
2. Read `DATA_MODEL.md`.
3. Read `IMPLEMENTATION_PLAN.md`.
4. Plan the smallest complete vertical slice.
5. State assumptions.

## Definition of done

A task is complete only when the UI works, validation is handled, migrations exist, domain logic is tested, documentation is updated, and lint/typecheck/tests/build pass.
