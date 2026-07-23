"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/features/accounts/money";
import type { TransferFormState } from "./actions";
import type { TransferCandidate, TransferLinkDetails } from "./model";

type Action = (state: TransferFormState, data: FormData) => Promise<TransferFormState>;
function SaveButton({ linked }: { linked: boolean }) { const { pending } = useFormStatus(); return <Button disabled={pending} type="submit">{pending ? "Saving…" : linked ? "Update transfer link" : "Mark as transfer"}</Button>; }
function UnlinkButton() { const { pending } = useFormStatus(); return <Button disabled={pending} type="submit" variant="outline">{pending ? "Unlinking…" : "Unlink transfer"}</Button>; }

export function TransferForm({ action, unlinkAction, amountCents, candidates, link }: {
  action: Action; unlinkAction: Action; amountCents: number; candidates: TransferCandidate[]; link: TransferLinkDetails | null;
}) {
  const [state, formAction] = useActionState(action, {});
  const [unlinkState, unlinkFormAction] = useActionState(unlinkAction, {});
  const router = useRouter();
  useEffect(() => { if (state.revision || unlinkState.revision) router.refresh(); }, [state.revision, unlinkState.revision, router]);
  const status = state.message || state.success ? state : unlinkState;
  if (link?.role === "destination") return <div className="space-y-4">
    {status.message && <p className="text-sm text-red-700" role="alert">{status.message}</p>}
    {status.success && <p className="text-sm text-emerald-800" role="status">{status.success}</p>}
    <p className="text-sm">Linked from <Link className="font-medium text-primary underline" href={`/transactions/${link.source.id}/edit`}>{link.source.description}</Link> in {link.source.accountName} ({formatCurrency(link.source.amountCents)}).</p>
    <form action={unlinkFormAction}><UnlinkButton /></form>
  </div>;
  if (amountCents >= 0) return <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Incoming transactions are linked from the outgoing transaction’s edit page.</p>;
  return <div className="space-y-4">
    {status.message && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{status.message}</div>}
    {status.success && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{status.success}</div>}
    {link && <p className="text-sm">{link.destination ? <>Linked to <Link className="font-medium text-primary underline" href={`/transactions/${link.destination.id}/edit`}>{link.destination.description}</Link> in {link.destination.accountName} ({formatCurrency(link.destination.amountCents)}).</> : "Marked as a transfer without a destination transaction."}</p>}
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex-1 space-y-2"><span className="text-sm font-medium">Destination transaction <span className="font-normal text-muted-foreground">(optional)</span></span>
        <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue={link?.destination?.id ?? ""} name="destinationTransactionId">
          <option value="">No linked destination</option>
          {candidates.map((item) => <option key={item.id} value={item.id}>{item.date} · {item.accountName} · {item.description} · {formatCurrency(item.amountCents)}</option>)}
        </select>
      </label><SaveButton linked={Boolean(link)} />
    </form>
    {!link?.destination && candidates.length === 0 && <p className="text-sm text-muted-foreground">No unlinked transaction with the exact opposite amount exists in another same-currency account.</p>}
    {link && <form action={unlinkFormAction}><UnlinkButton /></form>}
  </div>;
}
