export function localDateString(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function localMonthString(date = new Date()): string { return localDateString(date).slice(0, 7); }

export type DateRangePreset = {
  id: "this-month" | "last-month" | "last-30-days" | "this-quarter" | "year-to-date" | "all-time";
  label: string;
  from?: string;
  to?: string;
};

export function transactionDateRangePresets(today = new Date()): DateRangePreset[] {
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayString = localDateString(today);

  return [
    { id: "this-month", label: "This month", from: localDateString(new Date(year, month, 1)), to: localDateString(new Date(year, month + 1, 0)) },
    { id: "last-month", label: "Last month", from: localDateString(new Date(year, month - 1, 1)), to: localDateString(new Date(year, month, 0)) },
    { id: "last-30-days", label: "Last 30 days", from: localDateString(new Date(year, month, today.getDate() - 29)), to: todayString },
    { id: "this-quarter", label: "This quarter", from: localDateString(new Date(year, Math.floor(month / 3) * 3, 1)), to: todayString },
    { id: "year-to-date", label: "Year to date", from: `${year}-01-01`, to: todayString },
    { id: "all-time", label: "All time" },
  ];
}
