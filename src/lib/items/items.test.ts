import { describe, expect, it } from "vitest";

import {
  buildItemsHref,
  mapItemDetailRows,
  mapItemFilterOptionRows,
  mapItemListRows,
  mapItemPurchaseHistoryRows,
  resolveItemListParams,
} from "@/lib/items/items";

const anchorDate = new Date("2026-05-31T12:00:00+09:00");

describe("item list params", () => {
  it("resolves defaults for empty search params", () => {
    expect(resolveItemListParams({}, anchorDate)).toEqual({
      search: "",
      sort: "name",
      direction: "asc",
      categories: [],
      groups: [],
      anchorDate: "2026-05-31",
      limit: 100,
    });
  });

  it("dedupes categories and groups while validating sort values", () => {
    expect(
      resolveItemListParams(
        {
          q: " shampoo ",
          sort: "total_spent",
          dir: "desc",
          category: ["cat-1", "", "cat-1", "cat-2"],
          group: ["personal", "group:g1", "bad", "group:g1"],
        },
        anchorDate,
      ),
    ).toEqual({
      search: "shampoo",
      sort: "total_spent",
      direction: "desc",
      categories: ["cat-1", "cat-2"],
      groups: ["personal", "group:g1"],
      anchorDate: "2026-05-31",
      limit: 100,
    });
  });

  it("builds list hrefs with repeated filters", () => {
    const href = buildItemsHref("/items", {
      search: "shampoo",
      sort: "last_purchase",
      direction: "desc",
      categories: ["cat-1"],
      groups: ["personal", "group:g1"],
      anchorDate: "2026-05-31",
      limit: 100,
    });

    expect(href).toBe(
      "/items?q=shampoo&sort=last_purchase&dir=desc&category=cat-1&group=personal&group=group%3Ag1",
    );
  });
});

describe("item mappers", () => {
  it("maps filter option rows into category and group groups", () => {
    expect(
      mapItemFilterOptionRows([
        {
          option_type: "category",
          option_id: "cat-1",
          label: "위생용품",
          secondary_label: null,
        },
        {
          option_type: "group",
          option_id: "personal",
          label: "내 물품",
          secondary_label: "개인",
        },
      ]),
    ).toEqual({
      categories: [{ id: "cat-1", label: "위생용품", secondaryLabel: "" }],
      groups: [{ id: "personal", label: "내 물품", secondaryLabel: "개인" }],
    });
  });

  it("maps item list rows with normalized text and numbers", () => {
    expect(
      mapItemListRows([
        {
          item_id: "item-1",
          item_name: "샴푸",
          brand: null,
          category_id: null,
          category: null,
          group_id: null,
          group_name: null,
          group_label: null,
          replacement_cycle_days: null,
          purchase_count: null,
          total_spent: null,
          last_purchase_date: null,
          last_price: null,
          expected_repurchase_date: null,
          days_until_repurchase: null,
        },
      ]),
    ).toEqual([
      {
        itemId: "item-1",
        itemName: "샴푸",
        brand: "",
        categoryId: null,
        category: "미분류",
        groupId: null,
        groupName: "",
        groupLabel: "내 물품",
        replacementCycleDays: null,
        purchaseCount: 0,
        totalSpent: 0,
        lastPurchaseDate: null,
        lastPrice: 0,
        expectedRepurchaseDate: null,
        daysUntilRepurchase: null,
      },
    ]);
  });

  it("maps detail and purchase history rows", () => {
    expect(
      mapItemDetailRows([
        {
          item_id: "item-1",
          item_name: "샴푸",
          brand: "브랜드",
          category_id: "cat-1",
          category: "위생용품",
          group_id: "g1",
          group_name: "가족",
          group_label: "가족",
          replacement_cycle_days: 45,
          purchase_count: 2,
          total_spent: 22000,
          average_price: 11000,
          min_price: 10000,
          max_price: 12000,
          last_purchase_date: "2026-05-20",
          last_price: 12000,
          last_store_name: "쿠팡",
          expected_repurchase_date: "2026-07-04",
          days_until_repurchase: 34,
        },
      ]),
    ).toMatchObject({
      itemId: "item-1",
      averagePrice: 11000,
      lastStoreName: "쿠팡",
      daysUntilRepurchase: 34,
    });

    expect(
      mapItemPurchaseHistoryRows([
        {
          purchase_id: "purchase-1",
          purchase_date: "2026-05-20",
          store_name: "쿠팡",
          quantity: 1,
          price: 12000,
          previous_price: 10000,
          price_delta: 2000,
          price_delta_ratio: 0.2,
        },
      ]),
    ).toEqual([
      {
        purchaseId: "purchase-1",
        purchaseDate: "2026-05-20",
        storeName: "쿠팡",
        quantity: 1,
        price: 12000,
        previousPrice: 10000,
        priceDelta: 2000,
        priceDeltaRatio: 0.2,
      },
    ]);
  });
});
