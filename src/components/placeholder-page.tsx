import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
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
        <Panel>
          <ul className="divide-y divide-hairline-soft">
            {rows.map((row) => (
              <li className="px-1 py-3 text-sm text-body" key={row}>
                {row}
              </li>
            ))}
          </ul>
        </Panel>
      </section>
    </AppShell>
  );
}
