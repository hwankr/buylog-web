import "server-only";

import { getJoinedGroupScopes } from "@/lib/queries/groups";
import { getItemList } from "@/lib/queries/items";
import { resolveItemListParams, type ItemListRow } from "@/lib/items/items";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/lib/auth/viewer";
import type { JoinedGroupScope } from "@/lib/scope";

export type GroupSummary = JoinedGroupScope & {
  itemCount: number;
  purchaseCount: number;
  totalSpent: number;
  nextReplacement: ItemListRow | null;
  topItems: ItemListRow[];
};

export type GroupsViewModel = {
  viewer: Viewer;
  groups: GroupSummary[];
};

function replacementRank(item: ItemListRow) {
  return item.daysUntilRepurchase ?? Number.POSITIVE_INFINITY;
}

export function summarizeGroupItems({
  group,
  items,
}: {
  group: JoinedGroupScope;
  items: ItemListRow[];
}): GroupSummary {
  const sortedByReplacement = [...items].sort(
    (left, right) => replacementRank(left) - replacementRank(right),
  );
  const sortedBySpend = [...items].sort(
    (left, right) => right.totalSpent - left.totalSpent,
  );

  return {
    ...group,
    itemCount: items.length,
    purchaseCount: items.reduce((sum, item) => sum + item.purchaseCount, 0),
    totalSpent: items.reduce((sum, item) => sum + item.totalSpent, 0),
    nextReplacement: sortedByReplacement[0] ?? null,
    topItems: sortedBySpend.slice(0, 3),
  };
}

export async function loadGroupsViewModel({
  viewer,
  anchorDate = new Date(),
}: {
  viewer: Viewer;
  anchorDate?: Date;
}): Promise<GroupsViewModel> {
  const supabase = await createClient();
  const groups = await getJoinedGroupScopes(supabase, viewer.id);
  const summaries = await Promise.all(
    groups.map(async (group) => {
      const params = resolveItemListParams(
        {
          group: `group:${group.groupId}`,
          sort: "total_spent",
          dir: "desc",
        },
        anchorDate,
      );
      const items = await getItemList({ client: supabase, params });

      return summarizeGroupItems({ group, items });
    }),
  );

  return {
    viewer,
    groups: summaries,
  };
}
