import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ItemsFilterBar } from "@/components/items/filter-bar";
import { ItemsTable } from "@/components/items/table";
import { PageHeader } from "@/components/ui/page-header";
import { resolveViewer } from "@/lib/auth/viewer";
import { loadItemsViewModel } from "@/lib/services/items";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ItemsPage({ searchParams }: PageProps) {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  const params = await searchParams;
  let viewModel: Awaited<ReturnType<typeof loadItemsViewModel>> | null = null;
  let loadError: string | null = null;

  try {
    viewModel = await loadItemsViewModel({
      viewer,
      searchParams: params,
    });
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "품목 목록을 불러오지 못했습니다.";
  }

  if (loadError || !viewModel) {
    return (
      <AppShell viewer={viewer}>
        <section className="rounded-lg border border-error/30 bg-surface-card p-6 text-sm text-error">
          {loadError ?? "품목 목록을 불러오지 못했습니다."}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell viewer={viewer}>
      <div className="space-y-5">
        <PageHeader
          eyebrow={`${viewModel.items.length}개 품목`}
          title="Items"
          description="구매 이력과 재구매 예상이 있는 품목 목록"
        />

        <ItemsFilterBar
          filterOptions={viewModel.filterOptions}
          params={viewModel.params}
        />
        <ItemsTable items={viewModel.items} />
      </div>
    </AppShell>
  );
}
