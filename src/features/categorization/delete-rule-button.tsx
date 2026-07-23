"use client";
import { Button } from "@/components/ui/button";
export function DeleteRuleButton({ name }: { name: string }) { return <Button className="text-red-700" onClick={(event) => { if (!window.confirm(`Delete rule ${name}? Existing categorizations will remain.`)) event.preventDefault(); }} size="sm" type="submit" variant="outline">Delete</Button>; }
