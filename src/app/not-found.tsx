import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <div className="mx-auto max-w-xl rounded-xl border bg-card p-8 text-center"><h1 className="text-xl font-semibold">Page not found</h1><p className="mt-2 text-sm text-muted-foreground">The requested SafeSpend page or record does not exist.</p><Button asChild className="mt-5"><Link href="/dashboard">Return to dashboard</Link></Button></div>;
}
