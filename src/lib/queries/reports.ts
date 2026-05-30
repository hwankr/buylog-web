import "server-only";

import type { BuylogScope } from "@/lib/scope";
import {
  type CategoryShare,
  type CategoryShareRpcRow,
  type ItemSpending,
  type ItemSpendingRpcRow,
  type PurchaseExport,
  type PurchaseExportRpcRow,
  type ReportFilterOptionRpcRow,
  type ReportFilterOptions,
  type ReportFilters,
  type SpendingTrendPoint,
  type SpendingTrendRpcRow,
  type StoreSpending,
  type StoreSpendingRpcRow,
  mapCategoryShareRows,
  mapFilterOptionRows,
  mapItemSpendingRows,
  mapPurchaseExportRows,
  mapSpendingTrendRows,
  mapStoreSpendingRows,
} from "@/lib/reporting/reports";

export type ReportRpcClient = {
  rpc(name: string, params: Record<string, unknown>): unknown;
};

export type ReportData = {
  trend: SpendingTrendPoint[];
  categories: CategoryShare[];
  items: ItemSpending[];
  stores: StoreSpending[];
};

type ScopeParams = {
  scope_type: "personal" | "group";
  scope_id: string | null;
};

function scopeParams(scope: BuylogScope): ScopeParams {
  return {
    scope_type: scope.type,
    scope_id: scope.type === "group" ? scope.groupId : null,
  };
}

function filteredParams(scope: BuylogScope, filters: ReportFilters) {
  return {
    ...scopeParams(scope),
    period_start: filters.range.from,
    period_end: filters.range.to,
    category_ids: filters.categories,
    item_ids: filters.items,
    store_names: filters.stores,
  };
}

async function rpcRows<T>(
  client: ReportRpcClient,
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

export async function getReportFilterOptions({
  client,
  scope,
}: {
  client: ReportRpcClient;
  scope: BuylogScope;
}): Promise<ReportFilterOptions> {
  const rows = await rpcRows<ReportFilterOptionRpcRow>(
    client,
    "buylog_report_filter_options",
    scopeParams(scope),
  );

  return mapFilterOptionRows(rows);
}

export async function getReportData({
  client,
  scope,
  filters,
}: {
  client: ReportRpcClient;
  scope: BuylogScope;
  filters: ReportFilters;
}): Promise<ReportData> {
  const baseParams = filteredParams(scope, filters);
  const [trendRows, categoryRows, itemRows, storeRows] = await Promise.all([
    rpcRows<SpendingTrendRpcRow>(client, "buylog_report_spending_trend", {
      ...baseParams,
      trend_grain: filters.trendGrain,
    }),
    rpcRows<CategoryShareRpcRow>(
      client,
      "buylog_report_category_share",
      baseParams,
    ),
    rpcRows<ItemSpendingRpcRow>(
      client,
      "buylog_report_item_spending",
      baseParams,
    ),
    rpcRows<StoreSpendingRpcRow>(
      client,
      "buylog_report_store_spending",
      baseParams,
    ),
  ]);

  return {
    trend: mapSpendingTrendRows(trendRows, filters.trendGrain),
    categories: mapCategoryShareRows(categoryRows),
    items: mapItemSpendingRows(itemRows),
    stores: mapStoreSpendingRows(storeRows),
  };
}

export async function loadReportCsvRows({
  client,
  scope,
  filters,
}: {
  client: ReportRpcClient;
  scope: BuylogScope;
  filters: ReportFilters;
}): Promise<PurchaseExport[]> {
  const rows = await rpcRows<PurchaseExportRpcRow>(
    client,
    "buylog_report_purchase_export",
    filteredParams(scope, filters),
  );

  return mapPurchaseExportRows(rows);
}
