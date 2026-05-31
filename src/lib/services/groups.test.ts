import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/queries/groups", () => ({
  getJoinedGroupScopes: vi.fn(),
}));

vi.mock("@/lib/queries/items", () => ({
  getItemList: vi.fn(),
}));

import { getJoinedGroupScopes } from "@/lib/queries/groups";
import { getItemList } from "@/lib/queries/items";
import {
  loadGroupsViewModel,
  summarizeGroupItems,
} from "@/lib/services/groups";
import { createClient } from "@/lib/supabase/server";
import type { ItemListRow } from "@/lib/items/items";

const mockedCreateClient = vi.mocked(createClient);
const mockedGetJoinedGroupScopes = vi.mocked(getJoinedGroupScopes);
const mockedGetItemList = vi.mocked(getItemList);

const viewer = {
  id: "user-1",
  email: "user@example.com",
  displayName: "Demo User",
  source: "demo" as const,
};

function item(overrides: Partial<ItemListRow>): ItemListRow {
  return {
    itemId: "item-1",
    itemName: "Paper cups",
    brand: "Brand",
    imageUrl: "https://example.com/item.svg",
    categoryId: "category-1",
    category: "Office",
    groupId: "group-1",
    groupName: "Lab",
    groupLabel: "Lab",
    replacementCycleDays: 30,
    purchaseCount: 1,
    totalSpent: 1000,
    lastPurchaseDate: "2026-05-01",
    lastPrice: 1000,
    expectedRepurchaseDate: "2026-06-01",
    daysUntilRepurchase: 1,
    ...overrides,
  };
}

describe("group view model service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateClient.mockResolvedValue({ rpc: vi.fn() } as never);
    mockedGetJoinedGroupScopes.mockResolvedValue([
      { groupId: "group-1", label: "Home 302", role: "owner" },
      { groupId: "group-2", label: "Lab", role: "member" },
    ]);
    mockedGetItemList.mockResolvedValueOnce([
      item({
        itemId: "home-rice",
        itemName: "Rice",
        purchaseCount: 6,
        totalSpent: 200000,
        daysUntilRepurchase: 4,
      }),
      item({
        itemId: "home-tissue",
        itemName: "Tissue",
        purchaseCount: 4,
        totalSpent: 80000,
        daysUntilRepurchase: 12,
      }),
    ]);
    mockedGetItemList.mockResolvedValueOnce([
      item({
        itemId: "lab-toner",
        itemName: "Toner",
        purchaseCount: 3,
        totalSpent: 230000,
        daysUntilRepurchase: 20,
      }),
    ]);
  });

  it("loads joined groups and summarizes each group's items", async () => {
    const viewModel = await loadGroupsViewModel({
      viewer,
      anchorDate: new Date("2026-05-31T12:00:00+09:00"),
    });

    expect(viewModel.viewer).toBe(viewer);
    expect(viewModel.groups).toEqual([
      expect.objectContaining({
        groupId: "group-1",
        label: "Home 302",
        role: "owner",
        itemCount: 2,
        purchaseCount: 10,
        totalSpent: 280000,
        nextReplacement: expect.objectContaining({ itemName: "Rice" }),
      }),
      expect.objectContaining({
        groupId: "group-2",
        label: "Lab",
        role: "member",
        itemCount: 1,
        purchaseCount: 3,
        totalSpent: 230000,
      }),
    ]);
    expect(mockedGetJoinedGroupScopes).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
    );
    expect(mockedGetItemList).toHaveBeenNthCalledWith(1, {
      client: expect.anything(),
      params: expect.objectContaining({
        groups: ["group:group-1"],
        sort: "total_spent",
        direction: "desc",
        anchorDate: "2026-05-31",
      }),
    });
    expect(mockedGetItemList).toHaveBeenNthCalledWith(2, {
      client: expect.anything(),
      params: expect.objectContaining({
        groups: ["group:group-2"],
      }),
    });
  });

  it("sorts top items by spend and nearest replacement by days", () => {
    const summary = summarizeGroupItems({
      group: { groupId: "group-1", label: "Home 302", role: "owner" },
      items: [
        item({
          itemId: "soap",
          itemName: "Soap",
          totalSpent: 5000,
          daysUntilRepurchase: 9,
        }),
        item({
          itemId: "rice",
          itemName: "Rice",
          totalSpent: 50000,
          daysUntilRepurchase: 20,
        }),
        item({
          itemId: "tissue",
          itemName: "Tissue",
          totalSpent: 30000,
          daysUntilRepurchase: 2,
        }),
        item({
          itemId: "coffee",
          itemName: "Coffee",
          totalSpent: 20000,
          daysUntilRepurchase: null,
        }),
      ],
    });

    expect(summary.nextReplacement?.itemName).toBe("Tissue");
    expect(summary.topItems.map((topItem) => topItem.itemName)).toEqual([
      "Rice",
      "Tissue",
      "Coffee",
    ]);
  });
});
