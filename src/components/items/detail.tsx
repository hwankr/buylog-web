"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/empty-state";
import {
  CHART_COLORS,
  CHART_GRID_COLOR,
  CHART_TEXT_COLOR,
} from "@/components/ui/chart-theme";
import { Panel } from "@/components/ui/panel";
import { formatKoreanDate, formatKrw } from "@/lib/format";
import type {
  ItemDetail,
  ItemPurchaseHistoryRow,
} from "@/lib/items/items";

function deltaText(value: number | null) {
  if (value === null) return "-";
  const formatted = formatKrw(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatKrw(0);
}

function daysText(value: number | null) {
  if (value === null) return "예상 없음";
  if (value < 0) return `${Math.abs(value)}일 지남`;
  if (value === 0) return "오늘";
  return `${value}일 남음`;
}

function trendData(history: ItemPurchaseHistoryRow[]) {
  return [...history]
    .reverse()
    .map((row) => ({
      date: row.purchaseDate,
      label: formatKoreanDate(row.purchaseDate),
      price: row.price,
    }));
}

function PriceTrendChart({ history }: { history: ItemPurchaseHistoryRow[] }) {
  const data = trendData(history);

  if (data.length === 0) {
    return <EmptyState message="가격 변화 데이터가 없습니다." />;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer height="100%" minHeight={1} width="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_TEXT_COLOR, fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: CHART_TEXT_COLOR, fontSize: 12 }}
            tickFormatter={(value) => formatKrw(Number(value))}
            tickLine={false}
            width={72}
          />
          <Tooltip formatter={(value) => [formatKrw(Number(value)), "가격"]} />
          <Line
            dataKey="price"
            dot={{ r: 3 }}
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PurchaseHistoryTable({
  history,
}: {
  history: ItemPurchaseHistoryRow[];
}) {
  if (history.length === 0) {
    return <EmptyState message="아직 구매 이력이 없습니다." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-hairline text-xs uppercase text-muted">
          <tr>
            <th className="py-2 pr-4 font-medium">날짜</th>
            <th className="py-2 pr-4 font-medium">매장</th>
            <th className="py-2 pr-4 text-right font-medium">수량</th>
            <th className="py-2 pr-4 text-right font-medium">가격</th>
            <th className="py-2 pr-4 text-right font-medium">변화</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline-soft">
          {history.map((row) => {
            const increased = (row.priceDelta ?? 0) > 0;
            const decreased = (row.priceDelta ?? 0) < 0;
            const Icon = increased ? ArrowUpRight : ArrowDownRight;
            return (
              <tr key={row.purchaseId}>
                <td className="whitespace-nowrap py-3 pr-4 text-body">
                  {formatKoreanDate(row.purchaseDate)}
                </td>
                <td className="py-3 pr-4 text-body">{row.storeName}</td>
                <td className="py-3 pr-4 text-right text-body">
                  {row.quantity}
                </td>
                <td className="py-3 pr-4 text-right font-medium text-ink">
                  {formatKrw(row.price)}
                </td>
                <td
                  className={[
                    "py-3 pr-4 text-right font-medium",
                    increased ? "text-error" : "",
                    decreased ? "text-success" : "",
                    !increased && !decreased ? "text-muted" : "",
                  ].join(" ")}
                >
                  <span className="inline-flex items-center justify-end gap-1">
                    {row.priceDelta === null ? null : (
                      <Icon aria-hidden="true" className="size-4" />
                    )}
                    {deltaText(row.priceDelta)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ItemDetailPanel({
  item,
  history,
}: {
  item: ItemDetail;
  history: ItemPurchaseHistoryRow[];
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-4">
        <Panel description={item.groupLabel} title="소속">
          <p className="text-2xl font-medium text-ink">{item.category}</p>
        </Panel>
        <Panel description="전체 구매 횟수" title="구매">
          <p className="text-2xl font-medium text-ink">{item.purchaseCount}건</p>
        </Panel>
        <Panel description="누적 지출" title="금액">
          <p className="text-2xl font-medium text-ink">
            {formatKrw(item.totalSpent)}
          </p>
        </Panel>
        <Panel
          description={item.expectedRepurchaseDate ?? "예상 없음"}
          title="재구매 예상"
        >
          <p className="text-2xl font-medium text-ink">
            {daysText(item.daysUntilRepurchase)}
          </p>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="가격 변화">
          <PriceTrendChart history={history} />
        </Panel>
        <Panel title="가격 요약">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">평균가</dt>
              <dd className="font-medium text-ink">
                {formatKrw(item.averagePrice)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">최저가</dt>
              <dd className="font-medium text-ink">{formatKrw(item.minPrice)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">최고가</dt>
              <dd className="font-medium text-ink">{formatKrw(item.maxPrice)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">최근 구매처</dt>
              <dd className="font-medium text-ink">{item.lastStoreName}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Panel title="구매 이력">
        <PurchaseHistoryTable history={history} />
      </Panel>
    </div>
  );
}
