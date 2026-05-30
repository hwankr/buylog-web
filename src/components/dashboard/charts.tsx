"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/empty-state";
import { formatKrw } from "@/lib/format";
import type { CategorySpending, MonthlySpendingPoint } from "@/lib/reporting/dashboard";

const COLORS = ["#0f172a", "#2563eb", "#059669", "#d97706", "#7c3aed", "#dc2626"];

type ChartShellProps = {
  title: string;
  children: React.ReactNode;
};

function ChartShell({ title, children }: ChartShellProps) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 h-72">{children}</div>
    </section>
  );
}

export function MonthlySpendingChart({ data }: { data: MonthlySpendingPoint[] }) {
  if (data.length === 0) {
    return (
      <ChartShell title="월간 지출 추이">
        <EmptyState message="월간 지출 데이터가 없습니다." />
      </ChartShell>
    );
  }

  return (
    <ChartShell title="월간 지출 추이">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={(value) => `${Number(value) / 10000}만`}
            width={48}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip formatter={(value) => formatKrw(Number(value))} />
          <Bar dataKey="totalAmount" fill="#0f172a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function CategoryChart({ data }: { data: CategorySpending[] }) {
  if (data.length === 0) {
    return (
      <ChartShell title="카테고리별 지출">
        <EmptyState message="카테고리 지출 데이터가 없습니다." />
      </ChartShell>
    );
  }

  return (
    <ChartShell title="카테고리별 지출">
      <div className="grid h-full gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              innerRadius={58}
              outerRadius={96}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell fill={COLORS[index % COLORS.length]} key={entry.category} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatKrw(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
        <ul className="space-y-2 self-center">
          {data.map((entry, index) => (
            <li className="flex items-center justify-between gap-3 text-sm" key={entry.category}>
              <span className="flex min-w-0 items-center gap-2 text-slate-600">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="truncate">{entry.category}</span>
              </span>
              <span className="font-medium text-slate-950">{formatKrw(entry.amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartShell>
  );
}
