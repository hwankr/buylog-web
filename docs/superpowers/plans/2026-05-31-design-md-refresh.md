# Design.md Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the current buylog-web dashboard from the default cool slate UI into the warm cream, coral, serif-display, dark-product-surface system described in `design.md`.

**Architecture:** Keep the existing Next.js App Router structure and data-loading boundaries intact. Apply the design through Tailwind v4 theme tokens in `src/app/globals.css`, optimized `next/font` variables in `src/app/layout.tsx`, small shared UI primitives, and focused restyling of shell, dashboard, reports, and entry-state components.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.4, Tailwind CSS v4, `next/font/google`, Vitest, React Testing Library, Recharts, lucide-react.

---

## Scope

This plan adapts `design.md` to a working management dashboard. Do not create a marketing landing page or oversized hero. Keep the app dense, scan-friendly, and operational while using the design's cream canvas, coral primary action, serif display headings, warm ink text, hairline borders, dark navy product surfaces, and restrained shadows.

## Local Next.js Docs Read Before Planning

The project's `AGENTS.md` requires local Next docs for this version. These guides were checked and should be rechecked at execution time if Next APIs are changed:

- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`
- `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`

The plan keeps pages and layouts as Server Components, uses Client Components only where Recharts already requires them, imports global CSS only from the root layout, and uses `next/font/google` from the root layout.

## File Structure

- Modify: `src/app/globals.css` - design tokens, Tailwind v4 theme aliases, base typography, focus styling.
- Modify: `src/app/layout.tsx` - replace Geist with Inter, Cormorant Garamond, and JetBrains Mono variables through `next/font/google`.
- Create: `src/app/design-tokens.test.ts` - static guard for token values and font aliases.
- Create: `src/lib/ui.ts` - `cn()` helper using `clsx` and `tailwind-merge`.
- Create: `src/components/ui/button.tsx` - shared button class helper and plain button/link wrappers.
- Create: `src/components/ui/panel.tsx` - shared cream, canvas, dark, and coral panel surfaces.
- Create: `src/components/ui/page-header.tsx` - consistent page title block.
- Create: `src/components/ui/brand-mark.tsx` - small radial mark used in the product wordmark.
- Create: `src/components/ui/chart-theme.ts` - shared chart palette from `design.md`.
- Create: `src/components/ui/primitives.test.tsx` - unit tests for primitives.
- Create: `src/components/design-class-contract.test.ts` - staged static guard against old slate/white/shadow styling.
- Modify: `src/components/app-shell.tsx` - cream canvas shell, warm navigation, dark user strip, mobile nav row.
- Modify: `src/components/scope-selector.tsx` - category-tab styling.
- Modify: `src/components/empty-state.tsx` - warm dashed empty states.
- Modify: `src/components/dashboard/kpi-grid.tsx` - cream cards, coral/dark icons, serif metric values.
- Modify: `src/components/dashboard/charts.tsx` - shared panel and chart palette.
- Modify: `src/components/dashboard/lists.tsx` - shared panel, warm table/list styling.
- Modify: `src/components/reports/filter-bar.tsx` - warm filters, coral primary actions, focused inputs.
- Modify: `src/components/reports/charts.tsx` - shared panel and chart palette.
- Modify: `src/components/reports/tables.tsx` - shared panel, warm table styling.
- Modify: `src/components/placeholder-page.tsx` - shared header and panel treatment.
- Modify: `src/app/page.tsx` - shared page header and warm error state.
- Modify: `src/app/reports/page.tsx` - shared page header and warm error state.
- Modify: `src/app/login/page.tsx` - warm login card with brand mark, coral primary action, cream secondary action.
- Modify: `src/app/loading.tsx` - cream loading skeletons.
- Modify: `src/app/error.tsx` - warm error card and coral retry action.

## Design Token Mapping

Use these exact Tailwind token aliases after Task 1:

| `design.md` token | CSS variable | Tailwind utility |
|---|---|---|
| `#faf9f5` canvas | `--canvas` | `bg-canvas` |
| `#f5f0e8` surface soft | `--surface-soft` | `bg-surface-soft` |
| `#efe9de` surface card | `--surface-card` | `bg-surface-card` |
| `#e8e0d2` cream strong | `--surface-cream-strong` | `bg-surface-cream-strong` |
| `#181715` dark surface | `--surface-dark` | `bg-surface-dark` |
| `#252320` dark elevated | `--surface-dark-elevated` | `bg-surface-dark-elevated` |
| `#1f1e1b` dark soft | `--surface-dark-soft` | `bg-surface-dark-soft` |
| `#e6dfd8` hairline | `--hairline` | `border-hairline` |
| `#ebe6df` hairline soft | `--hairline-soft` | `border-hairline-soft` |
| `#141413` ink | `--ink` | `text-ink` |
| `#3d3d3a` body | `--body` | `text-body` |
| `#6c6a64` muted | `--muted` | `text-muted` |
| `#8e8b82` muted soft | `--muted-soft` | `text-muted-soft` |
| `#cc785c` coral | `--primary` | `bg-primary`, `text-primary`, `border-primary` |
| `#a9583e` coral active | `--primary-active` | `bg-primary-active` |
| `#5db8a6` teal | `--accent-teal` | `text-accent-teal`, `bg-accent-teal` |
| `#e8a55a` amber | `--accent-amber` | `text-accent-amber`, `bg-accent-amber` |

