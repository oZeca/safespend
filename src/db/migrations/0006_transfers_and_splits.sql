CREATE INDEX idx_transaction_splits_transaction
  ON transaction_splits(transaction_id);

CREATE UNIQUE INDEX idx_transfer_links_source
  ON transfer_links(source_transaction_id);

CREATE UNIQUE INDEX idx_transfer_links_destination
  ON transfer_links(destination_transaction_id)
  WHERE destination_transaction_id IS NOT NULL;
