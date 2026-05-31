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
    <article
      className={cn("relative overflow-hidden rounded-lg p-5", toneClasses[tone])}
    >
      <div
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-1", accentClasses[accent])}
      />
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
        <p className={cn("mt-4 pl-2 text-sm leading-6", mutedClass(tone))}>
          {helper}
        </p>
      ) : null}
    </article>
  );
}
