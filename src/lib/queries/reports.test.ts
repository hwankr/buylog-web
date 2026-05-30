import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getReportData,
  getReportFilterOptions,
  loadReportCsvRows,
} from "@/lib/queries/reports";
import { resolveReportFilters } from "@/lib/reporting/reports";

class FakeReportClient {
  calls: { name: string; params: Record<string, unknown> }[] = [];

  constructor(private readonly failName?: string) {}

  rpc<T = unknown>(name: string, params: Record<string, unknown>) {
    this.calls.push({ name, params });

    if (name === this.failName) {
      return Promise.resolve({ data: null, error: { message: "broken" } });
    }

    const dataByName: Record<string, unknown> = {
      buylog_report_filter_options: [
        {
          option_type: "category",
          option_id: "cat-1",
          label: "위생용품",
          secondary_label: null,
        },
      ],
      buylog_report_spending_trend: [
        { bucket: "2026-05-01", total_amount: 10000, purchase_count: 2 },
      ],
      buylog_report_category_share: [
        {
          category_id: "cat-1",
          category: "위생용품",
          amount: 10000,
          purchase_count: 2,
        },
      ],
      buylog_report_item_spending: [
        {
          item_id: "item-1",
          item_name: "샴푸",
          brand: "브랜드",
          category: "위생용품",
          amount: 10000,
          purchase_count: 2,
        },
      ],
      buylog_report_store_spending: [
        { store_name: "쿠팡", amount: 10000, purchase_count: 2 },
      ],
      buylog_report_purchase_export: [
        {
          purchase_id: "purchase-1",
          purchase_date: "2026-05-30",
          item_name: "샴푸",
          brand: "브랜드",
          category: "위생용품",
          store_name: "쿠팡",
          quantity: 1,
          price: 10000,
        },
      ],
    };

    return Promise.resolve({ data: dataByName[name] as T, error: null });
  }
}

const anchorDate = new Date("2026-05-30T12:00:00+09:00");

describe("report query service", () => {
  it("loads filter options with personal scope params", async () => {
    const client = new FakeReportClient();

    const options = await getReportFilterOptions({
      client,
      scope: { type: "personal" },
    });

    expect(client.calls).toEqual([
      {
        name: "buylog_report_filter_options",
        params: {
          scope_type: "personal",
          scope_id: null,
        },
      },
    ]);
    expect(options.categories[0]?.label).toBe("위생용품");
  });

  it("calls report RPCs with group scope, filters, and trend grain", async () => {
    const client = new FakeReportClient();
    const filters = resolveReportFilters(
      {
        period: "custom",
        from: "2026-01-01",
        to: "2026-05-30",
        category: ["cat-1", "cat-2"],
        item: "item-1",
        store: "쿠팡",
      },
      anchorDate,
    );

    const report = await getReportData({
      client,
      scope: { type: "group", groupId: "group-1", label: "가족" },
      filters,
    });

    expect(client.calls.map((call) => call.name)).toEqual([
      "buylog_report_spending_trend",
      "buylog_report_category_share",
      "buylog_report_item_spending",
      "buylog_report_store_spending",
    ]);
    expect(client.calls[0]?.params).toEqual({
      scope_type: "group",
      scope_id: "group-1",
      period_start: "2026-01-01",
      period_end: "2026-05-30",
      category_ids: ["cat-1", "cat-2"],
      item_ids: ["item-1"],
      store_names: ["쿠팡"],
      trend_grain: "month",
    });
    expect(report.trend[0]?.totalAmount).toBe(10000);
    expect(report.items[0]?.itemName).toBe("샴푸");
    expect(report.stores[0]?.storeName).toBe("쿠팡");
  });

  it("loads CSV export rows with the same filtered params", async () => {
    const client = new FakeReportClient();
    const filters = resolveReportFilters({ store: "쿠팡" }, anchorDate);

    const rows = await loadReportCsvRows({
      client,
      scope: { type: "personal" },
      filters,
    });

    expect(client.calls[0]?.name).toBe("buylog_report_purchase_export");
    expect(client.calls[0]?.params).toMatchObject({
      scope_type: "personal",
      scope_id: null,
      period_start: "2026-05-01",
      period_end: "2026-05-30",
      store_names: ["쿠팡"],
    });
    expect(rows[0]?.purchaseId).toBe("purchase-1");
  });

  it("includes the failing RPC name in errors", async () => {
    const client = new FakeReportClient("buylog_report_store_spending");
    const filters = resolveReportFilters({}, anchorDate);

    await expect(
      getReportData({
        client,
        scope: { type: "personal" },
        filters,
      }),
    ).rejects.toThrow("buylog_report_store_spending: broken");
  });
});
