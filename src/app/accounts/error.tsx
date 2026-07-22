"use client";

import { Button } from "@/components/ui/button";

export default function AccountsError({ reset }: { reset: () => void }) {
  return <div className="mx-auto max-w-xl rounded-xl border bg-card p-8 text-center"><h1 className="text-xl font-semibold">Accounts could not be loaded</h1><p className="mt-2 text-sm text-muted-foreground">Check that database migrations have been applied, then try again.</p><Button className="mt-5" onClick={reset}>Try again</Button></div>;
}
