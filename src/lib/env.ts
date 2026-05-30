export const DEMO_USER_ID = "08cccfe3-766f-43bd-b06c-8d909e0f9fe8";

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function getSupabasePublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
}

export function hasSupabaseConfig() {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey());
}

export function getDevUserId() {
  return process.env.BUYLOG_DEV_USER_ID || DEMO_USER_ID;
}

export function isDevFallbackEnabled() {
  return process.env.BUYLOG_ENABLE_DEV_FALLBACK === "true";
}
