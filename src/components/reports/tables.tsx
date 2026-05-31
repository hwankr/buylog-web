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
      <Section title="물품별 누적 지출">
        <EmptyState message="물품별 지출 데이터가 없습니다." />
      </Section>
    );
  }

  return (
    <Section title="물품별 누적 지출">
      <TableShell label="물품별 누적 지출">
        <table className={tableClassName}>
          <thead className={tableHeadClassName}>
            <tr>
              <th className={tableHeaderCellClassName}>물품</th>
              <th className={tableHeaderCellClassName}>카테고리</th>
              <th className={`${tableHeaderCellClassName} text-right`}>건수</th>
              <th className={`${tableHeaderCellClassName} text-right`}>
                누적 지출
              </th>
            </tr>
          </thead>
          <tbody className={tableBodyClassName}>
            {items.map((item) => (
              <tr className="active:bg-surface-soft" key={item.itemId}>
                <td className={tableCellClassName}>
                  <p className="font-medium text-ink">{item.itemName}</p>
                  <p className="text-xs text-muted">{item.brand || "-"}</p>
                </td>
                <td className={tableCellClassName}>{item.category}</td>
                <td className={tableNumberCellClassName}>
                  {item.purchaseCount}건
                </td>
                <td className={tableNumberCellClassName}>
                  {formatKrw(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
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
      <TableShell label="매장별 구매액">
        <table className={tableClassName}>
          <thead className={tableHeadClassName}>
            <tr>
              <th className={tableHeaderCellClassName}>매장</th>
              <th className={`${tableHeaderCellClassName} text-right`}>건수</th>
              <th className={`${tableHeaderCellClassName} text-right`}>구매액</th>
            </tr>
          </thead>
          <tbody className={tableBodyClassName}>
            {stores.map((store) => (
              <tr className="active:bg-surface-soft" key={store.storeName}>
                <td className={`${tableCellClassName} font-medium text-ink`}>
                  {store.storeName}
                </td>
                <td className={tableNumberCellClassName}>
                  {store.purchaseCount}건
                </td>
                <td className={tableNumberCellClassName}>
                  {formatKrw(store.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </Section>
  );
}
