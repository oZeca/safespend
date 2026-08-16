"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/features/accounts/money";
import type { MonthlyAssumptionPoint } from "./model";

function CurrencyAxis({ value }: { value: number }) {
  return `€${Math.round(value / 100)}`;
}

export function PlannedCashFlowChart({ data, compact = false }: { data: MonthlyAssumptionPoint[]; compact?: boolean }) {
  return <div className={`${compact ? "h-56" : "h-72"} w-full min-w-0 max-w-full overflow-hidden`} aria-label="Monthly planned income and expenses chart" role="img">
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" fontSize={12} tickLine={false} />
        <YAxis fontSize={12} tickFormatter={(value: number) => CurrencyAxis({ value })} tickLine={false} width={64} />
        <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), String(name)]} labelFormatter={(label) => `${label} planned cash flow`} />
        {!compact && <Legend />}
        <Bar dataKey="expectedIncomeCents" fill="#047857" name="Expected income" radius={[3, 3, 0, 0]} stackId="income" />
        <Bar dataKey="recurringIncomeCents" fill="#6ee7b7" name="Recurring income" radius={[3, 3, 0, 0]} stackId="income" />
        <Bar dataKey="plannedExpenseCents" fill="#b45309" name="Planned expenses" radius={[3, 3, 0, 0]} stackId="expense" />
        <Bar dataKey="recurringExpenseCents" fill="#fbbf24" name="Recurring expenses" radius={[3, 3, 0, 0]} stackId="expense" />
      </BarChart>
    </ResponsiveContainer>
  </div>;
}

export function RecurringScheduleChart({ data }: { data: MonthlyAssumptionPoint[] }) {
  return <div className="h-64 w-full min-w-0 max-w-full overflow-hidden" aria-label="Monthly recurring income and expenses chart" role="img">
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" fontSize={12} tickLine={false} />
        <YAxis fontSize={12} tickFormatter={(value: number) => CurrencyAxis({ value })} tickLine={false} width={64} />
        <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), String(name)]} labelFormatter={(label) => `${label} recurring schedule`} />
        <Legend />
        <Bar dataKey="recurringIncomeCents" fill="#047857" name="Recurring income" radius={[3, 3, 0, 0]} />
        <Bar dataKey="recurringExpenseCents" fill="#b45309" name="Recurring expenses" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>;
}
