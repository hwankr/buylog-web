import { describe, expect, it } from "vitest";

import {
  buildReportSearchParams,
  mapCategoryShareRows,
  mapFilterOptionRows,
  mapSpendingTrendRows,
  resolveReportFilters,
} from "@/lib/reporting/reports";
import type { BuylogScope } from "@/lib/scope";

const anchorDate = new Date("2026-05-30T12:00:00+09:00");

describe("report filter helpers", () => {
  it("resolves the default this-month period in KST", () => {
    const filters = resolveReportFilters({}, anchorDate);

    expect(filters.period).toBe("this-month");
    expect(filters.range).toEqual({
      from: "2026-05-01",
      to: "2026-05-30",
      label: "이번 달",
    });
    expect(filters.trendGrain).toBe("month");
  });

  it("resolves the last-3-months period from the current month start through today", () => {
    const filters = resolveReportFilters({ period: "last-3-months" }, anchorDate);

    expect(filters.range).toEqual({
      from: "2026-03-01",
      to: "2026-05-30",
      label: "최근 3개월",
    });
    expect(filters.trendGrain).toBe("month");
  });

  it("uses yearly trend grain for valid custom ranges over 12 months", () => {
    const filters = resolveReportFilters(
      {
        period: "custom",
        from: "2025-01-01",
        to: "2026-05-30",
      },
      anchorDate,
    );

    expect(filters.period).toBe("custom");
    expect(filters.range).toEqual({
      from: "2025-01-01",
      to: "2026-05-30",
      label: "2025-01-01 - 2026-05-30",
    });
    expect(filters.trendGrain).toBe("year");
  });

  it("falls back to this-month for invalid custom ranges", () => {
    const filters = resolveReportFilters(
      {
        period: "custom",
        from: "2026-06-01",
        to: "2026-05-30",
      },
      anchorDate,
    );

    expect(filters.period).toBe("this-month");
    expect(filters.range.from).toBe("2026-05-01");
    expect(filters.range.to).toBe("2026-05-30");
  });

  it("dedupes repeated category, item, and store params while dropping blanks", () => {
    const filters = resolveReportFilters(
      {
        category: ["cat-1", "", "cat-2", "cat-1"],
        item: [" item-1 ", "item-1", "item-2"],
        store: ["쿠팡", "쿠팡", " "],
      },
      anchorDate,
    );

    expect(filters.categories).toEqual(["cat-1", "cat-2"]);
    expect(filters.items).toEqual(["item-1", "item-2"]);
    expect(filters.stores).toEqual(["쿠팡"]);
  });

  it("builds repeated search params for links and CSV export", () => {
    const scope: BuylogScope = { type: "group", groupId: "group-1", label: "가족" };
    const filters = resolveReportFilters(
      {
        period: "custom",
        from: "2026-01-01",
        to: "2026-05-30",
        category: ["cat-1", "cat-2"],
        item: "item-1",
        store: ["쿠팡", "마트"],
      },
      anchorDate,
    );

    expect(buildReportSearchParams(filters, scope).toString()).toBe(
      "period=custom&from=2026-01-01&to=2026-05-30&scope=group%3Agroup-1&category=cat-1&category=cat-2&item=item-1&store=%EC%BF%A0%ED%8C%A1&store=%EB%A7%88%ED%8A%B8",
    );
  });
});

describe("report mappers", () => {
  it("maps filter options into scoped category, item, and store groups", () => {
    expect(
      mapFilterOptionRows([
        {
          option_type: "category",
          option_id: "cat-1",
          label: "위생용품",
          secondary_label: null,
        },
        {
          option_type: "item",
          option_id: "item-1",
          label: "샴푸",
          secondary_label: "브랜드",
        },
        {
          option_type: "store",
          option_id: null,
          label: null,
          secondary_label: null,
        },
      ]),
    ).toEqual({
      categories: [{ id: "cat-1", label: "위생용품", secondaryLabel: "" }],
      items: [{ id: "item-1", label: "샴푸", secondaryLabel: "브랜드" }],
      stores: [{ id: "미지정 매장", label: "미지정 매장", secondaryLabel: "" }],
    });
  });

  it("maps trend rows with month and year labels", () => {
    expect(
      mapSpendingTrendRows(
        [
          { bucket: "2026-05-01", total_amount: 10000, purchase_count: 2 },
          { bucket: "2027-01-01", total_amount: null, purchase_count: null },
        ],
        "year",
      ),
    ).toEqual([
      { bucket: "2026-05-01", label: "2026년", totalAmount: 10000, purchaseCount: 2 },
      { bucket: "2027-01-01", label: "2027년", totalAmount: 0, purchaseCount: 0 },
    ]);
  });

  it("maps category share rows and derives ratios from total spending", () => {
    expect(
      mapCategoryShareRows([
        {
          category_id: "cat-1",
          category: "위생용품",
          amount: 30000,
          purchase_count: 3,
        },
        {
          category_id: null,
          category: null,
          amount: 10000,
          purchase_count: 1,
        },
      ]),
    ).toEqual([
      {
        categoryId: "cat-1",
        category: "위생용품",
        amount: 30000,
        purchaseCount: 3,
        shareRatio: 0.75,
      },
      {
        categoryId: null,
        category: "미분류",
        amount: 10000,
        purchaseCount: 1,
        shareRatio: 0.25,
      },
    ]);
  });
});
