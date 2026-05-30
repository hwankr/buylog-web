import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getDashboardData } from "@/lib/queries/dashboard";

class FakeSupabaseClient {
  calls: { name: string; params: Record<string, unknown> }[] = [];

  rpc<T = unknown>(name: string, params: Record<string, unknown>) {
    this.calls.push({ name, params });

    const dataByName: Record<string, unknown> = {
      buylog_dashboard_kpis: [
        {
          month_total: 10000,
          previous_month_total: 5000,
          purchase_count: 2,
          top_category: "위생용품",
          next_30_cost: 1000,
          next_60_cost: 2000,
          next_90_cost: 3000,
        },
      ],
      buylog_monthly_spending: [
        { month: "2026-05-01", total_amount: 10000, purchase_count: 2 },
      ],
      buylog_category_spending: [
        { category: "위생용품", amount: 10000, purchase_count: 2 },
      ],
      buylog_replacement_due: [],
      buylog_price_movements: [],
      buylog_recent_purchases: [],
    };

    return Promise.resolve({ data: dataByName[name] as T, error: null });
  }
}

describe("dashboard query service", () => {
  it("calls the dashboard RPCs with serialized personal scope parameters", async () => {
    const client = new FakeSupabaseClient();

    await getDashboardData({
      client,
      scope: { type: "personal" },
      anchorDate: new Date("2026-05-30T12:00:00+09:00"),
    });

    expect(client.calls.map((call) => call.name)).toEqual([
      "buylog_dashboard_kpis",
      "buylog_monthly_spending",
      "buylog_category_spending",
      "buylog_replacement_due",
      "buylog_price_movements",
      "buylog_recent_purchases",
    ]);
    expect(client.calls[0]?.params).toMatchObject({
      scope_type: "personal",
      scope_id: null,
      anchor_date: "2026-05-30",
    });
  });

  it("maps grouped dashboard RPC results for the UI", async () => {
    const client = new FakeSupabaseClient();

    const data = await getDashboardData({
      client,
      scope: { type: "group", groupId: "g1", label: "가족", role: "owner" },
      anchorDate: new Date("2026-05-30T12:00:00+09:00"),
    });

    expect(client.calls[0]?.params).toMatchObject({
      scope_type: "group",
      scope_id: "g1",
    });
    expect(data.kpis.monthTotal).toBe(10000);
    expect(data.monthlySpending).toEqual([
      { month: "2026-05", label: "5월", totalAmount: 10000, purchaseCount: 2 },
    ]);
    expect(data.categories[0]?.category).toBe("위생용품");
  });
});
