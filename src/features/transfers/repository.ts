import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import type { SplitWrite, TransactionSplit, TransferCandidate, TransferLinkDetails } from "./model";

interface TransferRow {
  id: string;
  sourceId: string;
  sourceAccountName: string;
  sourceDate: string;
  sourceDescription: string;
  sourceAmountCents: number;
  destinationId: string | null;
  destinationAccountName: string | null;
  destinationDate: string | null;
  destinationDescription: string | null;
  destinationAmountCents: number | null;
}

export interface TransferRepositoryOptions { now?: () => Date; id?: () => string; }

export class TransferValidationError extends Error {}

export function createTransferRepository(database: Database.Database, options: TransferRepositoryOptions = {}) {
  const now = options.now ?? (() => new Date());
  const makeId = options.id ?? randomUUID;

  function candidate(id: string, accountName: string, date: string, description: string, amountCents: number): TransferCandidate {
    return { id, accountName, date, description, amountCents };
  }

  function getActiveTransaction(id: string) {
    return database.prepare(`SELECT t.id, t.account_id AS accountId, t.amount_cents AS amountCents, t.transaction_type AS transactionType,
      a.currency FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE t.id = ? AND t.is_deleted = 0`).get(id) as
      { id: string; accountId: string; amountCents: number; transactionType: string; currency: string } | undefined;
  }

  return {
    listSplits(transactionId: string): TransactionSplit[] {
      return database.prepare(`SELECT s.id, s.category_id AS categoryId, c.name AS categoryName, s.amount_cents AS amountCents, s.notes
        FROM transaction_splits s JOIN categories c ON c.id = s.category_id WHERE s.transaction_id = ? ORDER BY s.created_at, s.id`)
        .all(transactionId) as TransactionSplit[];
    },

    replaceSplits(transactionId: string, splits: SplitWrite[]): TransactionSplit[] {
      const transaction = getActiveTransaction(transactionId);
      if (!transaction) throw new TransferValidationError("This transaction no longer exists.");
      if (transaction.transactionType === "transfer") throw new TransferValidationError("Transfers cannot be split.");
      if (splits.length < 2) throw new TransferValidationError("Add at least two split rows.");
      if (splits.some((split) => split.amountCents === 0 || Math.sign(split.amountCents) !== Math.sign(transaction.amountCents))) {
        throw new TransferValidationError("Every split must be non-zero and use the transaction sign.");
      }
      if (splits.reduce((sum, split) => sum + split.amountCents, 0) !== transaction.amountCents) {
        throw new TransferValidationError("Split amounts must add up exactly to the transaction amount.");
      }
      const categories = database.prepare(`SELECT id FROM categories WHERE is_archived = 0 AND id IN (${splits.map(() => "?").join(",")})`)
        .pluck().all(...splits.map((split) => split.categoryId)) as string[];
      if (new Set(categories).size !== new Set(splits.map((split) => split.categoryId)).size) {
        throw new TransferValidationError("Choose active categories for every split.");
      }
      const timestamp = now().toISOString();
      database.transaction(() => {
        database.prepare("DELETE FROM transaction_splits WHERE transaction_id = ?").run(transactionId);
        const insert = database.prepare("INSERT INTO transaction_splits (id, transaction_id, category_id, amount_cents, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)");
        for (const split of splits) insert.run(makeId(), transactionId, split.categoryId, split.amountCents, split.notes, timestamp);
        database.prepare("UPDATE transactions SET category_id = NULL, updated_at = ? WHERE id = ?").run(timestamp, transactionId);
      })();
      return this.listSplits(transactionId);
    },

    clearSplits(transactionId: string): boolean {
      return database.prepare("DELETE FROM transaction_splits WHERE transaction_id = ?").run(transactionId).changes > 0;
    },

    findTransferLink(transactionId: string): TransferLinkDetails | null {
      const row = database.prepare(`SELECT l.id, s.id AS sourceId, sa.name AS sourceAccountName, s.date AS sourceDate, s.description AS sourceDescription, s.amount_cents AS sourceAmountCents,
        d.id AS destinationId, da.name AS destinationAccountName, d.date AS destinationDate, d.description AS destinationDescription, d.amount_cents AS destinationAmountCents
        FROM transfer_links l JOIN transactions s ON s.id = l.source_transaction_id JOIN accounts sa ON sa.id = s.account_id
        LEFT JOIN transactions d ON d.id = l.destination_transaction_id LEFT JOIN accounts da ON da.id = d.account_id
        WHERE l.source_transaction_id = ? OR l.destination_transaction_id = ?`).get(transactionId, transactionId) as TransferRow | undefined;
      if (!row) return null;
      return {
        id: row.id,
        role: row.sourceId === transactionId ? "source" : "destination",
        source: candidate(row.sourceId, row.sourceAccountName, row.sourceDate, row.sourceDescription, row.sourceAmountCents),
        destination: row.destinationId && row.destinationAccountName && row.destinationDate && row.destinationDescription && row.destinationAmountCents !== null
          ? candidate(row.destinationId, row.destinationAccountName, row.destinationDate, row.destinationDescription, row.destinationAmountCents) : null
      };
    },

    listDestinationCandidates(sourceTransactionId: string): TransferCandidate[] {
      const source = getActiveTransaction(sourceTransactionId);
      if (!source || source.amountCents >= 0) return [];
      return database.prepare(`SELECT t.id, a.name AS accountName, t.date, t.description, t.amount_cents AS amountCents
        FROM transactions t JOIN accounts a ON a.id = t.account_id
        WHERE t.is_deleted = 0 AND t.id <> @sourceId AND t.account_id <> @accountId AND a.currency = @currency
          AND t.amount_cents = @amount AND NOT EXISTS (
            SELECT 1 FROM transfer_links l WHERE l.source_transaction_id = t.id OR l.destination_transaction_id = t.id
          )
        ORDER BY ABS(julianday(t.date) - julianday((SELECT date FROM transactions WHERE id = @sourceId))), t.date DESC, t.id`)
        .all({ sourceId: source.id, accountId: source.accountId, currency: source.currency, amount: -source.amountCents }) as TransferCandidate[];
    },

    markAndLink(sourceTransactionId: string, destinationTransactionId: string | null): TransferLinkDetails {
      const source = getActiveTransaction(sourceTransactionId);
      if (!source) throw new TransferValidationError("This transaction no longer exists.");
      if (source.amountCents >= 0) throw new TransferValidationError("The transfer source must be an outgoing transaction.");
      const splitCount = (database.prepare("SELECT COUNT(*) FROM transaction_splits WHERE transaction_id = ?").pluck().get(source.id) as number);
      if (splitCount) throw new TransferValidationError("Remove the transaction splits before marking it as a transfer.");
      let destination: ReturnType<typeof getActiveTransaction>;
      if (destinationTransactionId) {
        destination = getActiveTransaction(destinationTransactionId);
        if (!destination) throw new TransferValidationError("The destination transaction is unavailable.");
        if (destination.id === source.id || destination.accountId === source.accountId) throw new TransferValidationError("Choose a transaction in a different account.");
        if (destination.currency !== source.currency) throw new TransferValidationError("Linked transfer accounts must use the same currency.");
        if (destination.amountCents !== -source.amountCents) throw new TransferValidationError("Linked transfer amounts must be exact opposites.");
        const destinationSplits = database.prepare("SELECT 1 FROM transaction_splits WHERE transaction_id = ?").get(destination.id);
        if (destinationSplits) throw new TransferValidationError("Remove the destination transaction splits before linking it.");
      }
      const timestamp = now().toISOString();
      database.transaction(() => {
        const existing = this.findTransferLink(source.id);
        if (existing && existing.role === "destination") throw new TransferValidationError("This transaction is already the destination of another transfer.");
        const destinationLink = destination ? this.findTransferLink(destination.id) : null;
        if (destinationLink && destinationLink.id !== existing?.id) throw new TransferValidationError("The destination is already linked to a transfer.");
        database.prepare("UPDATE transactions SET transaction_type = 'transfer', category_id = 'category-transfers', updated_at = ? WHERE id = ?").run(timestamp, source.id);
        if (destination) database.prepare("UPDATE transactions SET transaction_type = 'transfer', category_id = 'category-transfers', updated_at = ? WHERE id = ?").run(timestamp, destination.id);
        if (existing) database.prepare("UPDATE transfer_links SET destination_transaction_id = ? WHERE id = ?").run(destination?.id ?? null, existing.id);
        else database.prepare("INSERT INTO transfer_links (id, source_transaction_id, destination_transaction_id, created_at) VALUES (?, ?, ?, ?)").run(makeId(), source.id, destination?.id ?? null, timestamp);
      })();
      return this.findTransferLink(source.id)!;
    },

    unlink(transactionId: string): boolean {
      return database.prepare("DELETE FROM transfer_links WHERE source_transaction_id = ? OR destination_transaction_id = ?").run(transactionId, transactionId).changes > 0;
    }
  };
}
