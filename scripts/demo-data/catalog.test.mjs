import { describe, expect, it } from "vitest";

import { DEMO_ITEMS, buildDemoCatalog } from "./catalog.mjs";

describe("demo catalog", () => {
  it("contains personal and group-scoped items", () => {
    expect(DEMO_ITEMS.filter((item) => item.scope === "personal")).toHaveLength(
      8,
    );
    expect(DEMO_ITEMS.filter((item) => item.scope === "home302")).toHaveLength(
      8,
    );
    expect(DEMO_ITEMS.filter((item) => item.scope === "lab")).toHaveLength(8);
  });

  it("builds image-backed items and six-month purchase coverage", () => {
    const catalog = buildDemoCatalog(new Date("2026-05-31T12:00:00+09:00"));
    const allPurchases = catalog.items.flatMap((item) => item.purchases);
    const purchaseMonths = new Set(
      allPurchases.map((purchase) => purchase.purchaseDate.slice(0, 7)),
    );

    expect(catalog.items.every((item) => item.imageSvg.includes("<svg"))).toBe(
      true,
    );
    expect(catalog.items.every((item) => item.imagePath.endsWith(".svg"))).toBe(
      true,
    );
    expect(purchaseMonths).toEqual(
      new Set(["2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05"]),
    );
    expect(allPurchases.length).toBeGreaterThanOrEqual(100);
  });

  it("contains low stock snapshots for visible replacement pressure", () => {
    const catalog = buildDemoCatalog();

    expect(catalog.items.filter((item) => item.stock === 0).length).toBeGreaterThanOrEqual(
      4,
    );
    expect(catalog.items.filter((item) => item.stock <= 1).length).toBeGreaterThanOrEqual(
      12,
    );
  });
});
