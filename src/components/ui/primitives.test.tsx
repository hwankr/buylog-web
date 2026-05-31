import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrandMark } from "@/components/ui/brand-mark";
import { Button, ButtonLink } from "@/components/ui/button";
import { CHART_COLORS, CHART_GRID_COLOR } from "@/components/ui/chart-theme";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";

describe("design primitives", () => {
  it("renders button variants with design.md classes", () => {
    render(
      <>
        <Button>Apply</Button>
        <ButtonLink href="/reports" variant="secondary">
          Reports
        </ButtonLink>
      </>,
    );

    expect(screen.getByRole("button", { name: "Apply" })).toHaveClass(
      "bg-primary",
      "text-on-primary",
      "rounded-md",
    );
    expect(screen.getByRole("link", { name: "Reports" })).toHaveClass(
      "border-hairline",
      "bg-canvas",
      "text-ink",
    );
  });

  it("renders panels and page headers with warm editorial classes", () => {
    render(
      <Panel title="Spending" description="This month">
        <PageHeader eyebrow="Today" title="Dashboard" description="Summary" />
      </Panel>,
    );

    expect(screen.getByRole("region", { name: "Spending" })).toHaveClass(
      "bg-surface-card",
      "rounded-lg",
      "border-hairline",
    );
    expect(screen.getByRole("heading", { name: "Dashboard" })).toHaveClass(
      "font-display",
      "text-ink",
    );
  });

  it("exposes a radial brand mark and warm chart palette", () => {
    const { container } = render(<BrandMark />);

    expect(container.firstElementChild).toHaveClass("text-ink");
    expect(CHART_COLORS).toEqual([
      "#cc785c",
      "#5db8a6",
      "#e8a55a",
      "#181715",
      "#8e8b82",
      "#5db872",
    ]);
    expect(CHART_GRID_COLOR).toBe("#e6dfd8");
  });
});
