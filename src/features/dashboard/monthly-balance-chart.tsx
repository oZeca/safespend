"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/features/accounts/money";
import type { DashboardMonthlyBalancePoint } from "./model";

const gridColor = "hsl(var(--border))";
const mutedColor = "hsl(var(--muted-foreground))";
const tooltipStyle = { backgroundColor: "hsl(var(--card))", borderColor: gridColor, borderRadius: "0.5rem", color: "hsl(var(--card-foreground))" };

export function MonthlyBalanceChart({ data }: { data: DashboardMonthlyBalancePoint[] }) {
  const chartData = data.map((point, index) => ({
    ...point,
    actualNetWorthCents: point.isForecast ? null : point.netWorthCents,
    projectedNetWorthCents: point.isForecast || data[index + 1]?.isForecast ? point.netWorthCents : null
  }));
  return <div className="h-72 w-full min-w-0 max-w-full overflow-hidden" aria-label="Cash, investments, and total balance at the end of each month" role="img">
    <ResponsiveContainer height="100%" width="100%">
      <LineChart data={chartData} margin={{ left: 0, right: 16, top: 8 }}>
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
        <XAxis axisLine={{ stroke: gridColor }} dataKey="label" fontSize={12} tick={{ fill: mutedColor }} tickLine={false} />
        <YAxis axisLine={{ stroke: gridColor }} fontSize={12} tick={{ fill: mutedColor }} tickFormatter={(value: number) => `€${Math.round(value / 100)}`} tickLine={false} width={64} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} labelFormatter={(label, payload) => `${label} · ${payload[0]?.payload?.date ?? ""}`} />
        <Legend />
        <Line connectNulls={false} dataKey="actualNetWorthCents" dot={{ r: 4 }} name="Net worth" stroke="hsl(var(--chart-net-worth))" strokeWidth={3} type="monotone" />
        <Line connectNulls={false} dataKey="projectedNetWorthCents" dot={{ r: 3 }} name="Projected net worth" stroke="hsl(var(--chart-net-worth))" strokeDasharray="6 4" strokeWidth={3} type="monotone" />
        <Line connectNulls={false} dataKey="availableCashCents" dot={{ r: 3 }} name="Available cash" stroke="hsl(var(--chart-cash))" strokeWidth={2} type="monotone" />
        <Line connectNulls={false} dataKey="investmentBalanceCents" dot={{ r: 3 }} name="Investments" stroke="hsl(var(--chart-investment))" strokeDasharray="6 4" strokeWidth={2} type="monotone" />
      </LineChart>
    </ResponsiveContainer>
  </div>;
}
