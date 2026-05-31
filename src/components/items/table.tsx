import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import {
  TableShell,
  tableBodyClassName,
  tableCellClassName,
  tableClassName,
  tableHeadClassName,
  tableHeaderCellClassName,
  tableNumberCellClassName,
} from "@/components/ui/data-table";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";
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
      <Panel title="물품 목록">
        <EmptyState message="조건에 맞는 물품이 없습니다." />
      </Panel>
    );
  }

  return (
    <Panel title="물품 목록">
      <TableShell label="물품 목록">
        <table className={tableClassName}>
          <thead className={tableHeadClassName}>
            <tr>
              <th className={tableHeaderCellClassName}>물품</th>
              <th className={tableHeaderCellClassName}>분류</th>
              <th className={`${tableHeaderCellClassName} text-right`}>구매</th>
              <th className={`${tableHeaderCellClassName} text-right`}>
                누적 지출
              </th>
              <th className={tableHeaderCellClassName}>최근 구매</th>
              <th className={tableHeaderCellClassName}>재구매 예상</th>
            </tr>
          </thead>
          <tbody className={tableBodyClassName}>
            {items.map((item) => (
              <tr className="active:bg-surface-soft" key={item.itemId}>
                <td className={tableCellClassName}>
                  <div className="flex min-w-56 items-center gap-3">
                    {item.imageUrl ? (
                      <img
                        alt={`${item.itemName} 이미지`}
                        className="size-11 shrink-0 rounded-md border border-hairline object-cover"
                        height={44}
                        loading="lazy"
                        src={item.imageUrl}
                        width={44}
                      />
                    ) : (
                      <div className="grid size-11 shrink-0 place-items-center rounded-md border border-hairline bg-surface-soft text-xs font-semibold text-muted">
                        {item.itemName.slice(0, 1)}
                      </div>
                    )}
                    <div>
                      <Link
                        className="font-medium text-ink underline-offset-4 active:underline"
                        href={`/items/${item.itemId}`}
                      >
                        {item.itemName}
                      </Link>
                      <p className="text-xs text-muted">{item.brand || "-"}</p>
                    </div>
                  </div>
                </td>
                <td className={tableCellClassName}>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone="amber">{item.category}</StatusPill>
                    <StatusPill tone="neutral">{item.groupLabel}</StatusPill>
                  </div>
                </td>
                <td className={tableNumberCellClassName}>
                  {item.purchaseCount}건
                </td>
                <td className={tableNumberCellClassName}>
                  {formatKrw(item.totalSpent)}
                </td>
                <td className={`${tableCellClassName} whitespace-nowrap`}>
                  {dateOrDash(item.lastPurchaseDate)}
                </td>
                <td className={`${tableCellClassName} whitespace-nowrap`}>
                  {repurchaseText(item)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </Panel>
  );
}
