"use client";

import { Button } from "@/components/ui/button";

export function ArchiveButton({ accountName }: { accountName: string }) {
  return <Button className="h-9 w-full justify-start border-0 px-3 text-red-700 shadow-none hover:bg-red-50" onClick={(event) => { if (!window.confirm(`Archive ${accountName}? Its history will be kept.`)) event.preventDefault(); }} size="sm" type="submit" variant="outline">Archive account</Button>;
}
