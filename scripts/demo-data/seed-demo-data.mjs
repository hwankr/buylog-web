import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

import { DEMO_USER_ID, buildDemoCatalog } from "./catalog.mjs";

const CONFIRM_TOKEN = "replace-demo-data";
const BUCKET = "product-images";
const DELETE_ORDER = [
  "product_inventory_snapshots",
  "inventory_observation_items",
  "inventory_observations",
  "notifications",
  "ai_predictions",
  "ocr_scans",
  "purchases",
  "product_items",
  "categories",
  "group_members",
  "groups",
  "product_prices",
  "users",
];

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
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    confirm: process.env.BUYLOG_DEMO_RESET_CONFIRM,
  };
}

function requireOk(error, label) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

function rowByKey(rows, key) {
  const row = rows.get(key);
  if (!row) throw new Error(`Missing inserted row for ${key}`);
  return row;
}

function findBy(rows, predicate, label) {
  const row = rows.find(predicate);
  if (!row) throw new Error(`Missing inserted row for ${label}`);
  return row;
}

const env = loadEnv();
if (!env.url || !env.serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local",
  );
}
if (env.confirm !== CONFIRM_TOKEN) {
  throw new Error(
    `Set BUYLOG_DEMO_RESET_CONFIRM=${CONFIRM_TOKEN} to run the destructive demo reset`,
  );
}

const supabase = createClient(env.url, env.serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const catalog = buildDemoCatalog();

const { error: clearDefaultGroupError } = await supabase
  .from("users")
  .update({ default_group_id: null })
  .not("id", "is", null);
requireOk(clearDefaultGroupError, "clear user default groups");

for (const table of DELETE_ORDER) {
  if (table === "product_inventory_snapshots") {
    const { error } = await supabase
      .from(table)
      .delete()
      .not("product_item_id", "is", null);
    requireOk(error, `clear ${table}`);
  } else {
    const { error } = await supabase.from(table).delete().not("id", "is", null);
    requireOk(error, `clear ${table}`);
  }
}

const { data: existingObjects, error: listObjectsError } = await supabase.storage
  .from(BUCKET)
  .list("items/demo-products", { limit: 1000 });
requireOk(listObjectsError, "list old demo images");

if ((existingObjects ?? []).length > 0) {
  const { error: removeObjectsError } = await supabase.storage
    .from(BUCKET)
    .remove(
      existingObjects.map((object) => `items/demo-products/${object.name}`),
    );
  requireOk(removeObjectsError, "remove old demo images");
}

const imageUrlBySlug = new Map();
for (const item of catalog.items) {
  const file = new Blob([item.imageSvg], { type: "image/svg+xml" });
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(item.imagePath, file, {
      contentType: "image/svg+xml",
      upsert: true,
    });
  requireOk(uploadError, `upload ${item.imagePath}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(item.imagePath);
  imageUrlBySlug.set(item.slug, data.publicUrl);
}

const { error: userError } = await supabase.from("users").upsert({
  id: catalog.user.id,
  email: catalog.user.email,
  display_name: catalog.user.displayName,
  avatar_url: catalog.user.avatarUrl,
  notification_enabled: true,
});
requireOk(userError, "upsert demo user");

const { data: insertedGroups, error: groupError } = await supabase
  .from("groups")
  .insert(
    catalog.groups.map((group) => ({
      name: group.name,
      invite_code: group.inviteCode,
      created_by: DEMO_USER_ID,
    })),
  )
  .select("id,name,invite_code");
requireOk(groupError, "insert groups");

const groupRows = new Map(
  insertedGroups.map((group) => [
    findBy(
      catalog.groups,
      (candidate) => candidate.inviteCode === group.invite_code,
      group.invite_code,
    ).key,
    group,
  ]),
);

const { error: memberError } = await supabase.from("group_members").insert(
  catalog.groups.map((group) => ({
    group_id: rowByKey(groupRows, group.key).id,
    user_id: DEMO_USER_ID,
    role: group.role,
  })),
);
requireOk(memberError, "insert group memberships");

const { error: defaultGroupError } = await supabase
  .from("users")
  .update({ default_group_id: rowByKey(groupRows, "home302").id })
  .eq("id", DEMO_USER_ID);
requireOk(defaultGroupError, "update default group");

const { data: insertedCategories, error: categoryError } = await supabase
  .from("categories")
  .insert(
    catalog.categories.map((category) => ({
      user_id: category.scope === "personal" ? DEMO_USER_ID : null,
      group_id:
        category.scope === "personal"
          ? null
          : rowByKey(groupRows, category.scope).id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      sort_order: category.sortOrder,
    })),
  )
  .select("id,name");
requireOk(categoryError, "insert categories");

const categoryRows = new Map(
  insertedCategories.map((row) => [
    findBy(catalog.categories, (category) => category.name === row.name, row.name)
      .key,
    row,
  ]),
);

const { data: insertedItems, error: itemError } = await supabase
  .from("product_items")
  .insert(
    catalog.items.map((item) => ({
      user_id: item.scope === "personal" ? DEMO_USER_ID : null,
      group_id: item.groupKey ? rowByKey(groupRows, item.groupKey).id : null,
      category_id: rowByKey(categoryRows, item.categoryKey).id,
      name: item.name,
      brand: item.brand,
      memo: item.scope === "personal" ? "개인 데모 등록 물품" : "그룹 데모 등록 물품",
      image_url: imageUrlBySlug.get(item.slug),
      replacement_cycle_days: item.cycleDays,
      registered_by: DEMO_USER_ID,
      vision_tracking_enabled: item.stock <= 1,
    })),
  )
  .select("id,name");
requireOk(itemError, "insert product items");

const itemRows = new Map(
  insertedItems.map((row) => [
    findBy(catalog.items, (item) => item.name === row.name, row.name).slug,
    row,
  ]),
);

const purchaseRows = catalog.items.flatMap((item) =>
  item.purchases.map((purchase) => ({
    product_item_id: rowByKey(itemRows, item.slug).id,
    purchased_by: DEMO_USER_ID,
    purchase_date: purchase.purchaseDate,
    price: purchase.price,
    store_name: purchase.storeName,
    quantity: purchase.quantity,
    memo: purchase.memo,
    use_started_on: purchase.purchaseDate,
  })),
);
const { error: purchaseError } = await supabase
  .from("purchases")
  .insert(purchaseRows);
requireOk(purchaseError, "insert purchases");

const snapshotRows = catalog.items
  .filter((item) => item.stock <= 1)
  .map((item) => ({
    product_item_id: rowByKey(itemRows, item.slug).id,
    remaining_quantity: item.stock,
    confidence: 0.86,
    source_detected_name: item.name,
    observed_at: new Date().toISOString(),
  }));
const { error: snapshotError } = await supabase
  .from("product_inventory_snapshots")
  .insert(snapshotRows);
requireOk(snapshotError, "insert inventory snapshots");

console.log(
  `Seeded ${catalog.groups.length} groups, ${catalog.items.length} items, ${purchaseRows.length} purchases, ${snapshotRows.length} snapshots.`,
);
