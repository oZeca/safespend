import { getAppDatabase } from "@/db/app-database";
import { getDatabaseHealth } from "@/db/queries/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    return Response.json(getDatabaseHealth(getAppDatabase()), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
