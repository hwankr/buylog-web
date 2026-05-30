import { AppShell } from "@/components/app-shell";
import type { Viewer } from "@/lib/auth/viewer";

type PlaceholderPageProps = {
  viewer: Viewer;
  title: string;
  rows: string[];
};

export function PlaceholderPage({ viewer, title, rows }: PlaceholderPageProps) {
  return (
    <AppShell viewer={viewer}>
      <section className="space-y-4">
        <header className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
        </header>
        <div className="rounded-md border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => (
              <li className="px-4 py-3 text-sm text-slate-700" key={row}>
                {row}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}
