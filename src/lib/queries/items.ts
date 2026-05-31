import "server-only";

import {
  type ItemDetail,
  type ItemDetailRpcRow,
  type ItemFilterOptionRpcRow,
  type ItemFilterOptions,
  type ItemListParams,
  type ItemListRow,
  type ItemListRpcRow,
  type ItemPurchaseHistoryRow,
  type ItemPurchaseHistoryRpcRow,
  mapItemDetailRows,
  mapItemFilterOptionRows,
  mapItemListRows,
  mapItemPurchaseHistoryRows,
} from "@/lib/items/items";

export type ItemRpcClient = {
  rpc(name: string, params: Record<string, unknown>): unknown;
};

async function rpcRows<T>(
  client: ItemRpcClient,
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

export async function getItemFilterOptions({
  client,
}: {
  client: ItemRpcClient;
}): Promise<ItemFilterOptions> {
  const rows = await rpcRows<ItemFilterOptionRpcRow>(
    client,
    "buylog_item_filter_options",
    {},
  );

  return mapItemFilterOptionRows(rows);
}

export async function getItemList({
  client,
  params,
}: {
  client: ItemRpcClient;
  params: ItemListParams;
}): Promise<ItemListRow[]> {
  const rows = await rpcRows<ItemListRpcRow>(client, "buylog_item_list", {
    search_text: params.search,
    category_ids: params.categories,
    group_filters: params.groups,
    sort_key: params.sort,
    sort_direction: params.direction,
    limit_count: params.limit,
    anchor_date: params.anchorDate,
  });

  return mapItemListRows(rows);
}

export async function getItemDetail({
  client,
  itemId,
  anchorDate,
}: {
  client: ItemRpcClient;
  itemId: string;
  anchorDate: string;
}): Promise<ItemDetail | null> {
  const rows = await rpcRows<ItemDetailRpcRow>(client, "buylog_item_detail", {
    target_item_id: itemId,
    anchor_date: anchorDate,
  });

  return mapItemDetailRows(rows);
}

export async function getItemPurchaseHistory({
  client,
  itemId,
  limit = 50,
}: {
  client: ItemRpcClient;
  itemId: string;
  limit?: number;
}): Promise<ItemPurchaseHistoryRow[]> {
  const rows = await rpcRows<ItemPurchaseHistoryRpcRow>(
    client,
    "buylog_item_purchase_history",
    {
      target_item_id: itemId,
      limit_count: limit,
    },
  );

  return mapItemPurchaseHistoryRows(rows);
}
