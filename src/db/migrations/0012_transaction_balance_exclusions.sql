ALTER TABLE transactions ADD COLUMN excluded_from_account_balance INTEGER NOT NULL DEFAULT 0 CHECK (excluded_from_account_balance IN (0,1));

CREATE INDEX idx_transactions_account_balance ON transactions(account_id, is_deleted, excluded_from_account_balance, date);