---

### Task 1: Global Tokens And Fonts

**Files:**
- Create: `src/app/design-tokens.test.ts`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Write the failing token test**

Create `src/app/design-tokens.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");

describe("design tokens", () => {
  it("defines the warm design.md color system", () => {
    expect(css).toContain("--canvas: #faf9f5;");
    expect(css).toContain("--surface-card: #efe9de;");
    expect(css).toContain("--surface-dark: #181715;");
    expect(css).toContain("--primary: #cc785c;");
    expect(css).toContain("--primary-active: #a9583e;");
    expect(css).toContain("--hairline: #e6dfd8;");
    expect(css).toContain("--ink: #141413;");
  });

  it("exposes Tailwind v4 aliases for the design system", () => {
    expect(css).toContain("--color-canvas: var(--canvas);");
    expect(css).toContain("--color-surface-card: var(--surface-card);");
    expect(css).toContain("--color-primary: var(--primary);");
    expect(css).toContain("--font-display: var(--font-cormorant)");
  });

  it("uses next/font variables for serif display, sans body, and mono code", () => {
    expect(layout).toContain("Cormorant_Garamond");
    expect(layout).toContain("Inter");
    expect(layout).toContain("JetBrains_Mono");
    expect(layout).toContain("--font-cormorant");
    expect(layout).toContain("--font-inter");
    expect(layout).toContain("--font-jetbrains-mono");
  });
});
```

- [ ] **Step 2: Run the token test to verify it fails**

Run:

```powershell
npm run test -- src/app/design-tokens.test.ts
```

Expected: FAIL because `--canvas`, `Cormorant_Garamond`, and the new font variables are not present yet.

- [ ] **Step 3: Replace `src/app/globals.css` with design tokens**

Use this complete file:

```css
@import "tailwindcss";

:root {
  --canvas: #faf9f5;
  --surface-soft: #f5f0e8;
  --surface-card: #efe9de;
  --surface-cream-strong: #e8e0d2;
  --surface-dark: #181715;
  --surface-dark-elevated: #252320;
  --surface-dark-soft: #1f1e1b;
  --hairline: #e6dfd8;
  --hairline-soft: #ebe6df;
  --ink: #141413;
  --body-strong: #252523;
  --body: #3d3d3a;
  --muted: #6c6a64;
  --muted-soft: #8e8b82;
  --primary: #cc785c;
  --primary-active: #a9583e;
  --primary-disabled: #e6dfd8;
  --on-primary: #ffffff;
  --on-dark: #faf9f5;
  --on-dark-soft: #a09d96;
  --accent-teal: #5db8a6;
  --accent-amber: #e8a55a;
  --success: #5db872;
  --warning: #d4a017;
  --error: #c64545;
}

@theme inline {
  --color-background: var(--canvas);
  --color-foreground: var(--ink);
  --color-canvas: var(--canvas);
  --color-surface-soft: var(--surface-soft);
  --color-surface-card: var(--surface-card);
  --color-surface-cream-strong: var(--surface-cream-strong);
  --color-surface-dark: var(--surface-dark);
  --color-surface-dark-elevated: var(--surface-dark-elevated);
  --color-surface-dark-soft: var(--surface-dark-soft);
  --color-hairline: var(--hairline);
  --color-hairline-soft: var(--hairline-soft);
  --color-ink: var(--ink);
  --color-body-strong: var(--body-strong);
  --color-body: var(--body);
  --color-muted: var(--muted);
  --color-muted-soft: var(--muted-soft);
  --color-primary: var(--primary);
  --color-primary-active: var(--primary-active);
  --color-primary-disabled: var(--primary-disabled);
  --color-on-primary: var(--on-primary);
  --color-on-dark: var(--on-dark);
  --color-on-dark-soft: var(--on-dark-soft);
  --color-accent-teal: var(--accent-teal);
  --color-accent-amber: var(--accent-amber);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-error: var(--error);
  --font-sans: var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-display: var(--font-cormorant), "Times New Roman", serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;
}

body {
  background: var(--canvas);
  color: var(--ink);
  font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

::selection {
  background: color-mix(in srgb, var(--primary) 28%, transparent);
}

:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--primary) 75%, transparent);
  outline-offset: 2px;
}

.font-display {
  font-family: var(--font-cormorant), "Times New Roman", serif;
  font-weight: 500;
  letter-spacing: -0.02em;
}
```

- [ ] **Step 4: Replace `src/app/layout.tsx` fonts and body classes**

Use this complete file:

```tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "buylog web",
  description: "소비재 구매와 재고를 분석하는 buylog 관리 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} ${cormorant.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-canvas text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Run token verification**

Run:

```powershell
npm run test -- src/app/design-tokens.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/app/design-tokens.test.ts src/app/globals.css src/app/layout.tsx
git commit -m "style: add design md tokens and fonts"
```

---

### Task 2: Shared UI Primitives

**Files:**
- Create: `src/lib/ui.ts`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/panel.tsx`
- Create: `src/components/ui/page-header.tsx`
- Create: `src/components/ui/brand-mark.tsx`
- Create: `src/components/ui/chart-theme.ts`
- Create: `src/components/ui/primitives.test.tsx`

