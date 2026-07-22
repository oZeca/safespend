"use client";
import { Button } from "@/components/ui/button";
export function DeleteTransactionButton() { return <Button className="text-red-700" onClick={(event) => { if (!window.confirm("Delete this transaction? It will be hidden but retained in the database.")) event.preventDefault(); }} size="sm" type="submit" variant="outline">Delete</Button>; }
