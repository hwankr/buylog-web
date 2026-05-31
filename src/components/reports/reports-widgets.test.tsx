import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReportsFilterBar } from "@/components/reports/filter-bar";
import {
  ReportsCategoryShareChart,
  ReportsSpendingTrendChart,
} from "@/components/reports/charts";
import {
  ReportItemSpendingTable,
  ReportStoreSpendingTable,
} from "@/components/reports/tables";
import { resolveReportFilters } from "@/lib/reporting/reports";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

const anchorDate = new Date("2026-05-30T12:00:00+09:00");

describe("reports widgets", () => {
  it("renders filter controls, selected values, reset link, and CSV export href", () => {
    const filters = resolveReportFilters(
      {
        period: "custom",
        from: "2026-01-01",
        to: "2026-05-30",
        category: "cat-1",
        store: "쿠팡",
      },
      anchorDate,
    );

    render(
      <ReportsFilterBar
        filterOptions={{
          categories: [{ id: "cat-1", label: "위생용품", secondaryLabel: "" }],
          items: [{ id: "item-1", label: "휴지", secondaryLabel: "브랜드" }],
          stores: [{ id: "쿠팡", label: "쿠팡", secondaryLabel: "" }],
        }}
        filters={filters}
        scopes={[
          { type: "personal", label: "내 물품" },
          { type: "group", groupId: "group-1", label: "가족", role: "owner" },
        ]}
        selectedScope={{
          type: "group",
          groupId: "group-1",
          label: "가족",
          role: "owner",
        }}
      />,
    );

    expect(screen.getByText("카테고리 1")).toHaveClass("bg-primary/15");
    expect(screen.getByText("매장 1")).toHaveClass("bg-primary/15");
    expect(screen.getByLabelText("사용자 지정")).toBeChecked();
    expect(screen.getByLabelText("위생용품")).toBeChecked();
    expect(screen.getByLabelText("휴지 브랜드")).not.toBeChecked();
    expect(screen.getByLabelText("쿠팡")).toBeChecked();
    expect(screen.getByLabelText("시작일")).toHaveValue("2026-01-01");
    expect(screen.getByLabelText("종료일")).toHaveValue("2026-05-30");
    expect(screen.getByRole("link", { name: "초기화" })).toHaveAttribute(
      "href",
      "/reports?scope=group%3Agroup-1",
    );
    expect(screen.getByRole("link", { name: "초기화" })).toHaveClass(
      "border-hairline",
    );
    expect(screen.getByRole("link", { name: "CSV 내보내기" })).toHaveAttribute(
      "href",
      "/api/reports/export?period=custom&from=2026-01-01&to=2026-05-30&scope=group%3Agroup-1&category=cat-1&store=%EC%BF%A0%ED%8C%A1",
    );
    expect(screen.getByRole("link", { name: "CSV 내보내기" })).toHaveClass(
      "bg-primary",
    );
    expect(
      screen.queryByRole("button", { name: "적용" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("사용자 지정").closest("form")).toHaveAttribute(
      "action",
      "/reports",
    );
    expect(screen.getByRole("link", { name: "내 물품" })).toHaveAttribute(
      "href",
      "/reports?period=custom&from=2026-01-01&to=2026-05-30&scope=personal",
    );
  });

  it("renders empty states for report charts", () => {
    render(
      <>
        <ReportsSpendingTrendChart data={[]} />
        <ReportsCategoryShareChart data={[]} />
      </>,
    );

    expect(
      screen.getByRole("region", { name: "월간/주간 지출 추이" }),
    ).toHaveClass("overflow-hidden", "bg-surface-card");
    expect(screen.getByText("지출 추이 데이터가 없습니다.")).toBeInTheDocument();
    expect(
      screen.getByText("카테고리별 지출 데이터가 없습니다."),
    ).toBeInTheDocument();
  });

  it("renders item and store spending tables with formatted amounts", () => {
    render(
      <>
        <ReportItemSpendingTable
          items={[
            {
              itemId: "item-1",
              itemName: "휴지",
              brand: "브랜드",
              category: "위생용품",
              amount: 12900,
              purchaseCount: 2,
            },
          ]}
        />
        <ReportStoreSpendingTable
          stores={[
            {
              storeName: "쿠팡",
              amount: 8000,
              purchaseCount: 1,
            },
          ]}
        />
      </>,
    );

    expect(screen.getByText("물품별 누적 지출")).toBeInTheDocument();
    expect(screen.getByText("휴지")).toBeInTheDocument();
    expect(screen.getByText("₩12,900")).toBeInTheDocument();
    expect(screen.getByText("매장별 구매액")).toBeInTheDocument();
    expect(screen.getByText("쿠팡")).toBeInTheDocument();
    expect(screen.getByText("₩8,000")).toBeInTheDocument();
  });

  it("renders empty states for report tables", () => {
    render(
      <>
        <ReportItemSpendingTable items={[]} />
        <ReportStoreSpendingTable stores={[]} />
      </>,
    );

    expect(screen.getByText("물품별 지출 데이터가 없습니다.")).toBeInTheDocument();
    expect(screen.getByText("매장별 지출 데이터가 없습니다.")).toBeInTheDocument();
  });
});
