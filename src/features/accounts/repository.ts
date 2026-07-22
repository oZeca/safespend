import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import type { Account, AccountType, BalanceSnapshot } from "./model";

interface AccountRow {
  id: string; name: string; institution: string | null; account_type: AccountType; currency: string; current_balance_cents: number;
  included_in_available_cash: number; included_in_net_worth: number; is_archived: number; created_at: string; updated_at: string;
}

export interface AccountWrite {
  name: string; institution: string | null; accountType: AccountType; currency: string; currentBalanceCents: number;
  includedInAvailableCash: boolean; includedInNetWorth: boolean;
}

export interface AccountRepositoryOptions { now?: () => Date; id?: () => string; localDate?: (date: Date) => string; }

const selectAccounts = `SELECT id, name, institution, account_type, currency, current_balance_cents, included_in_available_cash, included_in_net_worth, is_archived, created_at, updated_at FROM accounts`;

function mapAccount(row: AccountRow): Account {
  return { id: row.id, name: row.name, institution: row.institution, accountType: row.account_type, currency: row.currency, currentBalanceCents: row.current_balance_cents,
    includedInAvailableCash: Boolean(row.included_in_available_cash), includedInNetWorth: Boolean(row.included_in_net_worth), isArchived: Boolean(row.is_archived), createdAt: row.created_at, updatedAt: row.updated_at };
}

export function createAccountRepository(database: Database.Database, options: AccountRepositoryOptions = {}) {
  const now = options.now ?? (() => new Date());
  const makeId = options.id ?? randomUUID;
  const localDate = options.localDate ?? ((date: Date) => {
    const year = date.getFullYear();
    return `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  });

  function recordSnapshot(accountId: string, balanceCents: number, date: Date, createdAt: string) {
    database.prepare("INSERT INTO balance_snapshots (id, account_id, date, balance_cents, source, created_at) VALUES (?, ?, ?, ?, 'manual', ?)")
      .run(makeId(), accountId, localDate(date), balanceCents, createdAt);
  }

  return {
    list(): Account[] {
      return (database.prepare(`${selectAccounts} ORDER BY is_archived ASC, name COLLATE NOCASE ASC`).all() as AccountRow[]).map(mapAccount);
    },
    findById(id: string): Account | null {
      const row = database.prepare(`${selectAccounts} WHERE id = ?`).get(id) as AccountRow | undefined;
      return row ? mapAccount(row) : null;
    },
    listBalanceSnapshots(accountId: string): BalanceSnapshot[] {
      return database.prepare("SELECT id, date, balance_cents AS balanceCents, source, created_at AS createdAt FROM balance_snapshots WHERE account_id = ? ORDER BY date DESC, created_at DESC").all(accountId) as BalanceSnapshot[];
    },
    create(input: AccountWrite): Account {
      const id = makeId(); const date = now(); const timestamp = date.toISOString();
      database.transaction(() => {
        database.prepare("INSERT INTO accounts (id, name, institution, account_type, currency, current_balance_cents, included_in_available_cash, included_in_net_worth, is_archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)")
          .run(id, input.name, input.institution, input.accountType, input.currency, input.currentBalanceCents, Number(input.includedInAvailableCash), Number(input.includedInNetWorth), timestamp, timestamp);
        recordSnapshot(id, input.currentBalanceCents, date, timestamp);
      })();
      return this.findById(id)!;
    },
    update(id: string, input: AccountWrite): Account | null {
      const existing = this.findById(id); if (!existing) return null;
      const date = now(); const timestamp = date.toISOString();
      database.transaction(() => {
        database.prepare("UPDATE accounts SET name = ?, institution = ?, account_type = ?, currency = ?, current_balance_cents = ?, included_in_available_cash = ?, included_in_net_worth = ?, updated_at = ? WHERE id = ?")
          .run(input.name, input.institution, input.accountType, input.currency, input.currentBalanceCents, Number(input.includedInAvailableCash), Number(input.includedInNetWorth), timestamp, id);
        if (existing.currentBalanceCents !== input.currentBalanceCents) recordSnapshot(id, input.currentBalanceCents, date, timestamp);
      })();
      return this.findById(id);
    },
    archive(id: string): boolean {
      return database.prepare("UPDATE accounts SET is_archived = 1, updated_at = ? WHERE id = ? AND is_archived = 0").run(now().toISOString(), id).changes === 1;
    }
  };
}
