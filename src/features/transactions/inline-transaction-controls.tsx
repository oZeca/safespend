"use client";

import { useEffect, useState, useTransition } from "react";
import type { ReactNode } from "react";
import type { InlineTransactionState } from "./actions";
import {
  transactionTypeLabels,
  transactionTypes,
  type TransactionType,
} from "./model";

type InlineAction = (formData: FormData) => Promise<InlineTransactionState>;

function Status({
  pending,
  state,
}: {
  pending: boolean;
  state: InlineTransactionState;
}) {
  return (
    <span
      aria-live="polite"
      className={`text-xs ${state.error ? "text-red-700" : "text-muted-foreground"}`}
    >
      {pending ? "Saving…" : (state.error ?? (state.saved ? "Saved" : ""))}
    </span>
  );
}

export function InlineTransactionControls({
  balanceAction,
  categoryControl,
  categoryIsTransfer,
  description,
  excludedFromAccountBalance,
  transactionType,
  typeAction,
}: {
  balanceAction: InlineAction;
  categoryControl: ReactNode;
  categoryIsTransfer: boolean;
  description: string;
  excludedFromAccountBalance: boolean;
  transactionType: TransactionType;
  typeAction: InlineAction;
}) {
  const [selectedType, setSelectedType] = useState(transactionType);
  const [isInternal, setIsInternal] = useState(excludedFromAccountBalance);
  const [typeState, setTypeState] = useState<InlineTransactionState>({});
  const [balanceState, setBalanceState] = useState<InlineTransactionState>({});
  const [typePending, startTypeTransition] = useTransition();
  const [balancePending, startBalanceTransition] = useTransition();

  useEffect(() => setSelectedType(transactionType), [transactionType]);
  useEffect(
    () => setIsInternal(excludedFromAccountBalance),
    [excludedFromAccountBalance],
  );

  return (
    <div className="contents">
      <div className="inline-flex min-w-0 items-center gap-1.5">
        <select
          aria-label={`Type for ${description}`}
          className="h-7 min-w-0 rounded-md border bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60"
          disabled={typePending || categoryIsTransfer}
          onChange={(event) => {
            const previousType = selectedType;
            const nextType = event.currentTarget.value as TransactionType;
            setSelectedType(nextType);
            setTypeState({});
            const formData = new FormData();
            formData.set("transactionType", nextType);
            startTypeTransition(async () => {
              const result = await typeAction(formData);
              setTypeState(result);
              if (result.error) setSelectedType(previousType);
            });
          }}
          value={selectedType}
        >
          {transactionTypes.map((type) => (
            <option key={type} value={type}>
              {transactionTypeLabels[type]}
            </option>
          ))}
        </select>
        <Status pending={typePending} state={typeState} />
      </div>
      {categoryControl}
      <div className="inline-flex min-w-0 items-center gap-1.5">
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-[10px] leading-tight text-foreground">
          <input
            aria-label={`Internal movement within this account for ${description}`}
            checked={isInternal}
            className="h-4 w-4 accent-emerald-700 disabled:cursor-wait disabled:opacity-60"
            disabled={balancePending}
            onChange={(event) => {
              const previousValue = isInternal;
              const nextValue = event.currentTarget.checked;
              setIsInternal(nextValue);
              setBalanceState({});
              const formData = new FormData();
              formData.set("excludedFromAccountBalance", String(nextValue));
              startBalanceTransition(async () => {
                const result = await balanceAction(formData);
                setBalanceState(result);
                if (result.error) setIsInternal(previousValue);
              });
            }}
            type="checkbox"
          />
          Internal movement
        </label>
        <Status pending={balancePending} state={balanceState} />
      </div>
    </div>
  );
}
