"use client";

import { useState, useTransition } from "react";
import type { InlineBalanceState } from "./actions";
import { formatMoneyInput } from "./validation";

type InlineBalanceAction = (formData: FormData) => Promise<InlineBalanceState>;

export function InlineBalanceInput({ accountName, action, balanceCents, currency }: {
  accountName: string;
  action: InlineBalanceAction;
  balanceCents: number;
  currency: string;
}) {
  const initialValue = formatMoneyInput(balanceCents);
  const [value, setValue] = useState(initialValue);
  const [savedValue, setSavedValue] = useState(initialValue);
  const [state, setState] = useState<InlineBalanceState>({});
  const [pending, startTransition] = useTransition();

  function save() {
    const nextValue = value.trim();
    if (pending || nextValue === savedValue) return;
    const formData = new FormData();
    formData.set("currentBalance", nextValue);
    setState({});
    startTransition(async () => {
      const result = await action(formData);
      setState(result);
      if (result.saved) setSavedValue(nextValue);
    });
  }

  return <div className="relative flex h-9 items-center">
    <label className="flex h-9 items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-primary">
      <span className="pl-2 text-sm text-muted-foreground">{currency === "EUR" ? "€" : currency}</span>
      <span className="sr-only">Current balance for {accountName}</span>
      <input
        aria-label={`Current balance for ${accountName}`}
        className="h-full w-28 bg-transparent px-2 text-right text-base font-semibold tabular-nums outline-none disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        inputMode="decimal"
        onBlur={save}
        onChange={(event) => { setValue(event.currentTarget.value); setState({}); }}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } }}
        value={value}
      />
    </label>
    <span aria-live="polite" className={`absolute right-0 top-full mt-1 whitespace-nowrap text-xs ${state.error ? "text-red-700" : "text-muted-foreground"}`}>
      {pending ? "Saving…" : state.error ?? (state.saved ? "Saved" : "")}
    </span>
  </div>;
}
