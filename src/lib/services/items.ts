import "server-only";

import {
  getItemDetail,
  getItemFilterOptions,
  getItemList,
  getItemPurchaseHistory,
} from "@/lib/queries/items";
import {
  type ItemDetail,
  type ItemFilterOptions,
  type ItemListParams,
  type ItemListRow,
  type ItemParamSource,
  type ItemPurchaseHistoryRow,
  resolveItemListParams,
} from "@/lib/items/items";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/lib/auth/viewer";

export type ItemsViewModel = {
  viewer: Viewer;
  params: ItemListParams;
  filterOptions: ItemFilterOptions;
  items: ItemListRow[];
};

export type ItemDetailViewModel = {
  viewer: Viewer;
  item: ItemDetail;
  history: ItemPurchaseHistoryRow[];
};

export async function loadItemsViewModel({
  viewer,
  searchParams,
  anchorDate = new Date(),
}: {
  viewer: Viewer;
  searchParams: ItemParamSource;
  anchorDate?: Date;
}): Promise<ItemsViewModel> {
  const supabase = await createClient();
  const params = resolveItemListParams(searchParams, anchorDate);
  const [filterOptions, items] = await Promise.all([
    getItemFilterOptions({ client: supabase }),
    getItemList({ client: supabase, params }),
  ]);

  return {
    viewer,
    params,
    filterOptions,
    items,
  };
}

export async function loadItemDetailViewModel({
  viewer,
  itemId,
  anchorDate = new Date(),
}: {
  viewer: Viewer;
  itemId: string;
  anchorDate?: Date;
}): Promise<ItemDetailViewModel | null> {
  const supabase = await createClient();
  const params = resolveItemListParams({}, anchorDate);
  const item = await getItemDetail({
    client: supabase,
    itemId,
    anchorDate: params.anchorDate,
  });

  if (!item) return null;

  const history = await getItemPurchaseHistory({
    client: supabase,
    itemId,
  });

  return {
    viewer,
    item,
    history,
  };
}
