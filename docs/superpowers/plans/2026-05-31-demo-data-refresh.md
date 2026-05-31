# Demo Data Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current shared Supabase demo data with professor-demo-ready personal and group consumable data spanning several months, including registered item images.

**Architecture:** Treat this as a controlled destructive seed workflow, not as normal product code. Keep the app pattern intact: Supabase owns data shaping, server-only query modules map RPC rows, and UI components render view models. Add a repeatable Node seed/export/verify toolset that uses a service-role key only from local environment variables and refuses to run without an explicit confirmation token.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.4, Supabase Postgres/Storage, `@supabase/supabase-js` 2.106.2, Node ESM scripts, Vitest.

---

## Scope Check

This plan covers one destructive demo-prep subsystem:

- Export current app-domain data before deletion.
- Delete and replace current app-domain rows in `public`.
- Create realistic personal data plus realistic group data.
- Register product images through the existing Supabase Storage `product-images` bucket and save public URLs in `product_items.image_url`.
- Extend the web item list/detail read path so the registered images are visible during the demo.
- Verify dashboard, reports, items, and group scopes after the seed.

This plan does not delete `auth`, `storage` system tables, Supabase migration history, or project settings. If a future request means literally deleting auth users and every storage object in the project, that must be a separate operational plan because it changes login/session recovery risk.

## Current Snapshot

Remote project: `fervijwxdgkwjtcpzskx`.

Current app-domain counts observed before planning:

- `public.users`: 1 visible row
- `public.groups`: 1 row
- `public.group_members`: 1 row
- `public.categories`: 12 rows
- `public.product_items`: 26 rows
- `public.purchases`: 90 rows
- `public.product_inventory_snapshots`: 0 rows
- `public.inventory_observations`: 0 rows
- `public.inventory_observation_items`: 0 rows
- `public.ocr_scans`: 0 rows
- `public.ai_predictions`: 0 rows
- `public.notifications`: 0 rows

Current demo fallback user used by the web app:

```text
08cccfe3-766f-43bd-b06c-8d909e0f9fe8
```

Supabase advisory currently reports RLS disabled on these exposed `public` tables:

```text
public.categories
public.product_items
public.purchases
public.ocr_scans
public.ai_predictions
public.notifications
public.product_prices
```

Do not auto-enable RLS in this demo-data plan. Enabling RLS without policies can break the current demo flow. Surface the risk, keep the seed tool service-role-only, and schedule RLS remediation separately after the demo path is stable.

## Next.js 16 Notes Checked

- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`: keep Supabase access in Server Components/server-only modules; add Client Components only for interactivity/browser APIs.
- `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`: remote images need known dimensions or `fill`; remote image optimization needs `remotePatterns`.
- `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/images.md`: Supabase can be used with the image loader/config path, but this plan uses plain rendered public URLs first to avoid adding image optimization config risk before the demo.

## File Structure

- Modify `.env.example`
  - Documents the local-only `SUPABASE_SERVICE_ROLE_KEY` required by destructive seed scripts.
- Modify `package.json`
  - Adds `db:demo:export`, `db:demo:seed`, and `db:demo:verify` scripts.
- Create `scripts/demo-data/catalog.mjs`
  - Owns deterministic demo personas, groups, categories, items, purchase schedules, inventory snapshots, and generated SVG product image markup.
- Create `scripts/demo-data/catalog.test.mjs`
  - Tests that the catalog has personal/group coverage, six-month purchase coverage, image coverage, and near-term replacement events.
- Create `scripts/demo-data/export-current-data.mjs`
  - Exports current app-domain rows to `artifacts/demo-data-backups/2026-05-31T19-30-00-000Z.json` style timestamped files. It prefers `SUPABASE_SERVICE_ROLE_KEY` and falls back to publishable-key-visible rows for demo operations.
- Create `scripts/demo-data/seed-demo-data.mjs`
  - Deletes app-domain rows in FK-safe order, reuses the existing `product-images` Storage bucket, uploads generated SVG item images under `items/demo-products/`, and inserts the replacement data.
- Create `scripts/demo-data/verify-demo-data.mjs`
  - Checks row counts, group scopes, image URLs, six-month purchase span, and key reporting/item RPCs. It can run with either service role or publishable key.
- Create one new Supabase migration through `supabase migration new include_item_images_in_item_rpcs`
  - Extends item list/detail RPCs to return `image_url`.
- Modify `src/lib/items/items.ts`
  - Adds `imageUrl` to item list/detail RPC row types and mapped view models.
- Modify `src/lib/items/items.test.ts`
  - Tests image URL mapping and fallback behavior.
- Modify `src/components/items/table.tsx`
  - Shows compact item thumbnails in the item list.
- Modify `src/components/items/detail.tsx`
  - Shows a larger item image in the detail summary area.
- Modify `src/components/items/items-widgets.test.tsx`
  - Tests accessible image rendering and fallback initials.

## Seed Shape

Use a relative-date seed anchored to the execution date in KST so the dashboard remains current even if the demo is a few days later.

Target shape:

- 1 demo viewer: `김도윤`, email `issue4test@test.com`, same fallback UUID.
- 2 joined groups:
  - `자취방 302호`: household shared consumables.
  - `캡스톤 실험실`: project/lab shared supplies.
- 8 personal items.
- 8 household group items.
- 8 lab group items.
- 8-10 categories across personal and group scopes.
- 95-120 purchase rows over the last six months.
- 12+ low-stock inventory snapshots to make replacement/forecast panels non-empty.
- Every item has a public image URL.

## Task 1: Environment and Command Wiring

**Files:**
- Modify: `.env.example`
- Modify: `package.json`

- [ ] **Step 1: Document the service-role env var**

Add this line to `.env.example`:

```dotenv
SUPABASE_SERVICE_ROLE_KEY=
```

Expected: `.env.example` still contains only empty/example values and no real secret.

- [ ] **Step 2: Add demo data scripts**

Modify `package.json` scripts to include:

```json
{
  "db:demo:export": "node scripts/demo-data/export-current-data.mjs",
  "db:demo:seed": "node scripts/demo-data/seed-demo-data.mjs",
  "db:demo:verify": "node scripts/demo-data/verify-demo-data.mjs"
}
```

Expected: existing scripts remain unchanged, and these three keys are added under `"scripts"`.

- [ ] **Step 3: Run package parse check**

Run:

```powershell
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json ok')"
```

Expected:

```text
package.json ok
```

- [ ] **Step 4: Commit**

Run:

```powershell
git add .env.example package.json
git commit -m "chore: add demo data script commands"
```

Expected: one small commit with only environment documentation and script command wiring.

## Task 2: Demo Catalog Module

**Files:**
- Create: `scripts/demo-data/catalog.mjs`
- Create: `scripts/demo-data/catalog.test.mjs`

- [ ] **Step 1: Create the demo-data directory**

Run:

```powershell
New-Item -ItemType Directory -Force -Path scripts\demo-data
```

Expected: `scripts\demo-data` exists.

- [ ] **Step 2: Create `scripts/demo-data/catalog.mjs`**

Use this module shape:

```js
export const DEMO_USER_ID = "08cccfe3-766f-43bd-b06c-8d909e0f9fe8";

