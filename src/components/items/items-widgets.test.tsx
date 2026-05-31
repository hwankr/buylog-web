import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ItemDetailPanel } from "@/components/items/detail";
import { ItemsFilterBar } from "@/components/items/filter-bar";
import { ItemsTable } from "@/components/items/table";
import type {
  ItemDetail,
  ItemFilterOptions,
  ItemListParams,
  ItemListRow,
  ItemPurchaseHistoryRow,
} from "@/lib/items/items";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

const params: ItemListParams = {
  search: "휴지",
  sort: "total_spent",
  direction: "desc",
  categories: ["cat-1"],
  groups: ["personal"],
  anchorDate: "2026-05-31",
  limit: 100,
};

const filterOptions: ItemFilterOptions = {
  categories: [{ id: "cat-1", label: "위생용품", secondaryLabel: "" }],
  groups: [
    { id: "personal", label: "내 물품", secondaryLabel: "개인" },
    { id: "group:g1", label: "가족", secondaryLabel: "owner" },
  ],
};

const rows: ItemListRow[] = [
  {
    itemId: "item-1",
    itemName: "휴지",
    brand: "브랜드",
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
];

const detail: ItemDetail = {
  ...rows[0],
  averagePrice: 11000,
  minPrice: 10000,
  maxPrice: 12000,
  lastStoreName: "쿠팡",
};

const history: ItemPurchaseHistoryRow[] = [
  {
    purchaseId: "purchase-1",
    purchaseDate: "2026-05-20",
    storeName: "쿠팡",
    quantity: 1,
    price: 12000,
    previousPrice: 10000,
    priceDelta: 2000,
    priceDeltaRatio: 0.2,
  },
];

describe("items widgets", () => {
  it("renders list filters with selected params", () => {
    render(<ItemsFilterBar filterOptions={filterOptions} params={params} />);

    expect(screen.getByText("카테고리 1")).toHaveClass("bg-primary/15");
    expect(screen.getByText("그룹 1")).toHaveClass("bg-primary/15");
    expect(screen.getByLabelText("검색")).toHaveValue("휴지");
    expect(screen.getByLabelText("정렬")).toHaveValue("total_spent");
    expect(screen.getByLabelText("방향")).toHaveValue("desc");
    expect(screen.getByLabelText("위생용품")).toBeChecked();
    expect(screen.getByLabelText("내 물품 개인")).toBeChecked();
    expect(screen.getByLabelText("가족 owner")).not.toBeChecked();
    expect(screen.getByRole("link", { name: "초기화" })).toHaveAttribute(
      "href",
      "/items",
    );
    expect(
      screen.queryByRole("button", { name: "적용" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("검색").closest("form")).toHaveAttribute(
      "action",
      "/items",
    );
  });

  it("renders item table rows with detail links", () => {
    render(<ItemsTable items={rows} />);

    expect(screen.getByRole("link", { name: "휴지" })).toHaveAttribute(
      "href",
      "/items/item-1",
    );
    expect(screen.getByText("위생용품")).toHaveClass("bg-accent-amber/20");
    expect(screen.getByText("내 물품")).toHaveClass("bg-surface-soft");
    expect(screen.getByText("₩22,000")).toBeInTheDocument();
    const itemsTableRegion = screen
      .getAllByRole("region", { name: "물품 목록" })
      .find((region) => region.className.includes("bg-canvas"));
    if (!itemsTableRegion) {
      throw new Error("물품 목록 table region was not rendered.");
    }
    expect(
      itemsTableRegion.firstElementChild,
    ).toHaveClass("overflow-x-auto", "px-4");
    expect(screen.getByText("2026. 5. 20.")).toBeInTheDocument();
    expect(screen.getByText("2026. 6. 19.")).toBeInTheDocument();
  });

  it("renders item table empty state", () => {
    render(<ItemsTable items={[]} />);

    expect(screen.getByText("조건에 맞는 물품이 없습니다.")).toBeInTheDocument();
  });

  it("renders detail metrics and purchase history", () => {
    render(<ItemDetailPanel history={history} item={detail} />);

    expect(screen.getByRole("region", { name: "가격 요약" })).toHaveClass(
      "bg-surface-dark",
      "text-on-dark",
    );
    expect(screen.getByText("구매 이력")).toBeInTheDocument();
    expect(screen.getAllByText("쿠팡")).toHaveLength(2);
    expect(screen.getByText("+₩2,000")).toBeInTheDocument();
    expect(screen.getByText("재구매 예상")).toBeInTheDocument();
    expect(screen.getByText("19일 남음")).toBeInTheDocument();
  });

  it("renders detail empty history state", () => {
    render(<ItemDetailPanel history={[]} item={{ ...detail, purchaseCount: 0 }} />);

    expect(screen.getByText("아직 구매 이력이 없습니다.")).toBeInTheDocument();
  });
});
