import { EmptyState } from "@/components/empty-state";
import { Panel } from "@/components/ui/panel";
import { formatKrw } from "@/lib/format";
import type { ItemSpending, StoreSpending } from "@/lib/reporting/reports";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return <Panel title={title}>{children}</Panel>;
}

export function ReportItemSpendingTable({ items }: { items: ItemSpending[] }) {
  if (items.length === 0) {
    return (
      <Section title="품목별 누적 지출">
        <EmptyState message="품목별 지출 데이터가 없습니다." />
      </Section>
    );
  }

  return (
    <Section title="품목별 누적 지출">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-hairline text-xs uppercase text-muted">
            <tr>
              <th className="py-2 pr-4 font-medium">품목</th>
              <th className="py-2 pr-4 font-medium">카테고리</th>
              <th className="py-2 pr-4 text-right font-medium">건수</th>
              <th className="py-2 pr-4 text-right font-medium">누적 지출</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {items.map((item) => (
              <tr key={item.itemId}>
                <td className="py-3 pr-4">
                  <p className="font-medium text-ink">{item.itemName}</p>
                  <p className="text-xs text-muted">{item.brand || "-"}</p>
                </td>
                <td className="py-3 pr-4 text-body">{item.category}</td>
                <td className="py-3 pr-4 text-right text-body">
                  {item.purchaseCount}건
                </td>
                <td className="py-3 pr-4 text-right font-medium text-ink">
                  {formatKrw(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function ReportStoreSpendingTable({
  stores,
}: {
  stores: StoreSpending[];
}) {
  if (stores.length === 0) {
    return (
      <Section title="매장별 구매액">
        <EmptyState message="매장별 지출 데이터가 없습니다." />
      </Section>
    );
  }

  return (
    <Section title="매장별 구매액">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-hairline text-xs uppercase text-muted">
            <tr>
              <th className="py-2 pr-4 font-medium">매장</th>
              <th className="py-2 pr-4 text-right font-medium">건수</th>
              <th className="py-2 pr-4 text-right font-medium">구매액</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {stores.map((store) => (
              <tr key={store.storeName}>
                <td className="py-3 pr-4 font-medium text-ink">
                  {store.storeName}
                </td>
                <td className="py-3 pr-4 text-right text-body">
                  {store.purchaseCount}건
                </td>
                <td className="py-3 pr-4 text-right font-medium text-ink">
                  {formatKrw(store.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
