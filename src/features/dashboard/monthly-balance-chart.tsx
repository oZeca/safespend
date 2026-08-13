"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/features/accounts/money";
import type { DashboardMonthlyBalancePoint } from "./model";

export function MonthlyBalanceChart({ data }: { data: DashboardMonthlyBalancePoint[] }) {
  return <div className="h-72 w-full min-w-0 max-w-full overflow-hidden" aria-label="Available cash at the end of each month" role="img">
    <ResponsiveContainer height="100%" width="100%">
      <LineChart data={data} margin={{ left: 0, right: 16, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" fontSize={12} tickLine={false} />
        <YAxis fontSize={12} tickFormatter={(value: number) => `€${Math.round(value / 100)}`} tickLine={false} width={64} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} labelFormatter={(label, payload) => `${label} · ${payload[0]?.payload?.date ?? ""}`} />
        <Line connectNulls={false} dataKey="balanceCents" dot={{ r: 4 }} name="Available cash" stroke="#0369a1" strokeWidth={3} type="monotone" />
      </LineChart>
    </ResponsiveContainer>
  </div>;
}
