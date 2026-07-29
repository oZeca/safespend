# Data model

## Conventions

- Text UUID primary keys
- Money as integer cents
- Dates as `YYYY-MM-DD`
- Timestamps as UTC ISO strings
- Foreign keys enabled on every connection
- WAL mode and busy timeout

Recommended pragmas:

```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
```

## Tables

### accounts

```text
id
name
institution
account_type
currency
current_balance_cents
included_in_available_cash
included_in_net_worth
is_archived
created_at
updated_at
```

Types: `current`, `savings`, `cash`, `credit`, `investment`.

### categories

```text
id
name
parent_category_id
kind
is_archived
created_at
updated_at
```

Kinds: `income`, `expense`, `transfer`, `mixed`.

### transactions

```text
id
account_id
date
posted_at
description
normalized_description
merchant
amount_cents
transaction_type
category_id
notes
is_recurring
is_exceptional
excluded_from_forecast_baseline
source_import_id
source_row_number
source_fingerprint
original_payload_json
is_deleted
created_at
updated_at
```

Types: `income`, `expense`, `transfer`, `refund`.
Positive amounts enter an account; negative amounts leave it.

### transaction_splits

```text
id
transaction_id
category_id
amount_cents
notes
created_at
```

Split amounts must sum to the parent transaction amount.

### transfer_links

```text
id
source_transaction_id
destination_transaction_id
created_at
```

Destination may be null until a matching transaction is found.

### categorization_rules

```text
id
name
match_field
match_type
pattern
category_id
transaction_type
priority
is_enabled
created_at
updated_at
```

Fields: `description`, `normalized_description`, `merchant`.
Match types: `contains`, `starts_with`, `exact`, `regex`.

### imports

```text
id
file_name
file_sha256
import_type
account_id
profile_id
status
row_count
imported_count
skipped_count
error_count
created_at
completed_at
```

### import_profiles

```text
id
name
institution
file_type
configuration_json
created_at
updated_at
```

Configuration describes mappings, delimiter, header row, date and decimal formats, and debit/credit behavior.

### recurring_items

```text
id
name
account_id
category_id
transaction_type
expected_amount_cents
amount_tolerance_cents
frequency
next_expected_date
end_date
is_enabled
created_at
updated_at
```

Frequencies: `weekly`, `monthly`, `quarterly`, `yearly`.

### budgets

```text
id
category_id
month
amount_cents
created_at
updated_at
```

`month` is `YYYY-MM`.

### savings_goals

```text
id
name
start_date
target_date
target_amount_cents
starting_amount_cents
include_investment_transfers
is_active
created_at
updated_at
```

### planned_expenses

```text
id
name
expected_date
amount_cents
category_id
scenario
is_committed
created_at
updated_at
```

### income_expectations

```text
id
name
expected_date
amount_cents
account_id
scenario
is_committed
created_at
updated_at
```

### settings

```text
key
value_json
updated_at
```

Suggested keys:

- `default_currency`
- `minimum_cash_buffer_cents`
- `financial_month_start_day`
- `investment_transfers_count_as_savings`

### balance_snapshots

```text
id
account_id
date
balance_cents
source
created_at
```

## Required indexes

```text
transactions(account_id, date)
transactions(date)
transactions(category_id, date)
transactions(source_fingerprint)
transactions(normalized_description)
imports(file_sha256)
budgets(month, category_id)
recurring_items(next_expected_date)
```

## Duplicate detection

Use a stable SHA-256 fingerprint based on normalized source values and the occurrence number of otherwise identical rows:

```text
account_id | date | amount_cents | normalized_description | occurrence
```

Prefer a bank-provided transaction identifier when available.

- Exact duplicates: skip automatically
- Probable duplicates: show for confirmation

Compare occurrence counts against existing active transactions so adding or reordering CSV rows does not defeat exact matching, while multiple legitimate identical transactions remain importable. Preview selection is a fallback that allows any otherwise valid row to be excluded manually.
