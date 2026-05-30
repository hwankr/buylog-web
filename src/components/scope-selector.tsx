import Link from "next/link";

import { serializeScope, type BuylogScope } from "@/lib/scope";

type ScopeSelectorProps = {
  scopes: BuylogScope[];
  selectedScope: BuylogScope;
  hrefForScope?: (scope: BuylogScope) => string;
};

function isSelected(scope: BuylogScope, selectedScope: BuylogScope) {
  if (scope.type !== selectedScope.type) return false;
  if (scope.type === "personal" || selectedScope.type === "personal") {
    return scope.type === selectedScope.type;
  }
  return scope.groupId === selectedScope.groupId;
}

function labelFor(scope: BuylogScope) {
  if (scope.type === "personal") return scope.label ?? "내 물품";
  return `${scope.label ?? "그룹"} ${scope.role ?? "member"}`;
}

export function ScopeSelector({
  scopes,
  selectedScope,
  hrefForScope,
}: ScopeSelectorProps) {
  return (
    <nav
      aria-label="데이터 스코프"
      className="inline-flex rounded-md border border-slate-200 bg-white p-1 shadow-sm"
    >
      {scopes.map((scope) => {
        const selected = isSelected(scope, selectedScope);
        return (
          <Link
            aria-current={selected ? "page" : undefined}
            className={[
              "flex h-9 items-center gap-1 rounded px-3 text-sm font-medium transition",
              selected
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            ].join(" ")}
            href={hrefForScope?.(scope) ?? `/?scope=${encodeURIComponent(serializeScope(scope))}`}
            key={serializeScope(scope)}
          >
            {labelFor(scope)}
          </Link>
        );
      })}
    </nav>
  );
}
