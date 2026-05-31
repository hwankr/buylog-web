# Auto-Apply Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Reports and Items filters apply as soon as the user changes a control, removing the visible `적용` button from those filter panels.

**Architecture:** Keep the current Next.js 16 App Router data boundary: pages read `searchParams`, server services load Supabase-backed view models, and filter panels encode state into URL query params. Add one small client wrapper around Next's `next/form` string-action form that calls `requestSubmit()` on filter changes, with debounced search input only for text search.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2, TypeScript, `next/form`, Vitest, Testing Library.

---

## Context And Constraints

- `AGENTS.md` says this Next.js version may have breaking changes and requires reading local docs before coding.
- Read these local docs before implementing:
  - `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`: `searchParams` is a Promise in page props, and page data filtering should use the `searchParams` prop.
  - `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`: updating search params with navigation causes the page to receive updated `searchParams`; `useSearchParams` is client-only and can require Suspense in prerendered trees.
  - `node_modules/next/dist/docs/01-app/03-api-reference/02-components/form.md`: `next/form` with a string `action` submits form data as GET search params and performs client-side navigation. Do not pass `method`.
- Scope from current repo search:
  - `src/components/reports/filter-bar.tsx` has a visible `적용` submit button.
  - `src/components/items/filter-bar.tsx` has a visible `적용` submit button.
  - No other current page has a comparable filter form with an apply button.
- Do not change Supabase RPCs, service/query modules, or URL parameter names.
- Search inputs should debounce before submission; checkbox, radio, select, and date controls should apply immediately.
- Reset links and CSV export links stay as links.

## File Structure

- Create: `src/components/ui/auto-submit-form.tsx`
  - A focused client component wrapping `next/form`.
  - Owns auto-submit behavior and debounce timing.
  - Keeps URL query navigation centralized for any future filter form.
- Create: `src/components/ui/auto-submit-form.test.tsx`
  - Unit tests for debounce, immediate submit, and canceling pending debounce.
- Modify: `src/components/reports/filter-bar.tsx`
  - Replace native `<form method="get">` with `<AutoSubmitForm>`.
  - Remove the visible `적용` button.
- Modify: `src/components/reports/reports-widgets.test.tsx`
  - Assert Reports no longer renders the visible apply button.
- Modify: `src/components/items/filter-bar.tsx`
  - Replace native `<form method="get">` with `<AutoSubmitForm>`.
  - Remove the visible `적용` button.
- Modify: `src/components/items/items-widgets.test.tsx`
  - Assert Items no longer renders the visible apply button.

## URL Behavior

- Reports keeps using:
  - `/reports?period=this-month&scope=personal`
  - `/reports?period=custom&from=2026-01-01&to=2026-05-31&scope=group%3Agroup-1&category=cat-1&item=item-1&store=%EC%BF%A0%ED%8C%A1`
- Items keeps using:
  - `/items?q=휴지&sort=total_spent&dir=desc&category=cat-1&group=personal`
  - `/items?category=cat-1&category=cat-2&group=group%3Agroup-1`
- Current parsing remains in:
  - `src/lib/reporting/reports.ts`
  - `src/lib/items/items.ts`

---

### Task 1: Shared Auto-Submit Form

**Files:**
- Create: `src/components/ui/auto-submit-form.tsx`
- Create: `src/components/ui/auto-submit-form.test.tsx`

- [ ] **Step 1: Write the failing unit test**

Create `src/components/ui/auto-submit-form.test.tsx` with this exact content:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AutoSubmitForm } from "@/components/ui/auto-submit-form";

vi.mock("next/form", () => ({
  default: ({ action, children, ...props }: ComponentProps<"form">) => (
    <form action={typeof action === "string" ? action : undefined} {...props}>
      {children}
    </form>
  ),
}));

