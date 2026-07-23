"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/features/accounts/money";
import type { DashboardMonthlyPoint } from "./model";

export function MonthlyTrendChart({ data }: { data: DashboardMonthlyPoint[] }) {
  return <div className="h-72 w-full" aria-label="Monthly income, expenses, and savings chart" role="img">
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" fontSize={12} tickLine={false} />
        <YAxis fontSize={12} tickFormatter={(value: number) => `€${Math.round(value / 100)}`} tickLine={false} width={64} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Legend />
        <Bar dataKey="incomeCents" fill="#047857" name="Income" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expenseCents" fill="#b45309" name="Expenses" radius={[3, 3, 0, 0]} />
        <Bar dataKey="savingsCents" fill="#0369a1" name="Savings" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>;
}
