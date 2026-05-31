import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardSummaryBand } from "@/components/dashboard/summary-band";

describe("DashboardSummaryBand", () => {
  it("renders a dark executive summary from KPI data", () => {
    render(
      <DashboardSummaryBand
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
        scopeLabel="가족"
      />,
    );

    expect(
      screen.getByRole("region", { name: "이번 달 구매 브리핑" }),
    ).toHaveClass("bg-surface-dark", "text-on-dark");
    expect(screen.getByText("가족")).toHaveClass("bg-surface-dark-elevated");
    expect(screen.getByText("₩128,900")).toBeInTheDocument();
    expect(screen.getByText("+₩28,900")).toBeInTheDocument();
  });
});
