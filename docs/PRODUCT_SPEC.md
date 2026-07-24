# Product specification

## Working title

SafeSpend

## Summary

SafeSpend is a private personal finance web app that consolidates bank transactions, account balances, budgets, savings targets, recurring costs, and forecasts.

It should answer:

> How much can I spend now and still save the amount I planned by year end?

## Core outcomes

The user can:

1. See balances across selected accounts.
2. Import bank CSV files and an exported Google Sheets `.xlsx` workbook.
3. Categorize transactions manually and automatically.
4. Distinguish income, expenses, transfers, refunds, and investment contributions.
5. See monthly and year-to-date income, spending, and savings.
6. Set an annual savings target.
7. See forecasted year-end savings.
8. See safe-to-spend values for the month, week, and day.
9. Inspect the assumptions behind forecasts.
10. Back up, restore, and export local data.

## MVP pages

### Dashboard

Show:

- Total available cash
- Current-month income, expenses, and savings
- Year-to-date savings
- Annual target progress
- Forecasted year-end savings
- Safe to spend for the rest of the month
- Secondary weekly and daily safe-to-spend values
- Monthly income/expense/savings chart
- Category breakdown
- Upcoming recurring expenses
- Off-track warnings

Safe to spend is the main visual priority.

### Transactions

- Paginated list
- Search by description or merchant
- Filter by date, account, category, and type
- Edit category and type
- Split across categories
- Mark recurring or transfer
- Add notes
- Bulk categorize
- Exclude exceptional transactions from forecast baselines without removing them from actual totals

### Accounts

- Create and edit current, savings, cash, credit, and investment accounts
- Mark inclusion in available cash and net worth
- Store current balance
- View account history
- Record balance snapshots

### Imports

MVP supports:

1. Generic CSV import
2. Reusable bank-specific CSV profiles
3. Exported `.xlsx` workbook from Google Sheets

CSV uploads accept UTF-8, UTF-16 files with a byte-order mark, and legacy
Windows-1252 exports commonly produced by banks and spreadsheet applications.
Date mappings support date-only values and `YYYY-MM-DD hh:mm:ss` timestamps;
timestamps are normalized to the transaction's `YYYY-MM-DD` date.

Flow:

1. Upload file.
2. Select or detect profile.
3. Map columns.
4. Preview normalized rows.
5. Flag invalid rows.
6. Detect exact and probable duplicates.
7. Apply categorization rules.
8. Confirm.
9. Show results.

Re-importing the same file must not create duplicate transactions.

### Categories and rules

- Parent and child categories
- Contains, starts-with, exact, and regex matching
- Match description, normalized description, or merchant
- Assign category and transaction type
- Rule priority
- Preview matches
- Offer to create a rule after manual categorization

Default categories may include Housing, Groceries, Restaurants, Transport, Utilities, Health, Child, Entertainment, Shopping, Travel, Taxes, Salary, Other income, Investments, Transfers, and Uncategorized.

### Budgets

- Optional monthly category limits
- Actual versus budget
- Remaining category amount
- Rollover is not required for MVP

### Savings goals

- Annual target
- Starting amount already saved
- Target date
- Include or exclude investment contributions
- Required average savings per remaining month
- On-track/off-track status

### Forecasts

The expected scenario combines:

- Actual transactions to date
- Expected future income
- Known recurring expenses
- Historical category baseline
- Planned irregular expenses
- Savings target
- Minimum desired cash buffer

The user can inspect and edit assumptions. Conservative and optimistic scenarios are later features.

### Settings and backup

- Currency, initially EUR
- Calendar-month default
- Minimum cash buffer
- Export data
- Download database backup
- Restore with explicit confirmation

## Core calculations

All monetary values use integer cents.

### Actual savings

```text
actual savings = income - expenses
```

Owned-account transfers are excluded. Investment transfers may count toward the savings target according to settings.

### Remaining savings requirement

```text
remaining savings requirement = max(0, annual target - savings credited so far)
```

### Remaining spendable money for the year

```text
remaining spendable money =
  expected remaining income
  - expected remaining fixed expenses
  - planned irregular expenses
  - remaining savings requirement
  - required ending cash-buffer adjustment
```

### Safe to spend this month

```text
safe to spend this month =
  current available cash
  + expected income before month end
  - expected fixed payments before month end
  - planned variable commitments before month end
  - savings allocation required this month
  - minimum cash buffer
```

Do not hide a negative result. It means assumptions or spending must change.

### Safe per day

```text
safe per day = max(0, safe to spend this month) / days remaining
```

This is secondary and informational.

## Domain rules

- A transfer has a source and optionally a linked destination transaction.
- Credit-card payments are transfers when individual card purchases are imported.
- Refunds reduce spending in the relevant category.
- Cash withdrawals may be transfers to a cash account or expenses.
- Duplicate detection cannot rely only on description.
- Preserve original imported row data after edits.
- Prefer soft deletion for imported transactions.

## Non-goals for MVP

- Public multi-user SaaS
- Open Banking synchronization
- Receipt OCR
- AI financial advice
- Tax filing
- Market-price tracking
- Native mobile apps
- Multi-currency conversion
- Household permissions
- Complex accounting UI
