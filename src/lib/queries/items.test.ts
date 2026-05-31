import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getItemDetail,
  getItemFilterOptions,
  getItemList,
  getItemPurchaseHistory,
} from "@/lib/queries/items";
import type { ItemListParams } from "@/lib/items/items";

class FakeItemClient {
  calls: { name: string; params: Record<string, unknown> }[] = [];

  constructor(private readonly failName?: string) {}

  rpc<T = unknown>(name: string, params: Record<string, unknown>) {
    this.calls.push({ name, params });

    if (name === this.failName) {
      return Promise.resolve({ data: null, error: { message: "broken" } });
    }

    const dataByName: Record<string, unknown> = {
      buylog_item_filter_options: [
        {
          option_type: "category",
          option_id: "cat-1",
          label: "위생용품",
          secondary_label: null,
        },
      ],
      buylog_item_list: [
        {
          item_id: "item-1",
          item_name: "샴푸",
          brand: "브랜드",
          category_id: "cat-1",
          category: "위생용품",
          group_id: null,
          group_name: null,
          group_label: "내 물품",
          replacement_cycle_days: 30,
          purchase_count: 2,
          total_spent: 22000,
          last_purchase_date: "2026-05-20",
          last_price: 12000,
          expected_repurchase_date: "2026-06-19",
          days_until_repurchase: 19,
        },
      ],
      buylog_item_detail: [
        {
          item_id: "item-1",
          item_name: "샴푸",
          brand: "브랜드",
          category_id: "cat-1",
          category: "위생용품",
          group_id: null,
          group_name: null,
          group_label: "내 물품",
          replacement_cycle_days: 30,
          purchase_count: 2,
          total_spent: 22000,
          average_price: 11000,
          min_price: 10000,
          max_price: 12000,
          last_purchase_date: "2026-05-20",
          last_price: 12000,
          last_store_name: "쿠팡",
          expected_repurchase_date: "2026-06-19",
          days_until_repurchase: 19,
        },
      ],
      buylog_item_purchase_history: [
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
      ],
    };

    return Promise.resolve({ data: dataByName[name] as T, error: null });
  }
}

const params: ItemListParams = {
  search: "샴푸",
  sort: "total_spent",
  direction: "desc",
  categories: ["cat-1"],
  groups: ["personal"],
  anchorDate: "2026-05-31",
  limit: 100,
};

describe("item query service", () => {
  it("loads filter options", async () => {
    const client = new FakeItemClient();

    const options = await getItemFilterOptions({ client });

    expect(client.calls).toEqual([
      { name: "buylog_item_filter_options", params: {} },
    ]);
    expect(options.categories[0]?.label).toBe("위생용품");
  });

  it("calls item list rpc with serialized filters", async () => {
    const client = new FakeItemClient();

    const rows = await getItemList({ client, params });

    expect(client.calls[0]).toEqual({
      name: "buylog_item_list",
      params: {
        search_text: "샴푸",
        category_ids: ["cat-1"],
        group_filters: ["personal"],
        sort_key: "total_spent",
        sort_direction: "desc",
        limit_count: 100,
        anchor_date: "2026-05-31",
      },
    });
    expect(rows[0]?.itemName).toBe("샴푸");
  });

  it("loads detail and purchase history", async () => {
    const client = new FakeItemClient();

    const detail = await getItemDetail({
      client,
      itemId: "item-1",
      anchorDate: "2026-05-31",
    });
    const history = await getItemPurchaseHistory({ client, itemId: "item-1" });

    expect(client.calls[0]).toEqual({
      name: "buylog_item_detail",
      params: { target_item_id: "item-1", anchor_date: "2026-05-31" },
    });
    expect(client.calls[1]).toEqual({
      name: "buylog_item_purchase_history",
      params: { target_item_id: "item-1", limit_count: 50 },
    });
    expect(detail?.lastStoreName).toBe("쿠팡");
    expect(history[0]?.priceDelta).toBe(2000);
  });

  it("includes rpc name in thrown errors", async () => {
    const client = new FakeItemClient("buylog_item_list");

    await expect(getItemList({ client, params })).rejects.toThrow(
      "buylog_item_list: broken",
    );
  });
});
