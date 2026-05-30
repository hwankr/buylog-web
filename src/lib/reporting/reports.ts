import { startOfMonth, startOfYear, subMonths } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { formatKstDate } from "@/lib/format";
import { serializeScope, type BuylogScope } from "@/lib/scope";

const KST_TIME_ZONE = "Asia/Seoul";
const DEFAULT_STORE_NAME = "미지정 매장";
const DEFAULT_CATEGORY_NAME = "미분류";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type ReportPeriod = "this-month" | "last-3-months" | "this-year" | "custom";
export type ReportTrendGrain = "month" | "year";
export type ReportParamSource =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

export type ReportRange = {
  from: string;
  to: string;
  label: string;
};

export type ReportFilters = {
  period: ReportPeriod;
  range: ReportRange;
  trendGrain: ReportTrendGrain;
  categories: string[];
  items: string[];
  stores: string[];
};

export type ReportFilterOptionRpcRow = {
  option_type: "category" | "item" | "store" | string;
  option_id: string | null;
  label: string | null;
  secondary_label: string | null;
};

export type ReportFilterOption = {
  id: string;
  label: string;
  secondaryLabel: string;
};

export type ReportFilterOptions = {
  categories: ReportFilterOption[];
  items: ReportFilterOption[];
  stores: ReportFilterOption[];
};

export type SpendingTrendRpcRow = {
  bucket: string;
  total_amount: number | null;
  purchase_count: number | null;
};

export type SpendingTrendPoint = {
  bucket: string;
  label: string;
  totalAmount: number;
  purchaseCount: number;
};

export type CategoryShareRpcRow = {
  category_id: string | null;
  category: string | null;
  amount: number | null;
  purchase_count: number | null;
};

export type CategoryShare = {
  categoryId: string | null;
  category: string;
  amount: number;
  purchaseCount: number;
  shareRatio: number;
};

export type ItemSpendingRpcRow = {
  item_id: string;
  item_name: string;
  brand: string | null;
  category: string | null;
  amount: number | null;
  purchase_count: number | null;
};

export type ItemSpending = {
  itemId: string;
  itemName: string;
  brand: string;
  category: string;
  amount: number;
  purchaseCount: number;
};

export type StoreSpendingRpcRow = {
  store_name: string | null;
  amount: number | null;
  purchase_count: number | null;
};

export type StoreSpending = {
  storeName: string;
  amount: number;
  purchaseCount: number;
};

export type PurchaseExportRpcRow = {
  purchase_id: string;
  purchase_date: string;
  item_name: string;
  brand: string | null;
  category: string | null;
  store_name: string | null;
  quantity: number | null;
  price: number | null;
};

export type PurchaseExport = {
  purchaseId: string;
  purchaseDate: string;
  itemName: string;
  brand: string;
  category: string;
  storeName: string;
  quantity: number;
  price: number;
};

function getParamValues(source: ReportParamSource, key: string) {
  if (source instanceof URLSearchParams) {
    return source.getAll(key);
  }

  const value = source[key];
  if (Array.isArray(value)) return value;
  return value === undefined ? [] : [value];
}

function firstParam(source: ReportParamSource, key: string) {
  return getParamValues(source, key)[0];
}

export function normalizeMultiParam(source: ReportParamSource, key: string) {
  const seen = new Set<string>();
  const values: string[] = [];

  for (const rawValue of getParamValues(source, key)) {
    const value = rawValue.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    values.push(value);
  }

  return values;
}

function toNumber(value: number | null | undefined) {
  return Number(value ?? 0);
}

