import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const TABLES = [
  "users",
  "groups",
  "group_members",
  "categories",
  "product_items",
  "purchases",
  "product_inventory_snapshots",
  "inventory_observations",
  "inventory_observation_items",
  "ocr_scans",
  "ai_predictions",
  "notifications",
  "product_prices",
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
    key: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

const { url, key } = loadEnv();
if (!url || !key) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local",
  );
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const backup = {};
for (const table of TABLES) {
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw new Error(`export ${table}: ${error.message}`);
  backup[table] = data ?? [];
}

const dir = path.join("artifacts", "demo-data-backups");
fs.mkdirSync(dir, { recursive: true });
const timestamp = new Date()
  .toISOString()
  .replaceAll(":", "-")
  .replaceAll(".", "-");
const outputPath = path.join(dir, `${timestamp}.json`);

fs.writeFileSync(
  outputPath,
  JSON.stringify({ exportedAt: new Date().toISOString(), tables: backup }, null, 2),
);
console.log(outputPath);
