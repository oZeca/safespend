import type { CategorizationRule, MatchableTransaction } from "./model";

function fieldValue(transaction: MatchableTransaction, rule: CategorizationRule): string {
  if (rule.matchField === "description") return transaction.description;
  if (rule.matchField === "normalized_description") return transaction.normalizedDescription;
  return transaction.merchant ?? "";
}

export function ruleMatches(rule: CategorizationRule, transaction: MatchableTransaction): boolean {
  if (!rule.isEnabled) return false; const value = fieldValue(transaction, rule); if (!value) return false;
  if (rule.matchType === "regex") { try { return new RegExp(rule.pattern, "i").test(value); } catch { return false; } }
  const normalizedValue = value.toLocaleLowerCase("en"); const pattern = rule.pattern.toLocaleLowerCase("en");
  if (rule.matchType === "contains") return normalizedValue.includes(pattern);
  if (rule.matchType === "starts_with") return normalizedValue.startsWith(pattern);
  return normalizedValue === pattern;
}

export function findMatchingRule(rules: CategorizationRule[], transaction: MatchableTransaction): CategorizationRule | null {
  return rules.find((rule) => ruleMatches(rule, transaction)) ?? null;
}
