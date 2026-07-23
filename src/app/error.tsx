"use client";

import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { reset: () => void }) {
  return <div className="mx-auto max-w-xl rounded-xl border bg-card p-8 text-center"><h1 className="text-xl font-semibold">SafeSpend hit an unexpected error</h1><p className="mt-2 text-sm text-muted-foreground">Your data has not been intentionally changed. Try the request again, then check the local server logs if it continues.</p><Button className="mt-5" onClick={reset}>Try again</Button></div>;
}
