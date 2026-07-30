export const effectiveBalanceSql = `(CASE WHEN a.balance_mode = 'calculated' THEN
  a.opening_balance_cents + COALESCE((SELECT SUM(t.amount_cents) FROM transactions t
    WHERE t.account_id = a.id AND t.is_deleted = 0 AND t.date >= a.opening_balance_date), 0)
  ELSE a.current_balance_cents END)`;
