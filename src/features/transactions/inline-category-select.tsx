"use client";

import { useState, useTransition } from "react";
import type { InlineCategoryState } from "./actions";
import type { CategoryOption } from "./model";

type InlineCategoryAction = (formData: FormData) => Promise<InlineCategoryState>;

export function InlineCategorySelect({ action, categories, categoryId, description }: {
  action: InlineCategoryAction;
  categories: CategoryOption[];
  categoryId: string | null;
  description: string;
}) {
  const [state, setState] = useState<InlineCategoryState>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId ?? "");
  const [pending, startTransition] = useTransition();
  const selectedCategoryName = categories.find((category) => category.id === selectedCategoryId)?.name ?? "Uncategorized";

  return <div className="inline-flex min-w-0 items-center gap-1.5">
    <span className="text-xs text-muted-foreground">{selectedCategoryName}</span>
    <select
      aria-label={`Category for ${description}`}
      className="h-7 min-w-0 max-w-48 rounded-md border bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60"
      disabled={pending}
      name="categoryId"
      onChange={(event) => {
        const nextCategoryId = event.currentTarget.value;
        setSelectedCategoryId(nextCategoryId);
        setState({});
        const formData = new FormData();
        formData.set("categoryId", nextCategoryId);
        startTransition(async () => setState(await action(formData)));
      }}
      value={selectedCategoryId}
    >
      <option label="Uncategorized" value="">Category</option>
      {categories.filter((category) => category.name !== "Uncategorized").map((category) => <option key={category.id} label={category.name} value={category.id}>Category</option>)}
    </select>
    <span aria-live="polite" className={`text-xs ${state.error ? "text-red-700" : "text-muted-foreground"}`}>
      {pending ? "Saving…" : state.error ?? (state.saved ? "Saved" : "")}
    </span>
  </div>;
}
