"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/features/accounts/money";
import type { DashboardMonthlyPoint } from "./model";

export function MonthlyTrendChart({ data, medianSpendingCents }: { data: DashboardMonthlyPoint[]; medianSpendingCents: number | null }) {
  return <div className="h-72 w-full min-w-0 max-w-full overflow-hidden" aria-label="Monthly income, expenses, and savings chart" role="img">
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" fontSize={12} tickLine={false} />
        <YAxis fontSize={12} tickFormatter={(value: number) => `€${Math.round(value / 100)}`} tickLine={false} width={64} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} labelFormatter={(label, payload) => `${label}${payload[0]?.payload?.isForecast ? " (forecast)" : " (actual)"}`} />
        <Legend />
        {medianSpendingCents !== null && <ReferenceLine label={{ value: "Typical spending", fill: "#6b7280", fontSize: 11, position: "insideTopRight" }} stroke="#6b7280" strokeDasharray="5 4" y={medianSpendingCents} />}
        <Bar dataKey="incomeCents" fill="#047857" name="Income" radius={[3, 3, 0, 0]}>{data.map((point) => <Cell fillOpacity={point.isForecast ? 0.4 : 1} key={point.month} />)}</Bar>
        <Bar dataKey="expenseCents" fill="#b45309" name="Expenses" radius={[3, 3, 0, 0]}>{data.map((point) => <Cell fillOpacity={point.isForecast ? 0.4 : 1} key={point.month} />)}</Bar>
        <Bar dataKey="savingsCents" fill="#0369a1" name="Savings" radius={[3, 3, 0, 0]}>{data.map((point) => <Cell fillOpacity={point.isForecast ? 0.4 : 1} key={point.month} />)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>;
}
