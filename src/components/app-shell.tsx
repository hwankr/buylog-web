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
import type { Viewer } from "@/lib/auth/viewer";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/items", label: "Items", icon: Boxes },
  { href: "/groups", label: "Groups", icon: UsersRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  viewer,
  children,
}: {
  viewer: Viewer;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-4 lg:h-auto lg:flex-col lg:items-stretch lg:gap-6 lg:px-5 lg:py-5">
          <Link className="flex items-center gap-2 font-semibold text-slate-950" href="/">
            <span className="rounded-md bg-slate-950 p-2 text-white">
              <BarChart3 className="size-4" aria-hidden="true" />
            </span>
            buylog web
          </Link>
          <nav className="hidden gap-1 lg:flex lg:flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  className="flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                  href={item.href}
                  key={item.href}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-950">
              {viewer.displayName}
            </p>
            <p className="text-xs text-slate-500">
              {viewer.source === "demo" ? "시연 모드" : viewer.email}
            </p>
          </div>
          <form action={logout}>
            <button
              className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
              title="로그아웃"
              type="submit"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </form>
        </header>
        <main className="px-4 py-5 lg:px-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
