import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Panel } from "@/components/ui/panel";
import { formatKoreanDate, formatKrw } from "@/lib/format";
import type { ItemListRow } from "@/lib/items/items";

function dateOrDash(value: string | null) {
  return value ? formatKoreanDate(value) : "-";
}

function repurchaseText(item: ItemListRow) {
  if (!item.expectedRepurchaseDate) return "-";
  if (item.daysUntilRepurchase === null) {
    return formatKoreanDate(item.expectedRepurchaseDate);
  }
  if (item.daysUntilRepurchase < 0) {
    return `${Math.abs(item.daysUntilRepurchase)}일 지남`;
  }
  if (item.daysUntilRepurchase === 0) return "오늘";
  return formatKoreanDate(item.expectedRepurchaseDate);
}

export function ItemsTable({ items }: { items: ItemListRow[] }) {
  if (items.length === 0) {
    return (
      <Panel title="품목 목록">
        <EmptyState message="조건에 맞는 품목이 없습니다." />
      </Panel>
    );
  }

  return (
    <Panel title="품목 목록">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-hairline text-xs uppercase text-muted">
            <tr>
              <th className="py-2 pr-4 font-medium">품목</th>
              <th className="py-2 pr-4 font-medium">카테고리</th>
              <th className="py-2 pr-4 font-medium">그룹</th>
              <th className="py-2 pr-4 text-right font-medium">구매</th>
              <th className="py-2 pr-4 text-right font-medium">누적 지출</th>
              <th className="py-2 pr-4 font-medium">최근 구매</th>
              <th className="py-2 pr-4 font-medium">재구매 예상</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {items.map((item) => (
              <tr key={item.itemId}>
                <td className="py-3 pr-4">
                  <Link
                    className="font-medium text-ink underline-offset-4 active:underline"
                    href={`/items/${item.itemId}`}
                  >
                    {item.itemName}
                  </Link>
                  <p className="text-xs text-muted">{item.brand || "-"}</p>
                </td>
                <td className="py-3 pr-4 text-body">{item.category}</td>
                <td className="py-3 pr-4 text-body">{item.groupLabel}</td>
                <td className="py-3 pr-4 text-right text-body">
                  {item.purchaseCount}건
                </td>
                <td className="py-3 pr-4 text-right font-medium text-ink">
                  {formatKrw(item.totalSpent)}
                </td>
                <td className="whitespace-nowrap py-3 pr-4 text-body">
                  {dateOrDash(item.lastPurchaseDate)}
                </td>
                <td className="whitespace-nowrap py-3 pr-4 text-body">
                  {repurchaseText(item)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
