import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePlannedExpenseAction } from "@/features/forecasting/actions";
import { PlannedExpenseForm } from "@/features/forecasting/forecast-forms";
import { getForecastRepository } from "@/features/forecasting/server-repository";

export const dynamic = "force-dynamic";

export default async function EditPlannedExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getForecastRepository().findPlannedExpenseById(id);
  if (!item) notFound();
  return <section className="mx-auto max-w-3xl space-y-6"><div><Link className="text-sm text-muted-foreground hover:text-foreground" href="/forecast">← Forecast</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight">Edit planned expense</h1><p className="mt-2 text-sm text-muted-foreground">Changes update the safe-to-spend forecast immediately.</p></div><PlannedExpenseForm action={updatePlannedExpenseAction.bind(null, id)} defaultDate={item.expectedDate} item={item} /></section>;
}
