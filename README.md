# SafeSpend Codex starter pack

Repository planning files for a private personal finance app.

## Included files

- `AGENTS.md`: permanent engineering instructions
- `PRODUCT_SPEC.md`: product requirements and calculations
- `DATA_MODEL.md`: proposed SQLite schema
- `IMPLEMENTATION_PLAN.md`: ten ordered tasks
- `PROMPT_FOR_CODEX.md`: kickoff and follow-up prompts

## Workflow

1. Create an empty Git repository.
2. Copy these files into its root.
3. Open the repository in Codex.
4. Paste the kickoff prompt from `PROMPT_FOR_CODEX.md`.
5. Review and commit after every task.
6. Use the task template for each next task.

Do not ask Codex to build the whole application in one run. The staged approach makes database changes and financial logic easier to review.
# SafeSpend

Private, single-user personal finance software. This repository currently contains Task 1: the project, database, test, and deployment foundation. Account and transaction workflows and financial calculations are intentionally not implemented yet.

## Requirements

- Node.js 22 (use `nvm use` with the included `.nvmrc`)
- npm
- Native build tools if npm cannot download a prebuilt `better-sqlite3` binary

## Local setup

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open <http://localhost:3000>. The database defaults to `./data/safespend.db`. Set `DATABASE_PATH` to an absolute or relative path to keep it elsewhere; its parent directory is created automatically.

## Commands

```bash
npm run dev          # development server
npm run build        # production build
npm run start        # production server
npm run lint         # ESLint
npm run typecheck    # strict TypeScript check
npm run test         # Vitest suite
npm run test:e2e     # Playwright critical-flow tests
npm run db:migrate   # apply pending numbered SQL migrations
npm run db:seed      # prepare idempotent Task 1 seed state
```

Install the Playwright Chromium browser once before E2E testing with `npx playwright install chromium`.

## Database

Migrations are plain, ordered SQL files in `src/db/migrations`. Applied versions are recorded in `schema_migrations`; rerunning migration is safe. Every opened connection enables WAL, foreign keys, synchronous `NORMAL`, and a 5000 ms busy timeout. Money is represented as integer cents and dates/timestamps follow the conventions in `DATA_MODEL.md`.

The synchronous SQLite driver is server-only architecture: do not import database modules into components marked `"use client"`. The current dashboard placeholder deliberately does not access the database during Next.js build-time rendering.

## Docker

```bash
docker compose up --build
```

The container applies migrations before starting Next.js. The named `safespend-data` volume persists `/app/data/safespend.db` between container replacements. This deployment is intended as one application process on a private host; multiple replicas sharing the SQLite file are unsupported.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

The database test creates a temporary SQLite file, applies the initial migration twice to prove idempotency, checks required pragmas, and executes a repository health query.
