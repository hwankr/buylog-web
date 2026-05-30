import { describe, expect, it } from "vitest";

import {
  formatKoreanDate,
  formatKrw,
  getKstMonthRange,
} from "@/lib/format";

describe("Korean formatting utilities", () => {
  it("formats Korean won without decimals", () => {
    expect(formatKrw(128900)).toBe("₩128,900");
  });

  it("formats dates for Korean users", () => {
    expect(formatKoreanDate("2026-05-03")).toBe("2026. 5. 3.");
  });

  it("builds KST month boundaries as ISO date strings", () => {
    expect(getKstMonthRange(new Date("2026-05-30T12:00:00+09:00"))).toEqual({
      start: "2026-05-01",
      end: "2026-05-31",
      previousStart: "2026-04-01",
      previousEnd: "2026-04-30",
    });
  });
});
