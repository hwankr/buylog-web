import { ArrowDownRight, ArrowUpRight, CalendarClock, ReceiptText, Tags, Wallet } from "lucide-react";

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
      ? "전월 지출 없음"
      : `${(kpis.deltaRatio * 100).toFixed(1)}%`;

  const cards = [
    {
      label: "이번 달 구매액",
      value: formatKrw(kpis.monthTotal),
      helper: `전월 대비 ${formatSignedCurrency(kpis.deltaAmount)}`,
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
            className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
            key={card.label}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="text-2xl font-semibold text-slate-950">{card.value}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-slate-600">
                <Icon className="size-4" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1 text-sm text-slate-500">
              {card.label === "이번 달 구매액" ? directionIcon : null}
              {card.helper}
            </p>
          </article>
        );
      })}
    </section>
  );
}