function mockRequestSubmit() {
  return vi
    .spyOn(HTMLFormElement.prototype, "requestSubmit")
    .mockImplementation(function requestSubmitMock(this: HTMLFormElement) {
      this.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("AutoSubmitForm", () => {
  it("debounces search input before submitting", () => {
    vi.useFakeTimers();
    const requestSubmit = mockRequestSubmit();

    render(
      <AutoSubmitForm action="/items" searchDebounceMs={400}>
        <label>
          검색
          <input name="q" type="search" />
        </label>
      </AutoSubmitForm>,
    );

    fireEvent.input(screen.getByLabelText("검색"), {
      target: { value: "휴" },
    });

    vi.advanceTimersByTime(399);
    expect(requestSubmit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });

  it("submits immediately for select and checkbox changes", () => {
    const requestSubmit = mockRequestSubmit();

    render(
      <AutoSubmitForm action="/items">
        <label>
          정렬
          <select defaultValue="name" name="sort">
            <option value="name">이름</option>
            <option value="total_spent">누적 지출</option>
          </select>
        </label>
        <label>
          카테고리
          <input name="category" type="checkbox" value="cat-1" />
        </label>
      </AutoSubmitForm>,
    );

    fireEvent.change(screen.getByLabelText("정렬"), {
      target: { value: "total_spent" },
    });
    expect(requestSubmit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText("카테고리"));
    expect(requestSubmit).toHaveBeenCalledTimes(2);
  });

  it("cancels a pending search submit when another control submits", () => {
    vi.useFakeTimers();
    const requestSubmit = mockRequestSubmit();

    render(
      <AutoSubmitForm action="/items" searchDebounceMs={400}>
        <label>
          검색
          <input name="q" type="search" />
        </label>
        <label>
          카테고리
          <input name="category" type="checkbox" value="cat-1" />
        </label>
      </AutoSubmitForm>,
    );

    fireEvent.input(screen.getByLabelText("검색"), {
      target: { value: "휴" },
    });
    vi.advanceTimersByTime(200);

    fireEvent.click(screen.getByLabelText("카테고리"));
    expect(requestSubmit).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(400);
    expect(requestSubmit).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
npm test -- src/components/ui/auto-submit-form.test.tsx
```

Expected: `FAIL` because `src/components/ui/auto-submit-form.tsx` does not exist.

- [ ] **Step 3: Implement the shared form wrapper**

Create `src/components/ui/auto-submit-form.tsx` with this exact content:

```tsx
"use client";

import Form from "next/form";
import {
  useCallback,
  useEffect,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";

type AutoSubmitFormProps = {
  action: string;
  children: ReactNode;
  className?: string;
  searchDebounceMs?: number;
};

function isSubmittableControl(
  target: EventTarget,
): target is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  );
}

function isSearchInput(target: EventTarget): target is HTMLInputElement {
  return target instanceof HTMLInputElement && target.type === "search";
}

export function AutoSubmitForm({
  action,
  children,
  className,
  searchDebounceMs = 450,
}: AutoSubmitFormProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingSubmit = useCallback(() => {
    if (!timeoutRef.current) return;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const submitForm = useCallback(
    (form: HTMLFormElement, delayMs = 0) => {
      clearPendingSubmit();

      if (delayMs > 0) {
        timeoutRef.current = setTimeout(() => {
          form.requestSubmit();
          timeoutRef.current = null;
        }, delayMs);
        return;
      }

      form.requestSubmit();
    },
    [clearPendingSubmit],
  );

  const handleInput = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      if (!isSearchInput(event.target)) return;

      submitForm(event.currentTarget, searchDebounceMs);
    },
    [searchDebounceMs, submitForm],
  );

  const handleChange = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      if (!isSubmittableControl(event.target) || isSearchInput(event.target)) {
        return;
      }

      submitForm(event.currentTarget);
    },
    [submitForm],
  );

  useEffect(() => clearPendingSubmit, [clearPendingSubmit]);

  return (
    <Form
      action={action}
      className={className}
      onChange={handleChange}
      onInput={handleInput}
    >
      {children}
    </Form>
  );
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```powershell
npm test -- src/components/ui/auto-submit-form.test.tsx
```

Expected: `PASS src/components/ui/auto-submit-form.test.tsx`.

- [ ] **Step 5: Commit the shared component**

Run:

```powershell
git add src/components/ui/auto-submit-form.tsx src/components/ui/auto-submit-form.test.tsx
git commit -m "feat: add auto-submit filter form"
```

Expected: commit succeeds with only the two files staged.

---

### Task 2: Reports Filter Auto-Apply

**Files:**
- Modify: `src/components/reports/filter-bar.tsx`
- Modify: `src/components/reports/reports-widgets.test.tsx`

- [ ] **Step 1: Write the failing Reports widget assertion**

In `src/components/reports/reports-widgets.test.tsx`, inside the first test after the CSV export link assertions, add these assertions:

```tsx
    expect(screen.queryByRole("button", { name: "적용" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("사용자 지정").closest("form")).toHaveAttribute(
      "action",
      "/reports",
    );
```

Run:

```powershell
npm test -- src/components/reports/reports-widgets.test.tsx
```

Expected: `FAIL` because the current Reports filter still renders a visible `적용` button.

- [ ] **Step 2: Update Reports filter form markup**

Replace `src/components/reports/filter-bar.tsx` with this exact content:

```tsx
import { Download, RotateCcw } from "lucide-react";

import { ScopeSelector } from "@/components/scope-selector";
import { AutoSubmitForm } from "@/components/ui/auto-submit-form";
import { buttonClassName } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";
import {
  buildReportHref,
  type ReportFilterOption,
  type ReportFilterOptions,
  type ReportFilters,
} from "@/lib/reporting/reports";
import { serializeScope, type BuylogScope } from "@/lib/scope";

type ReportsFilterBarProps = {
  scopes: BuylogScope[];
  selectedScope: BuylogScope;
  filters: ReportFilters;
  filterOptions: ReportFilterOptions;
};

const periodOptions = [
  { value: "this-month", label: "이번 달" },
  { value: "last-3-months", label: "최근 3개월" },
  { value: "this-year", label: "올해" },
  { value: "custom", label: "사용자 지정" },
] as const;

function CheckboxGroup({
  title,
  name,
  options,
  selectedValues,
  emptyText,
}: {
  title: string;
  name: "category" | "item" | "store";
  options: ReportFilterOption[];
  selectedValues: string[];
  emptyText: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-ink">{title}</legend>
      {options.length === 0 ? (
        <p className="rounded-md border border-dashed border-hairline bg-surface-soft px-3 py-2 text-sm text-muted">
          {emptyText}
        </p>
      ) : (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-hairline bg-canvas p-2">
          {options.map((option) => {
            const label = [option.label, option.secondaryLabel]
              .filter(Boolean)
              .join(" ");
            return (
              <label
                className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-body active:bg-surface-card"
                key={option.id}
              >
                <input
                  className="size-4 rounded border-hairline text-primary"
                  defaultChecked={selectedValues.includes(option.id)}
                  name={name}
                  type="checkbox"
                  value={option.id}
                />
                <span className="min-w-0 truncate">{label}</span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

function resetHref(selectedScope: BuylogScope) {
  const params = new URLSearchParams();
  params.set("scope", serializeScope(selectedScope));
  return `/reports?${params.toString()}`;
}

export function ReportsFilterBar({
  scopes,
  selectedScope,
  filters,
  filterOptions,
}: ReportsFilterBarProps) {
  const clearedFilters = {
    ...filters,
    categories: [],
    items: [],
    stores: [],
  };
  const selectedFilterCounts = [
    { label: "카테고리", count: filters.categories.length },
    { label: "물품", count: filters.items.length },
    { label: "매장", count: filters.stores.length },
  ].filter((item) => item.count > 0);

  return (
    <Panel accent="teal">
      <div className="flex flex-col gap-3 border-b border-hairline-soft pb-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <ScopeSelector
            hrefForScope={(scope) =>
              buildReportHref("/reports", clearedFilters, scope)
            }
            scopes={scopes}
            selectedScope={selectedScope}
          />
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
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            className={buttonClassName("secondary")}
            href={resetHref(selectedScope)}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            초기화
          </a>
          <a
            className={buttonClassName("primary")}
            href={buildReportHref("/api/reports/export", filters, selectedScope)}
          >
            <Download className="size-4" aria-hidden="true" />
            CSV 내보내기
          </a>
        </div>
      </div>

      <AutoSubmitForm action="/reports" className="mt-4 space-y-4">
        <input name="scope" type="hidden" value={serializeScope(selectedScope)} />

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-ink">기간 필터</legend>
          <div className="flex flex-wrap gap-2">
            {periodOptions.map((option) => (
              <label
                className={[
                  "inline-flex h-9 cursor-pointer items-center rounded-md border px-3 text-sm font-medium transition",
                  filters.period === option.value
                    ? "border-primary bg-primary text-on-primary"
                    : "border-hairline text-muted active:bg-surface-card active:text-ink",
                ].join(" ")}
                key={option.value}
              >
                <input
                  className="sr-only"
                  defaultChecked={filters.period === option.value}
                  name="period"
                  type="radio"
                  value={option.value}
                />
                {option.label}
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-body">
              <span>시작일</span>
              <input
                className="h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                defaultValue={filters.range.from}
                name="from"
                type="date"
              />
            </label>
            <label className="space-y-1 text-sm font-medium text-body">
              <span>종료일</span>
              <input
                className="h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                defaultValue={filters.range.to}
                name="to"
                type="date"
              />
            </label>
          </div>
        </fieldset>

        <div className="grid gap-4 lg:grid-cols-3">
          <CheckboxGroup
            emptyText="선택 가능한 카테고리가 없습니다."
            name="category"
            options={filterOptions.categories}
            selectedValues={filters.categories}
            title="카테고리"
          />
          <CheckboxGroup
            emptyText="선택 가능한 물품이 없습니다."
            name="item"
            options={filterOptions.items}
            selectedValues={filters.items}
            title="물품"
          />
          <CheckboxGroup
            emptyText="선택 가능한 매장이 없습니다."
            name="store"
            options={filterOptions.stores}
            selectedValues={filters.stores}
            title="매장"
          />
        </div>
      </AutoSubmitForm>
    </Panel>
  );
}
```

- [ ] **Step 3: Run Reports widget tests**

Run:

```powershell
npm test -- src/components/reports/reports-widgets.test.tsx
```

Expected: `PASS src/components/reports/reports-widgets.test.tsx`.

- [ ] **Step 4: Commit Reports auto-apply**

Run:

```powershell
git add src/components/reports/filter-bar.tsx src/components/reports/reports-widgets.test.tsx
git commit -m "feat: auto-apply report filters"
```

Expected: commit succeeds with only Reports files staged.

---

### Task 3: Items Filter Auto-Apply

**Files:**
- Modify: `src/components/items/filter-bar.tsx`
- Modify: `src/components/items/items-widgets.test.tsx`

- [ ] **Step 1: Write the failing Items widget assertion**

In `src/components/items/items-widgets.test.tsx`, inside the first test after the reset link assertion, add these assertions:

```tsx
    expect(screen.queryByRole("button", { name: "적용" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("검색").closest("form")).toHaveAttribute(
      "action",
      "/items",
    );
```

Run:

```powershell
npm test -- src/components/items/items-widgets.test.tsx
```

Expected: `FAIL` because the current Items filter still renders a visible `적용` button.

- [ ] **Step 2: Update Items filter form markup**

Replace `src/components/items/filter-bar.tsx` with this exact content:

```tsx
import { RotateCcw, Search } from "lucide-react";
import Link from "next/link";

import { AutoSubmitForm } from "@/components/ui/auto-submit-form";
import { buttonClassName } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";
import type {
  ItemFilterOption,
  ItemFilterOptions,
  ItemListParams,
} from "@/lib/items/items";

type ItemsFilterBarProps = {
  filterOptions: ItemFilterOptions;
  params: ItemListParams;
};

const sortOptions = [
  { value: "name", label: "이름" },
  { value: "category", label: "카테고리" },
  { value: "group", label: "그룹" },
  { value: "last_purchase", label: "최근 구매일" },
  { value: "purchase_count", label: "구매 횟수" },
  { value: "total_spent", label: "누적 지출" },
  { value: "next_repurchase", label: "재구매 예상" },
] as const;

function CheckboxGroup({
  title,
  name,
  options,
  selectedValues,
  emptyText,
}: {
  title: string;
  name: "category" | "group";
  options: ItemFilterOption[];
  selectedValues: string[];
  emptyText: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-ink">{title}</legend>
      {options.length === 0 ? (
        <p className="rounded-md border border-dashed border-hairline bg-surface-soft px-3 py-2 text-sm text-muted">
          {emptyText}
        </p>
      ) : (
        <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-hairline bg-canvas p-2">
          {options.map((option) => {
            const label = [option.label, option.secondaryLabel]
              .filter(Boolean)
              .join(" ");
            return (
              <label
                className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-body active:bg-surface-card"
                key={option.id}
              >
                <input
                  className="size-4 rounded border-hairline text-primary"
                  defaultChecked={selectedValues.includes(option.id)}
                  name={name}
                  type="checkbox"
                  value={option.id}
                />
                <span className="min-w-0 truncate">{label}</span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

export function ItemsFilterBar({ filterOptions, params }: ItemsFilterBarProps) {
  const selectedFilterCounts = [
    { label: "카테고리", count: params.categories.length },
    { label: "그룹", count: params.groups.length },
  ].filter((item) => item.count > 0);

  return (
    <Panel accent="amber">
      <AutoSubmitForm action="/items" className="space-y-4">
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

        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_140px_auto] lg:items-end">
          <label className="space-y-1 text-sm font-medium text-body">
            <span>검색</span>
            <span className="relative block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              />
              <input
                className="h-10 w-full rounded-md border border-hairline bg-canvas pl-9 pr-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                defaultValue={params.search}
                name="q"
                type="search"
              />
            </span>
          </label>

          <label className="space-y-1 text-sm font-medium text-body">
            <span>정렬</span>
            <select
              className="h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              defaultValue={params.sort}
              name="sort"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm font-medium text-body">
            <span>방향</span>
            <select
              className="h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              defaultValue={params.direction}
              name="dir"
            >
              <option value="asc">오름차순</option>
              <option value="desc">내림차순</option>
            </select>
          </label>

          <div className="flex gap-2">
            <Link className={buttonClassName("secondary")} href="/items">
              <RotateCcw aria-hidden="true" className="size-4" />
              초기화
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <CheckboxGroup
            emptyText="선택 가능한 카테고리가 없습니다."
            name="category"
            options={filterOptions.categories}
            selectedValues={params.categories}
            title="카테고리"
          />
          <CheckboxGroup
            emptyText="선택 가능한 그룹이 없습니다."
            name="group"
            options={filterOptions.groups}
            selectedValues={params.groups}
            title="그룹"
          />
        </div>
      </AutoSubmitForm>
    </Panel>
  );
}
```

- [ ] **Step 3: Run Items widget tests**

Run:

```powershell
npm test -- src/components/items/items-widgets.test.tsx
```

Expected: `PASS src/components/items/items-widgets.test.tsx`.

- [ ] **Step 4: Commit Items auto-apply**

Run:

```powershell
git add src/components/items/filter-bar.tsx src/components/items/items-widgets.test.tsx
git commit -m "feat: auto-apply item filters"
```

Expected: commit succeeds with only Items files staged.

---

### Task 4: Full Verification And Browser Smoke

**Files:**
- Verify changed files only plus app-wide checks.

- [ ] **Step 1: Run focused component tests together**

Run:

```powershell
npm test -- src/components/ui/auto-submit-form.test.tsx src/components/reports/reports-widgets.test.tsx src/components/items/items-widgets.test.tsx
```

Expected: all three test files pass.

- [ ] **Step 2: Run the full test suite**

Run:

```powershell
npm test
```

Expected: all Vitest suites pass.

- [ ] **Step 3: Run lint**

Run:

```powershell
npm run lint
```

Expected: ESLint exits with code `0`.

- [ ] **Step 4: Run TypeScript**

Run:

```powershell
npm run typecheck
```

Expected: TypeScript exits with code `0`.

- [ ] **Step 5: Run production build**

Run:

```powershell
npm run build
```

Expected: Next.js build completes successfully.

- [ ] **Step 6: Browser smoke test Reports**

Run:

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000/reports`.

Verify:

- The Reports filter panel has no visible `적용` button.
- Clicking `최근 3개월` changes the URL to include `period=last-3-months`.
- Clicking a category, item, or store checkbox updates the URL immediately with the matching repeated query key.
- Changing `시작일` or `종료일` updates the URL immediately.
- `초기화` keeps only the current `scope` query parameter.
- `CSV 내보내기` still points to `/api/reports/export` with the active filter query.

Expected: each interaction triggers navigation without pressing an apply button, and the Reports charts/tables refresh from the new URL state.

- [ ] **Step 7: Browser smoke test Items**

With the same dev server open, visit `http://127.0.0.1:3000/items`.

Verify:

- The Items filter panel has no visible `적용` button.
- Selecting `누적 지출` changes the URL with `sort=total_spent`.
- Selecting `내림차순` changes the URL with `dir=desc`.
- Clicking category or group checkboxes updates the URL immediately with repeated `category` or `group` keys.
- Typing in `검색` does not navigate on every keystroke; after a short pause it updates the URL with `q=휴지` when the typed value is `휴지`.
- `초기화` still navigates to `/items`.

Expected: each non-search filter applies immediately, search applies after the debounce, and the Items table refreshes from the new URL state.

- [ ] **Step 8: Commit verification note only if code changed during fixes**

If verification required code changes, commit those changes:

```powershell
git status --short
git add src/components/ui/auto-submit-form.tsx src/components/ui/auto-submit-form.test.tsx src/components/reports/filter-bar.tsx src/components/reports/reports-widgets.test.tsx src/components/items/filter-bar.tsx src/components/items/items-widgets.test.tsx
git commit -m "fix: stabilize auto-apply filters"
```

Expected: no unrelated dirty files are staged.

---

## Self-Review

- Spec coverage: Reports and Items both remove the visible apply button and apply filter changes immediately. Current repo search shows these are the only filter forms with visible `적용` buttons.
- Architecture coverage: Server pages still load from URL `searchParams`; client behavior is limited to the form wrapper.
- Type consistency: `AutoSubmitForm` accepts only string `action`, matching the two paths `/reports` and `/items`. It does not pass unsupported `method` to `next/form`.
- Test coverage: Unit tests cover debounce and immediate submit behavior. Widget tests cover removal of the visible apply button and unchanged form action paths.
