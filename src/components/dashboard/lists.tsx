import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
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
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
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
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-4 font-medium">날짜</th>
              <th className="py-2 pr-4 font-medium">품목</th>
              <th className="py-2 pr-4 font-medium">매장</th>
              <th className="py-2 pr-4 text-right font-medium">금액</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.purchaseId}>
                <td className="whitespace-nowrap py-3 pr-4 text-slate-600">
                  {formatKoreanDate(row.purchaseDate)}
                </td>
                <td className="py-3 pr-4">
                  <p className="font-medium text-slate-950">{row.itemName}</p>
                  <p className="text-xs text-slate-500">{row.brand || row.category}</p>
                </td>
                <td className="py-3 pr-4 text-slate-600">{row.storeName || "-"}</td>
                <td className="py-3 pr-4 text-right font-medium text-slate-950">
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
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li className="flex items-center justify-between gap-4 py-3" key={item.itemId}>
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-950">{item.itemName}</p>
              <p className="text-sm text-slate-500">
                {item.expectedReplacementDate
                  ? formatKoreanDate(item.expectedReplacementDate)
                  : "예상일 없음"}
                {item.remainingQuantity === null
                  ? ""
                  : ` · 남은 수량 ${item.remainingQuantity}`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-950">{item.daysUntilReplacement}일</p>
              <p className="text-sm text-slate-500">{formatKrw(item.expectedPrice)}</p>
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
      <ul className="divide-y divide-slate-100">
        {movements.map((movement) => {
          const increased = movement.deltaAmount > 0;
          const Icon = increased ? ArrowUpRight : ArrowDownRight;
          return (
            <li className="flex items-center justify-between gap-4 py-3" key={movement.itemId}>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-950">{movement.itemName}</p>
                <p className="text-sm text-slate-500">
                  {movement.previousStore || "-"} → {movement.currentStore || "-"}
                </p>
              </div>
              <div className={increased ? "text-red-600" : "text-emerald-600"}>
                <p className="flex items-center justify-end gap-1 font-semibold">
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
