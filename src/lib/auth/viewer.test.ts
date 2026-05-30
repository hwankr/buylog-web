import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { resolveViewerFromSources } from "@/lib/auth/viewer";

describe("viewer resolution", () => {
  it("prefers a real Supabase Auth user profile over demo fallback", () => {
    expect(
      resolveViewerFromSources({
        authUser: { id: "real-user", email: "real@example.com" },
        profile: { display_name: "실사용자", email: "profile@example.com" },
        demoCookieEnabled: true,
        devFallbackEnabled: true,
        devUserId: "dev-user",
      }),
    ).toEqual({
      id: "real-user",
      email: "profile@example.com",
      displayName: "실사용자",
      source: "auth",
    });
  });

  it("uses demo viewer only when both cookie and env flag are enabled", () => {
    expect(
      resolveViewerFromSources({
        authUser: null,
        profile: null,
        demoCookieEnabled: true,
        devFallbackEnabled: true,
        devUserId: "dev-user",
      }),
    ).toEqual({
      id: "dev-user",
      email: "demo@buylog.local",
      displayName: "시연 사용자",
      source: "demo",
    });

    expect(
      resolveViewerFromSources({
        authUser: null,
        profile: null,
        demoCookieEnabled: true,
        devFallbackEnabled: false,
        devUserId: "dev-user",
      }),
    ).toBeNull();
  });
});
