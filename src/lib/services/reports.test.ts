import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/queries/groups", () => ({
  getJoinedGroupScopes: vi.fn(),
}));

vi.mock("@/lib/queries/reports", () => ({
  getReportData: vi.fn(),
  getReportFilterOptions: vi.fn(),
}));

import { getJoinedGroupScopes } from "@/lib/queries/groups";
import { getReportData, getReportFilterOptions } from "@/lib/queries/reports";
import { loadReportsViewModel } from "@/lib/services/reports";
import { createClient } from "@/lib/supabase/server";

const mockedCreateClient = vi.mocked(createClient);
const mockedGetJoinedGroupScopes = vi.mocked(getJoinedGroupScopes);
const mockedGetReportData = vi.mocked(getReportData);
const mockedGetReportFilterOptions = vi.mocked(getReportFilterOptions);

describe("reports view model service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateClient.mockResolvedValue({ rpc: vi.fn() } as never);
    mockedGetJoinedGroupScopes.mockResolvedValue([
      { groupId: "group-1", label: "가족", role: "owner" },
    ]);
    mockedGetReportFilterOptions.mockResolvedValue({
      categories: [{ id: "cat-1", label: "위생용품", secondaryLabel: "" }],
      items: [],
      stores: [],
    });
    mockedGetReportData.mockResolvedValue({
      trend: [],
      categories: [],
      items: [],
      stores: [],
    });
  });

  it("resolves scope, filters, options, and report data for the page", async () => {
    const viewModel = await loadReportsViewModel({
      viewer: {
        id: "user-1",
        email: "user@example.com",
        displayName: "User",
        source: "auth",
      },
      searchParams: {
        scope: "group:group-1",
        period: "custom",
        from: "2026-01-01",
        to: "2026-05-30",
        category: "cat-1",
      },
      anchorDate: new Date("2026-05-30T12:00:00+09:00"),
    });

    expect(viewModel.selectedScope).toEqual({
      type: "group",
      groupId: "group-1",
      label: "가족",
      role: "owner",
    });
    expect(viewModel.filters.range).toMatchObject({
      from: "2026-01-01",
      to: "2026-05-30",
    });
    expect(viewModel.filterOptions.categories[0]?.label).toBe("위생용품");
    expect(mockedGetReportFilterOptions).toHaveBeenCalledWith({
      client: expect.anything(),
      scope: viewModel.selectedScope,
    });
    expect(mockedGetReportData).toHaveBeenCalledWith({
      client: expect.anything(),
      scope: viewModel.selectedScope,
      filters: viewModel.filters,
    });
  });
});