export const DEMO_USER = {
  id: DEMO_USER_ID,
  email: "issue4test@test.com",
  displayName: "김도윤",
  avatarUrl: null,
};

export const DEMO_GROUPS = [
  {
    key: "home302",
    name: "자취방 302호",
    inviteCode: "HOME-302",
    role: "owner",
  },
  {
    key: "lab",
    name: "캡스톤 실험실",
    inviteCode: "LAB-2026",
    role: "member",
  },
];

export const DEMO_CATEGORIES = [
  { key: "personal-bath", scope: "personal", name: "욕실", icon: "shower-head", color: "#2563eb", sortOrder: 10 },
  { key: "personal-laundry", scope: "personal", name: "세탁", icon: "shirt", color: "#0f766e", sortOrder: 20 },
  { key: "personal-kitchen", scope: "personal", name: "주방", icon: "utensils", color: "#b45309", sortOrder: 30 },
  { key: "personal-health", scope: "personal", name: "건강", icon: "heart-pulse", color: "#be123c", sortOrder: 40 },
  { key: "home-kitchen", scope: "home302", name: "공용 주방", icon: "cooking-pot", color: "#ca8a04", sortOrder: 10 },
  { key: "home-living", scope: "home302", name: "생활 소모품", icon: "package", color: "#475569", sortOrder: 20 },
  { key: "home-cleaning", scope: "home302", name: "청소", icon: "spray-can", color: "#16a34a", sortOrder: 30 },
  { key: "lab-office", scope: "lab", name: "문구/출력", icon: "printer", color: "#4f46e5", sortOrder: 10 },
  { key: "lab-pantry", scope: "lab", name: "회의 준비", icon: "coffee", color: "#92400e", sortOrder: 20 },
  { key: "lab-safety", scope: "lab", name: "위생/안전", icon: "shield-check", color: "#0891b2", sortOrder: 30 },
];