function isValidDateString(value: string | undefined): value is string {
  if (!value || !DATE_PATTERN.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function monthSpan(from: string, to: string) {
  const [fromYear, fromMonth] = from.split("-").map(Number);
  const [toYear, toMonth] = to.split("-").map(Number);

  return (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
}

function trendGrainForRange(range: ReportRange): ReportTrendGrain {
  return monthSpan(range.from, range.to) <= 12 ? "month" : "year";
}

function thisMonthRange(anchorDate: Date): ReportRange {
  const zonedAnchor = toZonedTime(anchorDate, KST_TIME_ZONE);

  return {
    from: formatKstDate(startOfMonth(zonedAnchor)),
    to: formatKstDate(zonedAnchor),
    label: "이번 달",
  };
}

function lastThreeMonthsRange(anchorDate: Date): ReportRange {
  const zonedAnchor = toZonedTime(anchorDate, KST_TIME_ZONE);

  return {
    from: formatKstDate(startOfMonth(subMonths(zonedAnchor, 2))),
    to: formatKstDate(zonedAnchor),
    label: "최근 3개월",
  };
}

function thisYearRange(anchorDate: Date): ReportRange {
  const zonedAnchor = toZonedTime(anchorDate, KST_TIME_ZONE);

  return {
    from: formatKstDate(startOfYear(zonedAnchor)),
    to: formatKstDate(zonedAnchor),
    label: "올해",
  };
}

function customRange(source: ReportParamSource): ReportRange | null {
  const from = firstParam(source, "from")?.trim();
  const to = firstParam(source, "to")?.trim();

  if (!isValidDateString(from) || !isValidDateString(to) || from > to) {
    return null;
  }

  return {
    from,
    to,
    label: `${from} - ${to}`,
  };
}

export function resolveReportFilters(
  source: ReportParamSource,
  anchorDate: Date = new Date(),
): ReportFilters {
  const requestedPeriod = firstParam(source, "period");
  let period: ReportPeriod = "this-month";
  let range = thisMonthRange(anchorDate);

  if (requestedPeriod === "last-3-months") {
    period = "last-3-months";
    range = lastThreeMonthsRange(anchorDate);
  } else if (requestedPeriod === "this-year") {
    period = "this-year";
    range = thisYearRange(anchorDate);
  } else if (requestedPeriod === "custom") {
    const custom = customRange(source);
    if (custom) {
      period = "custom";
      range = custom;
    }
  }

  return {
    period,
    range,
    trendGrain: trendGrainForRange(range),
    categories: normalizeMultiParam(source, "category"),
    items: normalizeMultiParam(source, "item"),
    stores: normalizeMultiParam(source, "store"),
  };
}

export function buildReportSearchParams(filters: ReportFilters, scope: BuylogScope) {
  const params = new URLSearchParams();

  params.set("period", filters.period);
  if (filters.period === "custom") {
    params.set("from", filters.range.from);
    params.set("to", filters.range.to);
  }
  params.set("scope", serializeScope(scope));
  filters.categories.forEach((category) => params.append("category", category));
  filters.items.forEach((item) => params.append("item", item));
  filters.stores.forEach((store) => params.append("store", store));

  return params;
}

export function buildReportHref(
  path: string,
  filters: ReportFilters,
  scope: BuylogScope,
) {
  return `${path}?${buildReportSearchParams(filters, scope).toString()}`;
}

export function mapFilterOptionRows(
  rows: ReportFilterOptionRpcRow[],
): ReportFilterOptions {
  const options: ReportFilterOptions = {
    categories: [],
    items: [],
    stores: [],
  };

  const addOption = (
    target: ReportFilterOption[],
    row: ReportFilterOptionRpcRow,
    fallbackLabel: string,
  ) => {
    const label = row.label?.trim() || fallbackLabel;
    const id = row.option_id?.trim() || label;

    if (target.some((option) => option.id === id)) return;

    target.push({
      id,
      label,
      secondaryLabel: row.secondary_label?.trim() ?? "",
    });
  };

  for (const row of rows) {
    if (row.option_type === "category") {
      addOption(options.categories, row, DEFAULT_CATEGORY_NAME);
    } else if (row.option_type === "item") {
      addOption(options.items, row, "이름 없는 품목");
    } else if (row.option_type === "store") {
      addOption(options.stores, row, DEFAULT_STORE_NAME);
    }
  }

  return options;
}

export function mapSpendingTrendRows(
  rows: SpendingTrendRpcRow[],
  grain: ReportTrendGrain,
): SpendingTrendPoint[] {
  return rows.map((row) => {
    const [year, month] = row.bucket.split("-");

    return {
      bucket: row.bucket,
      label: grain === "year" ? `${year}년` : `${Number(month)}월`,
      totalAmount: toNumber(row.total_amount),
      purchaseCount: toNumber(row.purchase_count),
    };
  });
}

export function mapCategoryShareRows(rows: CategoryShareRpcRow[]): CategoryShare[] {
  const totalAmount = rows.reduce(
    (sum, row) => sum + toNumber(row.amount),
    0,
  );

  return rows.map((row) => {
    const amount = toNumber(row.amount);

    return {
      categoryId: row.category_id,
      category: row.category?.trim() || DEFAULT_CATEGORY_NAME,
      amount,
      purchaseCount: toNumber(row.purchase_count),
      shareRatio: totalAmount === 0 ? 0 : amount / totalAmount,
    };
  });
}

export function mapItemSpendingRows(rows: ItemSpendingRpcRow[]): ItemSpending[] {
  return rows.map((row) => ({
    itemId: row.item_id,
    itemName: row.item_name,
    brand: row.brand ?? "",
    category: row.category?.trim() || DEFAULT_CATEGORY_NAME,
    amount: toNumber(row.amount),
    purchaseCount: toNumber(row.purchase_count),
  }));
}

export function mapStoreSpendingRows(rows: StoreSpendingRpcRow[]): StoreSpending[] {
  return rows.map((row) => ({
    storeName: row.store_name?.trim() || DEFAULT_STORE_NAME,
    amount: toNumber(row.amount),
    purchaseCount: toNumber(row.purchase_count),
  }));
}

export function mapPurchaseExportRows(
  rows: PurchaseExportRpcRow[],
): PurchaseExport[] {
  return rows.map((row) => ({
    purchaseId: row.purchase_id,
    purchaseDate: row.purchase_date,
    itemName: row.item_name,
    brand: row.brand ?? "",
    category: row.category?.trim() || DEFAULT_CATEGORY_NAME,
    storeName: row.store_name?.trim() || DEFAULT_STORE_NAME,
    quantity: Math.max(1, toNumber(row.quantity)),
    price: toNumber(row.price),
  }));
}
