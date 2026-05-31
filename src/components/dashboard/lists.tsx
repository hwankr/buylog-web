import { ArrowDownRight, ArrowUpRight } from "lucide-react";

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
import { formatKoreanDate, formatKrw } from "@/lib/format";
import type {
  PriceMovement,
  RecentPurchase,
  ReplacementDueItem,
} from "@/lib/reporting/dashboard";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return <Panel title={title}>{children}</Panel>;
}

export function RecentPurchaseTable({ rows }: { rows: RecentPurchase[] }) {
  if (rows.length === 0) {
    return (
      <Section title="최근 구매 이력">
        <EmptyState message="최근 구매 이력이 없습니다." />
      </Section>
    );
  }

  return (
    <Section title="최근 구매 이력">
      <TableShell label="최근 구매 이력">
        <table className={tableClassName}>
          <thead className={tableHeadClassName}>
            <tr>
              <th className={tableHeaderCellClassName}>날짜</th>
              <th className={tableHeaderCellClassName}>물품</th>
              <th className={tableHeaderCellClassName}>매장</th>
              <th className={`${tableHeaderCellClassName} text-right`}>금액</th>
            </tr>
          </thead>
          <tbody className={tableBodyClassName}>
            {rows.map((row) => (
              <tr className="active:bg-surface-soft" key={row.purchaseId}>
                <td className={`${tableCellClassName} whitespace-nowrap`}>
                  {formatKoreanDate(row.purchaseDate)}
                </td>
                <td className={tableCellClassName}>
                  <p className="font-medium text-ink">{row.itemName}</p>
                  <p className="text-xs text-muted">
                    {row.brand || row.category}
                  </p>
                </td>
                <td className={tableCellClassName}>{row.storeName || "-"}</td>
                <td className={tableNumberCellClassName}>
                  {formatKrw(row.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </Section>
  );
}

export function ReplacementDueList({ items }: { items: ReplacementDueItem[] }) {
  if (items.length === 0) {
    return (
      <Section title="교체 임박 물품">
        <EmptyState message="교체 임박 물품이 없습니다." />
      </Section>
    );
  }

  return (
    <Section title="교체 임박 물품">
      <ul className="divide-y divide-hairline-soft">
        {items.map((item) => (
          <li
            className="flex items-center justify-between gap-4 py-3"
            key={item.itemId}
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{item.itemName}</p>
              <p className="text-sm text-muted">
                {item.expectedReplacementDate
                  ? formatKoreanDate(item.expectedReplacementDate)
                  : "예상일 없음"}
                {item.remainingQuantity === null
                  ? ""
                  : ` · 남은 수량 ${item.remainingQuantity}`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium text-ink">
                {item.daysUntilReplacement}일
              </p>
              <p className="text-sm text-muted">{formatKrw(item.expectedPrice)}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function PriceMovementList({ movements }: { movements: PriceMovement[] }) {
  if (movements.length === 0) {
    return (
      <Section title="가격 변동">
        <EmptyState message="가격 변동이 감지된 물품이 없습니다." />
      </Section>
    );
  }

  return (
    <Section title="가격 변동">
      <ul className="divide-y divide-hairline-soft">
        {movements.map((movement) => {
          const increased = movement.deltaAmount > 0;
          const Icon = increased ? ArrowUpRight : ArrowDownRight;
          return (
            <li
              className="flex items-center justify-between gap-4 py-3"
              key={movement.itemId}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">
                  {movement.itemName}
                </p>
                <p className="text-sm text-muted">
                  {movement.previousStore || "-"} → {movement.currentStore || "-"}
                </p>
              </div>
              <div className={increased ? "text-error" : "text-success"}>
                <p className="flex items-center justify-end gap-1 font-medium">
                  <Icon className="size-4" aria-hidden="true" />
                  {formatKrw(Math.abs(movement.deltaAmount))}
                </p>
                <p className="text-right text-sm">
                  {formatKrw(movement.previousPrice)} →{" "}
                  {formatKrw(movement.currentPrice)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
