import "server-only";

import { getDashboardData, type DashboardData } from "@/lib/queries/dashboard";
import { getJoinedGroupScopes } from "@/lib/queries/groups";
import {
  buildAvailableScopes,
  parseScopeParam,
  resolveSelectedScope,
  type BuylogScope,
} from "@/lib/scope";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/lib/auth/viewer";

export type DashboardViewModel = {
  viewer: Viewer;
  selectedScope: BuylogScope;
  scopes: BuylogScope[];
  dashboard: DashboardData;
};

export async function loadDashboardViewModel({
  viewer,
  scopeParam,
}: {
  viewer: Viewer;
  scopeParam: string | string[] | undefined;
}): Promise<DashboardViewModel> {
  const supabase = await createClient();
  const groups = await getJoinedGroupScopes(supabase, viewer.id);
  const scopes = buildAvailableScopes(groups);
  const selectedScope = resolveSelectedScope(parseScopeParam(scopeParam), scopes);
  const dashboard = await getDashboardData({
    client: supabase,
    scope: selectedScope,
  });

  return {
    viewer,
    selectedScope,
    scopes,
    dashboard,
  };
}
