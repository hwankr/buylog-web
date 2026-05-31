import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
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
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-hairline text-xs uppercase text-muted">
            <tr>
              <th className="py-2 pr-4 font-medium">날짜</th>
              <th className="py-2 pr-4 font-medium">품목</th>
              <th className="py-2 pr-4 font-medium">매장</th>
              <th className="py-2 pr-4 text-right font-medium">금액</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {rows.map((row) => (
              <tr key={row.purchaseId}>
                <td className="whitespace-nowrap py-3 pr-4 text-body">
                  {formatKoreanDate(row.purchaseDate)}
                </td>
                <td className="py-3 pr-4">
                  <p className="font-medium text-ink">{row.itemName}</p>
                  <p className="text-xs text-muted">{row.brand || row.category}</p>
                </td>
                <td className="py-3 pr-4 text-body">{row.storeName || "-"}</td>
                <td className="py-3 pr-4 text-right font-medium text-ink">
                  {formatKrw(row.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function ReplacementDueList({ items }: { items: ReplacementDueItem[] }) {
  if (items.length === 0) {
    return (
      <Section title="교체 임박 품목">
        <EmptyState message="교체 임박 품목이 없습니다." />
      </Section>
    );
  }

  return (
    <Section title="교체 임박 품목">
      <ul className="divide-y divide-hairline-soft">
        {items.map((item) => (
          <li className="flex items-center justify-between gap-4 py-3" key={item.itemId}>
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
              <p className="font-medium text-ink">{item.daysUntilReplacement}일</p>
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
        <EmptyState message="가격 변동이 감지된 품목이 없습니다." />
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
            <li className="flex items-center justify-between gap-4 py-3" key={movement.itemId}>
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{movement.itemName}</p>
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
                  {formatKrw(movement.previousPrice)} → {formatKrw(movement.currentPrice)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
