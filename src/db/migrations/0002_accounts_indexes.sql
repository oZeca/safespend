CREATE INDEX idx_accounts_archived_name ON accounts(is_archived, name);
CREATE INDEX idx_balance_snapshots_account_date ON balance_snapshots(account_id, date DESC, created_at DESC);
