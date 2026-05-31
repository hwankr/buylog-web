import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";
import type { Viewer } from "@/lib/auth/viewer";

type PlaceholderPageProps = {
  viewer: Viewer;
  title: string;
  rows: string[];
};

export function PlaceholderPage({ viewer, title, rows }: PlaceholderPageProps) {
  return (
    <AppShell viewer={viewer}>
      <section className="space-y-6">
        <PageHeader title={title} />
        <Panel
          accent="amber"
          description="다음 관리 화면으로 확장될 영역입니다."
          title={title}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((row, index) => (
              <article
                className="rounded-md border border-hairline bg-canvas p-4"
                key={row}
              >
                <StatusPill tone={index === 0 ? "primary" : "neutral"}>
                  Step {index + 1}
                </StatusPill>
                <p className="mt-3 text-sm font-medium text-ink">{row}</p>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
