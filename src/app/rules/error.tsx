"use client";
import { Button } from "@/components/ui/button";
export default function RulesError({ reset }: { reset: () => void }) { return <div className="mx-auto max-w-xl rounded-xl border bg-card p-8 text-center"><h1 className="text-xl font-semibold">Rules could not be loaded</h1><p className="mt-2 text-sm text-muted-foreground">Check the database and try again.</p><Button className="mt-5" onClick={reset}>Try again</Button></div>; }
