import type { TransactionType } from "@/features/transactions/model";

export const matchFields = ["description", "normalized_description", "merchant"] as const;
export const matchTypes = ["contains", "starts_with", "exact", "regex"] as const;
export const categorizationRulePatternMaxLength = 2_000;
export type MatchField = (typeof matchFields)[number];
export type MatchType = (typeof matchTypes)[number];

export interface CategorizationRule {
  id: string; name: string; matchField: MatchField; matchType: MatchType; pattern: string; categoryId: string; categoryName: string;
  transactionType: TransactionType | null; priority: number; isEnabled: boolean; createdAt: string; updatedAt: string;
}
export interface RuleWrite { name: string; matchField: MatchField; matchType: MatchType; pattern: string; categoryId: string; transactionType: TransactionType | null; priority: number; isEnabled: boolean; }
export interface MatchableTransaction { id?: string; description: string; normalizedDescription: string; merchant: string | null; }
export interface RuleMatchPreview { totalCount: number; items: Array<{ id: string; date: string; description: string; merchant: string | null; accountName: string }>; }
