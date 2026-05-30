import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CategoryChart, MonthlySpendingChart } from "@/components/dashboard/charts";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import {
  PriceMovementList,
  RecentPurchaseTable,
  ReplacementDueList,
} from "@/components/dashboard/lists";
import { ScopeSelector } from "@/components/scope-selector";

describe("dashboard widgets", () => {
  it("renders KPI values in Korean management-dashboard format", () => {
    render(
      <KpiGrid
        kpis={{
          monthTotal: 128900,
          previousMonthTotal: 100000,
          deltaAmount: 28900,
          deltaRatio: 0.289,
          purchaseCount: 8,
          topCategory: "위생용품",
          forecast: {
            next30DaysAmount: 20000,
            next60DaysAmount: 45000,
            next90DaysAmount: 80000,
          },
        }}
      />,
    );

    expect(screen.getByText("이번 달 구매액")).toBeInTheDocument();
    expect(screen.getByText("₩128,900")).toBeInTheDocument();
    expect(screen.getByText("전월 대비 +₩28,900")).toBeInTheDocument();
    expect(screen.getByText("8건")).toBeInTheDocument();
    expect(screen.getByText("위생용품")).toBeInTheDocument();
  });

  it("renders empty states for chart and list widgets", () => {
    render(
      <>
        <MonthlySpendingChart data={[]} />
        <CategoryChart data={[]} />
        <RecentPurchaseTable rows={[]} />
        <ReplacementDueList items={[]} />
        <PriceMovementList movements={[]} />
      </>,
    );

    expect(screen.getByText("월간 지출 데이터가 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("카테고리 지출 데이터가 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("최근 구매 이력이 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("교체 임박 품목이 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("가격 변동이 감지된 품목이 없습니다.")).toBeInTheDocument();
  });

  it("renders scope links with URL query values", () => {
    render(
      <ScopeSelector
        selectedScope={{ type: "group", groupId: "g1", label: "가족", role: "owner" }}
        scopes={[
          { type: "personal", label: "내 물품" },
          { type: "group", groupId: "g1", label: "가족", role: "owner" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "내 물품" })).toHaveAttribute(
      "href",
      "/?scope=personal",
    );
    expect(screen.getByRole("link", { name: "가족 owner" })).toHaveAttribute(
      "href",
      "/?scope=group%3Ag1",
    );
  });
});
