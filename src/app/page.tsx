import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { CategoryChart, MonthlySpendingChart } from "@/components/dashboard/charts";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import {
  PriceMovementList,
  RecentPurchaseTable,
  ReplacementDueList,
} from "@/components/dashboard/lists";
import { ScopeSelector } from "@/components/scope-selector";
import { formatKoreanDate } from "@/lib/format";
import { resolveViewer } from "@/lib/auth/viewer";
import { loadDashboardViewModel } from "@/lib/services/dashboard";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const viewer = await resolveViewer();
  if (!viewer) {
    redirect("/login");
  }

  const params = await searchParams;
  let viewModel: Awaited<ReturnType<typeof loadDashboardViewModel>> | null = null;
  let loadError: string | null = null;

  try {
    viewModel = await loadDashboardViewModel({
      viewer,
      scopeParam: params.scope,
    });
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "대시보드를 불러오지 못했습니다.";
  }

  if (loadError || !viewModel) {
    return (
      <AppShell viewer={viewer}>
        <section className="rounded-md border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {loadError ?? "대시보드를 불러오지 못했습니다."}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell viewer={viewer}>
      <div className="space-y-5">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {formatKoreanDate(new Date())}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
              대시보드
            </h1>
          </div>
          <ScopeSelector
            scopes={viewModel.scopes}
            selectedScope={viewModel.selectedScope}
          />
        </header>

        <KpiGrid kpis={viewModel.dashboard.kpis} />

        <div className="grid gap-4 xl:grid-cols-2">
          <MonthlySpendingChart data={viewModel.dashboard.monthlySpending} />
          <CategoryChart data={viewModel.dashboard.categories} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <RecentPurchaseTable rows={viewModel.dashboard.recentPurchases} />
          <div className="space-y-4">
            <ReplacementDueList items={viewModel.dashboard.replacementDue} />
            <PriceMovementList movements={viewModel.dashboard.priceMovements} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
