import type { ReactNode } from "react";

import { cn } from "@/lib/ui";

export const tableClassName = "min-w-full text-left text-sm";
export const tableHeadClassName =
  "border-b border-hairline text-xs uppercase text-muted";
export const tableBodyClassName = "divide-y divide-hairline-soft";
export const tableHeaderCellClassName = "py-2 pr-4 font-medium";
export const tableCellClassName = "py-3 pr-4 text-body";
export const tableNumberCellClassName =
  "py-3 pr-4 text-right font-medium text-ink";

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
