import { formatKstDate } from "@/lib/format";

const DEFAULT_CATEGORY_NAME = "미분류";
const DEFAULT_GROUP_LABEL = "내 물품";
const DEFAULT_STORE_NAME = "미지정 매장";

export type ItemSortKey =
  | "name"
  | "category"
  | "group"
  | "last_purchase"
  | "purchase_count"
  | "total_spent"
  | "next_repurchase";

export type ItemSortDirection = "asc" | "desc";
export type ItemParamSource =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

export type ItemListParams = {
  search: string;
  sort: ItemSortKey;
  direction: ItemSortDirection;
  categories: string[];
  groups: string[];
  anchorDate: string;
  limit: number;
};

export type ItemFilterOptionRpcRow = {
  option_type: "category" | "group" | string;
  option_id: string | null;
  label: string | null;
  secondary_label: string | null;
};

export type ItemFilterOption = {
  id: string;
  label: string;
  secondaryLabel: string;
};

export type ItemFilterOptions = {
  categories: ItemFilterOption[];
  groups: ItemFilterOption[];
};

export type ItemListRpcRow = {
  item_id: string;
  item_name: string;
  brand: string | null;
  image_url: string | null;
  category_id: string | null;
  category: string | null;
  group_id: string | null;
  group_name: string | null;
  group_label: string | null;
  replacement_cycle_days: number | null;
  purchase_count: number | null;
  total_spent: number | null;
  last_purchase_date: string | null;
  last_price: number | null;
  expected_repurchase_date: string | null;
  days_until_repurchase: number | null;
};

export type ItemListRow = {
  itemId: string;
  itemName: string;
  brand: string;
  imageUrl: string;
  categoryId: string | null;
  category: string;
  groupId: string | null;
  groupName: string;
  groupLabel: string;
  replacementCycleDays: number | null;
  purchaseCount: number;
  totalSpent: number;
  lastPurchaseDate: string | null;
  lastPrice: number;
  expectedRepurchaseDate: string | null;
  daysUntilRepurchase: number | null;
};

export type ItemDetailRpcRow = {
  item_id: string;
  item_name: string;
  brand: string | null;
  image_url: string | null;
  category_id: string | null;
  category: string | null;
  group_id: string | null;
  group_name: string | null;
  group_label: string | null;
  replacement_cycle_days: number | null;
  purchase_count: number | null;
  total_spent: number | null;
  average_price: number | string | null;
  min_price: number | null;
  max_price: number | null;
  last_purchase_date: string | null;
  last_price: number | null;
  last_store_name: string | null;
  expected_repurchase_date: string | null;
  days_until_repurchase: number | null;
};

export type ItemDetail = ItemListRow & {
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  lastStoreName: string;
};

export type ItemPurchaseHistoryRpcRow = {
  purchase_id: string;
  purchase_date: string;
  store_name: string | null;
  quantity: number | null;
  price: number | null;
  previous_price: number | null;
  price_delta: number | null;
  price_delta_ratio: number | string | null;
};

export type ItemPurchaseHistoryRow = {
  purchaseId: string;
  purchaseDate: string;
  storeName: string;
  quantity: number;
  price: number;
  previousPrice: number | null;
  priceDelta: number | null;
  priceDeltaRatio: number | null;
};

const validSortKeys = new Set<ItemSortKey>([
  "name",
  "category",
  "group",
  "last_purchase",
  "purchase_count",
  "total_spent",
  "next_repurchase",
]);

function getParamValues(source: ItemParamSource, key: string) {
  if (source instanceof URLSearchParams) return source.getAll(key);
  const value = source[key];
  if (Array.isArray(value)) return value;
  return value === undefined ? [] : [value];
}

function firstParam(source: ItemParamSource, key: string) {
  return getParamValues(source, key)[0];
}

function uniqueTrimmed(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const rawValue of values) {
    const value = rawValue.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }

  return result;
}

