export function formatCurrency(cents: number, currency = "EUR"): string {
  const absolute = BigInt(Math.abs(cents));
  const whole = absolute / 100n;
  const fraction = String(absolute % 100n).padStart(2, "0");
  const symbol = currency === "EUR" ? "€" : `${currency} `;
  return `${cents < 0 ? "-" : ""}${symbol}${whole.toLocaleString("en-IE")}.${fraction}`;
}
