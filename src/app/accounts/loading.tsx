export default function AccountsLoading() {
  return <div className="mx-auto max-w-5xl animate-pulse space-y-5" aria-label="Loading accounts"><div className="h-9 w-56 rounded bg-muted" /><div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <div className="h-28 rounded-xl bg-muted" key={item} />)}</div><div className="h-32 rounded-xl bg-muted" /></div>;
}
