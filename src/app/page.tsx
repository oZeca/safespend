import {
  ArrowRight,
  CalendarSync,
  Check,
  CircleCheck,
  FileUp,
  Gauge,
  Landmark,
  LockKeyhole,
  PiggyBank,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const workflow = [
  {
    icon: Landmark,
    number: "1",
    title: "Add your accounts",
    description: "Start with every account that affects your spending picture.",
    details: [
      "Enter the current balance for each account.",
      "Include current, savings, and cash accounts in available cash when appropriate.",
      "Add credit and investment accounts for a complete net-worth view.",
    ],
    href: "/accounts",
    action: "Manage accounts",
  },
  {
    icon: FileUp,
    number: "2",
    title: "Import your transactions",
    description: "Bring in a bank CSV, map its columns, and review the rows before saving.",
    details: [
      "Choose the account the file belongs to.",
      "Confirm date, description, and amount mappings.",
      "Review invalid rows and duplicates in the preview.",
    ],
    href: "/imports",
    action: "Import a CSV",
  },
  {
    icon: Tags,
    number: "3",
    title: "Review and categorize",
    description: "Check transaction types and categories so totals reflect reality.",
    details: [
      "Mark money moving between your own accounts as transfers.",
      "Split purchases when one payment belongs to several categories.",
      "Create rules for merchants and descriptions you see repeatedly.",
    ],
    href: "/transactions",
    action: "Review transactions",
  },
  {
    icon: PiggyBank,
    number: "4",
    title: "Set the plan",
    description: "Tell SafeSpend what you want to save and what must remain untouched.",
    details: [
      "Create an annual savings goal and target date.",
      "Set your minimum cash buffer.",
      "Add expected income, recurring costs, and planned expenses.",
    ],
    href: "/forecast",
    action: "Configure forecast",
  },
  {
    icon: Gauge,
    number: "5",
    title: "Use the dashboard",
    description: "Let the safe-to-spend figure guide day-to-day decisions.",
    details: [
      "Check the monthly amount first; weekly and daily values are supporting guides.",
      "Open the calculation breakdown to understand every input.",
      "Use total and category links to investigate the transactions behind them.",
    ],
    href: "/dashboard",
    action: "Open dashboard",
  },
];

export default function HomePage() {
  return (
    <div className="-my-6 sm:-my-10">
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28">
        <div
          aria-hidden="true"
          className="absolute -right-32 -top-40 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -left-40 bottom-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
              <LockKeyhole className="h-3.5 w-3.5" />
              Private by design. Your data stays local.
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
              Spend with confidence.
              <span className="block text-primary">Save with a plan.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              SafeSpend turns your accounts, transactions, and annual savings goal into one useful number:
              how much you can safely spend this month.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12 px-6 text-base">
                <Link href="/dashboard">
                  Go to dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild className="h-12 px-6 text-base" variant="outline">
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-3 rotate-2 rounded-3xl bg-primary/10" aria-hidden="true" />
            <div className="relative rounded-2xl border bg-card p-6 shadow-xl shadow-emerald-950/10 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Safe to spend this month</p>
                  <p className="mt-2 text-4xl font-bold tracking-tight text-emerald-700">€1,240</p>
                </div>
                <div className="rounded-xl bg-emerald-100 p-3 text-emerald-800">
                  <CircleCheck className="h-7 w-7" />
                </div>
              </div>
              <div className="my-6 h-px bg-border" />
              <div className="grid grid-cols-2 gap-5 text-sm">
                <div>
                  <p className="text-muted-foreground">Available cash</p>
                  <p className="mt-1 text-lg font-semibold">€4,850</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Savings target</p>
                  <p className="mt-1 text-lg font-semibold">68%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Weekly guide</p>
                  <p className="mt-1 text-lg font-semibold">€310</p>
                </div>
                <div>
                  <p className="text-muted-foreground">On track</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-700">Yes</p>
                </div>
              </div>
              <p className="mt-6 rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
                A simple preview — your dashboard always shows how its calculation was made.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-background py-16 sm:py-24" id="how-it-works">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Start here</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Set up SafeSpend in this order</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Each step gives the next one better information. Complete the setup once, then use the shorter monthly
              routine below.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {workflow.map((step) => (
              <article
                className="grid gap-5 rounded-xl border bg-card p-5 shadow-sm sm:p-6 md:grid-cols-[3rem_minmax(0,1fr)_minmax(15rem,0.85fr)]"
                key={step.number}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
                  {step.number}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <step.icon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                  <Button asChild className="mt-4" size="sm" variant="outline">
                    <Link href={step.href}>
                      {step.action}
                      <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
                <ul className="space-y-2 border-t pt-5 text-sm md:border-l md:border-t-0 md:pl-6 md:pt-0">
                  {step.details.map((detail) => (
                    <li className="flex gap-2.5 leading-5" key={detail}>
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <div className="inline-flex rounded-lg bg-emerald-100 p-2.5 text-emerald-800">
                <CalendarSync className="h-5 w-5" />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-primary">Your regular routine</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Keep it current each month</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Once setup is complete, you only need a few short check-ins to keep the guidance useful.
              </p>
            </div>

            <ol className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
              <li className="grid gap-2 p-5 sm:grid-cols-[7rem_1fr] sm:p-6">
                <p className="text-sm font-semibold text-primary">At month start</p>
                <div>
                  <p className="font-semibold">Update the plan</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Add unusual upcoming expenses, confirm expected income, and check recurring payments.
                  </p>
                </div>
              </li>
              <li className="grid gap-2 p-5 sm:grid-cols-[7rem_1fr] sm:p-6">
                <p className="text-sm font-semibold text-primary">During the month</p>
                <div>
                  <p className="font-semibold">Import and review</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Import recent transactions, clear uncategorized items, and check safe-to-spend before discretionary
                    purchases.
                  </p>
                </div>
              </li>
              <li className="grid gap-2 p-5 sm:grid-cols-[7rem_1fr] sm:p-6">
                <p className="text-sm font-semibold text-primary">At month end</p>
                <div>
                  <p className="font-semibold">Reconcile and learn</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Confirm account balances, review category spending, and adjust future assumptions where actual
                    spending differed.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-5 rounded-xl border border-emerald-200 bg-emerald-50 p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-emerald-950">Already set up?</h2>
              <p className="mt-1 text-sm text-emerald-900/75">
                Head to the dashboard and start with the safe-to-spend figure.
              </p>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/dashboard">
                Go to dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
