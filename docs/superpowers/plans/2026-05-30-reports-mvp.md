# Reports MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/reports`에서 기간, 스코프, 카테고리, 품목, 매장 필터 기반 지출 리포트와 원천 구매내역 CSV 내보내기를 제공한다.

**Architecture:** Next 16 App Router의 서버 컴포넌트에서 필터를 검증하고 Supabase read-only RPC를 호출한다. 화면은 DTO만 클라이언트 Recharts 컴포넌트로 넘기고, CSV는 별도 dynamic Route Handler로 제공한다.

**Tech Stack:** Next.js 16.2.6, React 19.2.4, Supabase RPC, date-fns/date-fns-tz, Recharts, Vitest/RTL.

---

## Summary

- 현재 기준 `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`가 모두 통과한다.
- 결정값: CSV는 필터 적용 원천 구매내역, 카테고리/품목/매장은 다중 선택, 추이 단위는 기간이 12개월 이하면 월별, 초과하면 연도별 자동 전환.
- 기간 기본값은 KST 기준 `this-month`; `last-3-months`는 현재월 포함 3개 달의 1일부터 오늘까지, `this-year`는 1월 1일부터 오늘까지, `custom`은 유효한 `from/to`가 있을 때만 사용한다.

## Public Interfaces

- `/reports` query params:
  - `period=this-month|last-3-months|this-year|custom`
  - `from=YYYY-MM-DD`, `to=YYYY-MM-DD`
  - `scope=personal|group:<uuid>`
  - repeated `category=<category_uuid>`, `item=<item_uuid>`, `store=<store_name>`
- CSV endpoint: `GET /api/reports/export` with the same query params; unauthenticated requests return `401`, authenticated responses return `text/csv; charset=utf-8` with `Content-Disposition`.
- New SQL migration: `supabase/migrations/20260530133800_complete_reports_mvp_rpcs.sql`
  - Add private scoped/filtered purchase helper using existing `private.current_buylog_user_id()` and `private.is_group_member()`.
  - Add RPCs: `buylog_report_filter_options`, `buylog_report_spending_trend`, `buylog_report_category_share`, `buylog_report_item_spending`, `buylog_report_store_spending`, `buylog_report_purchase_export`.
  - Treat `p.price` as the purchase amount already used by current dashboard RPCs; keep `quantity` as CSV context, not a multiplier.

## Implementation Changes

- Replace `src/app/reports/page.tsx` placeholder with an authenticated server page that awaits `searchParams`, loads scopes, resolves filters, renders filter controls, charts, item/store tables, and a CSV download link.
- Add server-only report modules:
  - `src/lib/reporting/reports.ts`: DTOs, mapper functions, period parsing, trend grain selection, multi-param normalization, category share percentage calculation.
  - `src/lib/queries/reports.ts`: typed Supabase RPC calls and shared `scope_type/scope_id` param serialization.
  - `src/lib/services/reports.ts`: viewer + groups + selected scope + filter options + report data view model.
  - `src/lib/reporting/csv.ts`: RFC-safe CSV escaping with Korean column headers.
- Add UI components under `src/components/reports/`:
  - `filter-bar.tsx`: GET form with period buttons/date inputs, scope selector, checkbox groups, apply/reset controls, CSV link.
  - `charts.tsx`: spending trend and category share charts.
  - `tables.tsx`: item cumulative spending and store spending tables with empty states.
- Extend `src/components/scope-selector.tsx` with optional `hrefForScope`; default behavior remains dashboard `/?scope=...`. Reports should preserve period/date on scope change and clear category/item/store filters because option ids are scope-specific.
- Add `src/app/api/reports/export/route.ts`; use `NextRequest`, `resolveViewer()`, report filter parsing, `loadReportCsvRows()`, and `Response` directly. Export `dynamic = "force-dynamic"`.

## Test Plan

- Mapper/filter tests:
  - `this-month` with anchor `2026-05-30T12:00:00+09:00` resolves `2026-05-01..2026-05-30`.
  - `last-3-months` resolves `2026-03-01..2026-05-30`.
  - custom range over 12 months selects yearly grain; invalid custom dates fall back to `this-month`.
  - repeated filter params are deduped and blanks are dropped.
- Query tests:
  - personal and group scopes call every report RPC with correct `scope_type`, `scope_id`, period dates, arrays, and `trend_grain`.
  - RPC errors include the failing RPC name.
- Component tests:
  - filter bar renders selected period, checked filters, reset link, and CSV href with repeated params.
  - empty trend/category/item/store states render useful Korean messages.
  - item/store tables render formatted KRW values.
  - existing ScopeSelector tests still pass with default href behavior.
- CSV tests:
  - quotes, commas, newlines, Korean text, empty store names, and dates serialize correctly.
- Final verification commands: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

## Assumptions

- Filter option lists are scoped but not period-limited: categories/items come from scoped `product_items`, stores from scoped purchase history.
- Store filter value uses normalized display text: blank or null store becomes `미지정 매장`.
- Scope authorization remains enforced inside SQL and again by resolving joined group scopes in the server service.
