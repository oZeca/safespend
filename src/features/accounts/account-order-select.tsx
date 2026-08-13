"use client";

export function AccountOrderSelect({ value }: { value: string }) {
  return (
    <form action="/accounts" method="get">
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Within type</span>
        <select
          aria-label="Order accounts by"
          className="h-8 rounded-md border bg-background px-2 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
          name="order"
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          value={value}
        >
          <option value="name">Name</option>
          <option value="balance-desc">Balance: high to low</option>
          <option value="balance-asc">Balance: low to high</option>
        </select>
      </label>
    </form>
  );
}
