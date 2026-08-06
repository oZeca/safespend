UPDATE transactions
SET transaction_type = 'transfer',
    updated_at = '2026-08-06T00:00:00.000Z'
WHERE category_id IN (
  SELECT id FROM categories WHERE kind = 'transfer'
)
AND transaction_type <> 'transfer';
