"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/features/accounts/money";
import type { MonthlyAssumptionPoint } from "./model";

const gridColor = "hsl(var(--border))";
const mutedColor = "hsl(var(--muted-foreground))";
const tooltipStyle = { backgroundColor: "hsl(var(--card))", borderColor: gridColor, borderRadius: "0.5rem", color: "hsl(var(--card-foreground))" };

function CurrencyAxis({ value }: { value: number }) {
  return `€${Math.round(value / 100)}`;
}

export function PlannedCashFlowChart({ data, compact = false }: { data: MonthlyAssumptionPoint[]; compact?: boolean }) {
  return <div className={`${compact ? "h-56" : "h-72"} w-full min-w-0 max-w-full overflow-hidden`} aria-label="Monthly planned income and expenses chart" role="img">
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
        <XAxis axisLine={{ stroke: gridColor }} dataKey="label" fontSize={12} tick={{ fill: mutedColor }} tickLine={false} />
        <YAxis axisLine={{ stroke: gridColor }} fontSize={12} tick={{ fill: mutedColor }} tickFormatter={(value: number) => CurrencyAxis({ value })} tickLine={false} width={64} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted) / 0.45)" }} formatter={(value, name) => [formatCurrency(Number(value)), String(name)]} labelFormatter={(label) => `${label} planned cash flow`} />
        {!compact && <Legend />}
        <Bar dataKey="expectedIncomeCents" fill="hsl(var(--chart-income))" name="Expected income" radius={[3, 3, 0, 0]} stackId="income" />
        <Bar dataKey="recurringIncomeCents" fill="hsl(var(--chart-income-secondary))" name="Recurring income" radius={[3, 3, 0, 0]} stackId="income" />
        <Bar dataKey="plannedExpenseCents" fill="hsl(var(--chart-expense))" name="Planned expenses" radius={[3, 3, 0, 0]} stackId="expense" />
        <Bar dataKey="recurringExpenseCents" fill="hsl(var(--chart-expense-secondary))" name="Recurring expenses" radius={[3, 3, 0, 0]} stackId="expense" />
      </BarChart>
    </ResponsiveContainer>
  </div>;
}

export function RecurringScheduleChart({ data }: { data: MonthlyAssumptionPoint[] }) {
  return <div className="h-64 w-full min-w-0 max-w-full overflow-hidden" aria-label="Monthly recurring income and expenses chart" role="img">
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
        <XAxis axisLine={{ stroke: gridColor }} dataKey="label" fontSize={12} tick={{ fill: mutedColor }} tickLine={false} />
        <YAxis axisLine={{ stroke: gridColor }} fontSize={12} tick={{ fill: mutedColor }} tickFormatter={(value: number) => CurrencyAxis({ value })} tickLine={false} width={64} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted) / 0.45)" }} formatter={(value, name) => [formatCurrency(Number(value)), String(name)]} labelFormatter={(label) => `${label} recurring schedule`} />
        <Legend />
        <Bar dataKey="recurringIncomeCents" fill="hsl(var(--chart-income))" name="Recurring income" radius={[3, 3, 0, 0]} />
        <Bar dataKey="recurringExpenseCents" fill="hsl(var(--chart-expense))" name="Recurring expenses" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>;
}
