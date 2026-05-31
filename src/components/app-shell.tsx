import Link from "next/link";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Settings,
  UsersRound,
} from "lucide-react";

import { logout } from "@/app/login/actions";
import { BrandMark } from "@/components/ui/brand-mark";
import type { Viewer } from "@/lib/auth/viewer";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/items", label: "Items", icon: Boxes },
  { href: "/groups", label: "Groups", icon: UsersRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Navigation({ compact = false }: { compact?: boolean }) {
  return (
    <nav
      aria-label="Primary"
      className={
        compact
          ? "flex gap-1 overflow-x-auto border-t border-hairline px-3 py-2 lg:hidden"
          : "hidden gap-1 lg:flex lg:flex-col"
      }
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            className="flex h-10 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted transition active:bg-surface-card active:text-ink"
            href={item.href}
            key={item.href}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  viewer,
  children,
}: {
  viewer: Viewer;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas text-ink lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-hairline bg-surface-soft lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-4 lg:h-auto lg:flex-col lg:items-stretch lg:gap-6 lg:px-5 lg:py-5">
          <Link className="flex items-center gap-2 font-display text-xl text-ink" href="/">
            <span className="rounded-md bg-canvas p-2 text-ink">
              <BrandMark className="size-4" />
            </span>
            buylog web
          </Link>
          <Navigation />
        </div>
        <Navigation compact />
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
              className="inline-flex size-9 items-center justify-center rounded-full border border-hairline bg-surface-dark-elevated text-on-dark transition active:bg-surface-dark-soft"
              title="Log out"
              type="submit"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </form>
        </header>
        <main className="px-4 py-6 lg:px-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