export const DEMO_ITEMS = [
  { slug: "toothpaste", scope: "personal", categoryKey: "personal-bath", name: "덴티스테 플러스화이트 치약", brand: "덴티스테", cycleDays: 52, basePrice: 8900, quantity: 1, stores: ["올리브영 서울대입구", "쿠팡 로켓배송"], dayOfMonth: 5, history: [-5, -3, -1, 0], stock: 1 },
  { slug: "shampoo", scope: "personal", categoryKey: "personal-bath", name: "케라시스 데미지 클리닉 샴푸", brand: "케라시스", cycleDays: 64, basePrice: 11900, quantity: 1, stores: ["이마트 신림점", "마켓컬리"], dayOfMonth: 8, history: [-5, -3, -1], stock: 1 },
  { slug: "lens-solution", scope: "personal", categoryKey: "personal-health", name: "리뉴 후레쉬 렌즈세정액", brand: "바슈롬", cycleDays: 38, basePrice: 7600, quantity: 1, stores: ["올리브영 서울대입구", "네이버 스마트스토어"], dayOfMonth: 12, history: [-5, -4, -2, -1, 0], stock: 0 },
  { slug: "laundry-detergent", scope: "personal", categoryKey: "personal-laundry", name: "퍼실 딥클린 라벤더 2.7L", brand: "퍼실", cycleDays: 45, basePrice: 17800, quantity: 1, stores: ["쿠팡 로켓배송", "이마트 신림점"], dayOfMonth: 16, history: [-5, -3, -2, 0], stock: 1 },
  { slug: "fabric-softener", scope: "personal", categoryKey: "personal-laundry", name: "다우니 실내건조 섬유유연제", brand: "다우니", cycleDays: 50, basePrice: 12900, quantity: 1, stores: ["홈플러스 남현점", "쿠팡 로켓배송"], dayOfMonth: 19, history: [-4, -2, 0], stock: 1 },
  { slug: "dish-soap-personal", scope: "personal", categoryKey: "personal-kitchen", name: "프릴 베이킹소다 주방세제", brand: "프릴", cycleDays: 35, basePrice: 6900, quantity: 1, stores: ["다이소 서울대입구역점", "쿠팡 로켓배송"], dayOfMonth: 22, history: [-5, -4, -3, -2, -1, 0], stock: 1 },
  { slug: "water-filter", scope: "personal", categoryKey: "personal-kitchen", name: "브리타 막스트라 플러스 필터", brand: "브리타", cycleDays: 56, basePrice: 23900, quantity: 3, stores: ["쿠팡 로켓배송", "이마트몰"], dayOfMonth: 24, history: [-5, -3, -1], stock: 1 },
  { slug: "vitamin", scope: "personal", categoryKey: "personal-health", name: "고려은단 비타민C 1000", brand: "고려은단", cycleDays: 72, basePrice: 19900, quantity: 1, stores: ["약국", "쿠팡 로켓배송"], dayOfMonth: 27, history: [-5, -2, 0], stock: 1 },

  { slug: "rice", scope: "home302", categoryKey: "home-kitchen", name: "대왕님표 여주쌀 10kg", brand: "대왕님표", cycleDays: 31, basePrice: 34900, quantity: 1, stores: ["이마트 신림점", "쿠팡 로켓프레시"], dayOfMonth: 3, history: [-5, -4, -3, -2, -1, 0], stock: 1 },
  { slug: "kitchen-towel", scope: "home302", categoryKey: "home-living", name: "크리넥스 안심 키친타월 6롤", brand: "크리넥스", cycleDays: 28, basePrice: 9800, quantity: 1, stores: ["홈플러스 남현점", "쿠팡 로켓배송"], dayOfMonth: 7, history: [-5, -4, -3, -2, -1, 0], stock: 0 },
  { slug: "trash-bag", scope: "home302", categoryKey: "home-living", name: "관악구 종량제봉투 20L", brand: "관악구", cycleDays: 42, basePrice: 5000, quantity: 2, stores: ["GS25 관악청룡점", "CU 서울대입구점"], dayOfMonth: 10, history: [-5, -3, -1, 0], stock: 1 },
  { slug: "dish-soap-group", scope: "home302", categoryKey: "home-cleaning", name: "자연퐁 솔잎 주방세제 리필", brand: "자연퐁", cycleDays: 33, basePrice: 7900, quantity: 1, stores: ["이마트 신림점", "쿠팡 로켓배송"], dayOfMonth: 13, history: [-5, -4, -3, -2, -1, 0], stock: 1 },
  { slug: "toilet-paper", scope: "home302", categoryKey: "home-living", name: "코디 순수 3겹 화장지 30롤", brand: "코디", cycleDays: 47, basePrice: 18900, quantity: 1, stores: ["쿠팡 로켓배송", "홈플러스 남현점"], dayOfMonth: 17, history: [-5, -3, -2, 0], stock: 1 },
  { slug: "cleaning-wipes", scope: "home302", categoryKey: "home-cleaning", name: "스카트 물걸레 청소포", brand: "스카트", cycleDays: 39, basePrice: 10900, quantity: 1, stores: ["다이소 서울대입구역점", "이마트 신림점"], dayOfMonth: 20, history: [-5, -4, -2, -1, 0], stock: 0 },
  { slug: "coffee-beans-home", scope: "home302", categoryKey: "home-kitchen", name: "스타벅스 하우스 블렌드 원두", brand: "스타벅스", cycleDays: 25, basePrice: 15900, quantity: 1, stores: ["마켓컬리", "쿠팡 로켓배송"], dayOfMonth: 25, history: [-5, -4, -3, -2, -1, 0], stock: 1 },
  { slug: "hand-soap-home", scope: "home302", categoryKey: "home-cleaning", name: "아이깨끗해 핸드워시 리필", brand: "아이깨끗해", cycleDays: 44, basePrice: 8400, quantity: 1, stores: ["올리브영 서울대입구", "쿠팡 로켓배송"], dayOfMonth: 28, history: [-5, -3, -1], stock: 1 },

  { slug: "a4-paper", scope: "lab", categoryKey: "lab-office", name: "더블에이 A4 복사용지 80g", brand: "더블에이", cycleDays: 36, basePrice: 26500, quantity: 1, stores: ["문구대통령", "쿠팡 비즈"], dayOfMonth: 4, history: [-5, -4, -3, -1, 0], stock: 1 },
  { slug: "printer-toner", scope: "lab", categoryKey: "lab-office", name: "브라더 TN-2480 토너", brand: "브라더", cycleDays: 88, basePrice: 76500, quantity: 1, stores: ["네이버 스마트스토어", "쿠팡 비즈"], dayOfMonth: 9, history: [-5, -2, 0], stock: 1 },
  { slug: "coffee-capsule", scope: "lab", categoryKey: "lab-pantry", name: "네스프레소 볼루토 캡슐", brand: "네스프레소", cycleDays: 24, basePrice: 18900, quantity: 2, stores: ["네스프레소 공식몰", "쿠팡 비즈"], dayOfMonth: 11, history: [-5, -4, -3, -2, -1, 0], stock: 0 },
  { slug: "paper-cup", scope: "lab", categoryKey: "lab-pantry", name: "무형광 종이컵 1000개", brand: "탐사", cycleDays: 41, basePrice: 15800, quantity: 1, stores: ["쿠팡 비즈", "문구대통령"], dayOfMonth: 15, history: [-5, -3, -1, 0], stock: 1 },
  { slug: "hand-sanitizer", scope: "lab", categoryKey: "lab-safety", name: "랩신 손소독제 500ml", brand: "랩신", cycleDays: 57, basePrice: 6200, quantity: 3, stores: ["올리브영 서울대입구", "쿠팡 비즈"], dayOfMonth: 18, history: [-5, -3, -1], stock: 1 },
  { slug: "aa-battery", scope: "lab", categoryKey: "lab-office", name: "듀라셀 AA 건전지 20입", brand: "듀라셀", cycleDays: 62, basePrice: 17900, quantity: 1, stores: ["이마트 신림점", "쿠팡 비즈"], dayOfMonth: 21, history: [-5, -3, 0], stock: 1 },
  { slug: "cable-tie", scope: "lab", categoryKey: "lab-office", name: "흰색 케이블타이 200mm", brand: "3M", cycleDays: 76, basePrice: 7900, quantity: 1, stores: ["문구대통령", "네이버 스마트스토어"], dayOfMonth: 23, history: [-5, -2, 0], stock: 1 },
  { slug: "wet-tissue-lab", scope: "lab", categoryKey: "lab-safety", name: "크리넥스 안심 물티슈 캡형", brand: "크리넥스", cycleDays: 30, basePrice: 11900, quantity: 1, stores: ["쿠팡 비즈", "홈플러스 남현점"], dayOfMonth: 26, history: [-5, -4, -3, -2, -1, 0], stock: 0 },
];

