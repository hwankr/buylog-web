import "server-only";

import { formatKstDate, getKstMonthRange } from "@/lib/format";
import {
  type CategorySpending,
  type CategorySpendingRpcRow,
  type DashboardKpis,
  type DashboardKpiRpcRow,
  type MonthlySpendingPoint,
  type MonthlySpendingRpcRow,
  type PriceMovement,
  type PriceMovementRpcRow,
  type RecentPurchase,
  type RecentPurchaseRpcRow,
  type ReplacementDueItem,
  type ReplacementDueRpcRow,
  mapCategoryRows,
  mapDashboardKpiRow,
  mapMonthlyRows,
  mapPriceMovementRows,
  mapRecentPurchaseRows,
  mapReplacementDueRows,
} from "@/lib/reporting/dashboard";
import type { BuylogScope } from "@/lib/scope";

export type DashboardRpcClient = {
  rpc(name: string, params: Record<string, unknown>): unknown;
};

export type DashboardData = {
  kpis: DashboardKpis;
  monthlySpending: MonthlySpendingPoint[];
  categories: CategorySpending[];
  replacementDue: ReplacementDueItem[];
  priceMovements: PriceMovement[];
  recentPurchases: RecentPurchase[];
};

type GetDashboardDataOptions = {
  client: DashboardRpcClient;
  scope: BuylogScope;
  anchorDate?: Date;
};

function scopeParams(scope: BuylogScope) {
  return {
    scope_type: scope.type,
    scope_id: scope.type === "group" ? scope.groupId : null,
  };
}

async function rpcRows<T>(
  client: DashboardRpcClient,
  name: string,
  params: Record<string, unknown>,
): Promise<T[]> {
  const { data, error } = (await client.rpc(name, params)) as {
    data: T[] | null;
    error: { message: string } | null;
  };
  if (error) {
    throw new Error(`${name}: ${error.message}`);
  }
  return Array.isArray(data) ? data : [];
}

export async function getDashboardData({
  client,
  scope,
  anchorDate = new Date(),
}: GetDashboardDataOptions): Promise<DashboardData> {
  const anchorDateParam = formatKstDate(anchorDate);
  const monthRange = getKstMonthRange(anchorDate);
  const baseParams = {
    ...scopeParams(scope),
    anchor_date: anchorDateParam,
  };

  const [
    kpiRows,
    monthlyRows,
    categoryRows,
    replacementRows,
    priceRows,
    recentRows,
  ] = await Promise.all([
    rpcRows<DashboardKpiRpcRow>(client, "buylog_dashboard_kpis", baseParams),
    rpcRows<MonthlySpendingRpcRow>(client, "buylog_monthly_spending", {
      ...baseParams,
      months: 6,
    }),
    rpcRows<CategorySpendingRpcRow>(client, "buylog_category_spending", {
      ...scopeParams(scope),
      period_start: monthRange.start,
      period_end: monthRange.end,
    }),
    rpcRows<ReplacementDueRpcRow>(client, "buylog_replacement_due", {
      ...baseParams,
      days: 30,
    }),
    rpcRows<PriceMovementRpcRow>(client, "buylog_price_movements", {
      ...baseParams,
      limit_count: 5,
    }),
    rpcRows<RecentPurchaseRpcRow>(client, "buylog_recent_purchases", {
      ...baseParams,
      limit_count: 8,
    }),
  ]);

  return {
    kpis: mapDashboardKpiRow(
      kpiRows[0] ?? {
        month_total: 0,
        previous_month_total: 0,
        purchase_count: 0,
        top_category: null,
        next_30_cost: 0,
        next_60_cost: 0,
        next_90_cost: 0,
      },
    ),
    monthlySpending: mapMonthlyRows(monthlyRows),
    categories: mapCategoryRows(categoryRows),
    replacementDue: mapReplacementDueRows(replacementRows),
    priceMovements: mapPriceMovementRows(priceRows),
    recentPurchases: mapRecentPurchaseRows(recentRows),
  };
}
