import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ItemDetailPanel } from "@/components/items/detail";
import { buttonClassName } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { resolveViewer } from "@/lib/auth/viewer";
import { loadItemDetailViewModel } from "@/lib/services/items";

type PageProps = {
  params: Promise<{ itemId: string }>;
};

export default async function ItemDetailPage({ params }: PageProps) {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  const { itemId } = await params;
  const viewModel = await loadItemDetailViewModel({ viewer, itemId });

  if (!viewModel) notFound();

  const { item, history } = viewModel;

  return (
    <AppShell viewer={viewer}>
      <div className="space-y-5">
        <PageHeader
          eyebrow={[item.category, item.groupLabel].filter(Boolean).join(" · ")}
          title={item.itemName}
          description={item.brand || "브랜드 정보 없음"}
          actions={
            <Link className={buttonClassName("secondary")} href="/items">
              목록
            </Link>
          }
        />
        <ItemDetailPanel history={history} item={item} />
      </div>
    </AppShell>
  );
}
