import { describe, expect, it } from "vitest";

import {
  mapCategoryRows,
  mapDashboardKpiRow,
  mapMonthlyRows,
  mapPriceMovementRows,
} from "@/lib/reporting/dashboard";

describe("dashboard reporting mappers", () => {
  it("maps dashboard KPI RPC rows and derives previous-month deltas", () => {
    expect(
      mapDashboardKpiRow({
        month_total: 120000,
        previous_month_total: 80000,
        purchase_count: 9,
        top_category: "위생용품",
        next_30_cost: 25000,
        next_60_cost: 47000,
        next_90_cost: 76000,
      }),
    ).toEqual({
      monthTotal: 120000,
      previousMonthTotal: 80000,
      deltaAmount: 40000,
      deltaRatio: 0.5,
      purchaseCount: 9,
      topCategory: "위생용품",
      forecast: {
        next30DaysAmount: 25000,
        next60DaysAmount: 47000,
        next90DaysAmount: 76000,
      },
    });
  });

  it("uses null delta ratio when the previous month has no spending", () => {
    expect(
      mapDashboardKpiRow({
        month_total: 120000,
        previous_month_total: 0,
        purchase_count: 2,
        top_category: null,
        next_30_cost: 0,
        next_60_cost: 0,
        next_90_cost: 0,
      }).deltaRatio,
    ).toBeNull();
  });

  it("maps chart rows into UI-safe numbers and labels", () => {
    expect(
      mapMonthlyRows([
        { month: "2026-04-01", total_amount: 10000, purchase_count: 2 },
        { month: "2026-05-01", total_amount: 20000, purchase_count: 3 },
      ]),
    ).toEqual([
      { month: "2026-04", label: "4월", totalAmount: 10000, purchaseCount: 2 },
      { month: "2026-05", label: "5월", totalAmount: 20000, purchaseCount: 3 },
    ]);

    expect(
      mapCategoryRows([
        { category: "위생용품", amount: 30000, purchase_count: 4 },
        { category: null, amount: 5000, purchase_count: 1 },
      ]),
    ).toEqual([
      { category: "위생용품", amount: 30000, purchaseCount: 4 },
      { category: "미분류", amount: 5000, purchaseCount: 1 },
    ]);
  });

  it("maps price movements with signed deltas and ratios", () => {
    expect(
      mapPriceMovementRows([
        {
          item_id: "item-1",
          item_name: "샴푸",
          brand: "브랜드",
          category: "욕실",
          current_price: 15000,
          previous_price: 12000,
          current_store: "쿠팡",
          previous_store: "마트",
        },
      ]),
    ).toEqual([
      {
        itemId: "item-1",
        itemName: "샴푸",
        brand: "브랜드",
        category: "욕실",
        currentPrice: 15000,
        previousPrice: 12000,
        currentStore: "쿠팡",
        previousStore: "마트",
        deltaAmount: 3000,
        deltaRatio: 0.25,
      },
    ]);
  });
});
