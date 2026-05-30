export type BuylogScope =
  | { type: "personal"; label?: string }
  | {
      type: "group";
      groupId: string;
      label?: string;
      role?: "owner" | "member";
    };

export type JoinedGroupScope = {
  groupId: string;
  label: string;
  role: "owner" | "member";
};

export function parseScopeParam(value: string | string[] | undefined): BuylogScope {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || raw === "personal") {
    return { type: "personal" };
  }

  if (!raw.startsWith("group:")) {
    return { type: "personal" };
  }

  const groupId = raw.slice("group:".length).trim();
  if (!groupId) {
    return { type: "personal" };
  }

  return { type: "group", groupId };
}

export function serializeScope(scope: BuylogScope) {
  return scope.type === "group" ? `group:${scope.groupId}` : "personal";
}

export function buildAvailableScopes(groups: JoinedGroupScope[]): BuylogScope[] {
  return [
    { type: "personal", label: "내 물품" },
    ...groups.map((group) => ({
      type: "group" as const,
      groupId: group.groupId,
      label: group.label,
      role: group.role,
    })),
  ];
}

export function resolveSelectedScope(
  requested: BuylogScope,
  availableScopes: BuylogScope[],
): BuylogScope {
  if (requested.type === "personal") {
    return availableScopes[0] ?? { type: "personal", label: "내 물품" };
  }

  return (
    availableScopes.find(
      (scope) => scope.type === "group" && scope.groupId === requested.groupId,
    ) ??
    availableScopes[0] ?? { type: "personal", label: "내 물품" }
  );
}
