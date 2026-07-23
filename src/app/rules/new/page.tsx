import Link from "next/link";
import { createRuleAction } from "@/features/categorization/actions";
import { RuleForm } from "@/features/categorization/rule-form";
import { getCategorizationRepository } from "@/features/categorization/server-repository";

export const dynamic = "force-dynamic";
export default async function NewRulePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams; const defaults = { name: params.name ?? "", matchField: params.matchField ?? "normalized_description", matchType: params.matchType ?? "contains", pattern: params.pattern ?? "", categoryId: params.categoryId ?? "", transactionType: params.transactionType ?? "", priority: params.priority ?? "100" };
  return <section className="mx-auto max-w-3xl space-y-6"><div><Link className="text-sm text-muted-foreground hover:text-foreground" href="/rules">← Rules</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight">Create categorization rule</h1></div><RuleForm action={createRuleAction} categories={getCategorizationRepository().categories()} defaults={defaults} /></section>;
}
