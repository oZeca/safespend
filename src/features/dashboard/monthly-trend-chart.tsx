"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/features/accounts/money";
import type { DashboardMonthlyPoint } from "./model";

const gridColor = "hsl(var(--border))";
const mutedColor = "hsl(var(--muted-foreground))";
const tooltipStyle = { backgroundColor: "hsl(var(--card))", borderColor: gridColor, borderRadius: "0.5rem", color: "hsl(var(--card-foreground))" };

export function MonthlyTrendChart({ data, medianSpendingCents }: { data: DashboardMonthlyPoint[]; medianSpendingCents: number | null }) {
  return <div className="h-72 w-full min-w-0 max-w-full overflow-hidden" aria-label="Monthly income, expenses, and savings chart" role="img">
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
        <XAxis axisLine={{ stroke: gridColor }} dataKey="label" fontSize={12} tick={{ fill: mutedColor }} tickLine={false} />
        <YAxis axisLine={{ stroke: gridColor }} fontSize={12} tick={{ fill: mutedColor }} tickFormatter={(value: number) => `€${Math.round(value / 100)}`} tickLine={false} width={64} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted) / 0.45)" }} formatter={(value) => formatCurrency(Number(value))} labelFormatter={(label, payload) => `${label}${payload[0]?.payload?.isForecast ? " (forecast)" : " (actual)"}`} />
        <Legend />
        {medianSpendingCents !== null && <ReferenceLine label={{ value: "Typical spending", fill: mutedColor, fontSize: 11, position: "insideTopRight" }} stroke={mutedColor} strokeDasharray="5 4" y={medianSpendingCents} />}
        <Bar dataKey="incomeCents" fill="hsl(var(--chart-income))" name="Income" radius={[3, 3, 0, 0]}>{data.map((point) => <Cell fillOpacity={point.isForecast ? 0.4 : 1} key={point.month} />)}</Bar>
        <Bar dataKey="expenseCents" fill="hsl(var(--chart-expense))" name="Expenses" radius={[3, 3, 0, 0]}>{data.map((point) => <Cell fillOpacity={point.isForecast ? 0.4 : 1} key={point.month} />)}</Bar>
        <Bar dataKey="savingsCents" fill="hsl(var(--chart-savings))" name="Savings" radius={[3, 3, 0, 0]}>{data.map((point) => <Cell fillOpacity={point.isForecast ? 0.4 : 1} key={point.month} />)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>;
}
