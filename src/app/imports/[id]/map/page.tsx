import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MappingForm } from "@/features/imports/mapping-form";
import { getImportRepository } from "@/features/imports/server-repository";

export const dynamic = "force-dynamic";
export default async function MapImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const detail = getImportRepository().findById(id); if (!detail) notFound(); if (detail.status !== "mapping") redirect(`/imports/${id}/preview`);
  const headers = Object.keys(detail.rows[0]?.original ?? {});
  return <section className="mx-auto max-w-3xl space-y-6"><div><Link className="text-sm text-muted-foreground hover:text-foreground" href="/imports">← Imports</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight">Map CSV columns</h1><p className="mt-2 text-sm text-muted-foreground">{detail.fileName} · {detail.rowCount} rows · {detail.accountName}</p></div>
    <div className="rounded-md bg-muted p-4 text-sm"><p className="font-medium">Detected headers</p><p className="mt-1 break-words text-muted-foreground">{headers.join(" · ")}</p></div><MappingForm delimiter={detail.detectedDelimiter} headers={headers} importId={id} /></section>;
}
