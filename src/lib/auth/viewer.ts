import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import { getDevUserId, hasSupabaseConfig, isDevFallbackEnabled } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const DEMO_COOKIE_NAME = "buylog_demo_session";

export type Viewer = {
  id: string;
  email: string | null;
  displayName: string;
  source: "auth" | "demo";
};

type AuthUserSource = {
  id: string;
  email?: string | null;
} | null;

type ProfileSource = {
  display_name?: string | null;
  email?: string | null;
} | null;

type ResolveViewerSources = {
  authUser: AuthUserSource;
  profile: ProfileSource;
  demoCookieEnabled: boolean;
  devFallbackEnabled: boolean;
  devUserId: string;
};

export function resolveViewerFromSources({
  authUser,
  profile,
  demoCookieEnabled,
  devFallbackEnabled,
  devUserId,
}: ResolveViewerSources): Viewer | null {
  if (authUser) {
    return {
      id: authUser.id,
      email: profile?.email ?? authUser.email ?? null,
      displayName:
        profile?.display_name?.trim() ||
        authUser.email?.trim() ||
        "로그인 사용자",
      source: "auth",
    };
  }

  if (demoCookieEnabled && devFallbackEnabled) {
    return {
      id: devUserId,
      email: "demo@buylog.local",
      displayName: "시연 사용자",
      source: "demo",
    };
  }

  return null;
}

export const resolveViewer = cache(async (): Promise<Viewer | null> => {
  const cookieStore = await cookies();
  const demoCookieEnabled = cookieStore.get(DEMO_COOKIE_NAME)?.value === "1";

  let authUser: AuthUserSource = null;
  let profile: ProfileSource = null;

  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      authUser = { id: user.id, email: user.email };
      const { data } = await supabase
        .from("users")
        .select("display_name,email")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        profile = {
          display_name: data.display_name,
          email: data.email,
        };
      }
    }
  }

  return resolveViewerFromSources({
    authUser,
    profile,
    demoCookieEnabled,
    devFallbackEnabled: isDevFallbackEnabled(),
    devUserId: getDevUserId(),
  });
});
