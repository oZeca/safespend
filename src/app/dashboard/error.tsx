"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { reset: () => void }) {
  return <div className="mx-auto max-w-xl rounded-xl border bg-card p-8 text-center"><h1 className="text-xl font-semibold">Dashboard could not be calculated</h1><p className="mt-2 text-sm text-muted-foreground">Check the database and forecast assumptions, then try again.</p><Button className="mt-5" onClick={reset}>Try again</Button></div>;
}
