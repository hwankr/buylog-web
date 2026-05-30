export type DashboardKpiRpcRow = {
  month_total: number | null;
  previous_month_total: number | null;
  purchase_count: number | null;
  top_category: string | null;
  next_30_cost: number | null;
  next_60_cost: number | null;
  next_90_cost: number | null;
};

export type DashboardKpis = {
  monthTotal: number;
  previousMonthTotal: number;
  deltaAmount: number;
  deltaRatio: number | null;
  purchaseCount: number;
  topCategory: string | null;
  forecast: {
    next30DaysAmount: number;
    next60DaysAmount: number;
    next90DaysAmount: number;
  };
};

export type MonthlySpendingRpcRow = {
  month: string;
  total_amount: number | null;
  purchase_count: number | null;
};

export type MonthlySpendingPoint = {
  month: string;
  label: string;
  totalAmount: number;
  purchaseCount: number;
};

export type CategorySpendingRpcRow = {
  category: string | null;
  amount: number | null;
  purchase_count: number | null;
};

export type CategorySpending = {
  category: string;
  amount: number;
  purchaseCount: number;
};

export type PriceMovementRpcRow = {
  item_id: string;
  item_name: string;
  brand: string | null;
  category: string | null;
  current_price: number | null;
  previous_price: number | null;
  current_store: string | null;
  previous_store: string | null;
};

export type PriceMovement = {
  itemId: string;
  itemName: string;
  brand: string;
  category: string;
  currentPrice: number;
  previousPrice: number;
  currentStore: string;
  previousStore: string;
  deltaAmount: number;
  deltaRatio: number | null;
};

export type ReplacementDueRpcRow = {
  item_id: string;
  item_name: string;
  brand: string | null;
  category: string | null;
  last_purchase_date: string | null;
  expected_replacement_date: string | null;
  days_until_replacement: number | null;
  expected_price: number | null;
  remaining_quantity: number | null;
};

export type ReplacementDueItem = {
  itemId: string;
  itemName: string;
  brand: string;
  category: string;
  lastPurchaseDate: string | null;
  expectedReplacementDate: string | null;
  daysUntilReplacement: number;
  expectedPrice: number;
  remainingQuantity: number | null;
};

export type RecentPurchaseRpcRow = {
  purchase_id: string;
  item_id: string;
  item_name: string;
  brand: string | null;
  category: string | null;
  purchase_date: string;
  price: number | null;
  quantity: number | null;
  store_name: string | null;
};

export type RecentPurchase = {
  purchaseId: string;
  itemId: string;
  itemName: string;
  brand: string;
  category: string;
  purchaseDate: string;
  price: number;
  quantity: number;
  storeName: string;
};

function toNumber(value: number | null | undefined) {
  return Number(value ?? 0);
}

export function mapDashboardKpiRow(row: DashboardKpiRpcRow): DashboardKpis {
  const monthTotal = toNumber(row.month_total);
  const previousMonthTotal = toNumber(row.previous_month_total);
  const deltaAmount = monthTotal - previousMonthTotal;

  return {
    monthTotal,
    previousMonthTotal,
    deltaAmount,
    deltaRatio:
      previousMonthTotal === 0 ? null : deltaAmount / previousMonthTotal,
    purchaseCount: toNumber(row.purchase_count),
    topCategory: row.top_category,
    forecast: {
      next30DaysAmount: toNumber(row.next_30_cost),
      next60DaysAmount: toNumber(row.next_60_cost),
      next90DaysAmount: toNumber(row.next_90_cost),
    },
  };
}

export function mapMonthlyRows(
  rows: MonthlySpendingRpcRow[],
): MonthlySpendingPoint[] {
  return rows.map((row) => {
    const [year, month] = row.month.split("-");
    const monthNumber = Number(month);

    return {
      month: `${year}-${month}`,
      label: `${monthNumber}월`,
      totalAmount: toNumber(row.total_amount),
      purchaseCount: toNumber(row.purchase_count),
    };
  });
}

export function mapCategoryRows(
  rows: CategorySpendingRpcRow[],
): CategorySpending[] {
  return rows.map((row) => ({
    category: row.category?.trim() || "미분류",
    amount: toNumber(row.amount),
    purchaseCount: toNumber(row.purchase_count),
  }));
}

export function mapPriceMovementRows(
  rows: PriceMovementRpcRow[],
): PriceMovement[] {
  return rows.map((row) => {
    const currentPrice = toNumber(row.current_price);
    const previousPrice = toNumber(row.previous_price);
    const deltaAmount = currentPrice - previousPrice;

    return {
      itemId: row.item_id,
      itemName: row.item_name,
      brand: row.brand ?? "",
      category: row.category ?? "미분류",
      currentPrice,
      previousPrice,
      currentStore: row.current_store ?? "",
      previousStore: row.previous_store ?? "",
      deltaAmount,
      deltaRatio: previousPrice === 0 ? null : deltaAmount / previousPrice,
    };
  });
}

export function mapReplacementDueRows(
  rows: ReplacementDueRpcRow[],
): ReplacementDueItem[] {
  return rows.map((row) => ({
    itemId: row.item_id,
    itemName: row.item_name,
    brand: row.brand ?? "",
    category: row.category ?? "미분류",
    lastPurchaseDate: row.last_purchase_date,
    expectedReplacementDate: row.expected_replacement_date,
    daysUntilReplacement: toNumber(row.days_until_replacement),
    expectedPrice: toNumber(row.expected_price),
    remainingQuantity:
      row.remaining_quantity === null || row.remaining_quantity === undefined
        ? null
        : Number(row.remaining_quantity),
  }));
}

export function mapRecentPurchaseRows(
  rows: RecentPurchaseRpcRow[],
): RecentPurchase[] {
  return rows.map((row) => ({
    purchaseId: row.purchase_id,
    itemId: row.item_id,
    itemName: row.item_name,
    brand: row.brand ?? "",
    category: row.category ?? "미분류",
    purchaseDate: row.purchase_date,
    price: toNumber(row.price),
    quantity: Math.max(1, toNumber(row.quantity)),
    storeName: row.store_name ?? "",
  }));
}
