import { describe, expect, it } from "vitest";

import { purchasesToCsv } from "@/lib/reporting/csv";

describe("report CSV export", () => {
  it("serializes filtered purchase rows with Korean headers and RFC-safe escaping", () => {
    const csv = purchasesToCsv([
      {
        purchaseId: "purchase-1",
        purchaseDate: "2026-05-30",
        itemName: "샴푸, 대용량",
        brand: '브랜드 "A"',
        category: "위생\n용품",
        storeName: "",
        quantity: 2,
        price: 12900,
      },
      {
        purchaseId: "purchase-2",
        purchaseDate: "2026-05-31",
        itemName: "휴지",
        brand: "",
        category: "미분류",
        storeName: "쿠팡",
        quantity: 1,
        price: 8000,
      },
    ]);

    expect(csv).toBe(
      [
        "구매일,품목,브랜드,카테고리,매장,수량,금액",
        '2026-05-30,"샴푸, 대용량","브랜드 ""A""","위생\n용품",미지정 매장,2,12900',
        "2026-05-31,휴지,,미분류,쿠팡,1,8000",
      ].join("\r\n"),
    );
  });
});
