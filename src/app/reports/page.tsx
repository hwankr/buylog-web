import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import {
  ReportsCategoryShareChart,
  ReportsSpendingTrendChart,
} from "@/components/reports/charts";
import { ReportsFilterBar } from "@/components/reports/filter-bar";
import {
  ReportItemSpendingTable,
  ReportStoreSpendingTable,
} from "@/components/reports/tables";
import { PageHeader } from "@/components/ui/page-header";
import { formatKoreanDate } from "@/lib/format";
import { resolveViewer } from "@/lib/auth/viewer";
import { loadReportsViewModel } from "@/lib/services/reports";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportsPage({ searchParams }: PageProps) {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  const params = await searchParams;
  let viewModel: Awaited<ReturnType<typeof loadReportsViewModel>> | null = null;
  let loadError: string | null = null;

  try {
    viewModel = await loadReportsViewModel({
      viewer,
      searchParams: params,
    });
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "리포트를 불러오지 못했습니다.";
  }

  if (loadError || !viewModel) {
    return (
      <AppShell viewer={viewer}>
        <section className="rounded-lg border border-error/30 bg-surface-card p-6 text-sm text-error">
          {loadError ?? "리포트를 불러오지 못했습니다."}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell viewer={viewer}>
      <div className="space-y-5">
        <PageHeader
          eyebrow={`${formatKoreanDate(viewModel.filters.range.from)} - ${formatKoreanDate(viewModel.filters.range.to)}`}
          title="Reports"
          description={`${viewModel.filters.range.label} 기준 지출 분석`}
        />

        <ReportsFilterBar
          filterOptions={viewModel.filterOptions}
          filters={viewModel.filters}
          scopes={viewModel.scopes}
          selectedScope={viewModel.selectedScope}
        />

        <div className="grid gap-4 xl:grid-cols-2">
          <ReportsSpendingTrendChart data={viewModel.report.trend} />
          <ReportsCategoryShareChart data={viewModel.report.categories} />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ReportItemSpendingTable items={viewModel.report.items} />
          <ReportStoreSpendingTable stores={viewModel.report.stores} />
        </div>
      </div>
    </AppShell>
  );
}
