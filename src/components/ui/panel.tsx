import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/ui";

type PanelTone = "card" | "canvas" | "dark" | "coral";

type PanelProps = HTMLAttributes<HTMLElement> & {
  title?: ReactNode;
  description?: ReactNode;
  tone?: PanelTone;
};

const toneClasses: Record<PanelTone, string> = {
  card: "border border-hairline bg-surface-card text-ink",
  canvas: "border border-hairline bg-canvas text-ink",
  dark: "bg-surface-dark text-on-dark",
  coral: "bg-primary text-on-primary",
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
  title,
  description,
  tone = "card",
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <section
      aria-label={typeof title === "string" ? title : undefined}
      className={cn("rounded-lg p-6", toneClasses[tone], className)}
      {...props}
    >
      {title || description ? (
        <header className="mb-5 space-y-1">
          {title ? (
            <h2 className={cn("text-lg font-medium", titleClass(tone))}>
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className={cn("text-sm", descriptionClass(tone))}>
              {description}
            </p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
