# Interface Richness Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current buylog-web UI less monotonous by adding richer visual hierarchy, clearer navigation state, stronger data surfaces, and more intuitive operational controls while staying restrained and consistent with `design.md`.

**Architecture:** Keep the current Next.js 16 App Router data boundaries intact: Server Components load view models, Client Components stay limited to path-aware navigation and Recharts widgets. Build the refresh through small shared UI primitives first, then apply them to shell, dashboard, reports, items, login, and placeholder states so the app gains surface rhythm without one-off styling.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.4, Tailwind CSS v4 tokens from `design.md`, Recharts, lucide-react, Vitest, React Testing Library.

---

## Context

`design.md` defines a warm cream canvas, coral primary action, dark product surfaces, serif display headings, hairline borders, and restrained accent colors. The current app already has the token layer and basic shared primitives, but most screens still repeat the same cream card pattern. This plan keeps the warm editorial direction and adds richer surface contrast: active navigation, dark dashboard summary, more structured metric cards, selected-filter chips, clearer tables, and polished login/empty states.

This is a UI/design refresh only. It does not change Supabase queries, RPCs, authentication behavior, or item/report data contracts.

## Next.js 16 Notes Checked

The project's `AGENTS.md` requires local Next.js docs before code work. These local docs were checked while writing the plan and should be rechecked if an implementation step touches the related API:

- `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`

Implementation rules from those docs:

- Keep `src/app/**/page.tsx` and `src/app/layout.tsx` as Server Components unless interactivity is required.
- Put the only new path-aware behavior in a small Client Component, `src/components/app-nav.tsx`.
- Keep global CSS imported only through the root layout.
- Use Tailwind utilities and shared components for most styling; use scoped component files instead of new route groups.

## File Structure

- Modify: `src/components/ui/panel.tsx` - add accent rails, header actions, title adornments, and density variants.
- Create: `src/components/ui/status-pill.tsx` - small semantic/metadata chips for filters, due status, and labels.
- Create: `src/components/ui/metric-card.tsx` - richer KPI card primitive with tone and accent support.
- Create: `src/components/ui/data-table.tsx` - shared table shell and class constants.
- Create: `src/components/ui/rich-primitives.test.tsx` - tests for the new primitive layer.
- Create: `src/components/app-nav.tsx` - Client Component that marks active navigation using `usePathname`.
- Create: `src/components/app-nav.test.tsx` - tests active nav behavior.
- Modify: `src/components/app-shell.tsx` - use `AppNav`, strengthen sidebar/header rhythm, and add subtle workspace framing.
- Create: `src/components/dashboard/summary-band.tsx` - dark editorial dashboard summary using existing KPI data.
- Create: `src/components/dashboard/summary-band.test.tsx` - tests summary copy and dark-surface classes.
- Modify: `src/app/page.tsx` - insert dashboard summary band.
- Modify: `src/components/dashboard/kpi-grid.tsx` - use `MetricCard` and stronger accent hierarchy.
- Modify: `src/components/dashboard/charts.tsx` - add panel adornments and clearer chart shells.
- Modify: `src/components/dashboard/lists.tsx` - use `DataTable` and richer list rows.
- Modify: `src/components/dashboard/dashboard-widgets.test.tsx` - update style expectations.
- Modify: `src/components/reports/filter-bar.tsx` - add selected-filter chips and clearer filter grouping.
- Modify: `src/components/reports/charts.tsx` - use richer chart shells.
- Modify: `src/components/reports/tables.tsx` - use `DataTable` and better table rhythm.
- Modify: `src/components/reports/reports-widgets.test.tsx` - update filter/table assertions.
- Modify: `src/components/items/filter-bar.tsx` - make search/sort/filter controls more scannable.
- Modify: `src/components/items/table.tsx` - add pills for group/category/repurchase status and table shell.
- Modify: `src/components/items/detail.tsx` - use metric cards and a dark price-summary surface.
- Modify: `src/components/items/items-widgets.test.tsx` - update item UI assertions.
- Modify: `src/app/login/page.tsx` - turn the login screen into a restrained split product surface.
- Modify: `src/components/placeholder-page.tsx` - make Groups/Settings placeholders feel like real planned workspaces.
- Modify: `src/app/loading.tsx` - richer skeleton rhythm.
- Modify: `src/app/error.tsx` - richer error surface.
- Modify: `src/components/design-class-contract.test.ts` - guard new files against cool slate/white/shadow regression.

---

### Task 1: Rich UI Primitive Layer

**Files:**
- Modify: `src/components/ui/panel.tsx`
- Create: `src/components/ui/status-pill.tsx`
- Create: `src/components/ui/metric-card.tsx`
- Create: `src/components/ui/data-table.tsx`
- Create: `src/components/ui/rich-primitives.test.tsx`
- Modify: `src/components/design-class-contract.test.ts`

- [ ] **Step 1: Write the failing primitive tests**

Create `src/components/ui/rich-primitives.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TableShell, tableClassName, tableHeadClassName } from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

describe("rich design primitives", () => {
  it("renders panels with accent rails and header actions", () => {
    render(
      <Panel
        accent="teal"
        actions={<a href="/reports">Open</a>}
        title="Spending"
        titleAdornment={<StatusPill tone="teal">Live</StatusPill>}
      >
        Content
      </Panel>,
    );

    expect(screen.getByRole("region", { name: "Spending" })).toHaveClass(
      "bg-surface-card",
      "border-hairline",
      "overflow-hidden",
    );
    expect(screen.getByText("Live")).toHaveClass("bg-accent-teal/15", "text-ink");
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute("href", "/reports");
  });

  it("renders metric cards with dark and cream hierarchy", () => {
    render(
      <>
        <MetricCard
          accent="coral"
          eyebrow="이번 달"
          helper="지난달 대비 +₩12,000"
          title="구매액"
          tone="dark"
          value="₩128,900"
        />
        <MetricCard
          accent="amber"
          eyebrow="예상"
          helper="30일 기준"
          title="재구매"
          value="₩20,000"
        />
      </>,
    );

    expect(screen.getByText("₩128,900").closest("article")).toHaveClass(
      "bg-surface-dark",
      "text-on-dark",
    );
    expect(screen.getByText("₩20,000").closest("article")).toHaveClass(
      "bg-surface-card",
      "border-hairline",
    );
  });

  it("renders status pills and table shell classes", () => {
    render(
      <TableShell label="Recent purchases">
        <table className={tableClassName}>
          <thead className={tableHeadClassName}>
            <tr>
              <th>Item</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <StatusPill tone="success">On track</StatusPill>
              </td>
            </tr>
          </tbody>
        </table>
      </TableShell>,
    );

    expect(screen.getByRole("region", { name: "Recent purchases" })).toHaveClass(
      "rounded-lg",
      "border-hairline",
    );
    expect(screen.getByText("On track")).toHaveClass("bg-success/15", "text-ink");
  });
});
```

