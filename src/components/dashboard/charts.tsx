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
import {
  CHART_BAR_RADIUS,
  CHART_COLORS,
  CHART_GRID_COLOR,
  CHART_TEXT_COLOR,
} from "@/components/ui/chart-theme";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";
import { formatKrw } from "@/lib/format";
import type {
  CategorySpending,
  MonthlySpendingPoint,
} from "@/lib/reporting/dashboard";

type ChartShellProps = {
  title: string;
  children: React.ReactNode;
};

function ChartShell({ title, children }: ChartShellProps) {
  return (
    <Panel
      accent="coral"
      title={title}
      titleAdornment={<StatusPill tone="primary">최근 데이터</StatusPill>}
    >
      <div className="h-72">{children}</div>
    </Panel>
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
          <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: CHART_TEXT_COLOR }}
          />
          <YAxis
            tickFormatter={(value) => `${Number(value) / 10000}만`}
            width={48}
            tickLine={false}
            axisLine={false}
            tick={{ fill: CHART_TEXT_COLOR }}
          />
          <Tooltip formatter={(value) => formatKrw(Number(value))} />
          <Bar
            dataKey="totalAmount"
            fill={CHART_COLORS[0]}
            radius={CHART_BAR_RADIUS}
          />
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
                <Cell
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  key={entry.category}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatKrw(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
        <ul className="space-y-2 self-center">
          {data.map((entry, index) => (
            <li
              className="flex items-center justify-between gap-3 text-sm"
              key={entry.category}
            >
              <span className="flex min-w-0 items-center gap-2 text-body">
                <span
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <span className="truncate">{entry.category}</span>
              </span>
              <span className="font-medium text-ink">
                {formatKrw(entry.amount)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartShell>
  );
}