- [ ] **Step 1: Write the failing primitive tests**

Create `src/components/ui/primitives.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandMark } from "@/components/ui/brand-mark";
import { Button, ButtonLink } from "@/components/ui/button";
import { CHART_COLORS, CHART_GRID_COLOR } from "@/components/ui/chart-theme";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";

describe("design primitives", () => {
  it("renders button variants with design.md classes", () => {
    render(
      <>
        <Button>Apply</Button>
        <ButtonLink href="/reports" variant="secondary">
          Reports
        </ButtonLink>
      </>,
    );

    expect(screen.getByRole("button", { name: "Apply" })).toHaveClass(
      "bg-primary",
      "text-on-primary",
      "rounded-md",
    );
    expect(screen.getByRole("link", { name: "Reports" })).toHaveClass(
      "border-hairline",
      "bg-canvas",
      "text-ink",
    );
  });

  it("renders panels and page headers with warm editorial classes", () => {
    render(
      <Panel title="Spending" description="This month">
        <PageHeader eyebrow="Today" title="Dashboard" description="Summary" />
      </Panel>,
    );

    expect(screen.getByRole("region", { name: "Spending" })).toHaveClass(
      "bg-surface-card",
      "rounded-lg",
      "border-hairline",
    );
    expect(screen.getByRole("heading", { name: "Dashboard" })).toHaveClass(
      "font-display",
      "text-ink",
    );
  });

  it("exposes a radial brand mark and warm chart palette", () => {
    const { container } = render(<BrandMark />);

    expect(container.firstElementChild).toHaveClass("text-ink");
    expect(CHART_COLORS).toEqual([
      "#cc785c",
      "#5db8a6",
      "#e8a55a",
      "#181715",
      "#8e8b82",
      "#5db872",
    ]);
    expect(CHART_GRID_COLOR).toBe("#e6dfd8");
  });
});
```

- [ ] **Step 2: Run the primitive tests to verify they fail**

Run:

```powershell
npm run test -- src/components/ui/primitives.test.tsx
```

Expected: FAIL because the UI primitive files do not exist.

- [ ] **Step 3: Add the class merge helper**

Create `src/lib/ui.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Add shared button styles**

Create `src/components/ui/button.tsx`:

```tsx
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/ui";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "dark" | "icon";

const base =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition disabled:pointer-events-none disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary px-4 text-on-primary active:bg-primary-active",
  secondary:
    "border border-hairline bg-canvas px-4 text-ink active:bg-surface-card",
  ghost: "px-3 text-muted active:bg-surface-card active:text-ink",
  dark: "bg-surface-dark-elevated px-4 text-on-dark active:bg-surface-dark-soft",
  icon: "size-9 rounded-full border border-hairline bg-canvas p-0 text-ink active:bg-surface-card",
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  className?: string,
) {
  return cn(base, variants[variant], className);
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName(variant, className)}
      type={type}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentPropsWithoutRef<"a"> & {
  variant?: ButtonVariant;
};

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ButtonLinkProps) {
  return <a className={buttonClassName(variant, className)} {...props} />;
}
```

- [ ] **Step 5: Add panel, page header, brand mark, and chart palette**

Create `src/components/ui/panel.tsx`:

```tsx
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/ui";

type PanelTone = "card" | "canvas" | "dark" | "coral";

type PanelProps = HTMLAttributes<HTMLElement> & {
  title?: ReactNode;
  description?: ReactNode;
  tone?: PanelTone;
};