- [ ] **Step 2: Run the failing primitive test**

Run:

```powershell
npm run test -- src/components/ui/rich-primitives.test.tsx
```

Expected: FAIL because `status-pill.tsx`, `metric-card.tsx`, and `data-table.tsx` do not exist and `Panel` does not support the new props.

- [ ] **Step 3: Replace `src/components/ui/panel.tsx` with the richer panel primitive**

Use this complete file:

```tsx
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/ui";

type PanelTone = "card" | "canvas" | "dark" | "coral";
type PanelAccent = "none" | "coral" | "teal" | "amber" | "dark";
type PanelDensity = "default" | "compact" | "spacious";

type PanelProps = HTMLAttributes<HTMLElement> & {
  actions?: ReactNode;
  accent?: PanelAccent;
  description?: ReactNode;
  density?: PanelDensity;
  title?: ReactNode;
  titleAdornment?: ReactNode;
  tone?: PanelTone;
};

const toneClasses: Record<PanelTone, string> = {
  card: "border border-hairline bg-surface-card text-ink",
  canvas: "border border-hairline bg-canvas text-ink",
  dark: "bg-surface-dark text-on-dark",
  coral: "bg-primary text-on-primary",
};

const densityClasses: Record<PanelDensity, string> = {
  compact: "p-4",
  default: "p-5 sm:p-6",
  spacious: "p-6 sm:p-8",
};

const accentClasses: Record<PanelAccent, string> = {
  none: "",
  coral: "bg-primary",
  teal: "bg-accent-teal",
  amber: "bg-accent-amber",
  dark: "bg-surface-dark",
};

function titleClass(tone: PanelTone) {
  if (tone === "dark") return "text-on-dark";
  if (tone === "coral") return "text-on-primary";
  return "text-ink";
}

function descriptionClass(tone: PanelTone) {
  if (tone === "dark") return "text-on-dark-soft";
  if (tone === "coral") return "text-on-primary/85";
  return "text-muted";
}

export function Panel({
  actions,
  accent = "none",
  description,
  density = "default",
  title,
  titleAdornment,
  tone = "card",
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <section
      aria-label={typeof title === "string" ? title : undefined}
      className={cn(
        "relative overflow-hidden rounded-lg",
        toneClasses[tone],
        densityClasses[density],
        className,
      )}
      {...props}
    >
      {accent !== "none" ? (
        <div
          aria-hidden="true"
          className={cn("absolute inset-x-0 top-0 h-1", accentClasses[accent])}
        />
      ) : null}

      {title || description || actions ? (
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            {title ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className={cn("text-lg font-medium leading-7", titleClass(tone))}>
                  {title}
                </h2>
                {titleAdornment}
              </div>
            ) : null}
            {description ? (
              <p className={cn("text-sm leading-6", descriptionClass(tone))}>
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>
      ) : null}

      {children}
    </section>
  );
}
```

- [ ] **Step 4: Add status pills**

Create `src/components/ui/status-pill.tsx`:

```tsx
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/ui";

type StatusTone =
  | "neutral"
  | "primary"
  | "teal"
  | "amber"
  | "success"
  | "warning"
  | "error"
  | "dark";

const toneClasses: Record<StatusTone, string> = {
  neutral: "bg-surface-soft text-muted",
  primary: "bg-primary/15 text-ink",
  teal: "bg-accent-teal/15 text-ink",
  amber: "bg-accent-amber/20 text-ink",
  success: "bg-success/15 text-ink",
  warning: "bg-warning/20 text-ink",
  error: "bg-error/15 text-ink",
  dark: "bg-surface-dark-elevated text-on-dark",
};

type StatusPillProps = ComponentPropsWithoutRef<"span"> & {
  tone?: StatusTone;
};

export function StatusPill({
  className,
  tone = "neutral",
  ...props
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-full items-center rounded-full px-2.5 text-xs font-medium leading-none",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 5: Add metric cards**

Create `src/components/ui/metric-card.tsx`:

```tsx
import type { ReactNode } from "react";

import { cn } from "@/lib/ui";

type MetricTone = "card" | "canvas" | "dark";
type MetricAccent = "coral" | "teal" | "amber" | "dark";

type MetricCardProps = {
  accent?: MetricAccent;
  eyebrow?: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
  tone?: MetricTone;
  value: ReactNode;
};

const toneClasses: Record<MetricTone, string> = {
  card: "border border-hairline bg-surface-card text-ink",
  canvas: "border border-hairline bg-canvas text-ink",
  dark: "bg-surface-dark text-on-dark",
};

const accentClasses: Record<MetricAccent, string> = {
  coral: "bg-primary",
  teal: "bg-accent-teal",
  amber: "bg-accent-amber",
  dark: "bg-surface-dark-elevated",
};

function mutedClass(tone: MetricTone) {
  return tone === "dark" ? "text-on-dark-soft" : "text-muted";
}

function iconClass(tone: MetricTone) {
  return tone === "dark"
    ? "border border-surface-dark-soft bg-surface-dark-elevated text-on-dark"
    : "border border-hairline bg-canvas text-primary";
}

export function MetricCard({
  accent = "coral",
  eyebrow,
  helper,
  icon,
  title,
  tone = "card",
  value,
}: MetricCardProps) {
  return (
    <article className={cn("relative overflow-hidden rounded-lg p-5", toneClasses[tone])}>
      <div aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1", accentClasses[accent])} />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0 space-y-1">
          {eyebrow ? (
            <p className={cn("truncate text-xs font-medium", mutedClass(tone))}>
              {eyebrow}
            </p>
          ) : null}
          <h3 className={cn("text-sm font-medium", mutedClass(tone))}>{title}</h3>
          <p className="font-display text-3xl leading-tight">{value}</p>
        </div>
        {icon ? (
          <div className={cn("rounded-md p-2", iconClass(tone))}>{icon}</div>
        ) : null}
      </div>
      {helper ? (
        <p className={cn("mt-4 pl-2 text-sm leading-6", mutedClass(tone))}>{helper}</p>
      ) : null}
    </article>
  );
}
```

- [ ] **Step 6: Add shared table shell classes**

Create `src/components/ui/data-table.tsx`:

```tsx
import type { ReactNode } from "react";

import { cn } from "@/lib/ui";

export const tableClassName = "min-w-full text-left text-sm";
export const tableHeadClassName = "border-b border-hairline text-xs uppercase text-muted";
export const tableBodyClassName = "divide-y divide-hairline-soft";
export const tableHeaderCellClassName = "py-2 pr-4 font-medium";
export const tableCellClassName = "py-3 pr-4 text-body";
export const tableNumberCellClassName = "py-3 pr-4 text-right font-medium text-ink";

