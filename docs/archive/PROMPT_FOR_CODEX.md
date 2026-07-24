# Codex kickoff prompt

Paste the following into a new Codex session after copying this starter pack into the repository root.

---

You are implementing a private, single-user personal finance application.

Before changing anything, read:

- `AGENTS.md`
- `PRODUCT_SPEC.md`
- `DATA_MODEL.md`
- `IMPLEMENTATION_PLAN.md`

The application replaces a Google Sheets workbook used for monthly bank expenses, account balances, savings, and annual forecasts.

Its central question is:

> How much can I safely spend this month and still reach my annual savings target?

Follow every architecture rule in `AGENTS.md`.

Implement **Task 1 — Project foundation** from `IMPLEMENTATION_PLAN.md` and nothing beyond it.

Before coding:

1. Summarize the intended architecture.
2. List the files you expect to create.
3. State your assumptions.
4. Identify risks, especially around Next.js and synchronous SQLite access.

Requirements:

- Node.js 22 with `.nvmrc`
- Next.js App Router and strict TypeScript
- Tailwind and shadcn/ui
- SQLite with `better-sqlite3`
- Plain numbered SQL migrations and a custom runner
- WAL, foreign keys, synchronous NORMAL, and 5000 ms busy timeout
- Configurable database path outside the source tree
- Dockerfile and Docker Compose with a persistent SQLite volume
- Scripts for dev, build, start, lint, typecheck, tests, E2E tests, migration, and seed
- Initial schema from `DATA_MODEL.md`
- Minimal responsive app shell and dashboard placeholder
- Database health/repository test proving migrations and queries work
- Setup documentation

Do not implement accounts, transactions, imports, forecasts, or other later features yet.

Before finishing, run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Report the exact commands and results, created files, important decisions, assumptions, and known limitations. Stop after Task 1.

---

# Template for following tasks

---

Read `AGENTS.md`, `PRODUCT_SPEC.md`, `DATA_MODEL.md`, and `IMPLEMENTATION_PLAN.md`.

Implement **Task [NUMBER] — [NAME]** only.

Inspect the current repository first and provide a concise plan. Preserve the current architecture unless there is a concrete reason to change it. Add required SQL migrations, validation, tests, UI states, and documentation. Do not implement later tasks opportunistically.

Before finishing, run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Run relevant Playwright tests when a critical user flow changes.

Report:

- What changed
- Migrations added
- Tests added
- Commands and results
- Assumptions
- Known limitations

Stop after the requested task.

---

# Repository review prompt

---

Review the repository against `AGENTS.md`, `PRODUCT_SPEC.md`, `DATA_MODEL.md`, and completed tasks in `IMPLEMENTATION_PLAN.md`. Do not modify code yet.

Find and prioritize:

- Missing or incorrect requirements
- Floating-point currency calculations
- Incorrect transfer, refund, or investment handling
- Import paths that can create duplicates
- Forecast logic inside UI components
- Client-side database access
- Missing database transactions
- Missing validation and error states
- Missing financial calculation tests
- Backup/restore data-loss risks
- Docker or SQLite persistence issues

Return findings with file references and suggested fixes.

---