const toneClasses: Record<PanelTone, string> = {
  card: "border border-hairline bg-surface-card text-ink",
  canvas: "border border-hairline bg-canvas text-ink",
  dark: "bg-surface-dark text-on-dark",
  coral: "bg-primary text-on-primary",
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
  title,
  description,
  tone = "card",
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <section
      aria-label={typeof title === "string" ? title : undefined}
      className={cn("rounded-lg p-6", toneClasses[tone], className)}
      {...props}
    >
      {title || description ? (
        <header className="mb-5 space-y-1">
          {title ? (
            <h2 className={cn("text-lg font-medium", titleClass(tone))}>
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className={cn("text-sm", descriptionClass(tone))}>
              {description}
            </p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
```

Create `src/components/ui/page-header.tsx`:

```tsx
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-hairline pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-sm font-medium text-muted">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 font-display text-4xl leading-tight text-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-body">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
```

Create `src/components/ui/brand-mark.tsx`:

```tsx
import { cn } from "@/lib/ui";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex size-5 items-center justify-center text-ink",
        className,
      )}
    >
      <span className="absolute h-[2px] w-5 rounded-full bg-current" />
      <span className="absolute h-[2px] w-5 rotate-90 rounded-full bg-current" />
      <span className="absolute h-[2px] w-4 rotate-45 rounded-full bg-current" />
      <span className="absolute h-[2px] w-4 -rotate-45 rounded-full bg-current" />
    </span>
  );
}
```

Create `src/components/ui/chart-theme.ts`:

```ts
export const CHART_COLORS = [
  "#cc785c",
  "#5db8a6",
  "#e8a55a",
  "#181715",
  "#8e8b82",
  "#5db872",
] as const;

export const CHART_GRID_COLOR = "#e6dfd8";
export const CHART_TEXT_COLOR = "#6c6a64";
export const CHART_BAR_RADIUS: [number, number, number, number] = [6, 6, 0, 0];
```

- [ ] **Step 6: Run primitive verification**

Run:

```powershell
npm run test -- src/components/ui/primitives.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/lib/ui.ts src/components/ui/button.tsx src/components/ui/panel.tsx src/components/ui/page-header.tsx src/components/ui/brand-mark.tsx src/components/ui/chart-theme.ts src/components/ui/primitives.test.tsx
git commit -m "style: add warm design primitives"
```

---

### Task 3: Shell, Scope Selector, And Empty State

**Files:**
- Create: `src/components/design-class-contract.test.ts`
- Modify: `src/components/app-shell.tsx`
- Modify: `src/components/scope-selector.tsx`
- Modify: `src/components/empty-state.tsx`

- [ ] **Step 1: Add a shell-focused design class contract**

Create `src/components/design-class-contract.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const themedFiles = [
  "src/components/app-shell.tsx",
  "src/components/scope-selector.tsx",
  "src/components/empty-state.tsx",
];

describe("design class contract", () => {
  it.each(themedFiles)("%s does not use the old cool-slate surface system", (file) => {
    const source = readFileSync(join(process.cwd(), file), "utf8");

    expect(source).not.toMatch(/\bbg-slate-/);
    expect(source).not.toMatch(/\btext-slate-/);
    expect(source).not.toMatch(/\bborder-slate-/);
    expect(source).not.toMatch(/\bbg-white\b/);
    expect(source).not.toMatch(/\bshadow-sm\b/);
  });
});
```

- [ ] **Step 2: Run the design class contract to verify it fails**

Run:

```powershell
npm run test -- src/components/design-class-contract.test.ts
```

Expected: FAIL because shell components still use `slate`, `bg-white`, and `shadow-sm` classes.

- [ ] **Step 3: Restyle the shell components**

Apply these exact class replacements:

| File | Existing class fragment | Replacement class fragment |
|---|---|---|
| `src/components/app-shell.tsx` | `min-h-screen bg-slate-100` | `min-h-screen bg-canvas text-ink` |
| `src/components/app-shell.tsx` | `border-slate-200 bg-white` | `border-hairline bg-surface-soft` |
| `src/components/app-shell.tsx` | `font-semibold text-slate-950` | `font-display text-xl text-ink` |
| `src/components/app-shell.tsx` | `rounded-md bg-slate-950 p-2 text-white` | `rounded-md bg-canvas p-2 text-ink` with `BrandMark` inside |
| `src/components/app-shell.tsx` | `text-slate-600 hover:bg-slate-100 hover:text-slate-950` | `text-muted active:bg-surface-card active:text-ink` |
| `src/components/app-shell.tsx` | `border-b border-slate-200 bg-white` | `border-b border-hairline bg-surface-dark text-on-dark` |
| `src/components/app-shell.tsx` | `text-slate-500` | `text-on-dark-soft` inside the dark header |
| `src/components/app-shell.tsx` | logout button `rounded-md border border-slate-200 text-slate-600` | `rounded-full border border-hairline bg-surface-dark-elevated text-on-dark` |
| `src/components/scope-selector.tsx` | `border border-slate-200 bg-white p-1 shadow-sm` | `border border-hairline bg-canvas p-1` |
| `src/components/scope-selector.tsx` | selected `bg-slate-900 text-white` | `bg-primary text-on-primary` |
| `src/components/scope-selector.tsx` | inactive `text-slate-600 hover:bg-slate-100 hover:text-slate-950` | `text-muted active:bg-surface-card active:text-ink` |
| `src/components/empty-state.tsx` | `border-slate-300 bg-slate-50 text-slate-500` | `border-hairline bg-surface-soft text-muted` |

Also update `src/components/app-shell.tsx` to import and use `BrandMark`:

```tsx
import { BrandMark } from "@/components/ui/brand-mark";
```

Set the logout button accessible name:

```tsx
aria-label="Log out"
title="Log out"
```

- [ ] **Step 4: Run shell verification**

Run:

```powershell
npm run test -- src/components/design-class-contract.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/components/design-class-contract.test.ts src/components/app-shell.tsx src/components/scope-selector.tsx src/components/empty-state.tsx
git commit -m "style: restyle shell with warm surfaces"
```

---

### Task 4: Dashboard Widgets

**Files:**
- Modify: `src/components/design-class-contract.test.ts`
- Modify: `src/components/dashboard/kpi-grid.tsx`
- Modify: `src/components/dashboard/charts.tsx`
- Modify: `src/components/dashboard/lists.tsx`
- Modify: `src/components/dashboard/dashboard-widgets.test.tsx`

- [ ] **Step 1: Expand the design class contract for dashboard files**

Replace the `themedFiles` array in `src/components/design-class-contract.test.ts` with:

```ts
const themedFiles = [
  "src/components/app-shell.tsx",
  "src/components/scope-selector.tsx",
  "src/components/empty-state.tsx",
  "src/components/dashboard/kpi-grid.tsx",
  "src/components/dashboard/charts.tsx",
  "src/components/dashboard/lists.tsx",
];
```

- [ ] **Step 2: Run the dashboard contract to verify it fails**

Run:

```powershell
npm run test -- src/components/design-class-contract.test.ts
```

Expected: FAIL because dashboard files still use old slate, white, and shadow classes.

- [ ] **Step 3: Restyle `KpiGrid`**

Use these exact dashboard KPI changes:

| Target | Replacement |
|---|---|
| Card article class | `rounded-lg border border-hairline bg-surface-card p-6` |
| KPI label class | `text-sm font-medium text-muted` |
| KPI value class | `font-display text-4xl leading-tight text-ink` |
| Icon tile class | `rounded-md border border-hairline bg-canvas p-2 text-primary` |
| Helper text class | `mt-4 flex items-center gap-1 text-sm text-muted` |
| Positive price movement class | `text-error` |
| Negative price movement class | `text-success` |

Keep the data shape and formatting helpers unchanged. Replace garbled visible KPI labels with:

```ts
const cards = [
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
];
```

Set the null ratio label to:

```ts
const ratioText =
  kpis.deltaRatio === null
    ? "지난달 지출 없음"
    : `${(kpis.deltaRatio * 100).toFixed(1)}%`;
```

- [ ] **Step 4: Restyle dashboard charts**

In `src/components/dashboard/charts.tsx`, import shared chart tokens:

```tsx
import {
  CHART_BAR_RADIUS,
  CHART_COLORS,
  CHART_GRID_COLOR,
  CHART_TEXT_COLOR,
} from "@/components/ui/chart-theme";
import { Panel } from "@/components/ui/panel";
```

Replace the local `COLORS` constant with `CHART_COLORS`.

Replace `ChartShell` with:

```tsx
function ChartShell({ title, children }: ChartShellProps) {
  return (
    <Panel title={title}>
      <div className="h-72">{children}</div>
    </Panel>
  );
}
```

Set chart colors:

```tsx
<CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
<XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: CHART_TEXT_COLOR }} />
<YAxis
  tickFormatter={(value) => `${Number(value) / 10000}만`}
  width={48}
  tickLine={false}
  axisLine={false}
  tick={{ fill: CHART_TEXT_COLOR }}
