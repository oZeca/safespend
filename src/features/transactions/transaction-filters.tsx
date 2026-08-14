"use client";

import { ListFilter, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { orphanedAccountFilter, transactionTypeLabels, type AccountOption, type CategoryOption } from "@/features/transactions/model";
import type { DateRangePreset } from "@/lib/dates";

type FilterParams = { search?: string; account?: string; category?: string; type?: string; accountBalance?: string; from?: string; to?: string; amountComparison?: string; amount?: string; sort?: string; page?: string; month?: string; status?: string; suggest?: string };
type Props = { params: FilterParams; accounts: AccountOption[]; categories: CategoryOption[]; datePresets: DateRangePreset[]; month: string; dateSort: string; amountFilterError: string | null };

function filterHref(params: FilterParams, changes: Partial<FilterParams>) {
  const query = new URLSearchParams(); const changedKeys = new Set(Object.keys(changes));
  for (const [key, value] of Object.entries(params)) if (value && !changedKeys.has(key) && !["page", "status", "suggest"].includes(key)) query.set(key, value);
  for (const [key, value] of Object.entries(changes)) if (value) query.set(key, value);
  const result = query.toString(); return result ? `/transactions?${result}` : "/transactions";
}

export function TransactionFilters({ params, accounts, categories, datePresets, month, dateSort, amountFilterError }: Props) {
  const router = useRouter();
  const activeCount = [params.search, params.account, params.category, params.type, params.accountBalance, params.from || params.to, params.amount].filter(Boolean).length;
  const selectClass = "h-9 min-w-0 rounded-md border bg-background px-2 text-sm";
  const inputClass = "h-10 w-full rounded-md border bg-background px-3 text-sm";
  const selectedAccount = accounts.find((account) => account.id === params.account);
  const quickAccounts = selectedAccount && !accounts.slice(0, 4).some((account) => account.id === selectedAccount.id) ? [...accounts.slice(0, 3), selectedAccount] : accounts.slice(0, 4);
  const quickTypes = [{ value: "", label: "All types" }, { value: "spending", label: "Spending" }, { value: "income", label: "Income" }, { value: "transfer", label: "Transfers" }, { value: "refund", label: "Refunds" }] as const;

  return <>
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2 shadow-sm">
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-1" aria-label="Quick filters" role="navigation">
        <div className="flex shrink-0 gap-1.5" aria-label="Quick date ranges" role="group">
          {datePresets.map((preset) => { const active = preset.from === params.from && preset.to === params.to; return <Button asChild className="shrink-0" key={preset.id} size="sm" variant={active ? "default" : "outline"}><Link aria-current={active ? "true" : undefined} href={filterHref(params, { from: preset.from, to: preset.to })}>{preset.label}</Link></Button>; })}
        </div>
        <span aria-hidden="true" className="mx-1 h-7 w-px shrink-0 self-center bg-border" />
        <div className="flex shrink-0 gap-1.5" aria-label="Quick account filters" role="group">
          <Button asChild className="shrink-0" size="sm" variant={!params.account ? "default" : "outline"}><Link aria-current={!params.account ? "true" : undefined} href={filterHref(params, { account: undefined })}>All accounts</Link></Button>
          {quickAccounts.map((account) => { const active = account.id === params.account; return <Button asChild className="shrink-0" key={account.id} size="sm" variant={active ? "default" : "outline"}><Link aria-current={active ? "true" : undefined} href={filterHref(params, { account: account.id })}>{account.name}</Link></Button>; })}
        </div>
        <span aria-hidden="true" className="mx-1 h-7 w-px shrink-0 self-center bg-border" />
        <div className="flex shrink-0 gap-1.5" aria-label="Quick transaction type filters" role="group">
          {quickTypes.map((type) => { const active = (params.type ?? "") === type.value; return <Button asChild className="shrink-0" key={type.value || "all"} size="sm" variant={active ? "default" : "outline"}><Link aria-current={active ? "true" : undefined} href={filterHref(params, { type: type.value || undefined })}>{type.label}</Link></Button>; })}
        </div>
      </div>
      <label className="order-last w-full shrink-0 sm:order-none sm:w-auto"><span className="sr-only">Quick category</span><select aria-label="Quick category" className={`${selectClass} w-full sm:w-auto`} onChange={(event) => router.push(filterHref(params, { category: event.currentTarget.value || undefined }))} value={params.category ?? ""}><option value="">All categories</option><option value="uncategorized">Uncategorized</option>{categories.filter((category) => category.name !== "Uncategorized").map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <Sheet>
        <SheetTrigger asChild><Button className="ml-auto" size="sm" variant="outline"><ListFilter className="mr-2 h-4 w-4" />Filters{activeCount > 0 && <span className="ml-2 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{activeCount}</span>}</Button></SheetTrigger>
        <SheetContent>
          <form className="flex h-full flex-col" method="get">
            <SheetHeader className="border-b px-6 py-5 pr-14"><SheetTitle>Filters</SheetTitle><SheetDescription>Refine the transaction list. Changes apply when you submit.</SheetDescription></SheetHeader>
            <div className="grid flex-1 auto-rows-min gap-4 overflow-y-auto px-6 py-5 sm:grid-cols-2">
              <label className="relative sm:col-span-2"><span className="text-sm font-medium">Search</span><Search className="absolute bottom-3 left-3 h-4 w-4 text-muted-foreground" /><input className={`${inputClass} mt-2 pl-9`} defaultValue={params.search} name="search" placeholder="Search description or merchant" /></label>
              <label><span className="text-sm font-medium">Account</span><select className={`${inputClass} mt-2`} defaultValue={params.account ?? ""} name="account"><option value="">All accounts</option><option value={orphanedAccountFilter}>Orphaned (no account)</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
              <label><span className="text-sm font-medium">Type</span><select className={`${inputClass} mt-2`} defaultValue={params.type ?? ""} name="type"><option value="">All types</option><option value="actual">Income, expenses, and refunds</option><option value="spending">Expenses and refunds</option>{Object.entries(transactionTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="sm:col-span-2"><span className="text-sm font-medium">Account balance treatment</span><select className={`${inputClass} mt-2`} defaultValue={params.accountBalance ?? ""} name="accountBalance"><option value="">All transactions</option><option value="internal">Internal movement within this account</option><option value="included">Included in calculated account balance</option></select></label>
              <label><span className="text-sm font-medium">Sort</span><select className={`${inputClass} mt-2`} defaultValue={dateSort} name="sort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
              <label><span className="text-sm font-medium">From</span><input className={`${inputClass} mt-2`} defaultValue={params.from} name="from" type="date" /></label>
              <label><span className="text-sm font-medium">To</span><input className={`${inputClass} mt-2`} defaultValue={params.to} name="to" type="date" /></label>
              <label><span className="text-sm font-medium">Amount comparison</span><select className={`${inputClass} mt-2`} defaultValue={params.amountComparison ?? "equal"} name="amountComparison"><option value="equal">Equals</option><option value="more">More than</option><option value="less">Less than</option></select></label>
              <label><span className="text-sm font-medium">Amount</span><input aria-describedby="amount-filter-help amount-filter-error" aria-invalid={amountFilterError ? true : undefined} aria-label="Transaction amount" className={`${inputClass} mt-2`} defaultValue={params.amount} inputMode="decimal" name="amount" placeholder="e.g. -50.00" /></label>
              <label><span className="text-sm font-medium">Totals month</span><input className={`${inputClass} mt-2`} defaultValue={month} name="month" type="month" /></label>
              <p className="text-xs text-muted-foreground sm:col-span-2" id="amount-filter-help">Use a negative amount for money out and a positive amount for money in.</p>
              {amountFilterError && <p className="text-sm text-red-700 sm:col-span-2" id="amount-filter-error" role="alert">{amountFilterError}</p>}
            </div>
            <div className="flex gap-2 border-t bg-background px-6 py-4"><Button className="flex-1" type="submit">Apply filters</Button><Button asChild variant="outline"><Link href="/transactions">Clear all</Link></Button></div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  </>;
}
