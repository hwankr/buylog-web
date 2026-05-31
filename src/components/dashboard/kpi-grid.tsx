import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  ReceiptText,
  Tags,
  Wallet,
} from "lucide-react";

import { formatKrw } from "@/lib/format";
import type { DashboardKpis } from "@/lib/reporting/dashboard";

type KpiGridProps = {
  kpis: DashboardKpis;
};

function formatSignedCurrency(value: number) {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}${formatKrw(Math.abs(value))}`;
}

export function KpiGrid({ kpis }: KpiGridProps) {
  const directionIcon =
    kpis.deltaAmount >= 0 ? (
      <ArrowUpRight className="size-4" aria-hidden="true" />
    ) : (
      <ArrowDownRight className="size-4" aria-hidden="true" />
    );
  const ratioText =
    kpis.deltaRatio === null
      ? "지난달 지출 없음"
      : `${(kpis.deltaRatio * 100).toFixed(1)}%`;

  const cards = [
    {
      label: "이번 달 구매액",
      value: formatKrw(kpis.monthTotal),
      helper: `지난달 대비 ${formatSignedCurrency(kpis.deltaAmount)}`,
      icon: Wallet,
    },
    {
      label: "구매 건수",
      value: `${kpis.purchaseCount}건`,
      helper: ratioText,
      icon: ReceiptText,
    },
    {
      label: "최다 지출 카테고리",
      value: kpis.topCategory ?? "없음",
      helper: "이번 달 기준",
      icon: Tags,
    },
    {
      label: "예상 재구매 비용",
      value: formatKrw(kpis.forecast.next30DaysAmount),
      helper: `60일 ${formatKrw(kpis.forecast.next60DaysAmount)} · 90일 ${formatKrw(kpis.forecast.next90DaysAmount)}`,
      icon: CalendarClock,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            className="rounded-lg border border-hairline bg-surface-card p-6"
            key={card.label}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted">{card.label}</p>
                <p className="font-display text-4xl leading-tight text-ink">
                  {card.value}
                </p>
              </div>
              <div className="rounded-md border border-hairline bg-canvas p-2 text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-4 flex items-center gap-1 text-sm text-muted">
              {card.label === "이번 달 구매액" ? directionIcon : null}
              {card.helper}
            </p>
          </article>
        );
      })}
    </section>
  );
}