/>
<Bar dataKey="totalAmount" fill={CHART_COLORS[0]} radius={CHART_BAR_RADIUS} />
```

Use `CHART_COLORS[index % CHART_COLORS.length]` for pie cells and legend dots.

Replace garbled chart titles and empty states with:

```tsx
<ChartShell title="월간 지출 추이">
  <EmptyState message="월간 지출 데이터가 없습니다." />
</ChartShell>
```

```tsx
<ChartShell title="카테고리별 지출">
  <EmptyState message="카테고리 지출 데이터가 없습니다." />
</ChartShell>
```

- [ ] **Step 5: Restyle dashboard lists**

In `src/components/dashboard/lists.tsx`, import `Panel`:

```tsx
import { Panel } from "@/components/ui/panel";
```

Replace the local `Section` implementation with:

```tsx
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return <Panel title={title}>{children}</Panel>;
}
```

Apply these table/list class replacements:

| Existing class fragment | Replacement |
|---|---|
| `border-b border-slate-200 text-xs uppercase text-slate-500` | `border-b border-hairline text-xs uppercase text-muted` |
| `divide-y divide-slate-100` | `divide-y divide-hairline-soft` |
| `text-slate-600` | `text-body` |
| `text-slate-950` | `text-ink` |
| `text-slate-500` | `text-muted` |
| `font-semibold` on list amounts | `font-medium` |
| `text-red-600` | `text-error` |
| `text-emerald-600` | `text-success` |

Replace garbled dashboard list titles with:

```tsx
"최근 구매 이력"
"교체 임박 품목"
"가격 변동"
```

Replace garbled empty-state messages with:

```tsx
"최근 구매 이력이 없습니다."
"교체 임박 품목이 없습니다."
"가격 변동이 감지된 품목이 없습니다."
```

- [ ] **Step 6: Update dashboard widget tests for clean labels and design classes**

In `src/components/dashboard/dashboard-widgets.test.tsx`, keep the current test structure and update expected Korean strings to match Task 4. Add this assertion after rendering `KpiGrid`:

```tsx
const firstCard = screen.getByText("이번 달 구매액").closest("article");
expect(firstCard).toHaveClass("bg-surface-card", "border-hairline", "rounded-lg");
```

Expected text assertions:

```tsx
expect(screen.getByText("이번 달 구매액")).toBeInTheDocument();
expect(screen.getByText("₩128,900")).toBeInTheDocument();
expect(screen.getByText("지난달 대비 +₩28,900")).toBeInTheDocument();
expect(screen.getByText("8건")).toBeInTheDocument();
expect(screen.getByText("위생용품")).toBeInTheDocument();
expect(screen.getByText("월간 지출 데이터가 없습니다.")).toBeInTheDocument();
expect(screen.getByText("카테고리 지출 데이터가 없습니다.")).toBeInTheDocument();
expect(screen.getByText("최근 구매 이력이 없습니다.")).toBeInTheDocument();
expect(screen.getByText("교체 임박 품목이 없습니다.")).toBeInTheDocument();
expect(screen.getByText("가격 변동이 감지된 품목이 없습니다.")).toBeInTheDocument();
```

- [ ] **Step 7: Run dashboard verification**

Run:

```powershell
npm run test -- src/components/design-class-contract.test.ts src/components/dashboard/dashboard-widgets.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```powershell
git add src/components/design-class-contract.test.ts src/components/dashboard/kpi-grid.tsx src/components/dashboard/charts.tsx src/components/dashboard/lists.tsx src/components/dashboard/dashboard-widgets.test.tsx
git commit -m "style: restyle dashboard widgets"
```

