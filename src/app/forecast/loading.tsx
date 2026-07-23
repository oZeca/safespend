export default function ForecastLoading() {
  return <div className="mx-auto max-w-5xl animate-pulse space-y-5" aria-label="Loading forecast"><div className="h-9 w-72 rounded bg-muted" /><div className="h-80 rounded-xl bg-muted" /><div className="grid gap-5 sm:grid-cols-2"><div className="h-64 rounded-xl bg-muted" /><div className="h-64 rounded-xl bg-muted" /></div></div>;
}