export function TableShell({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div
      aria-label={label}
      className={cn("overflow-hidden rounded-lg border border-hairline bg-canvas", className)}
      role="region"
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
```

- [ ] **Step 7: Expand the static design contract**

In `src/components/design-class-contract.test.ts`, add the new files to `themedFiles`:

```ts
const themedFiles = [
  "src/components/app-shell.tsx",
  "src/components/app-nav.tsx",
  "src/components/scope-selector.tsx",
  "src/components/empty-state.tsx",
  "src/components/dashboard/summary-band.tsx",
  "src/components/dashboard/kpi-grid.tsx",
  "src/components/dashboard/charts.tsx",
  "src/components/dashboard/lists.tsx",
  "src/components/reports/filter-bar.tsx",
  "src/components/reports/charts.tsx",
  "src/components/reports/tables.tsx",
  "src/components/items/filter-bar.tsx",
  "src/components/items/table.tsx",
  "src/components/items/detail.tsx",
  "src/components/placeholder-page.tsx",
  "src/components/ui/data-table.tsx",
  "src/components/ui/metric-card.tsx",
  "src/components/ui/panel.tsx",
  "src/components/ui/status-pill.tsx",
  "src/app/page.tsx",
  "src/app/reports/page.tsx",
  "src/app/items/page.tsx",
  "src/app/login/page.tsx",
  "src/app/loading.tsx",
  "src/app/error.tsx",
];
```

- [ ] **Step 8: Run primitive verification**

Run:

```powershell
npm run test -- src/components/ui/rich-primitives.test.tsx src/components/design-class-contract.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

Run:

```powershell
git add src/components/ui/panel.tsx src/components/ui/status-pill.tsx src/components/ui/metric-card.tsx src/components/ui/data-table.tsx src/components/ui/rich-primitives.test.tsx src/components/design-class-contract.test.ts
git commit -m "style: add richer design primitives"
```

---

### Task 2: Active App Shell And Navigation

**Files:**
- Create: `src/components/app-nav.tsx`
- Create: `src/components/app-nav.test.tsx`
- Modify: `src/components/app-shell.tsx`

- [ ] **Step 1: Write the failing active navigation test**

Create `src/components/app-nav.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppNav } from "@/components/app-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/reports",
}));

describe("AppNav", () => {
  it("marks the active route and keeps navigation accessible", () => {
    render(<AppNav />);

    expect(screen.getByRole("link", { name: "Reports" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Reports" })).toHaveClass(
      "bg-surface-dark",
      "text-on-dark",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
```

- [ ] **Step 2: Run the failing active navigation test**

Run:

```powershell
npm run test -- src/components/app-nav.test.tsx
```

Expected: FAIL because `src/components/app-nav.tsx` does not exist.

- [ ] **Step 3: Add `AppNav` as a focused Client Component**

Create `src/components/app-nav.tsx`:

```tsx
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
```

- [ ] **Step 4: Update `AppShell` to use active navigation**

In `src/components/app-shell.tsx`, remove `BarChart3`, `Boxes`, `LayoutDashboard`, `Settings`, and `UsersRound` imports. Add:

```tsx
import { AppNav } from "@/components/app-nav";
```

Remove the local `navItems` and `Navigation` definitions.

Replace the component body with:

```tsx
return (
  <div className="min-h-screen bg-canvas text-ink lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
    <aside className="border-b border-hairline bg-surface-soft lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-16 items-center justify-between px-4 lg:h-auto lg:flex-col lg:items-stretch lg:gap-7 lg:px-5 lg:py-5">
        <Link className="flex items-center gap-2 font-display text-xl text-ink" href="/">
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
          <p className="truncate text-sm font-medium text-on-dark">{viewer.displayName}</p>
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
```

- [ ] **Step 5: Run shell verification**

Run:

```powershell
npm run test -- src/components/app-nav.test.tsx src/components/design-class-contract.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/components/app-nav.tsx src/components/app-nav.test.tsx src/components/app-shell.tsx
git commit -m "style: add active app navigation"
```

---

### Task 3: Dashboard Summary Band And KPI Hierarchy

**Files:**
- Create: `src/components/dashboard/summary-band.tsx`
- Create: `src/components/dashboard/summary-band.test.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/dashboard/kpi-grid.tsx`
- Modify: `src/components/dashboard/dashboard-widgets.test.tsx`

- [ ] **Step 1: Write the failing dashboard summary test**

Create `src/components/dashboard/summary-band.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardSummaryBand } from "@/components/dashboard/summary-band";

describe("DashboardSummaryBand", () => {
  it("renders a dark executive summary from KPI data", () => {
    render(
      <DashboardSummaryBand
        kpis={{
          monthTotal: 128900,
          previousMonthTotal: 100000,
          deltaAmount: 28900,
          deltaRatio: 0.289,
          purchaseCount: 8,
          topCategory: "위생용품",
          forecast: {
            next30DaysAmount: 20000,
            next60DaysAmount: 45000,
            next90DaysAmount: 80000,
          },
        }}
        scopeLabel="가족"
      />,
    );

    expect(screen.getByRole("region", { name: "이번 달 구매 브리핑" })).toHaveClass(
      "bg-surface-dark",
      "text-on-dark",
    );
    expect(screen.getByText("가족")).toHaveClass("bg-surface-dark-elevated");
    expect(screen.getByText("₩128,900")).toBeInTheDocument();
    expect(screen.getByText("+₩28,900")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the failing dashboard summary test**

Run:

```powershell
npm run test -- src/components/dashboard/summary-band.test.tsx
```

Expected: FAIL because `summary-band.tsx` does not exist.

- [ ] **Step 3: Add the dashboard summary band**

Create `src/components/dashboard/summary-band.tsx`:

```tsx
import { ArrowDownRight, ArrowUpRight, CalendarClock, ReceiptText } from "lucide-react";

import { StatusPill } from "@/components/ui/status-pill";
import { formatKrw } from "@/lib/format";
import type { DashboardKpis } from "@/lib/reporting/dashboard";

function signedCurrency(value: number) {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}${formatKrw(Math.abs(value))}`;
}

export function DashboardSummaryBand({
  kpis,
  scopeLabel,
}: {
  kpis: DashboardKpis;
  scopeLabel: string;
}) {
  const isIncrease = kpis.deltaAmount >= 0;
  const TrendIcon = isIncrease ? ArrowUpRight : ArrowDownRight;

  return (
    <section
      aria-label="이번 달 구매 브리핑"
      className="overflow-hidden rounded-lg bg-surface-dark text-on-dark"
    >
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:p-7">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="dark">{scopeLabel}</StatusPill>
            <StatusPill tone={isIncrease ? "warning" : "success"}>
              {isIncrease ? "지출 증가" : "지출 감소"}
            </StatusPill>
          </div>
          <h2 className="mt-4 font-display text-4xl leading-tight text-on-dark">
            이번 달 구매 흐름
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-on-dark-soft">
            구매액, 구매 건수, 재구매 예상액을 한 화면에서 비교해 다음 구매 결정을 빠르게 잡습니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-lg bg-surface-dark-elevated px-4 py-3">
              <p className="text-xs text-on-dark-soft">월 구매액</p>
              <p className="font-display text-3xl leading-tight">{formatKrw(kpis.monthTotal)}</p>
            </div>
            <div className="rounded-lg bg-surface-dark-elevated px-4 py-3">
              <p className="text-xs text-on-dark-soft">지난달 대비</p>
              <p className="flex items-center gap-1 font-display text-3xl leading-tight">
                <TrendIcon className="size-5" aria-hidden="true" />
                {signedCurrency(kpis.deltaAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-surface-dark-soft bg-surface-dark-elevated p-4">
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-4 rounded-md bg-surface-dark-soft px-3 py-3">
              <span className="flex items-center gap-2 text-sm text-on-dark-soft">
                <ReceiptText className="size-4" aria-hidden="true" />
                구매 건수
              </span>
              <span className="font-medium text-on-dark">{kpis.purchaseCount}건</span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-surface-dark-soft px-3 py-3">
              <span className="flex items-center gap-2 text-sm text-on-dark-soft">
                <CalendarClock className="size-4" aria-hidden="true" />
                30일 재구매 예상
              </span>
              <span className="font-medium text-on-dark">
                {formatKrw(kpis.forecast.next30DaysAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-md bg-surface-dark-soft px-3 py-3">
              <span className="text-sm text-on-dark-soft">최다 지출 카테고리</span>
              <span className="truncate font-medium text-on-dark">
                {kpis.topCategory ?? "없음"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Insert the summary band on the dashboard page**

In `src/app/page.tsx`, add:

```tsx
import { DashboardSummaryBand } from "@/components/dashboard/summary-band";
```

After the `PageHeader` block and before `<KpiGrid ... />`, add:

```tsx
<DashboardSummaryBand
  kpis={viewModel.dashboard.kpis}
  scopeLabel={viewModel.selectedScope.label ?? "개인 물품"}
/>
```

- [ ] **Step 5: Replace KPI grid cards with `MetricCard`**

In `src/components/dashboard/kpi-grid.tsx`, add:

```tsx
import { MetricCard } from "@/components/ui/metric-card";
```

Replace the returned `<section>` block with:

```tsx
return (
  <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {cards.map((card, index) => {
      const Icon = card.icon;
      return (
        <MetricCard
          accent={index === 0 ? "coral" : index === 1 ? "teal" : index === 2 ? "amber" : "dark"}
          eyebrow={index === 0 ? "핵심 지표" : undefined}
          helper={
            <span className="flex items-center gap-1">
              {card.label === "이번 달 구매액" ? directionIcon : null}
              {card.helper}
            </span>
          }
          icon={<Icon className="size-4" aria-hidden="true" />}
          key={card.label}
          title={card.label}
          tone={index === 0 ? "dark" : "card"}
          value={card.value}
        />
      );
    })}
  </section>
);
```

Keep the `cards` labels as:

```tsx
{
  label: "이번 달 구매액",
  value: formatKrw(kpis.monthTotal),
  helper: `지난달 대비 ${formatSignedCurrency(kpis.deltaAmount)}`,
  icon: Wallet,
},
{
  label: "구매 건수",
  value: `${kpis.purchaseCount}건`,
  helper: ratioText,
  icon: ReceiptText,
},
{
  label: "최다 지출 카테고리",
  value: kpis.topCategory ?? "없음",
  helper: "이번 달 기준",
  icon: Tags,
},
{
  label: "예상 재구매 비용",
  value: formatKrw(kpis.forecast.next30DaysAmount),
  helper: `60일 ${formatKrw(kpis.forecast.next60DaysAmount)} · 90일 ${formatKrw(kpis.forecast.next90DaysAmount)}`,
  icon: CalendarClock,
},
```

- [ ] **Step 6: Update dashboard widget tests**

In `src/components/dashboard/dashboard-widgets.test.tsx`, update the KPI assertions to:

```tsx
const firstCard = screen.getByText("이번 달 구매액").closest("article");
expect(firstCard).toHaveClass("bg-surface-dark", "text-on-dark");
expect(screen.getByText("₩128,900")).toBeInTheDocument();
expect(screen.getByText("지난달 대비 +₩28,900")).toBeInTheDocument();
expect(screen.getByText("8건")).toBeInTheDocument();
expect(screen.getByText("위생용품")).toBeInTheDocument();
```

Use clean fixture strings in the test data:

```tsx
topCategory: "위생용품",
```

- [ ] **Step 7: Run dashboard verification**

Run:

```powershell
npm run test -- src/components/dashboard/summary-band.test.tsx src/components/dashboard/dashboard-widgets.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```powershell
git add src/components/dashboard/summary-band.tsx src/components/dashboard/summary-band.test.tsx src/app/page.tsx src/components/dashboard/kpi-grid.tsx src/components/dashboard/dashboard-widgets.test.tsx
git commit -m "style: enrich dashboard hierarchy"
```

---

### Task 4: Chart And Table Surface Rhythm

**Files:**
- Modify: `src/components/dashboard/charts.tsx`
- Modify: `src/components/dashboard/lists.tsx`
- Modify: `src/components/reports/charts.tsx`
- Modify: `src/components/reports/tables.tsx`
- Modify: `src/components/dashboard/dashboard-widgets.test.tsx`
- Modify: `src/components/reports/reports-widgets.test.tsx`

- [ ] **Step 1: Add richer chart shell expectations**

In `src/components/dashboard/dashboard-widgets.test.tsx`, add this assertion inside the empty-state test after rendering:

```tsx
expect(screen.getByRole("region", { name: "월간 지출 추이" })).toHaveClass(
  "overflow-hidden",
  "bg-surface-card",
);
```

In `src/components/reports/reports-widgets.test.tsx`, add:

```tsx
expect(screen.getByRole("region", { name: "월간/주간 지출 추이" })).toHaveClass(
  "overflow-hidden",
  "bg-surface-card",
);
```

- [ ] **Step 2: Run chart tests to verify they fail**

Run:

```powershell
npm run test -- src/components/dashboard/dashboard-widgets.test.tsx src/components/reports/reports-widgets.test.tsx
```

Expected: FAIL until chart shells use the richer `Panel` classes and clean labels.

- [ ] **Step 3: Update dashboard chart shells**

In `src/components/dashboard/charts.tsx`, import:

```tsx
import { StatusPill } from "@/components/ui/status-pill";
```

Replace `ChartShell` with:

```tsx
function ChartShell({ title, children }: ChartShellProps) {
  return (
    <Panel
      accent="coral"
      title={title}
      titleAdornment={<StatusPill tone="primary">최근 데이터</StatusPill>}
    >
      <div className="h-72">{children}</div>
    </Panel>
  );
}
```

Use these clean dashboard chart strings:

```tsx
"월간 지출 추이"
"월간 지출 데이터가 없습니다."
"카테고리별 지출"
"카테고리 지출 데이터가 없습니다."
```

- [ ] **Step 4: Update reports chart shells**

In `src/components/reports/charts.tsx`, import:

```tsx
import { StatusPill } from "@/components/ui/status-pill";
```

Replace `ChartShell` with:

```tsx
function ChartShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Panel
      accent="teal"
      title={title}
      titleAdornment={<StatusPill tone="teal">필터 반영</StatusPill>}
    >
      <div className="h-72">{children}</div>
    </Panel>
  );
}
```

Use these clean reports chart strings:

```tsx
"월간/주간 지출 추이"
"지출 추이 데이터가 없습니다."
"카테고리별 지출 비중"
"카테고리별 지출 데이터가 없습니다."
```

- [ ] **Step 5: Use `DataTable` in dashboard list tables**

In `src/components/dashboard/lists.tsx`, import:

```tsx
import {
  TableShell,
  tableBodyClassName,
  tableCellClassName,
  tableClassName,
  tableHeadClassName,
  tableHeaderCellClassName,
  tableNumberCellClassName,
} from "@/components/ui/data-table";
```

In `RecentPurchaseTable`, replace the table wrapper with:

```tsx
<TableShell label="최근 구매 이력">
  <table className={tableClassName}>
    <thead className={tableHeadClassName}>
      <tr>
        <th className={tableHeaderCellClassName}>날짜</th>
        <th className={tableHeaderCellClassName}>물품</th>
        <th className={tableHeaderCellClassName}>매장</th>
        <th className={`${tableHeaderCellClassName} text-right`}>금액</th>
      </tr>
    </thead>
    <tbody className={tableBodyClassName}>
      {rows.map((row) => (
        <tr className="active:bg-surface-soft" key={row.purchaseId}>
          <td className={`${tableCellClassName} whitespace-nowrap`}>
            {formatKoreanDate(row.purchaseDate)}
          </td>
          <td className={tableCellClassName}>
            <p className="font-medium text-ink">{row.itemName}</p>
            <p className="text-xs text-muted">{row.brand || row.category}</p>
          </td>
          <td className={tableCellClassName}>{row.storeName || "-"}</td>
          <td className={tableNumberCellClassName}>{formatKrw(row.price)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</TableShell>
```

Use these clean dashboard list strings:

```tsx
"최근 구매 이력"
"최근 구매 이력이 없습니다."
"교체 임박 물품"
"교체 임박 물품이 없습니다."
"가격 변동"
"가격 변동이 감지된 물품이 없습니다."
"예상일 없음"
"남은 수량"
```

- [ ] **Step 6: Use `DataTable` in report tables**

In `src/components/reports/tables.tsx`, import the same `DataTable` exports as Step 5.

Use these clean reports table strings:

```tsx
"물품별 누적 지출"
"물품별 지출 데이터가 없습니다."
"매장별 구매액"
"매장별 지출 데이터가 없습니다."
"물품"
"카테고리"
"건수"
"누적 지출"
"매장"
"구매액"
```

Wrap each table with:

```tsx
<TableShell label="물품별 누적 지출">
  <table className={tableClassName}>
    ...
  </table>
</TableShell>
```

and:

```tsx
<TableShell label="매장별 구매액">
  <table className={tableClassName}>
    ...
  </table>
</TableShell>
```

- [ ] **Step 7: Update dashboard and reports tests for clean strings**

In `src/components/dashboard/dashboard-widgets.test.tsx`, update empty-state expectations:

```tsx
expect(screen.getByText("월간 지출 데이터가 없습니다.")).toBeInTheDocument();
expect(screen.getByText("카테고리 지출 데이터가 없습니다.")).toBeInTheDocument();
expect(screen.getByText("최근 구매 이력이 없습니다.")).toBeInTheDocument();
expect(screen.getByText("교체 임박 물품이 없습니다.")).toBeInTheDocument();
expect(screen.getByText("가격 변동이 감지된 물품이 없습니다.")).toBeInTheDocument();
```

In `src/components/reports/reports-widgets.test.tsx`, update empty-state expectations:

```tsx
expect(screen.getByText("지출 추이 데이터가 없습니다.")).toBeInTheDocument();
expect(screen.getByText("카테고리별 지출 데이터가 없습니다.")).toBeInTheDocument();
expect(screen.getByText("물품별 지출 데이터가 없습니다.")).toBeInTheDocument();
expect(screen.getByText("매장별 지출 데이터가 없습니다.")).toBeInTheDocument();
```

- [ ] **Step 8: Run chart/table verification**

Run:

```powershell
npm run test -- src/components/dashboard/dashboard-widgets.test.tsx src/components/reports/reports-widgets.test.tsx src/components/design-class-contract.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit**

Run:

```powershell
git add src/components/dashboard/charts.tsx src/components/dashboard/lists.tsx src/components/reports/charts.tsx src/components/reports/tables.tsx src/components/dashboard/dashboard-widgets.test.tsx src/components/reports/reports-widgets.test.tsx
git commit -m "style: enrich chart and table surfaces"
```

---

### Task 5: Filter Bars With Clear Selection State

**Files:**
- Modify: `src/components/reports/filter-bar.tsx`
- Modify: `src/components/items/filter-bar.tsx`
- Modify: `src/components/reports/reports-widgets.test.tsx`
- Modify: `src/components/items/items-widgets.test.tsx`

- [ ] **Step 1: Add selected-filter test expectations**

In `src/components/reports/reports-widgets.test.tsx`, add:

```tsx
expect(screen.getByText("카테고리 1")).toHaveClass("bg-primary/15");
expect(screen.getByText("매장 1")).toHaveClass("bg-primary/15");
```

In `src/components/items/items-widgets.test.tsx`, add:

```tsx
expect(screen.getByText("카테고리 1")).toHaveClass("bg-primary/15");
expect(screen.getByText("그룹 1")).toHaveClass("bg-primary/15");
```

- [ ] **Step 2: Run filter tests to verify they fail**

Run:

```powershell
npm run test -- src/components/reports/reports-widgets.test.tsx src/components/items/items-widgets.test.tsx
```

Expected: FAIL because filter bars do not render selected-filter pills.

- [ ] **Step 3: Add selection summary pills to reports filters**

In `src/components/reports/filter-bar.tsx`, add:

```tsx
import { StatusPill } from "@/components/ui/status-pill";
```

Inside `ReportsFilterBar`, before `return`, add:

```tsx
const selectedFilterCounts = [
  { label: "카테고리", count: filters.categories.length },
  { label: "물품", count: filters.items.length },
  { label: "매장", count: filters.stores.length },
].filter((item) => item.count > 0);
```

Inside the top header area, after `ScopeSelector`, add:

```tsx
{selectedFilterCounts.length > 0 ? (
  <div className="flex flex-wrap gap-2">
    {selectedFilterCounts.map((item) => (
      <StatusPill key={item.label} tone="primary">
        {item.label} {item.count}
      </StatusPill>
    ))}
  </div>
) : (
  <StatusPill tone="neutral">전체 데이터</StatusPill>
)}
```

Use these clean reports labels:

```tsx
const periodOptions = [
  { value: "this-month", label: "이번 달" },
  { value: "last-3-months", label: "최근 3개월" },
  { value: "this-year", label: "올해" },
  { value: "custom", label: "사용자 지정" },
] as const;
```

and:

```tsx
"기간 필터"
"시작일"
"종료일"
"카테고리"
"물품"
"매장"
"초기화"
"CSV 내보내기"
"적용"
```

- [ ] **Step 4: Add selection summary pills to item filters**

In `src/components/items/filter-bar.tsx`, add:

```tsx
import { StatusPill } from "@/components/ui/status-pill";
```

Inside `ItemsFilterBar`, before `return`, add:

```tsx
const selectedFilterCounts = [
  { label: "카테고리", count: params.categories.length },
  { label: "그룹", count: params.groups.length },
].filter((item) => item.count > 0);
```

Inside the form, above the first grid, add:

```tsx
<div className="flex flex-wrap items-center gap-2">
  <StatusPill tone="teal">물품 탐색</StatusPill>
  {selectedFilterCounts.length > 0 ? (
    selectedFilterCounts.map((item) => (
      <StatusPill key={item.label} tone="primary">
        {item.label} {item.count}
      </StatusPill>
    ))
  ) : (
    <StatusPill tone="neutral">전체 물품</StatusPill>
  )}
</div>
```

Use these clean item sort labels:

```tsx
const sortOptions = [
  { value: "name", label: "이름" },
  { value: "category", label: "카테고리" },
  { value: "group", label: "그룹" },
  { value: "last_purchase", label: "최근 구매일" },
  { value: "purchase_count", label: "구매 횟수" },
  { value: "total_spent", label: "누적 지출" },
  { value: "next_repurchase", label: "재구매 예상" },
] as const;
```

and:

```tsx
"검색"
"정렬"
"방향"
"오름차순"
"내림차순"
"적용"
"초기화"
"카테고리"
"그룹"
```

- [ ] **Step 5: Update tests for clean fixture strings**

In `src/components/reports/reports-widgets.test.tsx`, use:

```tsx
categories: [{ id: "cat-1", label: "위생용품", secondaryLabel: "" }],
items: [{ id: "item-1", label: "휴지", secondaryLabel: "브랜드" }],
stores: [{ id: "쿠팡", label: "쿠팡", secondaryLabel: "" }],
```

Update role/name expectations:

```tsx
expect(screen.getByLabelText("사용자 지정")).toBeChecked();
expect(screen.getByLabelText("위생용품")).toBeChecked();
expect(screen.getByLabelText("휴지 브랜드")).not.toBeChecked();
expect(screen.getByLabelText("쿠팡")).toBeChecked();
expect(screen.getByLabelText("시작일")).toHaveValue("2026-01-01");
expect(screen.getByLabelText("종료일")).toHaveValue("2026-05-30");
expect(screen.getByRole("link", { name: "초기화" })).toHaveAttribute(
  "href",
  "/reports?scope=group%3Agroup-1",
);
expect(screen.getByRole("link", { name: "CSV 내보내기" })).toHaveClass("bg-primary");
```

In `src/components/items/items-widgets.test.tsx`, use:

```tsx
search: "휴지",
categories: [{ id: "cat-1", label: "위생용품", secondaryLabel: "" }],
groups: [
  { id: "personal", label: "내 물품", secondaryLabel: "개인" },
  { id: "group:g1", label: "가족", secondaryLabel: "owner" },
],
```

Update form expectations:

```tsx
expect(screen.getByLabelText("검색")).toHaveValue("휴지");
expect(screen.getByLabelText("정렬")).toHaveValue("total_spent");
expect(screen.getByLabelText("방향")).toHaveValue("desc");
expect(screen.getByLabelText("위생용품")).toBeChecked();
expect(screen.getByLabelText("내 물품 개인")).toBeChecked();
expect(screen.getByLabelText("가족 owner")).not.toBeChecked();
expect(screen.getByRole("link", { name: "초기화" })).toHaveAttribute("href", "/items");
```

- [ ] **Step 6: Run filter verification**

Run:

```powershell
npm run test -- src/components/reports/reports-widgets.test.tsx src/components/items/items-widgets.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/components/reports/filter-bar.tsx src/components/items/filter-bar.tsx src/components/reports/reports-widgets.test.tsx src/components/items/items-widgets.test.tsx
git commit -m "style: clarify filter selection state"
```

---

### Task 6: Items List And Detail Visual Clarity

**Files:**
- Modify: `src/components/items/table.tsx`
- Modify: `src/components/items/detail.tsx`
- Modify: `src/components/items/items-widgets.test.tsx`
- Modify: `src/app/items/[itemId]/page.tsx`

- [ ] **Step 1: Add item table and detail expectations**

In `src/components/items/items-widgets.test.tsx`, add to the table test:

```tsx
expect(screen.getByText("위생용품")).toHaveClass("bg-accent-amber/20");
expect(screen.getByText("내 물품")).toHaveClass("bg-surface-soft");
```

Add to the detail test:

```tsx
expect(screen.getByRole("region", { name: "가격 요약" })).toHaveClass(
  "bg-surface-dark",
  "text-on-dark",
);
```

- [ ] **Step 2: Run item tests to verify they fail**

Run:

```powershell
npm run test -- src/components/items/items-widgets.test.tsx
```

Expected: FAIL because category/group pills and dark price summary are not rendered yet.

- [ ] **Step 3: Add pills and shared table shell to `ItemsTable`**

In `src/components/items/table.tsx`, import:

```tsx
import {
  TableShell,
  tableBodyClassName,
  tableCellClassName,
  tableClassName,
  tableHeadClassName,
  tableHeaderCellClassName,
  tableNumberCellClassName,
} from "@/components/ui/data-table";
import { StatusPill } from "@/components/ui/status-pill";
```

Replace the table wrapper with:

```tsx
<TableShell label="물품 목록">
  <table className={tableClassName}>
    <thead className={tableHeadClassName}>
      <tr>
        <th className={tableHeaderCellClassName}>물품</th>
        <th className={tableHeaderCellClassName}>분류</th>
        <th className={`${tableHeaderCellClassName} text-right`}>구매</th>
        <th className={`${tableHeaderCellClassName} text-right`}>누적 지출</th>
        <th className={tableHeaderCellClassName}>최근 구매</th>
        <th className={tableHeaderCellClassName}>재구매 예상</th>
      </tr>
    </thead>
    <tbody className={tableBodyClassName}>
      {items.map((item) => (
        <tr className="active:bg-surface-soft" key={item.itemId}>
          <td className={tableCellClassName}>
            <Link
              className="font-medium text-ink underline-offset-4 active:underline"
              href={`/items/${item.itemId}`}
            >
              {item.itemName}
            </Link>
            <p className="text-xs text-muted">{item.brand || "-"}</p>
          </td>
          <td className={tableCellClassName}>
            <div className="flex flex-wrap gap-2">
              <StatusPill tone="amber">{item.category}</StatusPill>
              <StatusPill tone="neutral">{item.groupLabel}</StatusPill>
            </div>
          </td>
          <td className={tableNumberCellClassName}>{item.purchaseCount}건</td>
          <td className={tableNumberCellClassName}>{formatKrw(item.totalSpent)}</td>
          <td className={`${tableCellClassName} whitespace-nowrap`}>
            {dateOrDash(item.lastPurchaseDate)}
          </td>
          <td className={`${tableCellClassName} whitespace-nowrap`}>
            {repurchaseText(item)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</TableShell>
```

Use these clean item strings:

```tsx
"물품 목록"
"조건에 맞는 물품이 없습니다."
"오늘"
"일 지남"
```

- [ ] **Step 4: Convert item detail summary to richer surfaces**

In `src/components/items/detail.tsx`, import:

```tsx
import { MetricCard } from "@/components/ui/metric-card";
import { StatusPill } from "@/components/ui/status-pill";
```

Replace the four top `<Panel>` metrics with:

```tsx
<div className="grid gap-4 lg:grid-cols-4">
  <MetricCard
    accent="amber"
    eyebrow={item.groupLabel}
    title="소속"
    value={item.category}
  />
  <MetricCard
    accent="teal"
    helper="전체 구매 횟수"
    title="구매"
    value={`${item.purchaseCount}건`}
  />
  <MetricCard
    accent="coral"
    helper="누적 지출"
    title="금액"
    tone="dark"
    value={formatKrw(item.totalSpent)}
  />
  <MetricCard
    accent="dark"
    helper={item.expectedRepurchaseDate ?? "예상 없음"}
    title="재구매 예상"
    value={daysText(item.daysUntilRepurchase)}
  />
</div>
```

Replace the price summary `<Panel title="가격 요약">` with:

```tsx
<Panel
  accent="teal"
  title="가격 요약"
  titleAdornment={<StatusPill tone="dark">최근 구매 기준</StatusPill>}
  tone="dark"
>
  <dl className="space-y-3 text-sm">
    <div className="flex justify-between gap-3">
      <dt className="text-on-dark-soft">평균가</dt>
      <dd className="font-medium text-on-dark">{formatKrw(item.averagePrice)}</dd>
    </div>
    <div className="flex justify-between gap-3">
      <dt className="text-on-dark-soft">최저가</dt>
      <dd className="font-medium text-on-dark">{formatKrw(item.minPrice)}</dd>
    </div>
    <div className="flex justify-between gap-3">
      <dt className="text-on-dark-soft">최고가</dt>
      <dd className="font-medium text-on-dark">{formatKrw(item.maxPrice)}</dd>
    </div>
    <div className="flex justify-between gap-3">
      <dt className="text-on-dark-soft">최근 구매처</dt>
      <dd className="font-medium text-on-dark">{item.lastStoreName}</dd>
    </div>
  </dl>
</Panel>
```

Use these clean detail strings:

```tsx
"예상 없음"
"일 지남"
"오늘"
"일 남음"
"가격 변동 데이터가 없습니다."
"아직 구매 이력이 없습니다."
"날짜"
"매장"
"수량"
"가격"
"변동"
"소속"
"구매"
"금액"
"재구매 예상"
"가격 변동"
"구매 이력"
```

- [ ] **Step 5: Clean detail page copy**

In `src/app/items/[itemId]/page.tsx`, use:

```tsx
eyebrow={[item.category, item.groupLabel].filter(Boolean).join(" · ")}
description={item.brand || "브랜드 정보 없음"}
```

Change the back link text to:

```tsx
목록
```

- [ ] **Step 6: Update item tests for clean strings**

In `src/components/items/items-widgets.test.tsx`, use clean row/detail fixtures:

```tsx
itemName: "휴지",
brand: "브랜드",
category: "위생용품",
groupLabel: "내 물품",
lastStoreName: "쿠팡",
```

Update expectations:

```tsx
expect(screen.getByRole("link", { name: "휴지" })).toHaveAttribute(
  "href",
  "/items/item-1",
);
expect(screen.getByText("₩22,000")).toBeInTheDocument();
expect(screen.getByText("2026. 5. 20.")).toBeInTheDocument();
expect(screen.getByText("2026. 6. 19.")).toBeInTheDocument();
expect(screen.getByText("조건에 맞는 물품이 없습니다.")).toBeInTheDocument();
expect(screen.getByText("구매 이력")).toBeInTheDocument();
expect(screen.getAllByText("쿠팡")).toHaveLength(2);
expect(screen.getByText("+₩2,000")).toBeInTheDocument();
expect(screen.getByText("재구매 예상")).toBeInTheDocument();
expect(screen.getByText("19일 남음")).toBeInTheDocument();
expect(screen.getByText("아직 구매 이력이 없습니다.")).toBeInTheDocument();
```

- [ ] **Step 7: Run item verification**

Run:

```powershell
npm run test -- src/components/items/items-widgets.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```powershell
git add src/components/items/table.tsx src/components/items/detail.tsx src/components/items/items-widgets.test.tsx src/app/items/[itemId]/page.tsx
git commit -m "style: enrich items workspace"
```

---

### Task 7: Entry, Placeholder, Loading, And Error States

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/components/placeholder-page.tsx`
- Modify: `src/app/groups/page.tsx`
- Modify: `src/app/settings/page.tsx`
- Modify: `src/app/loading.tsx`
- Modify: `src/app/error.tsx`

- [ ] **Step 1: Add static contract coverage for entry states**

Confirm `src/components/design-class-contract.test.ts` includes:

```ts
"src/app/login/page.tsx",
"src/components/placeholder-page.tsx",
"src/app/groups/page.tsx",
"src/app/settings/page.tsx",
"src/app/loading.tsx",
"src/app/error.tsx",
```

- [ ] **Step 2: Run the static contract**

Run:

```powershell
npm run test -- src/components/design-class-contract.test.ts
```

Expected: PASS before edits. Keep it passing after the edits in this task.

- [ ] **Step 3: Refresh the login screen**

In `src/app/login/page.tsx`, keep the existing actions and config logic. Replace the returned JSX with:

```tsx
return (
  <main className="grid min-h-screen bg-canvas lg:grid-cols-[minmax(0,1fr)_480px]">
    <section className="flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-hairline bg-surface-card p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-canvas p-2 text-ink">
            <BrandMark />
          </div>
          <div>
            <h1 className="font-display text-3xl leading-tight text-ink">buylog web</h1>
            <p className="text-sm text-muted">소비와 재구매를 읽는 관리 대시보드</p>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-5 rounded-md border border-error/30 bg-canvas px-3 py-2 text-sm text-error">
            {errorMessage}
          </p>
        ) : null}

        <form action={login} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-body">
            이메일
            <input
              className="mt-1 h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="block text-sm font-medium text-body">
            비밀번호
            <input
              className="mt-1 h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className={buttonClassName("primary", "w-full")} type="submit">
            로그인
          </button>
        </form>

        {demoEnabled ? (
          <form action={enterDemoMode} className="mt-3">
            <button className={buttonClassName("secondary", "w-full")} type="submit">
              시연 모드로 보기
            </button>
          </form>
        ) : null}
      </div>
    </section>

    <aside className="hidden bg-surface-dark p-8 text-on-dark lg:flex lg:flex-col lg:justify-between">
      <div>
        <StatusPill tone="dark">Demo workspace</StatusPill>
        <h2 className="mt-5 font-display text-4xl leading-tight">
          구매 기록을 다음 행동으로 바꿉니다.
        </h2>
        <p className="mt-4 text-sm leading-6 text-on-dark-soft">
          리포트, 물품, 재구매 흐름을 하나의 관리 화면에서 확인하도록 설계했습니다.
        </p>
      </div>
      <div className="rounded-lg bg-surface-dark-elevated p-4">
        <div className="flex items-center justify-between border-b border-surface-dark-soft pb-3 text-sm">
          <span className="text-on-dark-soft">이번 달 구매액</span>
          <span className="font-medium text-on-dark">₩128,900</span>
        </div>
        <div className="flex items-center justify-between pt-3 text-sm">
          <span className="text-on-dark-soft">재구매 예상</span>
          <span className="font-medium text-on-dark">30일 기준</span>
        </div>
      </div>
    </aside>
  </main>
);
```

Add the missing import:

```tsx
import { StatusPill } from "@/components/ui/status-pill";
```

Use clean error messages:

```tsx
const ERROR_MESSAGES: Record<string, string> = {
  "missing-config": "Supabase 환경 변수가 설정되지 않았습니다.",
  "invalid-credentials": "이메일 또는 비밀번호를 확인해 주세요.",
  "demo-disabled": "시연 모드가 비활성화되어 있습니다.",
};
```

- [ ] **Step 4: Refresh placeholder pages**

In `src/components/placeholder-page.tsx`, replace the list body with:

```tsx
<Panel accent="amber" description="다음 관리 화면으로 확장될 영역입니다." title={title}>
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
```

Add:

```tsx
import { StatusPill } from "@/components/ui/status-pill";
```

In `src/app/groups/page.tsx`, use:

```tsx
rows={["내 그룹", "멤버 역할", "그룹 리포트", "권한 관리"]}
```

In `src/app/settings/page.tsx`, use:

```tsx
rows={["카테고리", "알림/리포트", "기본 기간", "Supabase 연결"]}
```

- [ ] **Step 5: Refresh loading and error states**

In `src/app/loading.tsx`, replace the inner skeleton with:

```tsx
<div className="mx-auto max-w-7xl space-y-5">
  <div className="h-40 animate-pulse rounded-lg bg-surface-dark" />
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <div
        className="h-32 animate-pulse rounded-lg bg-surface-card"
        key={index}
      />
    ))}
  </div>
  <div className="grid gap-4 xl:grid-cols-2">
    <div className="h-80 animate-pulse rounded-lg bg-surface-card" />
    <div className="h-80 animate-pulse rounded-lg bg-surface-card" />
  </div>
</div>
```

In `src/app/error.tsx`, use clean text:

```tsx
<h1 className="font-display text-3xl text-ink">오류</h1>
...
다시 시도
```

- [ ] **Step 6: Run entry-state verification**

Run:

```powershell
npm run test -- src/components/design-class-contract.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/app/login/page.tsx src/components/placeholder-page.tsx src/app/groups/page.tsx src/app/settings/page.tsx src/app/loading.tsx src/app/error.tsx
git commit -m "style: enrich entry and placeholder states"
```

---

### Task 8: Full Verification And Visual Smoke

**Files:**
- No planned source changes unless verification reveals a concrete defect.

- [ ] **Step 1: Run lint**

Run:

```powershell
npm run lint
```

Expected: PASS with no ESLint errors.

- [ ] **Step 2: Run typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS. If generated `.next/types` are stale, run `npm run build` once and then rerun `npm run typecheck`.

- [ ] **Step 3: Run unit tests**

Run:

```powershell
npm run test
```

Expected: PASS for all Vitest files.

- [ ] **Step 4: Run production build**

Run:

```powershell
npm run build
```

Expected: PASS with a completed Next.js production build.

- [ ] **Step 5: Start the local dev server**

Run:

```powershell
npm run dev
```

Expected: Next.js reports a local URL, normally `http://localhost:3000`. Use the port printed by Next.js if 3000 is occupied.

- [ ] **Step 6: Browser visual smoke**

Open these routes:

```text
http://localhost:3000/login
http://localhost:3000/
http://localhost:3000/reports
http://localhost:3000/items
```

Expected visual results:

- Login has a cream form surface and dark product surface on desktop; mobile shows only the focused login flow.
- App shell shows an active nav state for the current route.
- Dashboard has a dark summary band, then metric cards, then chart/table content.
- Reports filter selections are visible as chips before the dense controls.
- Items table uses category/group pills and remains readable on mobile horizontal scroll.
- Text does not overlap at desktop width around 1440px or mobile width around 390px.
- The page does not read as a single beige/cream block because dark, coral, teal, and amber accents are distributed by purpose.

- [ ] **Step 7: Route defects back to owning task**

If verification reveals a concrete defect, fix it in the file owned by the task above, rerun that task's targeted tests, then rerun the full verification commands from Steps 1-4. If no defect is found, do not create an empty commit.

## Self-Review

Spec coverage:

- `design.md` cream/coral/dark rhythm: Tasks 1, 3, 4, and 7.
- "Not too much" restraint: Tasks keep dark surfaces to summary/login/detail areas, use coral for primary emphasis, and use teal/amber for metadata only.
- Intuitive navigation: Task 2 adds active route state.
- Richer dashboard: Task 3 adds summary band and varied metric card hierarchy.
- Richer reports/items controls: Tasks 5 and 6 add chips, table shells, and semantic pills.
- Existing Next.js boundaries: All data-loading pages remain Server Components; only `AppNav` is a new Client Component.
- Verification: Task 8 covers lint, typecheck, tests, build, and browser smoke.

Placeholder scan:

- No placeholder markers are present.
- No deferred implementation wording is present.
- No unnamed tests.
- Every created file has concrete code.
- Every modified area has exact file paths, snippets, commands, and expected results.

Type consistency:

- `PanelAccent`, `StatusTone`, `MetricTone`, and `MetricAccent` values match every later usage.
- `MetricCard`, `StatusPill`, `TableShell`, `tableClassName`, `tableHeadClassName`, and table cell constants are defined before later tasks import them.
- `AppNav` is the only new Client Component and is imported from the Server Component shell without passing non-serializable props.
- Dashboard summary uses the existing `DashboardKpis` type and does not require service/query changes.