export function kstDate(anchor = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(anchor);
}

export function monthDate(anchorDate, monthOffset, dayOfMonth) {
  const [year, month] = kstDate(anchorDate).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + monthOffset, 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  const day = Math.min(dayOfMonth, lastDay);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function priceFor(basePrice, sequenceIndex, slug) {
  const slugNoise = [...slug].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 700;
  const wave = [-500, 0, 300, -200, 600, 100][sequenceIndex % 6];
  return Math.max(1000, Math.round((basePrice + slugNoise + wave) / 100) * 100);
}

export function productSvg(item, category) {
  const bg = category.color;
  const escapedName = item.name.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const escapedBrand = item.brand.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
  <rect width="900" height="700" fill="#f8fafc"/>
  <rect x="70" y="70" width="760" height="560" rx="44" fill="${bg}"/>
  <rect x="112" y="112" width="676" height="476" rx="32" fill="#ffffff" opacity="0.92"/>
  <text x="150" y="210" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#111827">${escapedBrand}</text>
  <text x="150" y="300" font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#0f172a">${escapedName}</text>
  <text x="150" y="388" font-family="Arial, sans-serif" font-size="32" fill="#475569">BuyLog demo registered product</text>
  <rect x="150" y="455" width="250" height="72" rx="18" fill="${bg}" opacity="0.14"/>
  <text x="174" y="502" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${bg}">${item.cycleDays} day cycle</text>
  <circle cx="700" cy="470" r="72" fill="${bg}" opacity="0.18"/>
  <circle cx="700" cy="470" r="36" fill="${bg}"/>
</svg>`;
}

export function buildDemoCatalog(anchorDate = new Date()) {
  const groupByKey = new Map(DEMO_GROUPS.map((group) => [group.key, group]));
  const categoryByKey = new Map(DEMO_CATEGORIES.map((category) => [category.key, category]));

  const items = DEMO_ITEMS.map((item) => {
    const category = categoryByKey.get(item.categoryKey);
    if (!category) throw new Error(`Missing category for ${item.slug}`);
    const group = item.scope === "personal" ? null : groupByKey.get(item.scope);
    if (item.scope !== "personal" && !group) throw new Error(`Missing group for ${item.slug}`);

    return {
      ...item,
      groupKey: group?.key ?? null,
      imagePath: `items/demo-products/${item.slug}.svg`,
      imageSvg: productSvg(item, category),
      purchases: item.history.map((monthOffset, index) => ({
        purchaseDate: monthDate(anchorDate, monthOffset, item.dayOfMonth),
        price: priceFor(item.basePrice, index, item.slug),
        quantity: item.quantity,
        storeName: item.stores[index % item.stores.length],
        memo: `${item.name} ${item.scope === "personal" ? "개인" : group.name} 정기 구매`,
      })),
    };
  });

  return {
    user: DEMO_USER,
    groups: DEMO_GROUPS,
    categories: DEMO_CATEGORIES,
    items,
  };
}
```

- [ ] **Step 3: Create catalog tests**

Create `scripts/demo-data/catalog.test.mjs` with:

```js
import { describe, expect, it } from "vitest";

import { DEMO_ITEMS, buildDemoCatalog } from "./catalog.mjs";

describe("demo catalog", () => {
  it("contains personal and group-scoped items", () => {
    expect(DEMO_ITEMS.filter((item) => item.scope === "personal")).toHaveLength(8);
    expect(DEMO_ITEMS.filter((item) => item.scope === "home302")).toHaveLength(8);
    expect(DEMO_ITEMS.filter((item) => item.scope === "lab")).toHaveLength(8);
  });

  it("builds image-backed items and six-month purchase coverage", () => {
    const catalog = buildDemoCatalog(new Date("2026-05-31T12:00:00+09:00"));
    const allPurchases = catalog.items.flatMap((item) => item.purchases);
    const purchaseMonths = new Set(allPurchases.map((purchase) => purchase.purchaseDate.slice(0, 7)));

    expect(catalog.items.every((item) => item.imageSvg.includes("<svg"))).toBe(true);
    expect(catalog.items.every((item) => item.imagePath.endsWith(".svg"))).toBe(true);
    expect(purchaseMonths).toEqual(new Set(["2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05"]));
    expect(allPurchases.length).toBeGreaterThanOrEqual(100);
  });

  it("contains low stock snapshots for visible replacement pressure", () => {
    const catalog = buildDemoCatalog();
    expect(catalog.items.filter((item) => item.stock === 0)).toHaveLength(4);
    expect(catalog.items.filter((item) => item.stock <= 1).length).toBeGreaterThanOrEqual(12);
  });
});
```

- [ ] **Step 4: Run the catalog test**

Run:

```powershell
npm test -- scripts/demo-data/catalog.test.mjs
```

Expected: test passes.

- [ ] **Step 5: Commit**

Run:

```powershell
git add scripts/demo-data/catalog.mjs scripts/demo-data/catalog.test.mjs
git commit -m "test: define professor demo data catalog"
```

Expected: one focused commit with catalog and catalog tests.

## Task 3: Export Current Data Before Reset

**Files:**
- Create: `scripts/demo-data/export-current-data.mjs`
- Modify: `.gitignore` only if `artifacts/` is not already ignored

- [ ] **Step 1: Create the export script**

Create `scripts/demo-data/export-current-data.mjs` with:

```js
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

function loadEnv() {
  const file = fs.readFileSync(".env.local", "utf8");
  const env = Object.fromEntries(
    file
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      }),
  );

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    key: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

const { url, key } = loadEnv();
if (!url || !key) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local");
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
const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const outputPath = path.join(dir, `${timestamp}.json`);
fs.writeFileSync(outputPath, JSON.stringify({ exportedAt: new Date().toISOString(), tables: backup }, null, 2));
console.log(outputPath);
```

- [ ] **Step 2: Run export**

Run:

```powershell
npm run db:demo:export
```

Expected: prints a path under `artifacts/demo-data-backups/` and the JSON contains current rows.

- [ ] **Step 3: Ensure backups are untracked**

Run:

```powershell
git status --short artifacts
```

Expected: no backup JSON appears as tracked/staged source. If backup JSON appears, add this line to `.gitignore`:

```gitignore
artifacts/demo-data-backups/
```

- [ ] **Step 4: Commit**

Run:

```powershell
git add scripts/demo-data/export-current-data.mjs .gitignore
git commit -m "chore: add demo data export backup script"
```

Expected: commit excludes generated backup JSON files.

## Task 4: Destructive Seed Script

**Files:**
- Create: `scripts/demo-data/seed-demo-data.mjs`

- [ ] **Step 1: Create the seed script**

Create `scripts/demo-data/seed-demo-data.mjs` with this behavior:

```js
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

function loadEnv() {
  const file = fs.readFileSync(".env.local", "utf8");
  const env = Object.fromEntries(
    file
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      }),
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

const env = loadEnv();
if (!env.url || !env.serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local");
}
if (env.confirm !== CONFIRM_TOKEN) {
  throw new Error(`Set BUYLOG_DEMO_RESET_CONFIRM=${CONFIRM_TOKEN} to run the destructive demo reset`);
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
    const { error: snapshotError } = await supabase.from(table).delete().not("product_item_id", "is", null);
    requireOk(snapshotError, `clear ${table}`);
  } else {
    const { error } = await supabase.from(table).delete().not("id", "is", null);
    requireOk(error, `clear ${table}`);
  }
}

const { data: existingObjects, error: listObjectsError } = await supabase.storage.from(BUCKET).list("items/demo-products", {
  limit: 1000,
});
requireOk(listObjectsError, "list old demo images");
if ((existingObjects ?? []).length > 0) {
  const { error: removeObjectsError } = await supabase.storage
    .from(BUCKET)
    .remove(existingObjects.map((object) => `items/demo-products/${object.name}`));
  requireOk(removeObjectsError, "remove old demo images");
}

const imageUrlBySlug = new Map();
for (const item of catalog.items) {
  const file = new Blob([item.imageSvg], { type: "image/svg+xml" });
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(item.imagePath, file, {
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
  .insert(catalog.groups.map((group) => ({
    name: group.name,
    invite_code: group.inviteCode,
    created_by: DEMO_USER_ID,
  })))
  .select("id,name,invite_code");
requireOk(groupError, "insert groups");
const groupRows = new Map(insertedGroups.map((group) => [catalog.groups.find((candidate) => candidate.inviteCode === group.invite_code).key, group]));

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
  .insert(catalog.categories.map((category) => ({
    user_id: category.scope === "personal" ? DEMO_USER_ID : null,
    group_id: category.scope === "personal" ? null : rowByKey(groupRows, category.scope).id,
    name: category.name,
    icon: category.icon,
    color: category.color,
    sort_order: category.sortOrder,
  })))
  .select("id,name");
requireOk(categoryError, "insert categories");
const categoryRows = new Map(insertedCategories.map((row) => [catalog.categories.find((category) => category.name === row.name).key, row]));

const { data: insertedItems, error: itemError } = await supabase
  .from("product_items")
  .insert(catalog.items.map((item) => ({
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
  })))
  .select("id,name");
requireOk(itemError, "insert product items");
const itemRows = new Map(insertedItems.map((row) => [catalog.items.find((item) => item.name === row.name).slug, row]));

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
const { error: purchaseError } = await supabase.from("purchases").insert(purchaseRows);
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
const { error: snapshotError } = await supabase.from("product_inventory_snapshots").insert(snapshotRows);
requireOk(snapshotError, "insert inventory snapshots");

console.log(`Seeded ${catalog.groups.length} groups, ${catalog.items.length} items, ${purchaseRows.length} purchases, ${snapshotRows.length} snapshots.`);
```

- [ ] **Step 2: Run export immediately before seed**

Run:

```powershell
npm run db:demo:export
```

Expected: a fresh backup JSON path is printed.

- [ ] **Step 3: Run destructive seed**

Run:

```powershell
$env:BUYLOG_DEMO_RESET_CONFIRM='replace-demo-data'; npm run db:demo:seed; Remove-Item Env:BUYLOG_DEMO_RESET_CONFIRM
```

Expected:

```text
Seeded 2 groups, 24 items, 100+ purchases, 12+ snapshots.
```

- [ ] **Step 4: Commit**

Run:

```powershell
git add scripts/demo-data/seed-demo-data.mjs
git commit -m "chore: add destructive professor demo seed"
```

Expected: seed script committed, generated backup JSON still untracked.

## Task 5: Image URL Visibility in Items UI

**Files:**
- Create: one generated migration from `supabase migration new include_item_images_in_item_rpcs`
- Modify: `src/lib/items/items.ts`
- Modify: `src/lib/items/items.test.ts`
- Modify: `src/components/items/table.tsx`
- Modify: `src/components/items/detail.tsx`
- Modify: `src/components/items/items-widgets.test.tsx`

- [ ] **Step 1: Create a migration through the Supabase CLI**

Run:

```powershell
supabase migration new include_item_images_in_item_rpcs
```

Expected: Supabase CLI prints a new file under `supabase/migrations/` ending in `_include_item_images_in_item_rpcs.sql`.

- [ ] **Step 2: Extend the generated migration**

In the generated migration, replace `private.buylog_accessible_items`, `public.buylog_item_list`, and `public.buylog_item_detail` with the current definitions from `supabase/migrations/20260531074636_add_item_management_rpcs.sql`, adding `image_url text` in each relevant return table and select list.

Concrete SQL changes:

```sql
-- private.buylog_accessible_items returns:
image_url text,

-- private.buylog_accessible_items select list:
pi.image_url,

-- public.buylog_item_list returns:
image_url text,

-- filtered_items select list:
ai.image_url,

-- final select list:
fi.image_url,

-- public.buylog_item_detail returns:
image_url text,

-- detail select list:
ai.image_url,
```

Expected: all existing grants remain present and no table schema changes are introduced.

- [ ] **Step 3: Apply the migration to remote**

Run the project's established remote migration workflow. If using Supabase CLI, first inspect help:

```powershell
supabase db --help
supabase migration --help
```

Then apply the new migration to project `fervijwxdgkwjtcpzskx` using the supported command for the installed CLI.

Expected: remote schema cache recognizes `image_url` in `buylog_item_list` and `buylog_item_detail`.

- [ ] **Step 4: Map image URLs in item DTOs**

In `src/lib/items/items.ts`, add:

```ts
image_url: string | null;
```

to `ItemListRpcRow` and `ItemDetailRpcRow`, and add:

```ts
imageUrl: string;
```

to `ItemListRow`. Then map rows with:

```ts
imageUrl: row.image_url?.trim() ?? "",
```

Expected: `ItemDetail` inherits `imageUrl` from `ItemListRow`.

- [ ] **Step 5: Add item thumbnail rendering**

In `src/components/items/table.tsx`, render a stable 44px thumbnail before the item link:

```tsx
<div className="flex min-w-56 items-center gap-3">
  {item.imageUrl ? (
    <img
      alt=""
      className="size-11 shrink-0 rounded-md border border-hairline object-cover"
      height={44}
      loading="lazy"
      src={item.imageUrl}
      width={44}
    />
  ) : (
    <div className="grid size-11 shrink-0 place-items-center rounded-md border border-hairline bg-surface-soft text-xs font-semibold text-muted">
      {item.itemName.slice(0, 1)}
    </div>
  )}
  <div>
    <Link
      className="font-medium text-ink underline-offset-4 active:underline"
      href={`/items/${item.itemId}`}
    >
      {item.itemName}
    </Link>
    <p className="text-xs text-muted">{item.brand || "-"}</p>
  </div>
</div>
```

Expected: table row height remains stable and text does not overlap at mobile widths.

- [ ] **Step 6: Add detail hero image**

In `src/components/items/detail.tsx`, add an image panel above the metric grid:

```tsx
<div className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface-card p-4 sm:flex-row sm:items-center">
  {item.imageUrl ? (
    <img
      alt=""
      className="h-32 w-full rounded-md border border-hairline object-cover sm:w-44"
      height={128}
      src={item.imageUrl}
      width={176}
    />
  ) : (
    <div className="grid h-32 w-full place-items-center rounded-md border border-hairline bg-surface-soft text-2xl font-semibold text-muted sm:w-44">
      {item.itemName.slice(0, 1)}
    </div>
  )}
  <div className="min-w-0">
    <p className="text-sm text-muted">{item.brand || item.category}</p>
    <h2 className="break-words text-xl font-semibold text-ink">{item.itemName}</h2>
  </div>
</div>
```

Expected: image is visible on detail pages without adding a new Client Component.

- [ ] **Step 7: Update tests**

Add or update tests so `mapItemListRows` and `mapItemDetailRows` preserve `image_url`, and `ItemsTable` renders an `img` when `imageUrl` is present.

Run:

```powershell
npm test -- src/lib/items/items.test.ts src/components/items/items-widgets.test.tsx
```

Expected: tests pass.

- [ ] **Step 8: Commit**

Run:

```powershell
git add supabase/migrations src/lib/items/items.ts src/lib/items/items.test.ts src/components/items/table.tsx src/components/items/detail.tsx src/components/items/items-widgets.test.tsx
git commit -m "feat: show registered item images"
```

Expected: one commit for the image read path and UI.

## Task 6: Demo Data Verification Script

**Files:**
- Create: `scripts/demo-data/verify-demo-data.mjs`

- [ ] **Step 1: Create verification script**

Create `scripts/demo-data/verify-demo-data.mjs` with checks:

```js
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

import { DEMO_USER_ID } from "./catalog.mjs";

function loadEnv() {
  const file = fs.readFileSync(".env.local", "utf8");
  const env = Object.fromEntries(
    file
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      }),
  );
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    key: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function fail(message) {
  throw new Error(message);
}

async function countRows(supabase, table) {
  const { count, error } = await supabase.from(table).select("*", { head: true, count: "exact" });
  if (error) fail(`${table}: ${error.message}`);
  return count ?? 0;
}

const { url, key } = loadEnv();
if (!url || !key) fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const counts = {
  groups: await countRows(supabase, "groups"),
  groupMembers: await countRows(supabase, "group_members"),
  categories: await countRows(supabase, "categories"),
  items: await countRows(supabase, "product_items"),
  purchases: await countRows(supabase, "purchases"),
  snapshots: await countRows(supabase, "product_inventory_snapshots"),
};

if (counts.groups !== 2) fail(`expected 2 groups, got ${counts.groups}`);
if (counts.groupMembers !== 2) fail(`expected 2 memberships, got ${counts.groupMembers}`);
if (counts.items !== 24) fail(`expected 24 items, got ${counts.items}`);
if (counts.purchases < 100) fail(`expected at least 100 purchases, got ${counts.purchases}`);
if (counts.snapshots < 12) fail(`expected at least 12 snapshots, got ${counts.snapshots}`);

const { data: items, error: imageError } = await supabase
  .from("product_items")
  .select("id,name,image_url")
  .is("image_url", null);
if (imageError) fail(`image check: ${imageError.message}`);
if ((items ?? []).length > 0) fail(`items missing image_url: ${items.map((item) => item.name).join(", ")}`);

const { data: groups, error: groupError } = await supabase
  .from("group_members")
  .select("role, groups(id,name)")
  .eq("user_id", DEMO_USER_ID);
if (groupError) fail(`group scope check: ${groupError.message}`);
if ((groups ?? []).length !== 2) fail("demo viewer must belong to both groups");

const rpcChecks = [
  ["buylog_dashboard_kpis", { scope_type: "personal", scope_id: null, anchor_date: new Date().toISOString().slice(0, 10) }],
  ["buylog_monthly_spending", { scope_type: "personal", scope_id: null, anchor_date: new Date().toISOString().slice(0, 10), months: 6 }],
  ["buylog_item_filter_options", {}],
  ["buylog_item_list", { search_text: "", category_ids: [], group_filters: [], sort_key: "name", sort_direction: "asc", limit_count: 100, anchor_date: new Date().toISOString().slice(0, 10) }],
];

for (const [name, params] of rpcChecks) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) fail(`${name}: ${error.message}`);
  if (!Array.isArray(data) || data.length === 0) fail(`${name}: expected non-empty result`);
}

console.log(JSON.stringify(counts, null, 2));
```

- [ ] **Step 2: Run verification**

Run:

```powershell
npm run db:demo:verify
```

Expected: prints counts and exits with code 0.

- [ ] **Step 3: Commit**

Run:

```powershell
git add scripts/demo-data/verify-demo-data.mjs
git commit -m "chore: verify professor demo data"
```

Expected: verification script committed.

## Task 7: Full Local and Browser Verification

**Files:**
- No new files.

- [ ] **Step 1: Run full static verification**

Run:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all commands pass.

- [ ] **Step 2: Start local dev server**

Run:

```powershell
npm run dev
```

Expected: Next dev server starts on `http://localhost:3000` or the next available port.

- [ ] **Step 3: Browser smoke the demo paths**

Open these paths and confirm the data story:

```text
/ 
/items
/items?group=personal
/reports
```

Expected visible story:

- Dashboard personal scope has non-zero current month total, previous month comparison, category share, recent purchases, and replacement due rows.
- Scope selector shows `자취방 302호` and `캡스톤 실험실`.
- Use the scope selector to switch from personal to `자취방 302호`, then to `캡스톤 실험실`.
- Items list has 24 image-backed rows when unfiltered.
- Personal-only and each group filter produce plausible scoped rows.
- Reports page has six populated monthly buckets and filter options for categories, items, and stores.
- CSV export downloads non-empty rows.

- [ ] **Step 4: Record demo evidence**

Create screenshots under:

```text
artifacts/demo-data-evidence/
```

Expected screenshots:

- `dashboard-personal.png`
- `dashboard-home302.png`
- `items-with-images.png`
- `reports-six-months.png`

These are artifacts, not source files.

- [ ] **Step 5: Final commit if screenshots are not tracked**

Run:

```powershell
git status --short
```

Expected: only intended source changes are tracked. Do not commit screenshot artifacts unless the user explicitly asks for evidence files in git.

## Execution Order

1. Task 1: wire commands.
2. Task 2: define and test catalog.
3. Task 3: export current data.
4. Task 4: seed destructive replacement data.
5. Task 5: add item image visibility.
6. Task 6: verify seeded remote data.
7. Task 7: full local and browser smoke.

## Rollback Plan

If the seed result is wrong:

1. Keep the most recent JSON from `artifacts/demo-data-backups/`.
2. Restore rows through a one-off restore script or Supabase SQL editor in reverse FK order.
3. Re-run `npm run db:demo:verify`.
4. Do not run another destructive seed until the catalog test explains the bad data shape.

## Self-Review

Spec coverage:

- "All existing data deleted": covered by Task 4 with FK-safe app-domain deletion and explicit scope limits.
- "Realistic registered dummy data": covered by Task 2 catalog and Task 4 seed.
- "Personal and group data": covered by two groups plus personal scope.
- "Several months": covered by six purchase months and report/dashboard verification.
- "Images": covered by Supabase Storage upload, `image_url` values, RPC mapping, and UI rendering.

Concrete-content scan:

- Dynamic Supabase migration filename is intentionally created by CLI because Supabase CLI migration timestamps must not be invented manually.

Type consistency:

- Database field is `image_url`.
- RPC row fields use `image_url`.
- TypeScript view model field is `imageUrl`.
