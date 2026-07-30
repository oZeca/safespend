ALTER TABLE accounts ADD COLUMN balance_mode TEXT NOT NULL DEFAULT 'manual' CHECK (balance_mode IN ('manual', 'calculated'));
ALTER TABLE accounts ADD COLUMN opening_balance_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE accounts ADD COLUMN opening_balance_date TEXT NOT NULL DEFAULT '1970-01-01';

CREATE INDEX idx_accounts_balance_mode ON accounts(balance_mode, is_archived);
