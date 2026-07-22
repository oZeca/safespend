"use client";

import { Button } from "@/components/ui/button";

export function ArchiveButton({ accountName }: { accountName: string }) {
  return <Button className="text-red-700" onClick={(event) => { if (!window.confirm(`Archive ${accountName}? Its history will be kept.`)) event.preventDefault(); }} size="sm" type="submit" variant="outline">Archive</Button>;
}
