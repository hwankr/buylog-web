import { describe, expect, it } from "vitest";

import {
  buildAvailableScopes,
  parseScopeParam,
  serializeScope,
} from "@/lib/scope";

describe("buylog scope helpers", () => {
  it("falls back to personal scope for missing or invalid query values", () => {
    expect(parseScopeParam(undefined)).toEqual({ type: "personal" });
    expect(parseScopeParam("group:")).toEqual({ type: "personal" });
    expect(parseScopeParam("unknown")).toEqual({ type: "personal" });
  });

  it("parses and serializes group scopes", () => {
    const scope = parseScopeParam("group:abc-123");

    expect(scope).toEqual({ type: "group", groupId: "abc-123" });
    expect(serializeScope(scope)).toBe("group:abc-123");
  });

  it("builds personal plus joined group scopes with owner/member roles", () => {
    expect(
      buildAvailableScopes([
        { groupId: "g1", label: "가족", role: "owner" },
        { groupId: "g2", label: "동아리", role: "member" },
      ]),
    ).toEqual([
      { type: "personal", label: "내 물품" },
      { type: "group", groupId: "g1", label: "가족", role: "owner" },
      { type: "group", groupId: "g2", label: "동아리", role: "member" },
    ]);
  });
});
