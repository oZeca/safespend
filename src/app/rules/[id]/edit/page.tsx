import Link from "next/link";
import { notFound } from "next/navigation";
import { updateRuleAction } from "@/features/categorization/actions";
import { RuleForm } from "@/features/categorization/rule-form";
import { getCategorizationRepository } from "@/features/categorization/server-repository";

export const dynamic = "force-dynamic";
export default async function EditRulePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const repository = getCategorizationRepository(); const rule = repository.findById(id); if (!rule) notFound(); return <section className="mx-auto max-w-3xl space-y-6"><div><Link className="text-sm text-muted-foreground hover:text-foreground" href="/rules">← Rules</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight">Edit rule</h1></div><RuleForm action={updateRuleAction.bind(null, id)} categories={repository.categories()} rule={rule} /></section>; }