---

### Task 5: Reports Filters, Charts, And Tables

**Files:**
- Modify: `src/components/design-class-contract.test.ts`
- Modify: `src/components/reports/filter-bar.tsx`
- Modify: `src/components/reports/charts.tsx`
- Modify: `src/components/reports/tables.tsx`
- Modify: `src/components/reports/reports-widgets.test.tsx`

- [ ] **Step 1: Expand the design class contract for reports files**

Replace the `themedFiles` array in `src/components/design-class-contract.test.ts` with:

```ts
const themedFiles = [
  "src/components/app-shell.tsx",
  "src/components/scope-selector.tsx",
  "src/components/empty-state.tsx",
  "src/components/dashboard/kpi-grid.tsx",
  "src/components/dashboard/charts.tsx",
  "src/components/dashboard/lists.tsx",
  "src/components/reports/filter-bar.tsx",
  "src/components/reports/charts.tsx",
  "src/components/reports/tables.tsx",
];
```

- [ ] **Step 2: Run the reports contract to verify it fails**

Run:

```powershell
npm run test -- src/components/design-class-contract.test.ts
```

Expected: FAIL because reports files still use old slate, white, and shadow classes.

- [ ] **Step 3: Restyle the reports filter bar**

In `src/components/reports/filter-bar.tsx`, import `buttonClassName` and `Panel`:

```tsx
import { buttonClassName } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
```

Replace the outer filter section:

```tsx
<Panel>
```

Use this header divider class:

```tsx
className="flex flex-col gap-3 border-b border-hairline-soft pb-5 xl:flex-row xl:items-center xl:justify-between"
```

Use `buttonClassName` for reset and export links:

```tsx
className={buttonClassName("secondary")}
```

```tsx
className={buttonClassName("primary")}
```

Use these exact filter control classes:

| Target | Replacement |
|---|---|
| Fieldset legend | `text-sm font-medium text-ink` |
| Empty filter text | `rounded-md border border-dashed border-hairline bg-surface-soft px-3 py-2 text-sm text-muted` |
| Checkbox scroll panel | `max-h-48 space-y-1 overflow-y-auto rounded-md border border-hairline bg-canvas p-2` |
| Checkbox label | `flex items-center gap-2 rounded px-2 py-1.5 text-sm text-body active:bg-surface-card` |
| Checkbox input | `size-4 rounded border-hairline text-primary` |
| Period active | `border-primary bg-primary text-on-primary` |
| Period inactive | `border-hairline text-muted active:bg-surface-card active:text-ink` |
| Date input | `h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15` |
| Apply button | `className={buttonClassName("primary")}` |

Replace garbled filter labels with:

```ts
const periodOptions = [
  { value: "this-month", label: "이번 달" },
  { value: "last-3-months", label: "최근 3개월" },
  { value: "this-year", label: "올해" },
  { value: "custom", label: "사용자 지정" },
] as const;
```

Use these visible labels:

```tsx
"기간 필터"
"시작일"
"종료일"
"카테고리"
"품목"
"매장"
"초기화"
"CSV 내보내기"
"적용"
```

- [ ] **Step 4: Restyle reports charts and tables**

Apply the same chart changes from Task 4 to `src/components/reports/charts.tsx`: use `Panel`, `CHART_COLORS`, `CHART_GRID_COLOR`, `CHART_TEXT_COLOR`, and `CHART_BAR_RADIUS`.

Replace report chart titles and empty states with:

```tsx
"월간/주간 지출 추이"
"지출 추이 데이터가 없습니다."
"카테고리별 지출 비중"
"카테고리별 지출 데이터가 없습니다."
```

In `src/components/reports/tables.tsx`, import `Panel` and replace the local `Section` implementation:

```tsx
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return <Panel title={title}>{children}</Panel>;
}
```

Apply these table classes:

| Existing class fragment | Replacement |
|---|---|
| `border-b border-slate-200 text-xs uppercase text-slate-500` | `border-b border-hairline text-xs uppercase text-muted` |
| `divide-y divide-slate-100` | `divide-y divide-hairline-soft` |
| `text-slate-600` | `text-body` |
| `text-slate-950` | `text-ink` |
| `text-slate-500` | `text-muted` |

Replace report table titles and empty states with:

```tsx
"품목별 누적 지출"
"품목별 지출 데이터가 없습니다."
"매장별 구매액"
"매장별 지출 데이터가 없습니다."
```

- [ ] **Step 5: Update reports widget tests for clean labels and classes**

In `src/components/reports/reports-widgets.test.tsx`, update text expectations to:

