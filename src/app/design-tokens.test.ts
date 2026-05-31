import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");

describe("design tokens", () => {
  it("defines the warm design.md color system", () => {
    expect(css).toContain("--canvas: #faf9f5;");
    expect(css).toContain("--surface-card: #efe9de;");
    expect(css).toContain("--surface-dark: #181715;");
    expect(css).toContain("--primary: #cc785c;");
    expect(css).toContain("--primary-active: #a9583e;");
    expect(css).toContain("--hairline: #e6dfd8;");
    expect(css).toContain("--ink: #141413;");
  });

  it("exposes Tailwind v4 aliases for the design system", () => {
    expect(css).toContain("--color-canvas: var(--canvas);");
    expect(css).toContain("--color-surface-card: var(--surface-card);");
    expect(css).toContain("--color-primary: var(--primary);");
    expect(css).toContain("--font-display: var(--font-cormorant)");
  });

  it("uses next/font variables for serif display, sans body, and mono code", () => {
    expect(layout).toContain("Cormorant_Garamond");
    expect(layout).toContain("Inter");
    expect(layout).toContain("JetBrains_Mono");
    expect(layout).toContain("--font-cormorant");
    expect(layout).toContain("--font-inter");
    expect(layout).toContain("--font-jetbrains-mono");
  });
});
