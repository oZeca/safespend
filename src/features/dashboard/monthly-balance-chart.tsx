"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/features/accounts/money";
import type { DashboardMonthlyBalancePoint } from "./model";

export function MonthlyBalanceChart({ data }: { data: DashboardMonthlyBalancePoint[] }) {
  const chartData = data.map((point, index) => ({
    ...point,
    actualNetWorthCents: point.isForecast ? null : point.netWorthCents,
    projectedNetWorthCents: point.isForecast || data[index + 1]?.isForecast ? point.netWorthCents : null
  }));
  return <div className="h-72 w-full min-w-0 max-w-full overflow-hidden" aria-label="Cash, investments, and total balance at the end of each month" role="img">
    <ResponsiveContainer height="100%" width="100%">
      <LineChart data={chartData} margin={{ left: 0, right: 16, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" fontSize={12} tickLine={false} />
        <YAxis fontSize={12} tickFormatter={(value: number) => `€${Math.round(value / 100)}`} tickLine={false} width={64} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} labelFormatter={(label, payload) => `${label} · ${payload[0]?.payload?.date ?? ""}`} />
        <Legend />
        <Line connectNulls={false} dataKey="actualNetWorthCents" dot={{ r: 4 }} name="Net worth" stroke="#14532d" strokeWidth={3} type="monotone" />
        <Line connectNulls={false} dataKey="projectedNetWorthCents" dot={{ r: 3 }} name="Projected net worth" stroke="#14532d" strokeDasharray="6 4" strokeWidth={3} type="monotone" />
        <Line connectNulls={false} dataKey="availableCashCents" dot={{ r: 3 }} name="Available cash" stroke="#0369a1" strokeWidth={2} type="monotone" />
        <Line connectNulls={false} dataKey="investmentBalanceCents" dot={{ r: 3 }} name="Investments" stroke="#65a30d" strokeDasharray="6 4" strokeWidth={2} type="monotone" />
      </LineChart>
    </ResponsiveContainer>
  </div>;
}