```tsx
expect(screen.getByLabelText("사용자 지정")).toBeChecked();
expect(screen.getByLabelText("위생용품")).toBeChecked();
expect(screen.getByLabelText("대형 티슈")).not.toBeChecked();
expect(screen.getByLabelText("쿠팡")).toBeChecked();
expect(screen.getByLabelText("시작일")).toHaveValue("2026-01-01");
expect(screen.getByLabelText("종료일")).toHaveValue("2026-05-30");
expect(screen.getByRole("link", { name: "초기화" })).toHaveClass("border-hairline");
expect(screen.getByRole("link", { name: "CSV 내보내기" })).toHaveClass("bg-primary");
expect(screen.getByText("지출 추이 데이터가 없습니다.")).toBeInTheDocument();
expect(screen.getByText("카테고리별 지출 데이터가 없습니다.")).toBeInTheDocument();
expect(screen.getByText("품목별 누적 지출")).toBeInTheDocument();
expect(screen.getByText("대형 티슈")).toBeInTheDocument();
expect(screen.getByText("₩12,900")).toBeInTheDocument();
expect(screen.getByText("매장별 구매액")).toBeInTheDocument();
expect(screen.getByText("쿠팡")).toBeInTheDocument();
expect(screen.getByText("₩8,000")).toBeInTheDocument();
expect(screen.getByText("품목별 지출 데이터가 없습니다.")).toBeInTheDocument();
expect(screen.getByText("매장별 지출 데이터가 없습니다.")).toBeInTheDocument();
```

Use these clean fixture labels:

```tsx
categories: [{ id: "cat-1", label: "위생용품", secondaryLabel: "" }],
items: [{ id: "item-1", label: "대형 티슈", secondaryLabel: "브랜드" }],
stores: [{ id: "쿠팡", label: "쿠팡", secondaryLabel: "" }],
```

- [ ] **Step 6: Run reports verification**

Run:

```powershell
npm run test -- src/components/design-class-contract.test.ts src/components/reports/reports-widgets.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/components/design-class-contract.test.ts src/components/reports/filter-bar.tsx src/components/reports/charts.tsx src/components/reports/tables.tsx src/components/reports/reports-widgets.test.tsx
git commit -m "style: restyle reports workspace"
```

---

### Task 6: Pages, Login, Loading, Error, And Placeholder States

**Files:**
- Modify: `src/components/design-class-contract.test.ts`
- Modify: `src/components/placeholder-page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/reports/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/loading.tsx`
- Modify: `src/app/error.tsx`

- [ ] **Step 1: Expand the design class contract for page-level UI**

Replace the `themedFiles` array in `src/components/design-class-contract.test.ts` with:

```ts
const themedFiles = [
  "src/components/app-shell.tsx",
  "src/components/scope-selector.tsx",
  "src/components/empty-state.tsx",
  "src/components/dashboard/kpi-grid.tsx",
  "src/components/dashboard/charts.tsx",
  "src/components/dashboard/lists.tsx",
  "src/components/reports/filter-bar.tsx",
  "src/components/reports/charts.tsx",
  "src/components/reports/tables.tsx",
  "src/components/placeholder-page.tsx",
  "src/app/page.tsx",
  "src/app/reports/page.tsx",
  "src/app/login/page.tsx",
  "src/app/loading.tsx",
  "src/app/error.tsx",
];
```

- [ ] **Step 2: Run the page-level contract to verify it fails**

Run:

```powershell
npm run test -- src/components/design-class-contract.test.ts
```

Expected: FAIL because page-level files still use old slate, white, and shadow classes.

- [ ] **Step 3: Restyle dashboard and reports page headers**

In `src/app/page.tsx`, import `PageHeader`:

```tsx
import { PageHeader } from "@/components/ui/page-header";
```

Replace the current dashboard `<header>` block with:

```tsx
<PageHeader
  eyebrow={formatKoreanDate(new Date())}
  title="대시보드"
  description="구매액, 재구매 일정, 가격 변동을 한 화면에서 확인합니다."
  actions={
    <ScopeSelector
      scopes={viewModel.scopes}
      selectedScope={viewModel.selectedScope}
    />
  }
/>
```

Replace dashboard error sections with:

```tsx
<section className="rounded-lg border border-error/30 bg-surface-card p-6 text-sm text-error">
  {loadError ?? "대시보드를 불러오지 못했습니다."}
</section>
```

In `src/app/reports/page.tsx`, import `PageHeader` and replace the current reports `<header>` block with:

```tsx
<PageHeader
  eyebrow={`${formatKoreanDate(viewModel.filters.range.from)} - ${formatKoreanDate(viewModel.filters.range.to)}`}
  title="Reports"
  description={`${viewModel.filters.range.label} 기준 지출 분석`}
/>
```

Replace reports error sections with:

```tsx
<section className="rounded-lg border border-error/30 bg-surface-card p-6 text-sm text-error">
  {loadError ?? "리포트를 불러오지 못했습니다."}
</section>
```

- [ ] **Step 4: Restyle login, loading, error, and placeholders**

In `src/app/login/page.tsx`, import `BrandMark` and `buttonClassName`:

```tsx
import { BrandMark } from "@/components/ui/brand-mark";
import { buttonClassName } from "@/components/ui/button";
```

Apply these exact class replacements:

