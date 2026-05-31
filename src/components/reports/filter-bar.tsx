import { Download, RotateCcw } from "lucide-react";

import { ScopeSelector } from "@/components/scope-selector";
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

      <form action="/reports" className="mt-4 space-y-4" method="get">
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

        <div className="flex justify-end">
          <button className={buttonClassName("primary")} type="submit">
            적용
          </button>
        </div>
      </form>
    </Panel>
  );
}
