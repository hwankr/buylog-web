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
