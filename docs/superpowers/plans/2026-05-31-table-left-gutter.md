# Table Left Gutter Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reports의 `물품별 누적 지출` 테이블과 Items의 `물품 목록` 테이블 첫 열이 왼쪽 테두리에 붙어 보이는 문제를 공통 테이블 primitive에서 고친다.

**Architecture:** `reports`와 `items`는 모두 `src/components/ui/data-table.tsx`의 `TableShell`과 table class constants를 사용한다. 화면별 임시 padding을 넣지 않고 `TableShell` 내부 스크롤 영역에 안정적인 좌우 gutter를 부여해 dashboard, item detail 등 같은 테이블 primitive를 쓰는 영역도 일관되게 개선한다.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.4, Tailwind CSS v4 utilities, Vitest, React Testing Library.

---

## Confirmed Diagnosis

- Visual evidence:
  - `artifacts/smoke-reports-fresh.png`: `물품별 누적 지출` 첫 번째 header/body cell이 흰색 table shell 왼쪽 경계에 붙어 있다.
  - `artifacts/smoke-items-fresh.png`: `물품 목록` 첫 번째 header/body cell이 table shell 왼쪽 경계에 붙고 일부 텍스트가 답답하게 보인다.
- Code cause:
  - `src/components/ui/data-table.tsx` currently renders `TableShell` with `<div className="overflow-x-auto">{children}</div>`, so the table starts at x=0 inside the bordered shell.
  - `tableHeaderCellClassName`, `tableCellClassName`, and `tableNumberCellClassName` use `pr-4` but no left-side table edge gutter.
- Next.js local guide checked:
  - `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md` recommends Tailwind utilities for common styling needs and keeping global styles truly global. This fix should stay in the shared component utility, not global CSS.

## File Structure

- Modify: `src/components/ui/data-table.tsx`
  - Owns shared data-table surface, scroll behavior, and spacing contract.
  - Add horizontal padding to the scroll wrapper inside `TableShell`.
- Modify: `src/components/ui/rich-primitives.test.tsx`
  - Lock the shared `TableShell` gutter contract.
- Modify: `src/components/reports/reports-widgets.test.tsx`
  - Assert the user-reported `물품별 누적 지출` region receives the shared gutter.
- Modify: `src/components/items/items-widgets.test.tsx`
  - Assert the user-reported `물품 목록` region receives the shared gutter.
- Do not modify: `src/components/reports/tables.tsx`
  - It already uses `TableShell`; page-specific padding would duplicate the shared fix.
- Do not modify: `src/components/items/table.tsx`
  - It already uses `TableShell`; page-specific padding would duplicate the shared fix.

---

### Task 1: Lock The Table Gutter Contract

**Files:**
- Modify: `src/components/ui/rich-primitives.test.tsx`
- Modify: `src/components/reports/reports-widgets.test.tsx`
- Modify: `src/components/items/items-widgets.test.tsx`

- [ ] **Step 1: Add the shared primitive assertion**

In `src/components/ui/rich-primitives.test.tsx`, inside `it("renders status pills and table shell classes", ...)`, replace the existing region assertion:

```tsx
    expect(
      screen.getByRole("region", { name: "Recent purchases" }),
    ).toHaveClass("rounded-lg", "border-hairline");
```

with:

```tsx
    const tableRegion = screen.getByRole("region", {
      name: "Recent purchases",
    });
    expect(tableRegion).toHaveClass("rounded-lg", "border-hairline");
    expect(tableRegion.firstElementChild).toHaveClass("overflow-x-auto", "px-4");
```

- [ ] **Step 2: Add the Reports regression assertion**

In `src/components/reports/reports-widgets.test.tsx`, inside `it("renders item and store spending tables with formatted amounts", ...)`, after this assertion:

```tsx
    expect(screen.getByText("₩12,900")).toBeInTheDocument();
```

add:

```tsx
    expect(
      screen.getByRole("region", { name: "물품별 누적 지출" }).firstElementChild,
    ).toHaveClass("overflow-x-auto", "px-4");
```

