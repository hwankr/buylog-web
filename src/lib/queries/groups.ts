import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { JoinedGroupScope } from "@/lib/scope";

type GroupMemberRow = {
  role: "owner" | "member" | string | null;
  groups:
    | {
        id: string;
        name: string;
      }
    | {
        id: string;
        name: string;
      }[]
    | null;
};

function firstGroup(value: GroupMemberRow["groups"]) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export async function getJoinedGroupScopes(
  client: SupabaseClient,
  userId: string,
): Promise<JoinedGroupScope[]> {
  const { data, error } = await client
    .from("group_members")
    .select("role, groups(id,name)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(`load groups: ${error.message}`);
  }

  return ((data ?? []) as GroupMemberRow[])
    .map((row) => {
      const group = firstGroup(row.groups);
      if (!group) return null;

      return {
        groupId: group.id,
        label: group.name,
        role: row.role === "owner" ? "owner" : "member",
      } satisfies JoinedGroupScope;
    })
    .filter((group): group is JoinedGroupScope => group !== null);
}
