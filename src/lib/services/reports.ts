import "server-only";

import { getJoinedGroupScopes } from "@/lib/queries/groups";
import {
  getReportData,
  getReportFilterOptions,
  type ReportData,
} from "@/lib/queries/reports";
import {
  type ReportFilterOptions,
  type ReportFilters,
  type ReportParamSource,
  resolveReportFilters,
} from "@/lib/reporting/reports";
import {
  buildAvailableScopes,
  parseScopeParam,
  resolveSelectedScope,
  type BuylogScope,
} from "@/lib/scope";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/lib/auth/viewer";

export type ReportsViewModel = {
  viewer: Viewer;
  selectedScope: BuylogScope;
  scopes: BuylogScope[];
  filters: ReportFilters;
  filterOptions: ReportFilterOptions;
  report: ReportData;
};

function scopeParamFromSource(source: ReportParamSource) {
  if (source instanceof URLSearchParams) {
    const values = source.getAll("scope");
    if (values.length > 1) return values;
    return values[0];
  }

  return source.scope;
}

export async function loadReportsViewModel({
  viewer,
  searchParams,
  anchorDate = new Date(),
}: {
  viewer: Viewer;
  searchParams: ReportParamSource;
  anchorDate?: Date;
}): Promise<ReportsViewModel> {
  const supabase = await createClient();
  const groups = await getJoinedGroupScopes(supabase, viewer.id);
  const scopes = buildAvailableScopes(groups);
  const selectedScope = resolveSelectedScope(
    parseScopeParam(scopeParamFromSource(searchParams)),
    scopes,
  );
  const filters = resolveReportFilters(searchParams, anchorDate);

  const [filterOptions, report] = await Promise.all([
    getReportFilterOptions({ client: supabase, scope: selectedScope }),
    getReportData({ client: supabase, scope: selectedScope, filters }),
  ]);

  return {
    viewer,
    selectedScope,
    scopes,
    filters,
    filterOptions,
    report,
  };
}
