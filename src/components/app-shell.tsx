import Link from "next/link";
import { LogOut } from "lucide-react";

import { logout } from "@/app/login/actions";
import { AppNav } from "@/components/app-nav";
import { BrandMark } from "@/components/ui/brand-mark";
import type { Viewer } from "@/lib/auth/viewer";

export function AppShell({
  viewer,
  children,
}: {
  viewer: Viewer;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas text-ink lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="border-b border-hairline bg-surface-soft lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-4 lg:h-auto lg:flex-col lg:items-stretch lg:gap-7 lg:px-5 lg:py-5">
          <Link
            className="flex items-center gap-2 font-display text-xl text-ink"
            href="/"
          >
            <span className="rounded-md bg-canvas p-2 text-ink">
              <BrandMark className="size-4" />
            </span>
            buylog web
          </Link>
          <div className="hidden rounded-lg border border-hairline bg-canvas p-2 lg:block">
            <AppNav />
          </div>
        </div>
        <AppNav compact />
      </aside>

      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-hairline bg-surface-dark px-4 text-on-dark lg:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-on-dark">
              {viewer.displayName}
            </p>
            <p className="text-xs text-on-dark-soft">
              {viewer.source === "demo" ? "시연 모드" : viewer.email}
            </p>
          </div>
          <form action={logout}>
            <button
              aria-label="Log out"
              className="inline-flex size-9 items-center justify-center rounded-full border border-surface-dark-soft bg-surface-dark-elevated text-on-dark transition active:bg-surface-dark-soft"
              title="Log out"
              type="submit"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </form>
        </header>
        <main className="px-4 py-6 lg:px-7 lg:py-7">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