- [ ] **Step 3: Add the Items regression assertion**

In `src/components/items/items-widgets.test.tsx`, inside `it("renders item table rows with detail links", ...)`, after this assertion:

```tsx
    expect(screen.getByText("₩22,000")).toBeInTheDocument();
```

add:

```tsx
    expect(
      screen.getByRole("region", { name: "물품 목록" }).firstElementChild,
    ).toHaveClass("overflow-x-auto", "px-4");
```

- [ ] **Step 4: Run the targeted tests and verify the failure**

Run:

```powershell
npm test -- src/components/ui/rich-primitives.test.tsx src/components/reports/reports-widgets.test.tsx src/components/items/items-widgets.test.tsx
```

Expected: FAIL. The new assertions fail because `TableShell` currently renders the scroll wrapper with `overflow-x-auto` but without `px-4`.

---

### Task 2: Add The Shared Table Gutter

**Files:**
- Modify: `src/components/ui/data-table.tsx`

- [ ] **Step 1: Update the `TableShell` scroll wrapper**

In `src/components/ui/data-table.tsx`, replace:

```tsx
      <div className="overflow-x-auto">{children}</div>
```

with:

```tsx
      <div className="overflow-x-auto px-4">{children}</div>
```

The complete `TableShell` after the change should be:

```tsx
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
      className={cn(
        "overflow-hidden rounded-lg border border-hairline bg-canvas",
        className,
      )}
      role="region"
    >
      <div className="overflow-x-auto px-4">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Run the targeted tests**

Run:

```powershell
npm test -- src/components/ui/rich-primitives.test.tsx src/components/reports/reports-widgets.test.tsx src/components/items/items-widgets.test.tsx
```

Expected: PASS for all three test files.

- [ ] **Step 3: Run the broader validation gate**

Run:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Expected:
- `npm run lint`: exits 0.
- `npm run typecheck`: exits 0.
- `npm test`: exits 0.
- `npm run build`: exits 0.

If `npm run typecheck` reports stale `.next/types`, run:

```powershell
npm run build
npm run typecheck
```

Expected: both commands exit 0 after `.next/types` refreshes.

---

### Task 3: Browser Smoke The Affected Screens

**Files:**
- Verify only: `src/components/ui/data-table.tsx`
- Verify only: `src/components/reports/tables.tsx`
- Verify only: `src/components/items/table.tsx`

- [ ] **Step 1: Start the local app**

Run:

```powershell
npm run dev
```

Expected: Next.js dev server starts and prints a local URL, normally `http://localhost:3000`.

- [ ] **Step 2: Check Reports visually**

Open:

```text
http://localhost:3000/reports
```

Expected:
- The `물품별 누적 지출` table header `물품` is inset from the white table shell's left border.
- The first body item name and brand are inset by the same gutter.
- Horizontal scrolling still works if the viewport is narrow.
- The `매장별 구매액` table receives the same gutter because it uses `TableShell`.

- [ ] **Step 3: Check Items visually**

Open:

```text
http://localhost:3000/items
```

Expected:
- The `물품 목록` table header `물품` is inset from the white table shell's left border.
- The first body item link and brand are inset by the same gutter.
- The table remains readable on desktop and scrollable on mobile widths.

## Self-Review

- Spec coverage: The plan directly covers both user-reported regions, `물품별 누적 지출` on Reports and `물품 목록` on Items.
- Scope: One shared component change fixes every current `TableShell` consumer without page-level duplication.
- Test coverage: Primitive contract test plus Reports and Items regression assertions catch the exact spacing issue.
- Visual coverage: Browser smoke checks both affected routes and verifies horizontal scrolling still works.
- Red-flag scan: No incomplete implementation steps remain.
- Type consistency: `TableShell` props and imports stay unchanged; only the inner wrapper class list changes.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-31-table-left-gutter.md`. Two execution options:

**1. Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
