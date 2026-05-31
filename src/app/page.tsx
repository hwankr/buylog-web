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
import { PageHeader } from "@/components/ui/page-header";
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
        <section className="rounded-lg border border-error/30 bg-surface-card p-6 text-sm text-error">
          {loadError ?? "대시보드를 불러오지 못했습니다."}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell viewer={viewer}>
      <div className="space-y-5">
        <PageHeader
          eyebrow={formatKoreanDate(new Date())}
          title="대시보드"
          description="구매액, 재구매 일정, 가격 변동을 한 화면에서 확인합니다."
          actions={
            <ScopeSelector
              scopes={viewModel.scopes}
              selectedScope={viewModel.selectedScope}
            />
          }
        />

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
