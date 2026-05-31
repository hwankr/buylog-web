"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Settings,
  UsersRound,
} from "lucide-react";

import { cn } from "@/lib/ui";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/items", label: "Items", icon: Boxes },
  { href: "/groups", label: "Groups", icon: UsersRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

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
        const active = isActive(pathname, item.href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 shrink-0 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
              active
                ? "bg-surface-dark text-on-dark"
                : "text-muted active:bg-surface-card active:text-ink",
            )}
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
