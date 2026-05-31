import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  ReceiptText,
  Tags,
  Wallet,
} from "lucide-react";

import { MetricCard } from "@/components/ui/metric-card";
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
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <MetricCard
            accent={
              index === 0
                ? "coral"
                : index === 1
                  ? "teal"
                  : index === 2
                    ? "amber"
                    : "dark"
            }
            eyebrow={index === 0 ? "핵심 지표" : undefined}
            helper={
              <span className="flex items-center gap-1">
                {card.label === "이번 달 구매액" ? directionIcon : null}
                {card.helper}
              </span>
            }
            icon={<Icon className="size-4" aria-hidden="true" />}
            key={card.label}
            title={card.label}
            tone={index === 0 ? "dark" : "card"}
            value={card.value}
          />
        );
      })}
    </section>
  );
}
