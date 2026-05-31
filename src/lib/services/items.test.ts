import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/queries/items", () => ({
  getItemDetail: vi.fn(),
  getItemFilterOptions: vi.fn(),
  getItemList: vi.fn(),
  getItemPurchaseHistory: vi.fn(),
}));

import {
  getItemDetail,
  getItemFilterOptions,
  getItemList,
  getItemPurchaseHistory,
} from "@/lib/queries/items";
import {
  loadItemDetailViewModel,
  loadItemsViewModel,
} from "@/lib/services/items";
import { createClient } from "@/lib/supabase/server";

const mockedCreateClient = vi.mocked(createClient);
const mockedGetItemDetail = vi.mocked(getItemDetail);
const mockedGetItemFilterOptions = vi.mocked(getItemFilterOptions);
const mockedGetItemList = vi.mocked(getItemList);
const mockedGetItemPurchaseHistory = vi.mocked(getItemPurchaseHistory);

const viewer = {
  id: "user-1",
  email: "user@example.com",
  displayName: "User",
  source: "auth" as const,
};

describe("item view model service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateClient.mockResolvedValue({ rpc: vi.fn() } as never);
    mockedGetItemFilterOptions.mockResolvedValue({
      categories: [{ id: "cat-1", label: "위생용품", secondaryLabel: "" }],
      groups: [{ id: "personal", label: "내 물품", secondaryLabel: "개인" }],
    });
    mockedGetItemList.mockResolvedValue([
      {
        itemId: "item-1",
        itemName: "샴푸",
        brand: "브랜드",
        imageUrl: "https://example.com/item.svg",
        categoryId: "cat-1",
        category: "위생용품",
        groupId: null,
        groupName: "",
        groupLabel: "내 물품",
        replacementCycleDays: 30,
        purchaseCount: 2,
        totalSpent: 22000,
        lastPurchaseDate: "2026-05-20",
        lastPrice: 12000,
        expectedRepurchaseDate: "2026-06-19",
        daysUntilRepurchase: 19,
      },
    ]);
    mockedGetItemDetail.mockResolvedValue({
      itemId: "item-1",
      itemName: "샴푸",
      brand: "브랜드",
      imageUrl: "https://example.com/detail.svg",
      categoryId: "cat-1",
      category: "위생용품",
      groupId: null,
      groupName: "",
      groupLabel: "내 물품",
      replacementCycleDays: 30,
      purchaseCount: 2,
      totalSpent: 22000,
      averagePrice: 11000,
      minPrice: 10000,
      maxPrice: 12000,
      lastPurchaseDate: "2026-05-20",
      lastPrice: 12000,
      lastStoreName: "쿠팡",
      expectedRepurchaseDate: "2026-06-19",
      daysUntilRepurchase: 19,
    });
    mockedGetItemPurchaseHistory.mockResolvedValue([]);
  });

  it("loads item list filters and rows", async () => {
    const viewModel = await loadItemsViewModel({
      viewer,
      searchParams: {
        q: "샴푸",
        category: "cat-1",
        group: "personal",
        sort: "total_spent",
        dir: "desc",
      },
      anchorDate: new Date("2026-05-31T12:00:00+09:00"),
    });

    expect(viewModel.viewer).toBe(viewer);
    expect(viewModel.params).toMatchObject({
      search: "샴푸",
      sort: "total_spent",
      direction: "desc",
      categories: ["cat-1"],
      groups: ["personal"],
      anchorDate: "2026-05-31",
    });
    expect(viewModel.items[0]?.itemName).toBe("샴푸");
    expect(viewModel.items[0]?.imageUrl).toBe("https://example.com/item.svg");
    expect(mockedGetItemFilterOptions).toHaveBeenCalledWith({
      client: expect.anything(),
    });
    expect(mockedGetItemList).toHaveBeenCalledWith({
      client: expect.anything(),
      params: viewModel.params,
    });
  });

  it("loads item detail with history", async () => {
    const viewModel = await loadItemDetailViewModel({
      viewer,
      itemId: "item-1",
      anchorDate: new Date("2026-05-31T12:00:00+09:00"),
    });

    expect(viewModel).not.toBeNull();
    expect(viewModel?.item.lastStoreName).toBe("쿠팡");
    expect(mockedGetItemDetail).toHaveBeenCalledWith({
      client: expect.anything(),
      itemId: "item-1",
      anchorDate: "2026-05-31",
    });
    expect(mockedGetItemPurchaseHistory).toHaveBeenCalledWith({
      client: expect.anything(),
      itemId: "item-1",
    });
  });

  it("returns null when detail rpc has no authorized item", async () => {
    mockedGetItemDetail.mockResolvedValueOnce(null);

    await expect(
      loadItemDetailViewModel({
        viewer,
        itemId: "missing",
        anchorDate: new Date("2026-05-31T12:00:00+09:00"),
      }),
    ).resolves.toBeNull();
    expect(mockedGetItemPurchaseHistory).not.toHaveBeenCalled();
  });
});
