import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, PackageSearch, UsersRound } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { formatKrw } from "@/lib/format";
import { resolveViewer } from "@/lib/auth/viewer";
import {
  loadGroupsViewModel,
  type GroupSummary,
} from "@/lib/services/groups";

function itemsHref(groupId: string) {
  const params = new URLSearchParams({
    group: `group:${groupId}`,
    sort: "total_spent",
    dir: "desc",
  });

  return `/items?${params.toString()}`;
}

function reportsHref(groupId: string) {
  const params = new URLSearchParams({
    scope: `group:${groupId}`,
    period: "last-3-months",
  });

  return `/reports?${params.toString()}`;
}

function replacementText(group: GroupSummary) {
  const item = group.nextReplacement;
  if (!item || item.daysUntilRepurchase === null) return "예상 없음";
  if (item.daysUntilRepurchase < 0) {
    return `${Math.abs(item.daysUntilRepurchase)}일 지남`;
  }
  if (item.daysUntilRepurchase === 0) return "오늘";

  return `${item.daysUntilRepurchase}일 후`;
}

function GroupCard({ group }: { group: GroupSummary }) {
  return (
    <article className="rounded-lg border border-hairline bg-surface-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold leading-7 text-ink">
              {group.label}
            </h2>
            <StatusPill tone={group.role === "owner" ? "primary" : "neutral"}>
              {group.role}
            </StatusPill>
          </div>
          <p className="mt-1 text-sm text-muted">
            {group.itemCount}개 품목 · {group.purchaseCount}건 구매 이력
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            className="inline-flex items-center gap-2 rounded-md border border-hairline bg-canvas px-3 py-2 text-sm font-medium text-ink transition active:bg-surface-soft"
            href={itemsHref(group.groupId)}
          >
            <PackageSearch className="size-4" aria-hidden="true" />
            품목
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary transition active:bg-primary-strong"
            href={reportsHref(group.groupId)}
          >
            <BarChart3 className="size-4" aria-hidden="true" />
            리포트
          </Link>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium text-muted">누적 지출</dt>
          <dd className="mt-1 font-display text-2xl text-ink">
            {formatKrw(group.totalSpent)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">다음 재구매</dt>
          <dd className="mt-1 font-display text-2xl text-ink">
            {replacementText(group)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">관리 품목</dt>
          <dd className="mt-1 font-display text-2xl text-ink">
            {group.itemCount}개
          </dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-hairline pt-4">
        <h3 className="text-sm font-medium text-ink">주요 품목</h3>
        {group.topItems.length > 0 ? (
          <ul className="mt-3 divide-y divide-hairline text-sm">
            {group.topItems.map((item) => (
              <li
                className="flex items-center justify-between gap-3 py-2"
                key={item.itemId}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">
                    {item.itemName}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {item.category} · {item.purchaseCount}건
                  </p>
                </div>
                <span className="shrink-0 font-medium text-ink">
                  {formatKrw(item.totalSpent)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">등록된 그룹 품목이 없습니다.</p>
        )}
      </div>
    </article>
  );
}

export default async function GroupsPage() {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  let viewModel: Awaited<ReturnType<typeof loadGroupsViewModel>> | null = null;
  let loadError: string | null = null;

  try {
    viewModel = await loadGroupsViewModel({ viewer });
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "그룹을 불러오지 못했습니다.";
  }

  if (loadError || !viewModel) {
    return (
      <AppShell viewer={viewer}>
        <section className="rounded-lg border border-error/30 bg-surface-card p-6 text-sm text-error">
          {loadError ?? "그룹을 불러오지 못했습니다."}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell viewer={viewer}>
      <div className="space-y-5">
        <PageHeader
          eyebrow={`${viewModel.groups.length}개 그룹`}
          title="Groups"
          description="함께 관리하는 품목과 구매 이력을 그룹 단위로 확인합니다."
          actions={
            <div className="inline-flex items-center gap-2 rounded-md border border-hairline bg-surface-card px-3 py-2 text-sm font-medium text-muted">
              <UsersRound className="size-4" aria-hidden="true" />
              {viewer.displayName}
            </div>
          }
        />

        {viewModel.groups.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {viewModel.groups.map((group) => (
              <GroupCard group={group} key={group.groupId} />
            ))}
          </div>
        ) : (
          <EmptyState message="참여 중인 그룹이 없습니다." />
        )}
      </div>
    </AppShell>
  );
}
