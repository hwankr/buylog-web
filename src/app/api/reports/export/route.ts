import { type NextRequest } from "next/server";

import { resolveViewer } from "@/lib/auth/viewer";
import { getJoinedGroupScopes } from "@/lib/queries/groups";
import { loadReportCsvRows } from "@/lib/queries/reports";
import { purchasesToCsv } from "@/lib/reporting/csv";
import { resolveReportFilters } from "@/lib/reporting/reports";
import {
  buildAvailableScopes,
  parseScopeParam,
  resolveSelectedScope,
} from "@/lib/scope";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function scopeParam(searchParams: URLSearchParams) {
  const scopes = searchParams.getAll("scope");
  if (scopes.length > 1) return scopes;
  return scopes[0] ?? undefined;
}

export async function GET(request: NextRequest) {
  const viewer = await resolveViewer();
  if (!viewer) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = await createClient();
  const groups = await getJoinedGroupScopes(supabase, viewer.id);
  const scopes = buildAvailableScopes(groups);
  const selectedScope = resolveSelectedScope(
    parseScopeParam(scopeParam(request.nextUrl.searchParams)),
    scopes,
  );
  const filters = resolveReportFilters(request.nextUrl.searchParams);
  const rows = await loadReportCsvRows({
    client: supabase,
    scope: selectedScope,
    filters,
  });

  return new Response(purchasesToCsv(rows), {
    headers: {
      "Content-Disposition": `attachment; filename="buylog-report-${filters.range.from}-${filters.range.to}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
