import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/ui";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "dark" | "icon";

const base =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition disabled:pointer-events-none disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary px-4 text-on-primary active:bg-primary-active",
  secondary:
    "border border-hairline bg-canvas px-4 text-ink active:bg-surface-card",
  ghost: "px-3 text-muted active:bg-surface-card active:text-ink",
  dark: "bg-surface-dark-elevated px-4 text-on-dark active:bg-surface-dark-soft",
  icon: "size-9 rounded-full border border-hairline bg-canvas p-0 text-ink active:bg-surface-card",
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  className?: string,
) {
  return cn(base, variants[variant], className);
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName(variant, className)}
      type={type}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentPropsWithoutRef<"a"> & {
  variant?: ButtonVariant;
};

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ButtonLinkProps) {
  return <a className={buttonClassName(variant, className)} {...props} />;
}
