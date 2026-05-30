"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DEMO_COOKIE_NAME } from "@/lib/auth/viewer";
import { hasSupabaseConfig, isDevFallbackEnabled } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  if (!hasSupabaseConfig()) {
    redirect("/login?error=missing-config");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid-credentials");
  }

  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE_NAME);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function enterDemoMode() {
  if (!isDevFallbackEnabled()) {
    redirect("/login?error=demo-disabled");
  }

  const cookieStore = await cookies();
  cookieStore.set(DEMO_COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE_NAME);

  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
