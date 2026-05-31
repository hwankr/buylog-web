import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppNav } from "@/components/app-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/reports",
}));

describe("AppNav", () => {
  it("marks the active route and keeps navigation accessible", () => {
    render(<AppNav />);

    expect(screen.getByRole("link", { name: "Reports" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Reports" })).toHaveClass(
      "bg-surface-dark",
      "text-on-dark",
    );
    expect(
      screen.getByRole("link", { name: "Dashboard" }),
    ).not.toHaveAttribute("aria-current");
  });
});
