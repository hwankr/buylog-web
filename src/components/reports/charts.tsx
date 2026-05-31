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
  CategoryShare,
  SpendingTrendPoint,
} from "@/lib/reporting/reports";

function ChartShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Panel
      accent="teal"
      title={title}
      titleAdornment={<StatusPill tone="teal">필터 반영</StatusPill>}
    >
      <div className="h-72">{children}</div>
    </Panel>
  );
}

export function ReportsSpendingTrendChart({
  data,
}: {
  data: SpendingTrendPoint[];
}) {
  if (data.length === 0) {
    return (
      <ChartShell title="월간/주간 지출 추이">
        <EmptyState message="지출 추이 데이터가 없습니다." />
      </ChartShell>
    );
  }

  return (
    <ChartShell title="월간/주간 지출 추이">
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
            axisLine={false}
            tickFormatter={(value) => `${Number(value) / 10000}만`}
            tickLine={false}
            width={48}
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

export function ReportsCategoryShareChart({ data }: { data: CategoryShare[] }) {
  if (data.length === 0) {
    return (
      <ChartShell title="카테고리별 지출 비중">
        <EmptyState message="카테고리별 지출 데이터가 없습니다." />
      </ChartShell>
    );
  }

  return (
    <ChartShell title="카테고리별 지출 비중">
      <div className="grid h-full gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              innerRadius={58}
              nameKey="category"
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
                {(entry.shareRatio * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartShell>
  );
}
