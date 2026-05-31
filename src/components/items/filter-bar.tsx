import { RotateCcw, Search } from "lucide-react";

import { buttonClassName } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
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
  return (
    <Panel>
      <form action="/items" className="space-y-4" method="get">
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
            <button className={buttonClassName("primary")} type="submit">
              적용
            </button>
            <a className={buttonClassName("secondary")} href="/items">
              <RotateCcw aria-hidden="true" className="size-4" />
              초기화
            </a>
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
      </form>
    </Panel>
  );
}