function normalizeGroups(values: string[]) {
  return uniqueTrimmed(values).filter(
    (value) => value === "personal" || value.startsWith("group:"),
  );
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function toOptionalNumber(value: number | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}

export function resolveItemListParams(
  source: ItemParamSource,
  anchorDate: Date = new Date(),
): ItemListParams {
  const requestedSort = firstParam(source, "sort");
  const sort: ItemSortKey =
    requestedSort && validSortKeys.has(requestedSort as ItemSortKey)
      ? (requestedSort as ItemSortKey)
      : "name";
  const direction: ItemSortDirection =
    firstParam(source, "dir") === "desc" ? "desc" : "asc";

  return {
    search: firstParam(source, "q")?.trim() ?? "",
    sort,
    direction,
    categories: uniqueTrimmed(getParamValues(source, "category")),
    groups: normalizeGroups(getParamValues(source, "group")),
    anchorDate: formatKstDate(anchorDate),
    limit: 100,
  };
}

export function buildItemsHref(path: string, params: ItemListParams) {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("q", params.search);
  if (params.sort !== "name") searchParams.set("sort", params.sort);
  if (params.direction !== "asc") searchParams.set("dir", params.direction);
  params.categories.forEach((category) =>
    searchParams.append("category", category),
  );
  params.groups.forEach((group) => searchParams.append("group", group));

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export function mapItemFilterOptionRows(
  rows: ItemFilterOptionRpcRow[],
): ItemFilterOptions {
  const options: ItemFilterOptions = {
    categories: [],
    groups: [],
  };

  const addOption = (
    target: ItemFilterOption[],
    row: ItemFilterOptionRpcRow,
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
    } else if (row.option_type === "group") {
      addOption(options.groups, row, DEFAULT_GROUP_LABEL);
    }
  }

  return options;
}

export function mapItemListRows(rows: ItemListRpcRow[]): ItemListRow[] {
  return rows.map((row) => ({
    itemId: row.item_id,
    itemName: row.item_name,
    brand: row.brand ?? "",
    imageUrl: row.image_url?.trim() ?? "",
    categoryId: row.category_id,
    category: row.category?.trim() || DEFAULT_CATEGORY_NAME,
    groupId: row.group_id,
    groupName: row.group_name ?? "",
    groupLabel: row.group_label?.trim() || DEFAULT_GROUP_LABEL,
    replacementCycleDays: toOptionalNumber(row.replacement_cycle_days),
    purchaseCount: toNumber(row.purchase_count),
    totalSpent: toNumber(row.total_spent),
    lastPurchaseDate: row.last_purchase_date,
    lastPrice: toNumber(row.last_price),
    expectedRepurchaseDate: row.expected_repurchase_date,
    daysUntilRepurchase: toOptionalNumber(row.days_until_repurchase),
  }));
}

export function mapItemDetailRows(rows: ItemDetailRpcRow[]): ItemDetail | null {
  const row = rows[0];
  if (!row) return null;

  return {
    itemId: row.item_id,
    itemName: row.item_name,
    brand: row.brand ?? "",
    imageUrl: row.image_url?.trim() ?? "",
    categoryId: row.category_id,
    category: row.category?.trim() || DEFAULT_CATEGORY_NAME,
    groupId: row.group_id,
    groupName: row.group_name ?? "",
    groupLabel: row.group_label?.trim() || DEFAULT_GROUP_LABEL,
    replacementCycleDays: toOptionalNumber(row.replacement_cycle_days),
    purchaseCount: toNumber(row.purchase_count),
    totalSpent: toNumber(row.total_spent),
    averagePrice: toNumber(row.average_price),
    minPrice: toNumber(row.min_price),
    maxPrice: toNumber(row.max_price),
    lastPurchaseDate: row.last_purchase_date,
    lastPrice: toNumber(row.last_price),
    lastStoreName: row.last_store_name?.trim() || DEFAULT_STORE_NAME,
    expectedRepurchaseDate: row.expected_repurchase_date,
    daysUntilRepurchase: toOptionalNumber(row.days_until_repurchase),
  };
}

export function mapItemPurchaseHistoryRows(
  rows: ItemPurchaseHistoryRpcRow[],
): ItemPurchaseHistoryRow[] {
  return rows.map((row) => ({
    purchaseId: row.purchase_id,
    purchaseDate: row.purchase_date,
    storeName: row.store_name?.trim() || DEFAULT_STORE_NAME,
    quantity: Math.max(1, toNumber(row.quantity)),
    price: toNumber(row.price),
    previousPrice: toOptionalNumber(row.previous_price),
    priceDelta: toOptionalNumber(row.price_delta),
    priceDeltaRatio:
      row.price_delta_ratio === null || row.price_delta_ratio === undefined
        ? null
        : Number(row.price_delta_ratio),
  }));
}
