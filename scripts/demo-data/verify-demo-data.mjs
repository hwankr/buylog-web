import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

import { DEMO_USER_ID } from "./catalog.mjs";

function parseEnvLine(line) {
  const index = line.indexOf("=");
  if (index === -1) return null;

  return [
    line.slice(0, index),
    line.slice(index + 1).replace(/^['"]|['"]$/g, ""),
  ];
}

function loadEnv() {
  const file = fs.readFileSync(".env.local", "utf8");
  const env = Object.fromEntries(
    file
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#"))
      .map(parseEnvLine)
      .filter(Boolean),
  );

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    key: env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

function fail(message) {
  throw new Error(message);
}

async function countRows(supabase, table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { head: true, count: "exact" });
  if (error) fail(`${table}: ${error.message}`);
  return count ?? 0;
}

const { url, key } = loadEnv();
if (!url || !key) {
  fail(
    "NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required",
  );
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anchorDate = new Date().toISOString().slice(0, 10);

const counts = {
  groups: await countRows(supabase, "groups"),
  groupMembers: await countRows(supabase, "group_members"),
  categories: await countRows(supabase, "categories"),
  items: await countRows(supabase, "product_items"),
  purchases: await countRows(supabase, "purchases"),
  snapshots: await countRows(supabase, "product_inventory_snapshots"),
};

if (counts.groups !== 2) fail(`expected 2 groups, got ${counts.groups}`);
if (counts.groupMembers !== 2) {
  fail(`expected 2 memberships, got ${counts.groupMembers}`);
}
if (counts.items !== 24) fail(`expected 24 items, got ${counts.items}`);
if (counts.purchases < 100) {
  fail(`expected at least 100 purchases, got ${counts.purchases}`);
}
if (counts.snapshots < 12) {
  fail(`expected at least 12 snapshots, got ${counts.snapshots}`);
}

const { data: missingImageItems, error: imageError } = await supabase
  .from("product_items")
  .select("id,name,image_url")
  .is("image_url", null);
if (imageError) fail(`image check: ${imageError.message}`);
if ((missingImageItems ?? []).length > 0) {
  fail(
    `items missing image_url: ${missingImageItems
      .map((item) => item.name)
      .join(", ")}`,
  );
}

const { data: groups, error: groupError } = await supabase
  .from("group_members")
  .select("role, groups(id,name)")
  .eq("user_id", DEMO_USER_ID);
if (groupError) fail(`group scope check: ${groupError.message}`);
if ((groups ?? []).length !== 2) fail("demo viewer must belong to both groups");

const rpcChecks = [
  [
    "buylog_dashboard_kpis",
    { scope_type: "personal", scope_id: null, anchor_date: anchorDate },
  ],
  [
    "buylog_monthly_spending",
    {
      scope_type: "personal",
      scope_id: null,
      anchor_date: anchorDate,
      months: 6,
    },
  ],
  ["buylog_item_filter_options", {}],
  [
    "buylog_item_list",
    {
      search_text: "",
      category_ids: [],
      group_filters: [],
      sort_key: "name",
      sort_direction: "asc",
      limit_count: 100,
      anchor_date: anchorDate,
    },
  ],
];

for (const [name, params] of rpcChecks) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) fail(`${name}: ${error.message}`);
  if (!Array.isArray(data) || data.length === 0) {
    fail(`${name}: expected non-empty result`);
  }
}

console.log(JSON.stringify(counts, null, 2));
