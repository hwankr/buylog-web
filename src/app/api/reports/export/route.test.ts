import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/viewer", () => ({
  resolveViewer: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/queries/groups", () => ({
  getJoinedGroupScopes: vi.fn(),
}));

vi.mock("@/lib/queries/reports", () => ({
  loadReportCsvRows: vi.fn(),
}));

import { resolveViewer } from "@/lib/auth/viewer";
import { getJoinedGroupScopes } from "@/lib/queries/groups";
import { loadReportCsvRows } from "@/lib/queries/reports";
import { createClient } from "@/lib/supabase/server";
import { GET } from "@/app/api/reports/export/route";

const mockedResolveViewer = vi.mocked(resolveViewer);
const mockedCreateClient = vi.mocked(createClient);
const mockedGetJoinedGroupScopes = vi.mocked(getJoinedGroupScopes);
const mockedLoadReportCsvRows = vi.mocked(loadReportCsvRows);

describe("reports CSV export route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateClient.mockResolvedValue({ rpc: vi.fn() } as never);
    mockedGetJoinedGroupScopes.mockResolvedValue([
      { groupId: "group-1", label: "가족", role: "owner" },
    ]);
    mockedLoadReportCsvRows.mockResolvedValue([
      {
        purchaseId: "purchase-1",
        purchaseDate: "2026-05-30",
        itemName: "샴푸",
        brand: "브랜드",
        category: "위생용품",
        storeName: "쿠팡",
        quantity: 1,
        price: 10000,
      },
    ]);
  });

  it("returns 401 when there is no authenticated viewer", async () => {
    mockedResolveViewer.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost/api/reports/export"),
    );

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });

  it("returns filtered source purchases as CSV", async () => {
    mockedResolveViewer.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      displayName: "User",
      source: "auth",
    });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/reports/export?scope=group:group-1&period=custom&from=2026-01-01&to=2026-05-30&store=%EC%BF%A0%ED%8C%A1",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toContain(
      'attachment; filename="buylog-report-2026-01-01-2026-05-30.csv"',
    );
    expect(mockedLoadReportCsvRows).toHaveBeenCalledWith({
      client: expect.anything(),
      scope: {
        type: "group",
        groupId: "group-1",
        label: "가족",
        role: "owner",
      },
      filters: expect.objectContaining({
        stores: ["쿠팡"],
        range: {
          from: "2026-01-01",
          to: "2026-05-30",
          label: "2026-01-01 - 2026-05-30",
        },
      }),
    });
    expect(await response.text()).toContain("2026-05-30,샴푸,브랜드");
  });
});
