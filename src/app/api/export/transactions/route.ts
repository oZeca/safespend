import { getAppDatabase } from "@/db/app-database";
import { exportTransactionsCsv } from "@/features/release/csv-export";
import { localDateString } from "@/lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    const csv = exportTransactionsCsv(getAppDatabase());
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="safespend-transactions-${localDateString()}.csv"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("Failed to export transactions", error);
    return Response.json({ error: "Transactions could not be exported." }, { status: 500 });
  }
}
