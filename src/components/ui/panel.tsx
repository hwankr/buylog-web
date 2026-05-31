import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/ui";

type PanelTone = "card" | "canvas" | "dark" | "coral";
type PanelAccent = "none" | "coral" | "teal" | "amber" | "dark";
type PanelDensity = "default" | "compact" | "spacious";

type PanelProps = HTMLAttributes<HTMLElement> & {
  actions?: ReactNode;
  accent?: PanelAccent;
  title?: ReactNode;
  description?: ReactNode;
  density?: PanelDensity;
  titleAdornment?: ReactNode;
  tone?: PanelTone;
};

const toneClasses: Record<PanelTone, string> = {
  card: "border border-hairline bg-surface-card text-ink",
  canvas: "border border-hairline bg-canvas text-ink",
  dark: "bg-surface-dark text-on-dark",
  coral: "bg-primary text-on-primary",
};

const densityClasses: Record<PanelDensity, string> = {
  compact: "p-4",
  default: "p-5 sm:p-6",
  spacious: "p-6 sm:p-8",
};

const accentClasses: Record<PanelAccent, string> = {
  none: "",
  coral: "bg-primary",
  teal: "bg-accent-teal",
  amber: "bg-accent-amber",
  dark: "bg-surface-dark",
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
  actions,
  accent = "none",
  title,
  description,
  density = "default",
  titleAdornment,
  tone = "card",
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <section
      aria-label={typeof title === "string" ? title : undefined}
      className={cn(
        "relative overflow-hidden rounded-lg",
        toneClasses[tone],
        densityClasses[density],
        className,
      )}
      {...props}
    >
      {accent !== "none" ? (
        <div
          aria-hidden="true"
          className={cn("absolute inset-x-0 top-0 h-1", accentClasses[accent])}
        />
      ) : null}

      {title || description || actions ? (
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            {title ? (
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2
                  className={cn(
                    "text-lg font-medium leading-7",
                    titleClass(tone),
                  )}
                >
                  {title}
                </h2>
                {titleAdornment}
              </div>
            ) : null}
            {description ? (
              <p className={cn("text-sm leading-6", descriptionClass(tone))}>
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