| Target | Replacement |
|---|---|
| Login main | `flex min-h-screen items-center justify-center bg-canvas px-4 py-10` |
| Login section | `w-full max-w-md rounded-lg border border-hairline bg-surface-card p-8` |
| Brand icon | `rounded-md bg-canvas p-2 text-ink` and render `<BrandMark />` |
| Login title | `font-display text-3xl leading-tight text-ink` |
| Login subtitle | `text-sm text-muted` |
| Error paragraph | `mt-5 rounded-md border border-error/30 bg-canvas px-3 py-2 text-sm text-error` |
| Label | `block text-sm font-medium text-body` |
| Input | `mt-1 h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15` |
| Submit button | `className={buttonClassName("primary", "w-full")}` |
| Demo button | `className={buttonClassName("secondary", "w-full")}` |

Use clean visible login strings:

```ts
const ERROR_MESSAGES: Record<string, string> = {
  "missing-config": "Supabase 환경 변수가 설정되지 않았습니다.",
  "invalid-credentials": "이메일 또는 비밀번호를 확인해 주세요.",
  "demo-disabled": "시연 모드가 비활성화되어 있습니다.",
};
```

```tsx
"소비재 관리 대시보드"
"이메일"
"비밀번호"
"로그인"
"시연 모드로 보기"
```

In `src/components/placeholder-page.tsx`, import `PageHeader` and `Panel`, then use:

```tsx
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
```

In `src/app/loading.tsx`, use:

```tsx
<main className="min-h-screen bg-canvas p-6">
  <div className="mx-auto max-w-7xl space-y-5">
    <div className="h-12 w-64 animate-pulse rounded-lg bg-surface-card" />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="h-32 animate-pulse rounded-lg bg-surface-card"
          key={index}
        />
      ))}
    </div>
    <div className="h-80 animate-pulse rounded-lg bg-surface-card" />
  </div>
</main>
```

In `src/app/error.tsx`, use a warm card and coral retry button:

```tsx
<main className="flex min-h-screen items-center justify-center bg-canvas px-4">
  <section className="w-full max-w-md rounded-lg border border-error/30 bg-surface-card p-6">
    <h1 className="font-display text-3xl text-ink">오류</h1>
    <p className="mt-2 text-sm text-body">{error.message}</p>
    <button
      className="mt-5 h-10 rounded-md bg-primary px-4 text-sm font-medium text-on-primary active:bg-primary-active"
      onClick={() => reset()}
      type="button"
    >
      다시 시도
    </button>
  </section>
</main>
```

- [ ] **Step 5: Run page-level verification**

Run:

```powershell
npm run test -- src/components/design-class-contract.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/components/design-class-contract.test.ts src/components/placeholder-page.tsx src/app/page.tsx src/app/reports/page.tsx src/app/login/page.tsx src/app/loading.tsx src/app/error.tsx
git commit -m "style: restyle page states and login"
```

---

### Task 7: Full Verification And Browser Check

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

Expected: PASS with `tsc --noEmit`.

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

Expected: Next.js reports a local URL, normally `http://localhost:3000`. If port 3000 is occupied, use the port shown by Next.js.

- [ ] **Step 6: Browser visual check**

Use the Browser plugin to open these routes:

```text
http://localhost:3000/login
http://localhost:3000/
http://localhost:3000/reports
```

Expected visual results:

- Login page uses cream canvas, warm card, serif buylog title, radial mark, coral login button, cream demo button.
- App shell uses cream canvas, warm sidebar/navigation, dark user strip, readable mobile layout.
- Dashboard panels are cream cards with hairline borders and serif metric values.
- Reports filters use warm inputs, coral active/primary states, and no cool slate/white card styling.
- Charts use coral, teal, amber, dark, muted, and success colors from `src/components/ui/chart-theme.ts`.
- No visible text overlaps at desktop width around 1440px and mobile width around 390px.

- [ ] **Step 7: Route verification defects back to the owning task**

If verification reveals a concrete visual or build defect, return to the task that owns the failing file and repeat that task's test, fix, and commit steps. If no defects are found, do not create an empty commit.

## Self-Review

Spec coverage:

- Cream canvas, surface-card, coral, dark navy, hairline, warm ink, muted text: Task 1.
- Serif display and sans body typography through `next/font`: Task 1.
- Buttons, panels, page headers, brand mark, chart palette: Task 2.
- Shell navigation, scope tabs, empty states: Task 3.
- Dashboard KPI, charts, tables, replacement/price lists: Task 4.
- Reports filters, charts, export/reset actions, tables: Task 5.
- Login, loading, error, placeholder, page headers: Task 6.
- Lint, typecheck, tests, build, browser visual check: Task 7.

Placeholder scan:

- No placeholder markers are present.
- No unspecified implementation steps are present.
- Every created file has concrete code.
- Every modified area has exact file paths, class mappings, labels, commands, and expected results.

Type consistency:

- `buttonClassName`, `Button`, `ButtonLink`, `Panel`, `PageHeader`, `BrandMark`, and chart constants are defined before later tasks import them.
- `ButtonVariant` values used later are exactly `primary`, `secondary`, `ghost`, `dark`, and `icon`.
- `Panel` tones used later are exactly `card`, `canvas`, `dark`, and `coral`.

Plan complete and saved to `docs/superpowers/plans/2026-05-31-design-md-refresh.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
