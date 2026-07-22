export default function DashboardPage() {
  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div><p className="text-sm font-medium text-primary">Dashboard</p><h1 className="text-3xl font-semibold tracking-tight">Your safe-to-spend overview</h1></div>
      <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm text-muted-foreground">Safe to spend this month</p>
        <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Not calculated yet</p>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">The foundation is ready. Accounts, transactions, savings goals, and forecast calculations arrive in later implementation tasks.</p>
      </div>
    </section>
  );
}
