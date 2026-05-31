import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  ReceiptText,
} from "lucide-react";

import { StatusPill } from "@/components/ui/status-pill";
import { formatKrw } from "@/lib/format";
import type { DashboardKpis } from "@/lib/reporting/dashboard";

function signedCurrency(value: number) {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}${formatKrw(Math.abs(value))}`;
}

export function DashboardSummaryBand({
  kpis,
  scopeLabel,
}: {
  kpis: DashboardKpis;
  scopeLabel: string;
}) {
  const isIncrease = kpis.deltaAmount >= 0;
  const TrendIcon = isIncrease ? ArrowUpRight : ArrowDownRight;

  return (
    <section
      aria-label="이번 달 구매 브리핑"
      className="overflow-hidden rounded-lg bg-surface-dark text-on-dark"
    >
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:p-7">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="dark">{scopeLabel}</StatusPill>
            <StatusPill tone={isIncrease ? "warning" : "success"}>
              {isIncrease ? "지출 증가" : "지출 감소"}
            </StatusPill>
          </div>
          <h2 className="mt-4 font-display text-4xl leading-tight text-on-dark">
            이번 달 구매 흐름
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-on-dark-soft">
            구매액, 구매 건수, 재구매 예상액을 한 화면에서 비교해 다음 구매
            결정을 빠르게 잡습니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-lg bg-surface-dark-elevated px-4 py-3">
              <p className="text-xs text-on-dark-soft">월 구매액</p>
              <p className="font-display text-3xl leading-tight">
                {formatKrw(kpis.monthTotal)}
              </p>
            </div>
            <div className="rounded-lg bg-surface-dark-elevated px-4 py-3">
              <p className="text-xs text-on-dark-soft">지난달 대비</p>
              <p className="flex items-center gap-1 font-display text-3xl leading-tight">
                <TrendIcon className="size-5" aria-hidden="true" />
                {signedCurrency(kpis.deltaAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-surface-dark-soft bg-surface-dark-elevated p-4">
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-4 rounded-md bg-surface-dark-soft px-3 py-3">
              <span className="flex items-center gap-2 text-sm text-on-dark-soft">
                <ReceiptText className="size-4" aria-hidden="true" />
                구매 건수
              </span>
              <span className="font-medium text-on-dark">
                {kpis.purchaseCount}건
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-surface-dark-soft px-3 py-3">
              <span className="flex items-center gap-2 text-sm text-on-dark-soft">
                <CalendarClock className="size-4" aria-hidden="true" />
                30일 재구매 예상
              </span>
              <span className="font-medium text-on-dark">
                {formatKrw(kpis.forecast.next30DaysAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-surface-dark-soft px-3 py-3">
              <span className="text-sm text-on-dark-soft">
                최다 지출 카테고리
              </span>
              <span className="truncate font-medium text-on-dark">
                {kpis.topCategory ?? "없음"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
