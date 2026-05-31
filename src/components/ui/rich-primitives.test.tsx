import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  TableShell,
  tableClassName,
  tableHeadClassName,
} from "@/components/ui/data-table";
import { MetricCard } from "@/components/ui/metric-card";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

describe("rich design primitives", () => {
  it("renders panels with accent rails and header actions", () => {
    render(
      <Panel
        accent="teal"
        actions={<a href="/reports">Open</a>}
        title="Spending"
        titleAdornment={<StatusPill tone="teal">Live</StatusPill>}
      >
        Content
      </Panel>,
    );

    expect(screen.getByRole("region", { name: "Spending" })).toHaveClass(
      "bg-surface-card",
      "border-hairline",
      "overflow-hidden",
    );
    expect(screen.getByText("Live")).toHaveClass(
      "bg-accent-teal/15",
      "text-ink",
    );
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute(
      "href",
      "/reports",
    );
  });

  it("renders metric cards with dark and cream hierarchy", () => {
    render(
      <>
        <MetricCard
          accent="coral"
          eyebrow="이번 달"
          helper="지난달 대비 +₩12,000"
          title="구매액"
          tone="dark"
          value="₩128,900"
        />
        <MetricCard
          accent="amber"
          eyebrow="예상"
          helper="30일 기준"
          title="재구매"
          value="₩20,000"
        />
      </>,
    );

    expect(screen.getByText("₩128,900").closest("article")).toHaveClass(
      "bg-surface-dark",
      "text-on-dark",
    );
    expect(screen.getByText("₩20,000").closest("article")).toHaveClass(
      "bg-surface-card",
      "border-hairline",
    );
  });

  it("renders status pills and table shell classes", () => {
    render(
      <TableShell label="Recent purchases">
        <table className={tableClassName}>
          <thead className={tableHeadClassName}>
            <tr>
              <th>Item</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <StatusPill tone="success">On track</StatusPill>
              </td>
            </tr>
          </tbody>
        </table>
      </TableShell>,
    );

    expect(
      screen.getByRole("region", { name: "Recent purchases" }),
    ).toHaveClass("rounded-lg", "border-hairline");
    expect(screen.getByText("On track")).toHaveClass(
      "bg-success/15",
      "text-ink",
    );
  });
});
