# Items Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the read-only Items management surface: searchable/sortable/filterable item list, item detail pages, purchase history, price change, and repurchase forecast.

**Architecture:** Keep the current buylog-web pattern: Next.js 16 App Router server pages load authenticated view models through server-only service and query modules, Supabase RPCs return already-scoped DTO rows, and client JavaScript is limited to chart widgets. Item edit/delete controls are excluded until the permissions model is documented and implemented as a separate mutation feature.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.4, Supabase SQL RPC, date-fns/date-fns-tz, Recharts, lucide-react, Vitest/React Testing Library.

---

## Scope Check

This plan covers one subsystem: read-only Items management. It does not add item creation, item editing, item deletion, group membership editing, RLS policy rewrites, or write APIs. The only permissions work in this plan is a short architecture note that freezes the read model and records the required mutation gate.

## Next.js 16 Notes Checked

- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`: page `searchParams` and dynamic route `params` are Promises in this version.
- `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`: use `next/link` for item detail navigation and add `loading.tsx` for the dynamic detail route.
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`: keep Supabase access in Server Components/server-only modules; chart components can be Client Components.
- `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`: fetch database data in Server Components/services and stream dynamic route loading UI through route `loading.tsx`.

## File Structure

- Create `docs/architecture/item-permissions.md`
  - Records the read-only permission model and mutation gate for future edit/delete work.
- Create `supabase/migrations/20260531074636_add_item_management_rpcs.sql`
  - Adds scoped item list/detail/history RPCs using existing `private.current_buylog_user_id()` and group membership checks.
- Create `src/lib/items/items.ts`
  - Owns item DTO types, query-param parsing, href builders, and row mappers.
- Create `src/lib/items/items.test.ts`
  - Tests param parsing, href building, option mapping, row mapping, and price delta normalization.
- Create `src/lib/queries/items.ts`
  - Server-only Supabase RPC adapter for item filter options, item list, item detail, and purchase history.
- Create `src/lib/queries/items.test.ts`
  - Tests RPC names, serialized params, mapping, and error messages.
- Create `src/lib/services/items.ts`
  - Server-only view-model loader for `/items` and `/items/[itemId]`.
- Create `src/lib/services/items.test.ts`
  - Tests service composition and not-found behavior.
- Create `src/components/items/filter-bar.tsx`
  - GET form for search, sort, category filters, and group filters.
- Create `src/components/items/table.tsx`
  - Items list table with detail links and empty state.
- Create `src/components/items/detail.tsx`
  - Detail summary, purchase history table, price trend chart, and repurchase forecast panel.
- Create `src/components/items/items-widgets.test.tsx`
  - Tests filter form, table links, empty states, detail metrics, and chart empty state.
- Modify `src/app/items/page.tsx`
  - Replace placeholder with authenticated server-rendered items list.
- Create `src/app/items/[itemId]/page.tsx`
  - Authenticated server-rendered item detail page.
- Create `src/app/items/[itemId]/loading.tsx`
  - Skeleton loading state for dynamic item detail navigation.

## Public Query Params

- `/items?q=<text>`
- `/items?sort=name|category|group|last_purchase|purchase_count|total_spent|next_repurchase`
- `/items?dir=asc|desc`
- `/items?category=<uuid>` repeated for category filters
- `/items?group=personal` and `/items?group=group:<uuid>` repeated for personal/group filters
- `/items/[itemId]` uses the item UUID route segment and returns `notFound()` when the RPC returns no detail row.

## Task 1: Permission Model Note

**Files:**
- Create: `docs/architecture/item-permissions.md`

- [ ] **Step 1: Create the architecture directory**

Run:

```powershell
New-Item -ItemType Directory -Force -Path docs\architecture
```

Expected: `docs\architecture` exists.

- [ ] **Step 2: Write the permissions note**

Create `docs/architecture/item-permissions.md` with this exact content:

```markdown
# Item Permissions Model

## Current Items Management Release

The web Items release is read-only.

Readable items:

- Personal items are readable by the item owner.
- Group items are readable by users who are current members of that group.
- The list view can show all readable items, personal items only, or one or more readable groups.
- The detail view must return a result only when the requested item is readable by the current viewer.

The Supabase RPC layer is the source of truth for read authorization. UI filters are convenience controls, not authorization checks.

## Mutation Gate

Item create, edit, and delete controls stay out of the UI until a separate mutation permissions model is implemented.

Required decisions before enabling mutations:

- Who can edit a group item: group owner only, item creator only, or any group member.
- Who can delete a group item.
- Whether deleting an item is a hard delete, soft delete, or blocked when purchase history exists.
- Whether category changes are global, user-owned, or group-owned.
- Whether purchases remain immutable when item metadata changes.

## Expected Future Shape

Future write operations should use Server Actions or Route Handlers that call scoped mutation RPCs. They should not write directly from Client Components.
```

- [ ] **Step 3: Commit**

Run:

```powershell
git add docs/architecture/item-permissions.md
git commit -m "docs: document item permissions model"
```

Expected: one docs commit.

## Task 2: Supabase Item Management RPCs

**Files:**
- Create: `supabase/migrations/20260531074636_add_item_management_rpcs.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260531074636_add_item_management_rpcs.sql` with this exact SQL:

```sql
begin;

create or replace function private.buylog_accessible_items()
returns table (
  item_id uuid,
  item_name text,
  brand text,
  category_id uuid,
  category text,
  replacement_cycle_days int,
  group_id uuid,
  group_name text,
  group_role text
)
language sql
stable
set search_path = ''
as $$
  with viewer_user as (
    select private.current_buylog_user_id() as id
  )
  select
    pi.id as item_id,
    pi.name as item_name,
    pi.brand,
    pi.category_id,
    c.name as category,
    pi.replacement_cycle_days,
    pi.group_id,
    g.name as group_name,
    gm.role::text as group_role
  from public.product_items as pi
  cross join viewer_user as u
  left join public.categories as c on c.id = pi.category_id
  left join public.groups as g on g.id = pi.group_id
  left join public.group_members as gm
    on gm.group_id = pi.group_id
   and gm.user_id = u.id
  where (
      pi.group_id is null
      and pi.user_id = u.id
    ) or (
      pi.group_id is not null
      and gm.user_id = u.id
    );
$$;

revoke all on function private.buylog_accessible_items() from public;
grant execute on function private.buylog_accessible_items() to anon, authenticated;

create or replace function public.buylog_item_filter_options()
returns table (
  option_type text,
  option_id text,
  label text,
  secondary_label text
)
language sql
stable
set search_path = ''
as $$
  with accessible_items as (
    select *
    from private.buylog_accessible_items()
  )
  select distinct
    'category'::text as option_type,
    ai.category_id::text as option_id,
    ai.category as label,
    null::text as secondary_label
  from accessible_items as ai
  where ai.category_id is not null
  union all
  select distinct
    'group'::text as option_type,
    'personal'::text as option_id,
    '내 물품'::text as label,
    '개인'::text as secondary_label
  from accessible_items as ai
  where ai.group_id is null
  union all
  select distinct
    'group'::text as option_type,
    ('group:' || ai.group_id::text) as option_id,
    coalesce(ai.group_name, '그룹') as label,
    coalesce(ai.group_role, 'member') as secondary_label
  from accessible_items as ai
  where ai.group_id is not null
  order by option_type, label;
$$;

create or replace function public.buylog_item_list(
  search_text text default '',
  category_ids uuid[] default '{}'::uuid[],
  group_filters text[] default '{}'::text[],
  sort_key text default 'name',
  sort_direction text default 'asc',
  limit_count int default 100,
  anchor_date date default current_date
)
returns table (
  item_id uuid,
  item_name text,
  brand text,
  category_id uuid,
  category text,
  group_id uuid,
  group_name text,
  group_label text,
  replacement_cycle_days int,
  purchase_count bigint,
  total_spent bigint,
  last_purchase_date date,
  last_price int,
  expected_repurchase_date date,
  days_until_repurchase int
)
language sql
stable
set search_path = ''
as $$
  with normalized_params as (
    select
      lower(coalesce(search_text, '')) as normalized_search,
      case
        when sort_key in (
          'name',
          'category',
          'group',
          'last_purchase',
          'purchase_count',
          'total_spent',
          'next_repurchase'
        ) then sort_key
        else 'name'
      end as normalized_sort_key,
      case when sort_direction = 'desc' then 'desc' else 'asc' end as normalized_sort_direction,
      least(greatest(coalesce(limit_count, 100), 1), 200) as normalized_limit
  ),
  accessible_items as (
    select *
    from private.buylog_accessible_items()
  ),
  latest_purchase as (
    select distinct on (p.product_item_id)
      p.product_item_id,
      p.purchase_date,
      p.price
    from public.purchases as p
    join accessible_items as ai on ai.item_id = p.product_item_id
    order by p.product_item_id, p.purchase_date desc, p.created_at desc, p.id desc
  ),
  purchase_rollup as (
    select
      p.product_item_id,
      count(*)::bigint as purchase_count,
      coalesce(sum(p.price), 0)::bigint as total_spent
    from public.purchases as p
    join accessible_items as ai on ai.item_id = p.product_item_id
    group by p.product_item_id
  ),
  filtered_items as (
    select
      ai.item_id,
      ai.item_name,
      ai.brand,
      ai.category_id,
      ai.category,
      ai.group_id,
      ai.group_name,
      case
        when ai.group_id is null then '내 물품'
        else coalesce(ai.group_name, '그룹')
      end as group_label,
      ai.replacement_cycle_days,
      coalesce(pr.purchase_count, 0)::bigint as purchase_count,
      coalesce(pr.total_spent, 0)::bigint as total_spent,
      lp.purchase_date as last_purchase_date,
      lp.price as last_price,
      case
        when lp.purchase_date is null then null
        else (lp.purchase_date + coalesce(ai.replacement_cycle_days, 30))::date
      end as expected_repurchase_date,
      case
        when lp.purchase_date is null then null
        else ((lp.purchase_date + coalesce(ai.replacement_cycle_days, 30)) - anchor_date)::int
      end as days_until_repurchase
    from accessible_items as ai
    cross join normalized_params as np
    left join purchase_rollup as pr on pr.product_item_id = ai.item_id
    left join latest_purchase as lp on lp.product_item_id = ai.item_id
    where (
        np.normalized_search = ''
        or lower(ai.item_name) like ('%' || np.normalized_search || '%')
        or lower(coalesce(ai.brand, '')) like ('%' || np.normalized_search || '%')
        or lower(coalesce(ai.category, '')) like ('%' || np.normalized_search || '%')
      )
      and (
        coalesce(array_length(category_ids, 1), 0) = 0
        or ai.category_id = any(category_ids)
      )
      and (
        coalesce(array_length(group_filters, 1), 0) = 0
        or (ai.group_id is null and 'personal' = any(group_filters))
        or (ai.group_id is not null and ('group:' || ai.group_id::text) = any(group_filters))
      )
  )
  select
    fi.item_id,
    fi.item_name,
    fi.brand,
    fi.category_id,
    fi.category,
    fi.group_id,
    fi.group_name,
    fi.group_label,
    fi.replacement_cycle_days,
    fi.purchase_count,
    fi.total_spent,
    fi.last_purchase_date,
    fi.last_price,
    fi.expected_repurchase_date,
    fi.days_until_repurchase
  from filtered_items as fi
  cross join normalized_params as np
  order by
    case when np.normalized_sort_key = 'name' and np.normalized_sort_direction = 'asc' then lower(fi.item_name) end asc nulls last,
    case when np.normalized_sort_key = 'name' and np.normalized_sort_direction = 'desc' then lower(fi.item_name) end desc nulls last,
    case when np.normalized_sort_key = 'category' and np.normalized_sort_direction = 'asc' then lower(coalesce(fi.category, '')) end asc nulls last,
    case when np.normalized_sort_key = 'category' and np.normalized_sort_direction = 'desc' then lower(coalesce(fi.category, '')) end desc nulls last,
    case when np.normalized_sort_key = 'group' and np.normalized_sort_direction = 'asc' then lower(fi.group_label) end asc nulls last,
    case when np.normalized_sort_key = 'group' and np.normalized_sort_direction = 'desc' then lower(fi.group_label) end desc nulls last,
    case when np.normalized_sort_key = 'last_purchase' and np.normalized_sort_direction = 'asc' then fi.last_purchase_date end asc nulls last,
    case when np.normalized_sort_key = 'last_purchase' and np.normalized_sort_direction = 'desc' then fi.last_purchase_date end desc nulls last,
    case when np.normalized_sort_key = 'purchase_count' and np.normalized_sort_direction = 'asc' then fi.purchase_count end asc nulls last,
    case when np.normalized_sort_key = 'purchase_count' and np.normalized_sort_direction = 'desc' then fi.purchase_count end desc nulls last,
    case when np.normalized_sort_key = 'total_spent' and np.normalized_sort_direction = 'asc' then fi.total_spent end asc nulls last,
    case when np.normalized_sort_key = 'total_spent' and np.normalized_sort_direction = 'desc' then fi.total_spent end desc nulls last,
    case when np.normalized_sort_key = 'next_repurchase' and np.normalized_sort_direction = 'asc' then fi.expected_repurchase_date end asc nulls last,
    case when np.normalized_sort_key = 'next_repurchase' and np.normalized_sort_direction = 'desc' then fi.expected_repurchase_date end desc nulls last,
    lower(fi.item_name) asc
  limit (select normalized_limit from normalized_params);
$$;

create or replace function public.buylog_item_detail(
  target_item_id uuid,
  anchor_date date default current_date
)
returns table (
  item_id uuid,
  item_name text,
  brand text,
  category_id uuid,
  category text,
  group_id uuid,
  group_name text,
  group_label text,
  replacement_cycle_days int,
  purchase_count bigint,
  total_spent bigint,
  average_price numeric,
  min_price int,
  max_price int,
  last_purchase_date date,
  last_price int,
  last_store_name text,
  expected_repurchase_date date,
  days_until_repurchase int
)
language sql
stable
set search_path = ''
as $$
  with accessible_item as (
    select *
    from private.buylog_accessible_items()
    where item_id = target_item_id
  ),
  latest_purchase as (
    select distinct on (p.product_item_id)
      p.product_item_id,
      p.purchase_date,
      p.price,
      p.store_name
    from public.purchases as p
    join accessible_item as ai on ai.item_id = p.product_item_id
    order by p.product_item_id, p.purchase_date desc, p.created_at desc, p.id desc
  ),
  purchase_rollup as (
    select
      p.product_item_id,
      count(*)::bigint as purchase_count,
      coalesce(sum(p.price), 0)::bigint as total_spent,
      avg(p.price)::numeric as average_price,
      min(p.price)::int as min_price,
      max(p.price)::int as max_price
    from public.purchases as p
    join accessible_item as ai on ai.item_id = p.product_item_id
    group by p.product_item_id
  )
  select
    ai.item_id,
    ai.item_name,
    ai.brand,
    ai.category_id,
    ai.category,
    ai.group_id,
    ai.group_name,
    case
      when ai.group_id is null then '내 물품'
      else coalesce(ai.group_name, '그룹')
    end as group_label,
    ai.replacement_cycle_days,
    coalesce(pr.purchase_count, 0)::bigint as purchase_count,
    coalesce(pr.total_spent, 0)::bigint as total_spent,
    coalesce(pr.average_price, 0)::numeric as average_price,
    coalesce(pr.min_price, 0)::int as min_price,
    coalesce(pr.max_price, 0)::int as max_price,
    lp.purchase_date as last_purchase_date,
    lp.price as last_price,
    coalesce(nullif(trim(lp.store_name), ''), '미지정 매장') as last_store_name,
    case
      when lp.purchase_date is null then null
      else (lp.purchase_date + coalesce(ai.replacement_cycle_days, 30))::date
    end as expected_repurchase_date,
    case
      when lp.purchase_date is null then null
      else ((lp.purchase_date + coalesce(ai.replacement_cycle_days, 30)) - anchor_date)::int
    end as days_until_repurchase
  from accessible_item as ai
  left join purchase_rollup as pr on pr.product_item_id = ai.item_id
  left join latest_purchase as lp on lp.product_item_id = ai.item_id;
$$;

create or replace function public.buylog_item_purchase_history(
  target_item_id uuid,
  limit_count int default 50
)
returns table (
  purchase_id uuid,
  purchase_date date,
  store_name text,
  quantity int,
  price int,
  previous_price int,
  price_delta int,
  price_delta_ratio numeric
)
language sql
stable
set search_path = ''
as $$
  with authorized_item as (
    select item_id
    from private.buylog_accessible_items()
    where item_id = target_item_id
  ),
  ordered_purchases as (
    select
      p.id as purchase_id,
      p.purchase_date,
      coalesce(nullif(trim(p.store_name), ''), '미지정 매장') as store_name,
      greatest(coalesce(p.quantity, 1), 1)::int as quantity,
      coalesce(p.price, 0)::int as price,
      lag(coalesce(p.price, 0)::int) over (
        order by p.purchase_date asc, p.created_at asc, p.id asc
      ) as previous_price,
      p.created_at
    from public.purchases as p
    join authorized_item as ai on ai.item_id = p.product_item_id
  )
  select
    op.purchase_id,
    op.purchase_date,
    op.store_name,
    op.quantity,
    op.price,
    op.previous_price,
    case
      when op.previous_price is null then null
      else op.price - op.previous_price
    end as price_delta,
    case
      when op.previous_price is null or op.previous_price = 0 then null
      else ((op.price - op.previous_price)::numeric / op.previous_price::numeric)
    end as price_delta_ratio
  from ordered_purchases as op
  order by op.purchase_date desc, op.created_at desc, op.purchase_id desc
  limit least(greatest(coalesce(limit_count, 50), 1), 200);
$$;

grant execute on function public.buylog_item_filter_options() to anon, authenticated;
grant execute on function public.buylog_item_list(text, uuid[], text[], text, text, int, date) to anon, authenticated;
grant execute on function public.buylog_item_detail(uuid, date) to anon, authenticated;
grant execute on function public.buylog_item_purchase_history(uuid, int) to anon, authenticated;

commit;
```

- [ ] **Step 2: Validate the SQL syntax locally if Supabase CLI is available**

Run:

```powershell
supabase migration list
```

Expected: either the linked migration list prints, or the shell reports the Supabase CLI is not installed. If the CLI is unavailable, continue with TypeScript work and apply the migration during remote verification.

- [ ] **Step 3: Commit**

Run:

```powershell
git add supabase/migrations/20260531074636_add_item_management_rpcs.sql
git commit -m "feat: add item management read rpcs"
```

Expected: one migration commit.

## Task 3: Item Domain Mappers and Param Helpers

**Files:**
- Create: `src/lib/items/items.ts`
- Create: `src/lib/items/items.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/items/items.test.ts` with this exact content:

```ts
import { describe, expect, it } from "vitest";

import {
  buildItemsHref,
  mapItemDetailRows,
  mapItemFilterOptionRows,
  mapItemListRows,
  mapItemPurchaseHistoryRows,
  resolveItemListParams,
} from "@/lib/items/items";

const anchorDate = new Date("2026-05-31T12:00:00+09:00");

describe("item list params", () => {
  it("resolves defaults for empty search params", () => {
    expect(resolveItemListParams({}, anchorDate)).toEqual({
      search: "",
      sort: "name",
      direction: "asc",
      categories: [],
      groups: [],
      anchorDate: "2026-05-31",
      limit: 100,
    });
  });

  it("dedupes categories and groups while validating sort values", () => {
    expect(
      resolveItemListParams(
        {
          q: " shampoo ",
          sort: "total_spent",
          dir: "desc",
          category: ["cat-1", "", "cat-1", "cat-2"],
          group: ["personal", "group:g1", "bad", "group:g1"],
        },
        anchorDate,
      ),
    ).toEqual({
      search: "shampoo",
      sort: "total_spent",
      direction: "desc",
      categories: ["cat-1", "cat-2"],
      groups: ["personal", "group:g1"],
      anchorDate: "2026-05-31",
      limit: 100,
    });
  });

  it("builds list hrefs with repeated filters", () => {
    const href = buildItemsHref("/items", {
      search: "shampoo",
      sort: "last_purchase",
      direction: "desc",
      categories: ["cat-1"],
      groups: ["personal", "group:g1"],
      anchorDate: "2026-05-31",
      limit: 100,
    });

    expect(href).toBe(
      "/items?q=shampoo&sort=last_purchase&dir=desc&category=cat-1&group=personal&group=group%3Ag1",
    );
  });
});

describe("item mappers", () => {
  it("maps filter option rows into category and group groups", () => {
    expect(
      mapItemFilterOptionRows([
        {
          option_type: "category",
          option_id: "cat-1",
          label: "위생용품",
          secondary_label: null,
        },
        {
          option_type: "group",
          option_id: "personal",
          label: "내 물품",
          secondary_label: "개인",
        },
      ]),
    ).toEqual({
      categories: [{ id: "cat-1", label: "위생용품", secondaryLabel: "" }],
      groups: [{ id: "personal", label: "내 물품", secondaryLabel: "개인" }],
    });
  });

  it("maps item list rows with normalized text and numbers", () => {
    expect(
      mapItemListRows([
        {
          item_id: "item-1",
          item_name: "샴푸",
          brand: null,
          category_id: null,
          category: null,
          group_id: null,
          group_name: null,
          group_label: null,
          replacement_cycle_days: null,
          purchase_count: null,
          total_spent: null,
          last_purchase_date: null,
          last_price: null,
          expected_repurchase_date: null,
          days_until_repurchase: null,
        },
      ]),
    ).toEqual([
      {
        itemId: "item-1",
        itemName: "샴푸",
        brand: "",
        categoryId: null,
        category: "미분류",
        groupId: null,
        groupName: "",
        groupLabel: "내 물품",
        replacementCycleDays: null,
        purchaseCount: 0,
        totalSpent: 0,
        lastPurchaseDate: null,
        lastPrice: 0,
        expectedRepurchaseDate: null,
        daysUntilRepurchase: null,
      },
    ]);
  });

  it("maps detail and purchase history rows", () => {
    expect(
      mapItemDetailRows([
        {
          item_id: "item-1",
          item_name: "샴푸",
          brand: "브랜드",
          category_id: "cat-1",
          category: "위생용품",
          group_id: "g1",
          group_name: "가족",
          group_label: "가족",
          replacement_cycle_days: 45,
          purchase_count: 2,
          total_spent: 22000,
          average_price: 11000,
          min_price: 10000,
          max_price: 12000,
          last_purchase_date: "2026-05-20",
          last_price: 12000,
          last_store_name: "쿠팡",
          expected_repurchase_date: "2026-07-04",
          days_until_repurchase: 34,
        },
      ]),
    ).toMatchObject({
      itemId: "item-1",
      averagePrice: 11000,
      lastStoreName: "쿠팡",
      daysUntilRepurchase: 34,
    });

    expect(
      mapItemPurchaseHistoryRows([
        {
          purchase_id: "purchase-1",
          purchase_date: "2026-05-20",
          store_name: "쿠팡",
          quantity: 1,
          price: 12000,
          previous_price: 10000,
          price_delta: 2000,
          price_delta_ratio: 0.2,
        },
      ]),
    ).toEqual([
      {
        purchaseId: "purchase-1",
        purchaseDate: "2026-05-20",
        storeName: "쿠팡",
        quantity: 1,
        price: 12000,
        previousPrice: 10000,
        priceDelta: 2000,
        priceDeltaRatio: 0.2,
      },
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm test -- src/lib/items/items.test.ts
```

Expected: FAIL because `src/lib/items/items.ts` does not exist.

- [ ] **Step 3: Implement the item helpers**

Create `src/lib/items/items.ts` with this exact content:

```ts
import { formatKstDate } from "@/lib/format";

const DEFAULT_CATEGORY_NAME = "미분류";
const DEFAULT_GROUP_LABEL = "내 물품";

export type ItemSortKey =
  | "name"
  | "category"
  | "group"
  | "last_purchase"
  | "purchase_count"
  | "total_spent"
  | "next_repurchase";

export type ItemSortDirection = "asc" | "desc";
export type ItemParamSource =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

export type ItemListParams = {
  search: string;
  sort: ItemSortKey;
  direction: ItemSortDirection;
  categories: string[];
  groups: string[];
  anchorDate: string;
  limit: number;
};

export type ItemFilterOptionRpcRow = {
  option_type: "category" | "group" | string;
  option_id: string | null;
  label: string | null;
  secondary_label: string | null;
};

export type ItemFilterOption = {
  id: string;
  label: string;
  secondaryLabel: string;
};

export type ItemFilterOptions = {
  categories: ItemFilterOption[];
  groups: ItemFilterOption[];
};

export type ItemListRpcRow = {
  item_id: string;
  item_name: string;
  brand: string | null;
  category_id: string | null;
  category: string | null;
  group_id: string | null;
  group_name: string | null;
  group_label: string | null;
  replacement_cycle_days: number | null;
  purchase_count: number | null;
  total_spent: number | null;
  last_purchase_date: string | null;
  last_price: number | null;
  expected_repurchase_date: string | null;
  days_until_repurchase: number | null;
};

export type ItemListRow = {
  itemId: string;
  itemName: string;
  brand: string;
  categoryId: string | null;
  category: string;
  groupId: string | null;
  groupName: string;
  groupLabel: string;
  replacementCycleDays: number | null;
  purchaseCount: number;
  totalSpent: number;
  lastPurchaseDate: string | null;
  lastPrice: number;
  expectedRepurchaseDate: string | null;
  daysUntilRepurchase: number | null;
};

export type ItemDetailRpcRow = {
  item_id: string;
  item_name: string;
  brand: string | null;
  category_id: string | null;
  category: string | null;
  group_id: string | null;
  group_name: string | null;
  group_label: string | null;
  replacement_cycle_days: number | null;
  purchase_count: number | null;
  total_spent: number | null;
  average_price: number | string | null;
  min_price: number | null;
  max_price: number | null;
  last_purchase_date: string | null;
  last_price: number | null;
  last_store_name: string | null;
  expected_repurchase_date: string | null;
  days_until_repurchase: number | null;
};

export type ItemDetail = ItemListRow & {
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  lastStoreName: string;
};

export type ItemPurchaseHistoryRpcRow = {
  purchase_id: string;
  purchase_date: string;
  store_name: string | null;
  quantity: number | null;
  price: number | null;
  previous_price: number | null;
  price_delta: number | null;
  price_delta_ratio: number | string | null;
};

export type ItemPurchaseHistoryRow = {
  purchaseId: string;
  purchaseDate: string;
  storeName: string;
  quantity: number;
  price: number;
  previousPrice: number | null;
  priceDelta: number | null;
  priceDeltaRatio: number | null;
};

const validSortKeys = new Set<ItemSortKey>([
  "name",
  "category",
  "group",
  "last_purchase",
  "purchase_count",
  "total_spent",
  "next_repurchase",
]);

function getParamValues(source: ItemParamSource, key: string) {
  if (source instanceof URLSearchParams) return source.getAll(key);
  const value = source[key];
  if (Array.isArray(value)) return value;
  return value === undefined ? [] : [value];
}

function firstParam(source: ItemParamSource, key: string) {
  return getParamValues(source, key)[0];
}

function uniqueTrimmed(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const rawValue of values) {
    const value = rawValue.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }

  return result;
}

function normalizeGroups(values: string[]) {
  return uniqueTrimmed(values).filter(
    (value) => value === "personal" || value.startsWith("group:"),
  );
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function toOptionalNumber(value: number | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}

export function resolveItemListParams(
  source: ItemParamSource,
  anchorDate: Date = new Date(),
): ItemListParams {
  const requestedSort = firstParam(source, "sort");
  const sort: ItemSortKey =
    requestedSort && validSortKeys.has(requestedSort as ItemSortKey)
      ? (requestedSort as ItemSortKey)
      : "name";
  const direction: ItemSortDirection =
    firstParam(source, "dir") === "desc" ? "desc" : "asc";

  return {
    search: firstParam(source, "q")?.trim() ?? "",
    sort,
    direction,
    categories: uniqueTrimmed(getParamValues(source, "category")),
    groups: normalizeGroups(getParamValues(source, "group")),
    anchorDate: formatKstDate(anchorDate),
    limit: 100,
  };
}

export function buildItemsHref(path: string, params: ItemListParams) {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("q", params.search);
  if (params.sort !== "name") searchParams.set("sort", params.sort);
  if (params.direction !== "asc") searchParams.set("dir", params.direction);
  params.categories.forEach((category) =>
    searchParams.append("category", category),
  );
  params.groups.forEach((group) => searchParams.append("group", group));

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export function mapItemFilterOptionRows(
  rows: ItemFilterOptionRpcRow[],
): ItemFilterOptions {
  const options: ItemFilterOptions = {
    categories: [],
    groups: [],
  };

  const addOption = (
    target: ItemFilterOption[],
    row: ItemFilterOptionRpcRow,
    fallbackLabel: string,
  ) => {
    const label = row.label?.trim() || fallbackLabel;
    const id = row.option_id?.trim() || label;
    if (target.some((option) => option.id === id)) return;

    target.push({
      id,
      label,
      secondaryLabel: row.secondary_label?.trim() ?? "",
    });
  };

  for (const row of rows) {
    if (row.option_type === "category") {
      addOption(options.categories, row, DEFAULT_CATEGORY_NAME);
    } else if (row.option_type === "group") {
      addOption(options.groups, row, DEFAULT_GROUP_LABEL);
    }
  }

  return options;
}

export function mapItemListRows(rows: ItemListRpcRow[]): ItemListRow[] {
  return rows.map((row) => ({
    itemId: row.item_id,
    itemName: row.item_name,
    brand: row.brand ?? "",
    categoryId: row.category_id,
    category: row.category?.trim() || DEFAULT_CATEGORY_NAME,
    groupId: row.group_id,
    groupName: row.group_name ?? "",
    groupLabel: row.group_label?.trim() || DEFAULT_GROUP_LABEL,
    replacementCycleDays: toOptionalNumber(row.replacement_cycle_days),
    purchaseCount: toNumber(row.purchase_count),
    totalSpent: toNumber(row.total_spent),
    lastPurchaseDate: row.last_purchase_date,
    lastPrice: toNumber(row.last_price),
    expectedRepurchaseDate: row.expected_repurchase_date,
    daysUntilRepurchase: toOptionalNumber(row.days_until_repurchase),
  }));
}

export function mapItemDetailRows(rows: ItemDetailRpcRow[]): ItemDetail | null {
  const row = rows[0];
  if (!row) return null;

  return {
    itemId: row.item_id,
    itemName: row.item_name,
    brand: row.brand ?? "",
    categoryId: row.category_id,
    category: row.category?.trim() || DEFAULT_CATEGORY_NAME,
    groupId: row.group_id,
    groupName: row.group_name ?? "",
    groupLabel: row.group_label?.trim() || DEFAULT_GROUP_LABEL,
    replacementCycleDays: toOptionalNumber(row.replacement_cycle_days),
    purchaseCount: toNumber(row.purchase_count),
    totalSpent: toNumber(row.total_spent),
    averagePrice: toNumber(row.average_price),
    minPrice: toNumber(row.min_price),
    maxPrice: toNumber(row.max_price),
    lastPurchaseDate: row.last_purchase_date,
    lastPrice: toNumber(row.last_price),
    lastStoreName: row.last_store_name?.trim() || "미지정 매장",
    expectedRepurchaseDate: row.expected_repurchase_date,
    daysUntilRepurchase: toOptionalNumber(row.days_until_repurchase),
  };
}

export function mapItemPurchaseHistoryRows(
  rows: ItemPurchaseHistoryRpcRow[],
): ItemPurchaseHistoryRow[] {
  return rows.map((row) => ({
    purchaseId: row.purchase_id,
    purchaseDate: row.purchase_date,
    storeName: row.store_name?.trim() || "미지정 매장",
    quantity: Math.max(1, toNumber(row.quantity)),
    price: toNumber(row.price),
    previousPrice: toOptionalNumber(row.previous_price),
    priceDelta: toOptionalNumber(row.price_delta),
    priceDeltaRatio:
      row.price_delta_ratio === null || row.price_delta_ratio === undefined
        ? null
        : Number(row.price_delta_ratio),
  }));
}
```

- [ ] **Step 4: Run the item helper tests**

Run:

```powershell
npm test -- src/lib/items/items.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/lib/items/items.ts src/lib/items/items.test.ts
git commit -m "feat: add item view model mappers"
```

Expected: one helper commit.

## Task 4: Item Query RPC Adapter

**Files:**
- Create: `src/lib/queries/items.ts`
- Create: `src/lib/queries/items.test.ts`

- [ ] **Step 1: Write the failing query tests**

Create `src/lib/queries/items.test.ts` with this exact content:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getItemDetail,
  getItemFilterOptions,
  getItemList,
  getItemPurchaseHistory,
} from "@/lib/queries/items";
import type { ItemListParams } from "@/lib/items/items";

class FakeItemClient {
  calls: { name: string; params: Record<string, unknown> }[] = [];

  constructor(private readonly failName?: string) {}

  rpc<T = unknown>(name: string, params: Record<string, unknown>) {
    this.calls.push({ name, params });

    if (name === this.failName) {
      return Promise.resolve({ data: null, error: { message: "broken" } });
    }

    const dataByName: Record<string, unknown> = {
      buylog_item_filter_options: [
        {
          option_type: "category",
          option_id: "cat-1",
          label: "위생용품",
          secondary_label: null,
        },
      ],
      buylog_item_list: [
        {
          item_id: "item-1",
          item_name: "샴푸",
          brand: "브랜드",
          category_id: "cat-1",
          category: "위생용품",
          group_id: null,
          group_name: null,
          group_label: "내 물품",
          replacement_cycle_days: 30,
          purchase_count: 2,
          total_spent: 22000,
          last_purchase_date: "2026-05-20",
          last_price: 12000,
          expected_repurchase_date: "2026-06-19",
          days_until_repurchase: 19,
        },
      ],
      buylog_item_detail: [
        {
          item_id: "item-1",
          item_name: "샴푸",
          brand: "브랜드",
          category_id: "cat-1",
          category: "위생용품",
          group_id: null,
          group_name: null,
          group_label: "내 물품",
          replacement_cycle_days: 30,
          purchase_count: 2,
          total_spent: 22000,
          average_price: 11000,
          min_price: 10000,
          max_price: 12000,
          last_purchase_date: "2026-05-20",
          last_price: 12000,
          last_store_name: "쿠팡",
          expected_repurchase_date: "2026-06-19",
          days_until_repurchase: 19,
        },
      ],
      buylog_item_purchase_history: [
        {
          purchase_id: "purchase-1",
          purchase_date: "2026-05-20",
          store_name: "쿠팡",
          quantity: 1,
          price: 12000,
          previous_price: 10000,
          price_delta: 2000,
          price_delta_ratio: 0.2,
        },
      ],
    };

    return Promise.resolve({ data: dataByName[name] as T, error: null });
  }
}

const params: ItemListParams = {
  search: "샴푸",
  sort: "total_spent",
  direction: "desc",
  categories: ["cat-1"],
  groups: ["personal"],
  anchorDate: "2026-05-31",
  limit: 100,
};

describe("item query service", () => {
  it("loads filter options", async () => {
    const client = new FakeItemClient();

    const options = await getItemFilterOptions({ client });

    expect(client.calls).toEqual([
      { name: "buylog_item_filter_options", params: {} },
    ]);
    expect(options.categories[0]?.label).toBe("위생용품");
  });

  it("calls item list rpc with serialized filters", async () => {
    const client = new FakeItemClient();

    const rows = await getItemList({ client, params });

    expect(client.calls[0]).toEqual({
      name: "buylog_item_list",
      params: {
        search_text: "샴푸",
        category_ids: ["cat-1"],
        group_filters: ["personal"],
        sort_key: "total_spent",
        sort_direction: "desc",
        limit_count: 100,
        anchor_date: "2026-05-31",
      },
    });
    expect(rows[0]?.itemName).toBe("샴푸");
  });

  it("loads detail and purchase history", async () => {
    const client = new FakeItemClient();

    const detail = await getItemDetail({
      client,
      itemId: "item-1",
      anchorDate: "2026-05-31",
    });
    const history = await getItemPurchaseHistory({ client, itemId: "item-1" });

    expect(client.calls[0]).toEqual({
      name: "buylog_item_detail",
      params: { target_item_id: "item-1", anchor_date: "2026-05-31" },
    });
    expect(client.calls[1]).toEqual({
      name: "buylog_item_purchase_history",
      params: { target_item_id: "item-1", limit_count: 50 },
    });
    expect(detail?.lastStoreName).toBe("쿠팡");
    expect(history[0]?.priceDelta).toBe(2000);
  });

  it("includes rpc name in thrown errors", async () => {
    const client = new FakeItemClient("buylog_item_list");

    await expect(getItemList({ client, params })).rejects.toThrow(
      "buylog_item_list: broken",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm test -- src/lib/queries/items.test.ts
```

Expected: FAIL because `src/lib/queries/items.ts` does not exist.

- [ ] **Step 3: Implement the query adapter**

Create `src/lib/queries/items.ts` with this exact content:

```ts
import "server-only";

import {
  type ItemDetail,
  type ItemDetailRpcRow,
  type ItemFilterOptionRpcRow,
  type ItemFilterOptions,
  type ItemListParams,
  type ItemListRow,
  type ItemListRpcRow,
  type ItemPurchaseHistoryRow,
  type ItemPurchaseHistoryRpcRow,
  mapItemDetailRows,
  mapItemFilterOptionRows,
  mapItemListRows,
  mapItemPurchaseHistoryRows,
} from "@/lib/items/items";

export type ItemRpcClient = {
  rpc(name: string, params: Record<string, unknown>): unknown;
};

async function rpcRows<T>(
  client: ItemRpcClient,
  name: string,
  params: Record<string, unknown>,
): Promise<T[]> {
  const { data, error } = (await client.rpc(name, params)) as {
    data: T[] | null;
    error: { message: string } | null;
  };

  if (error) {
    throw new Error(`${name}: ${error.message}`);
  }

  return Array.isArray(data) ? data : [];
}

export async function getItemFilterOptions({
  client,
}: {
  client: ItemRpcClient;
}): Promise<ItemFilterOptions> {
  const rows = await rpcRows<ItemFilterOptionRpcRow>(
    client,
    "buylog_item_filter_options",
    {},
  );

  return mapItemFilterOptionRows(rows);
}

export async function getItemList({
  client,
  params,
}: {
  client: ItemRpcClient;
  params: ItemListParams;
}): Promise<ItemListRow[]> {
  const rows = await rpcRows<ItemListRpcRow>(client, "buylog_item_list", {
    search_text: params.search,
    category_ids: params.categories,
    group_filters: params.groups,
    sort_key: params.sort,
    sort_direction: params.direction,
    limit_count: params.limit,
    anchor_date: params.anchorDate,
  });

  return mapItemListRows(rows);
}

export async function getItemDetail({
  client,
  itemId,
  anchorDate,
}: {
  client: ItemRpcClient;
  itemId: string;
  anchorDate: string;
}): Promise<ItemDetail | null> {
  const rows = await rpcRows<ItemDetailRpcRow>(client, "buylog_item_detail", {
    target_item_id: itemId,
    anchor_date: anchorDate,
  });

  return mapItemDetailRows(rows);
}

export async function getItemPurchaseHistory({
  client,
  itemId,
  limit = 50,
}: {
  client: ItemRpcClient;
  itemId: string;
  limit?: number;
}): Promise<ItemPurchaseHistoryRow[]> {
  const rows = await rpcRows<ItemPurchaseHistoryRpcRow>(
    client,
    "buylog_item_purchase_history",
    {
      target_item_id: itemId,
      limit_count: limit,
    },
  );

  return mapItemPurchaseHistoryRows(rows);
}
```

- [ ] **Step 4: Run the query tests**

Run:

```powershell
npm test -- src/lib/queries/items.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/lib/queries/items.ts src/lib/queries/items.test.ts
git commit -m "feat: add item query adapter"
```

Expected: one query commit.

## Task 5: Item Services

**Files:**
- Create: `src/lib/services/items.ts`
- Create: `src/lib/services/items.test.ts`

- [ ] **Step 1: Write the failing service tests**

Create `src/lib/services/items.test.ts` with this exact content:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/queries/items", () => ({
  getItemDetail: vi.fn(),
  getItemFilterOptions: vi.fn(),
  getItemList: vi.fn(),
  getItemPurchaseHistory: vi.fn(),
}));

import {
  getItemDetail,
  getItemFilterOptions,
  getItemList,
  getItemPurchaseHistory,
} from "@/lib/queries/items";
import {
  loadItemDetailViewModel,
  loadItemsViewModel,
} from "@/lib/services/items";
import { createClient } from "@/lib/supabase/server";

const mockedCreateClient = vi.mocked(createClient);
const mockedGetItemDetail = vi.mocked(getItemDetail);
const mockedGetItemFilterOptions = vi.mocked(getItemFilterOptions);
const mockedGetItemList = vi.mocked(getItemList);
const mockedGetItemPurchaseHistory = vi.mocked(getItemPurchaseHistory);

const viewer = {
  id: "user-1",
  email: "user@example.com",
  displayName: "User",
  source: "auth" as const,
};

describe("item view model service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateClient.mockResolvedValue({ rpc: vi.fn() } as never);
    mockedGetItemFilterOptions.mockResolvedValue({
      categories: [{ id: "cat-1", label: "위생용품", secondaryLabel: "" }],
      groups: [{ id: "personal", label: "내 물품", secondaryLabel: "개인" }],
    });
    mockedGetItemList.mockResolvedValue([
      {
        itemId: "item-1",
        itemName: "샴푸",
        brand: "브랜드",
        categoryId: "cat-1",
        category: "위생용품",
        groupId: null,
        groupName: "",
        groupLabel: "내 물품",
        replacementCycleDays: 30,
        purchaseCount: 2,
        totalSpent: 22000,
        lastPurchaseDate: "2026-05-20",
        lastPrice: 12000,
        expectedRepurchaseDate: "2026-06-19",
        daysUntilRepurchase: 19,
      },
    ]);
    mockedGetItemDetail.mockResolvedValue({
      itemId: "item-1",
      itemName: "샴푸",
      brand: "브랜드",
      categoryId: "cat-1",
      category: "위생용품",
      groupId: null,
      groupName: "",
      groupLabel: "내 물품",
      replacementCycleDays: 30,
      purchaseCount: 2,
      totalSpent: 22000,
      averagePrice: 11000,
      minPrice: 10000,
      maxPrice: 12000,
      lastPurchaseDate: "2026-05-20",
      lastPrice: 12000,
      lastStoreName: "쿠팡",
      expectedRepurchaseDate: "2026-06-19",
      daysUntilRepurchase: 19,
    });
    mockedGetItemPurchaseHistory.mockResolvedValue([]);
  });

  it("loads item list filters and rows", async () => {
    const viewModel = await loadItemsViewModel({
      viewer,
      searchParams: {
        q: "샴푸",
        category: "cat-1",
        group: "personal",
        sort: "total_spent",
        dir: "desc",
      },
      anchorDate: new Date("2026-05-31T12:00:00+09:00"),
    });

    expect(viewModel.viewer).toBe(viewer);
    expect(viewModel.params).toMatchObject({
      search: "샴푸",
      sort: "total_spent",
      direction: "desc",
      categories: ["cat-1"],
      groups: ["personal"],
      anchorDate: "2026-05-31",
    });
    expect(viewModel.items[0]?.itemName).toBe("샴푸");
    expect(mockedGetItemFilterOptions).toHaveBeenCalledWith({
      client: expect.anything(),
    });
    expect(mockedGetItemList).toHaveBeenCalledWith({
      client: expect.anything(),
      params: viewModel.params,
    });
  });

  it("loads item detail with history", async () => {
    const viewModel = await loadItemDetailViewModel({
      viewer,
      itemId: "item-1",
      anchorDate: new Date("2026-05-31T12:00:00+09:00"),
    });

    expect(viewModel).not.toBeNull();
    expect(viewModel?.item.lastStoreName).toBe("쿠팡");
    expect(mockedGetItemDetail).toHaveBeenCalledWith({
      client: expect.anything(),
      itemId: "item-1",
      anchorDate: "2026-05-31",
    });
    expect(mockedGetItemPurchaseHistory).toHaveBeenCalledWith({
      client: expect.anything(),
      itemId: "item-1",
    });
  });

  it("returns null when detail rpc has no authorized item", async () => {
    mockedGetItemDetail.mockResolvedValueOnce(null);

    await expect(
      loadItemDetailViewModel({
        viewer,
        itemId: "missing",
        anchorDate: new Date("2026-05-31T12:00:00+09:00"),
      }),
    ).resolves.toBeNull();
    expect(mockedGetItemPurchaseHistory).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm test -- src/lib/services/items.test.ts
```

Expected: FAIL because `src/lib/services/items.ts` does not exist.

- [ ] **Step 3: Implement the services**

Create `src/lib/services/items.ts` with this exact content:

```ts
import "server-only";

import {
  getItemDetail,
  getItemFilterOptions,
  getItemList,
  getItemPurchaseHistory,
} from "@/lib/queries/items";
import {
  type ItemDetail,
  type ItemFilterOptions,
  type ItemListParams,
  type ItemListRow,
  type ItemParamSource,
  type ItemPurchaseHistoryRow,
  resolveItemListParams,
} from "@/lib/items/items";
import { createClient } from "@/lib/supabase/server";
import type { Viewer } from "@/lib/auth/viewer";

export type ItemsViewModel = {
  viewer: Viewer;
  params: ItemListParams;
  filterOptions: ItemFilterOptions;
  items: ItemListRow[];
};

export type ItemDetailViewModel = {
  viewer: Viewer;
  item: ItemDetail;
  history: ItemPurchaseHistoryRow[];
};

export async function loadItemsViewModel({
  viewer,
  searchParams,
  anchorDate = new Date(),
}: {
  viewer: Viewer;
  searchParams: ItemParamSource;
  anchorDate?: Date;
}): Promise<ItemsViewModel> {
  const supabase = await createClient();
  const params = resolveItemListParams(searchParams, anchorDate);
  const [filterOptions, items] = await Promise.all([
    getItemFilterOptions({ client: supabase }),
    getItemList({ client: supabase, params }),
  ]);

  return {
    viewer,
    params,
    filterOptions,
    items,
  };
}

export async function loadItemDetailViewModel({
  viewer,
  itemId,
  anchorDate = new Date(),
}: {
  viewer: Viewer;
  itemId: string;
  anchorDate?: Date;
}): Promise<ItemDetailViewModel | null> {
  const supabase = await createClient();
  const params = resolveItemListParams({}, anchorDate);
  const item = await getItemDetail({
    client: supabase,
    itemId,
    anchorDate: params.anchorDate,
  });

  if (!item) return null;

  const history = await getItemPurchaseHistory({
    client: supabase,
    itemId,
  });

  return {
    viewer,
    item,
    history,
  };
}
```

- [ ] **Step 4: Run the service tests**

Run:

```powershell
npm test -- src/lib/services/items.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/lib/services/items.ts src/lib/services/items.test.ts
git commit -m "feat: add item view model services"
```

Expected: one service commit.

## Task 6: Items List UI

**Files:**
- Create: `src/components/items/filter-bar.tsx`
- Create: `src/components/items/table.tsx`
- Create: `src/components/items/items-widgets.test.tsx`

- [ ] **Step 1: Write the failing component tests**

Create `src/components/items/items-widgets.test.tsx` with this exact content:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ItemDetailPanel } from "@/components/items/detail";
import { ItemsFilterBar } from "@/components/items/filter-bar";
import { ItemsTable } from "@/components/items/table";
import type {
  ItemDetail,
  ItemFilterOptions,
  ItemListParams,
  ItemListRow,
  ItemPurchaseHistoryRow,
} from "@/lib/items/items";

const params: ItemListParams = {
  search: "샴푸",
  sort: "total_spent",
  direction: "desc",
  categories: ["cat-1"],
  groups: ["personal"],
  anchorDate: "2026-05-31",
  limit: 100,
};

const filterOptions: ItemFilterOptions = {
  categories: [{ id: "cat-1", label: "위생용품", secondaryLabel: "" }],
  groups: [
    { id: "personal", label: "내 물품", secondaryLabel: "개인" },
    { id: "group:g1", label: "가족", secondaryLabel: "owner" },
  ],
};

const rows: ItemListRow[] = [
  {
    itemId: "item-1",
    itemName: "샴푸",
    brand: "브랜드",
    categoryId: "cat-1",
    category: "위생용품",
    groupId: null,
    groupName: "",
    groupLabel: "내 물품",
    replacementCycleDays: 30,
    purchaseCount: 2,
    totalSpent: 22000,
    lastPurchaseDate: "2026-05-20",
    lastPrice: 12000,
    expectedRepurchaseDate: "2026-06-19",
    daysUntilRepurchase: 19,
  },
];

const detail: ItemDetail = {
  ...rows[0],
  averagePrice: 11000,
  minPrice: 10000,
  maxPrice: 12000,
  lastStoreName: "쿠팡",
};

const history: ItemPurchaseHistoryRow[] = [
  {
    purchaseId: "purchase-1",
    purchaseDate: "2026-05-20",
    storeName: "쿠팡",
    quantity: 1,
    price: 12000,
    previousPrice: 10000,
    priceDelta: 2000,
    priceDeltaRatio: 0.2,
  },
];

describe("items widgets", () => {
  it("renders list filters with selected params", () => {
    render(<ItemsFilterBar filterOptions={filterOptions} params={params} />);

    expect(screen.getByLabelText("검색")).toHaveValue("샴푸");
    expect(screen.getByLabelText("정렬")).toHaveValue("total_spent");
    expect(screen.getByLabelText("방향")).toHaveValue("desc");
    expect(screen.getByLabelText("위생용품")).toBeChecked();
    expect(screen.getByLabelText("내 물품 개인")).toBeChecked();
    expect(screen.getByLabelText("가족 owner")).not.toBeChecked();
    expect(screen.getByRole("link", { name: "초기화" })).toHaveAttribute(
      "href",
      "/items",
    );
  });

  it("renders item table rows with detail links", () => {
    render(<ItemsTable items={rows} />);

    expect(screen.getByRole("link", { name: "샴푸" })).toHaveAttribute(
      "href",
      "/items/item-1",
    );
    expect(screen.getByText("₩22,000")).toBeInTheDocument();
    expect(screen.getByText("2026. 5. 20.")).toBeInTheDocument();
    expect(screen.getByText("2026. 6. 19.")).toBeInTheDocument();
  });

  it("renders item table empty state", () => {
    render(<ItemsTable items={[]} />);

    expect(screen.getByText("조건에 맞는 품목이 없습니다.")).toBeInTheDocument();
  });

  it("renders detail metrics and purchase history", () => {
    render(<ItemDetailPanel history={history} item={detail} />);

    expect(screen.getByText("구매 이력")).toBeInTheDocument();
    expect(screen.getByText("쿠팡")).toBeInTheDocument();
    expect(screen.getByText("+₩2,000")).toBeInTheDocument();
    expect(screen.getByText("재구매 예상")).toBeInTheDocument();
    expect(screen.getByText("19일 남음")).toBeInTheDocument();
  });

  it("renders detail empty history state", () => {
    render(<ItemDetailPanel history={[]} item={{ ...detail, purchaseCount: 0 }} />);

    expect(screen.getByText("아직 구매 이력이 없습니다.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm test -- src/components/items/items-widgets.test.tsx
```

Expected: FAIL because item components do not exist.

- [ ] **Step 3: Implement the filter bar**

Create `src/components/items/filter-bar.tsx` with this exact content:

```tsx
import { RotateCcw, Search } from "lucide-react";

import { buttonClassName } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import type {
  ItemFilterOption,
  ItemFilterOptions,
  ItemListParams,
} from "@/lib/items/items";

type ItemsFilterBarProps = {
  filterOptions: ItemFilterOptions;
  params: ItemListParams;
};

const sortOptions = [
  { value: "name", label: "이름" },
  { value: "category", label: "카테고리" },
  { value: "group", label: "그룹" },
  { value: "last_purchase", label: "최근 구매일" },
  { value: "purchase_count", label: "구매 횟수" },
  { value: "total_spent", label: "누적 지출" },
  { value: "next_repurchase", label: "재구매 예상" },
] as const;

function CheckboxGroup({
  title,
  name,
  options,
  selectedValues,
  emptyText,
}: {
  title: string;
  name: "category" | "group";
  options: ItemFilterOption[];
  selectedValues: string[];
  emptyText: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-ink">{title}</legend>
      {options.length === 0 ? (
        <p className="rounded-md border border-dashed border-hairline bg-surface-soft px-3 py-2 text-sm text-muted">
          {emptyText}
        </p>
      ) : (
        <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-hairline bg-canvas p-2">
          {options.map((option) => {
            const label = [option.label, option.secondaryLabel]
              .filter(Boolean)
              .join(" ");
            return (
              <label
                className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-body active:bg-surface-card"
                key={option.id}
              >
                <input
                  className="size-4 rounded border-hairline text-primary"
                  defaultChecked={selectedValues.includes(option.id)}
                  name={name}
                  type="checkbox"
                  value={option.id}
                />
                <span className="min-w-0 truncate">{label}</span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

export function ItemsFilterBar({ filterOptions, params }: ItemsFilterBarProps) {
  return (
    <Panel>
      <form action="/items" className="space-y-4" method="get">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_140px_auto] lg:items-end">
          <label className="space-y-1 text-sm font-medium text-body">
            <span>검색</span>
            <span className="relative block">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              />
              <input
                className="h-10 w-full rounded-md border border-hairline bg-canvas pl-9 pr-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                defaultValue={params.search}
                name="q"
                type="search"
              />
            </span>
          </label>

          <label className="space-y-1 text-sm font-medium text-body">
            <span>정렬</span>
            <select
              className="h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              defaultValue={params.sort}
              name="sort"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm font-medium text-body">
            <span>방향</span>
            <select
              className="h-10 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              defaultValue={params.direction}
              name="dir"
            >
              <option value="asc">오름차순</option>
              <option value="desc">내림차순</option>
            </select>
          </label>

          <div className="flex gap-2">
            <button className={buttonClassName("primary")} type="submit">
              적용
            </button>
            <a className={buttonClassName("secondary")} href="/items">
              <RotateCcw aria-hidden="true" className="size-4" />
              초기화
            </a>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <CheckboxGroup
            emptyText="선택 가능한 카테고리가 없습니다."
            name="category"
            options={filterOptions.categories}
            selectedValues={params.categories}
            title="카테고리"
          />
          <CheckboxGroup
            emptyText="선택 가능한 그룹이 없습니다."
            name="group"
            options={filterOptions.groups}
            selectedValues={params.groups}
            title="그룹"
          />
        </div>
      </form>
    </Panel>
  );
}
```

- [ ] **Step 4: Implement the table**

Create `src/components/items/table.tsx` with this exact content:

```tsx
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Panel } from "@/components/ui/panel";
import { formatKoreanDate, formatKrw } from "@/lib/format";
import type { ItemListRow } from "@/lib/items/items";

function dateOrDash(value: string | null) {
  return value ? formatKoreanDate(value) : "-";
}

function repurchaseText(item: ItemListRow) {
  if (!item.expectedRepurchaseDate) return "-";
  if (item.daysUntilRepurchase === null) return formatKoreanDate(item.expectedRepurchaseDate);
  if (item.daysUntilRepurchase < 0) return `${Math.abs(item.daysUntilRepurchase)}일 지남`;
  if (item.daysUntilRepurchase === 0) return "오늘";
  return formatKoreanDate(item.expectedRepurchaseDate);
}

export function ItemsTable({ items }: { items: ItemListRow[] }) {
  if (items.length === 0) {
    return (
      <Panel title="품목 목록">
        <EmptyState message="조건에 맞는 품목이 없습니다." />
      </Panel>
    );
  }

  return (
    <Panel title="품목 목록">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-hairline text-xs uppercase text-muted">
            <tr>
              <th className="py-2 pr-4 font-medium">품목</th>
              <th className="py-2 pr-4 font-medium">카테고리</th>
              <th className="py-2 pr-4 font-medium">그룹</th>
              <th className="py-2 pr-4 text-right font-medium">구매</th>
              <th className="py-2 pr-4 text-right font-medium">누적 지출</th>
              <th className="py-2 pr-4 font-medium">최근 구매</th>
              <th className="py-2 pr-4 font-medium">재구매 예상</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {items.map((item) => (
              <tr key={item.itemId}>
                <td className="py-3 pr-4">
                  <Link
                    className="font-medium text-ink underline-offset-4 active:underline"
                    href={`/items/${item.itemId}`}
                  >
                    {item.itemName}
                  </Link>
                  <p className="text-xs text-muted">{item.brand || "-"}</p>
                </td>
                <td className="py-3 pr-4 text-body">{item.category}</td>
                <td className="py-3 pr-4 text-body">{item.groupLabel}</td>
                <td className="py-3 pr-4 text-right text-body">
                  {item.purchaseCount}건
                </td>
                <td className="py-3 pr-4 text-right font-medium text-ink">
                  {formatKrw(item.totalSpent)}
                </td>
                <td className="whitespace-nowrap py-3 pr-4 text-body">
                  {dateOrDash(item.lastPurchaseDate)}
                </td>
                <td className="whitespace-nowrap py-3 pr-4 text-body">
                  {repurchaseText(item)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
```

- [ ] **Step 5: Run the component tests and capture the next missing module**

Run:

```powershell
npm test -- src/components/items/items-widgets.test.tsx
```

Expected: FAIL because `src/components/items/detail.tsx` does not exist. The list components should compile.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/components/items/filter-bar.tsx src/components/items/table.tsx src/components/items/items-widgets.test.tsx
git commit -m "feat: add items list widgets"
```

Expected: one UI commit. The component test still fails until Task 7 adds the detail component.

## Task 7: Item Detail UI

**Files:**
- Create: `src/components/items/detail.tsx`
- Modify: `src/components/items/items-widgets.test.tsx`

- [ ] **Step 1: Implement the detail panel**

Create `src/components/items/detail.tsx` with this exact content:

```tsx
"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { CHART_COLORS, CHART_GRID_COLOR } from "@/components/ui/chart-theme";
import { Panel } from "@/components/ui/panel";
import { formatKoreanDate, formatKrw } from "@/lib/format";
import type {
  ItemDetail,
  ItemPurchaseHistoryRow,
} from "@/lib/items/items";

function deltaText(value: number | null) {
  if (value === null) return "-";
  const formatted = formatKrw(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatKrw(0);
}

function daysText(value: number | null) {
  if (value === null) return "예상 없음";
  if (value < 0) return `${Math.abs(value)}일 지남`;
  if (value === 0) return "오늘";
  return `${value}일 남음`;
}

function trendData(history: ItemPurchaseHistoryRow[]) {
  return [...history]
    .reverse()
    .map((row) => ({
      date: row.purchaseDate,
      label: formatKoreanDate(row.purchaseDate),
      price: row.price,
    }));
}

function PriceTrendChart({ history }: { history: ItemPurchaseHistoryRow[] }) {
  const data = trendData(history);

  if (data.length === 0) {
    return <EmptyState message="가격 변화 데이터가 없습니다." />;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => formatKrw(Number(value))}
            tickLine={false}
            width={72}
          />
          <Tooltip
            formatter={(value) => [formatKrw(Number(value)), "가격"]}
            labelClassName="text-ink"
          />
          <Line
            dataKey="price"
            dot={{ r: 3 }}
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PurchaseHistoryTable({
  history,
}: {
  history: ItemPurchaseHistoryRow[];
}) {
  if (history.length === 0) {
    return <EmptyState message="아직 구매 이력이 없습니다." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-hairline text-xs uppercase text-muted">
          <tr>
            <th className="py-2 pr-4 font-medium">날짜</th>
            <th className="py-2 pr-4 font-medium">매장</th>
            <th className="py-2 pr-4 text-right font-medium">수량</th>
            <th className="py-2 pr-4 text-right font-medium">가격</th>
            <th className="py-2 pr-4 text-right font-medium">변화</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline-soft">
          {history.map((row) => {
            const increased = (row.priceDelta ?? 0) > 0;
            const decreased = (row.priceDelta ?? 0) < 0;
            const Icon = increased ? ArrowUpRight : ArrowDownRight;
            return (
              <tr key={row.purchaseId}>
                <td className="whitespace-nowrap py-3 pr-4 text-body">
                  {formatKoreanDate(row.purchaseDate)}
                </td>
                <td className="py-3 pr-4 text-body">{row.storeName}</td>
                <td className="py-3 pr-4 text-right text-body">
                  {row.quantity}
                </td>
                <td className="py-3 pr-4 text-right font-medium text-ink">
                  {formatKrw(row.price)}
                </td>
                <td
                  className={[
                    "py-3 pr-4 text-right font-medium",
                    increased ? "text-error" : "",
                    decreased ? "text-success" : "",
                    !increased && !decreased ? "text-muted" : "",
                  ].join(" ")}
                >
                  <span className="inline-flex items-center justify-end gap-1">
                    {row.priceDelta === null ? null : (
                      <Icon aria-hidden="true" className="size-4" />
                    )}
                    {deltaText(row.priceDelta)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ItemDetailPanel({
  item,
  history,
}: {
  item: ItemDetail;
  history: ItemPurchaseHistoryRow[];
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-4">
        <Panel description={item.groupLabel} title="소속">
          <p className="text-2xl font-medium text-ink">{item.category}</p>
        </Panel>
        <Panel description="전체 구매 횟수" title="구매">
          <p className="text-2xl font-medium text-ink">{item.purchaseCount}건</p>
        </Panel>
        <Panel description="누적 지출" title="금액">
          <p className="text-2xl font-medium text-ink">
            {formatKrw(item.totalSpent)}
          </p>
        </Panel>
        <Panel description={item.expectedRepurchaseDate ?? "예상 없음"} title="재구매 예상">
          <p className="text-2xl font-medium text-ink">
            {daysText(item.daysUntilRepurchase)}
          </p>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="가격 변화">
          <PriceTrendChart history={history} />
        </Panel>
        <Panel title="가격 요약">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">평균가</dt>
              <dd className="font-medium text-ink">{formatKrw(item.averagePrice)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">최저가</dt>
              <dd className="font-medium text-ink">{formatKrw(item.minPrice)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">최고가</dt>
              <dd className="font-medium text-ink">{formatKrw(item.maxPrice)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">최근 구매처</dt>
              <dd className="font-medium text-ink">{item.lastStoreName}</dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Panel title="구매 이력">
        <PurchaseHistoryTable history={history} />
      </Panel>
    </div>
  );
}
```

- [ ] **Step 2: Run the component tests**

Run:

```powershell
npm test -- src/components/items/items-widgets.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Commit**

Run:

```powershell
git add src/components/items/detail.tsx src/components/items/items-widgets.test.tsx
git commit -m "feat: add item detail widgets"
```

Expected: one detail UI commit.

## Task 8: App Router Pages

**Files:**
- Modify: `src/app/items/page.tsx`
- Create: `src/app/items/[itemId]/page.tsx`
- Create: `src/app/items/[itemId]/loading.tsx`

- [ ] **Step 1: Replace the items list page**

Replace `src/app/items/page.tsx` with this exact content:

```tsx
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ItemsFilterBar } from "@/components/items/filter-bar";
import { ItemsTable } from "@/components/items/table";
import { PageHeader } from "@/components/ui/page-header";
import { resolveViewer } from "@/lib/auth/viewer";
import { loadItemsViewModel } from "@/lib/services/items";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ItemsPage({ searchParams }: PageProps) {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  const params = await searchParams;
  let viewModel: Awaited<ReturnType<typeof loadItemsViewModel>> | null = null;
  let loadError: string | null = null;

  try {
    viewModel = await loadItemsViewModel({
      viewer,
      searchParams: params,
    });
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "품목 목록을 불러오지 못했습니다.";
  }

  if (loadError || !viewModel) {
    return (
      <AppShell viewer={viewer}>
        <section className="rounded-lg border border-error/30 bg-surface-card p-6 text-sm text-error">
          {loadError ?? "품목 목록을 불러오지 못했습니다."}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell viewer={viewer}>
      <div className="space-y-5">
        <PageHeader
          eyebrow={`${viewModel.items.length}개 품목`}
          title="Items"
          description="구매 이력과 재구매 예상이 있는 품목 목록"
        />

        <ItemsFilterBar
          filterOptions={viewModel.filterOptions}
          params={viewModel.params}
        />
        <ItemsTable items={viewModel.items} />
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: Add the dynamic detail page**

Create `src/app/items/[itemId]/page.tsx` with this exact content:

```tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ItemDetailPanel } from "@/components/items/detail";
import { buttonClassName } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { resolveViewer } from "@/lib/auth/viewer";
import { loadItemDetailViewModel } from "@/lib/services/items";

type PageProps = {
  params: Promise<{ itemId: string }>;
};

export default async function ItemDetailPage({ params }: PageProps) {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  const { itemId } = await params;
  const viewModel = await loadItemDetailViewModel({ viewer, itemId });

  if (!viewModel) notFound();

  const { item, history } = viewModel;

  return (
    <AppShell viewer={viewer}>
      <div className="space-y-5">
        <PageHeader
          eyebrow={[item.category, item.groupLabel].filter(Boolean).join(" · ")}
          title={item.itemName}
          description={item.brand || "브랜드 정보 없음"}
          actions={
            <Link className={buttonClassName("secondary")} href="/items">
              목록
            </Link>
          }
        />
        <ItemDetailPanel history={history} item={item} />
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 3: Add the dynamic detail loading state**

Create `src/app/items/[itemId]/loading.tsx` with this exact content:

```tsx
export default function ItemDetailLoading() {
  return (
    <div className="space-y-5">
      <div className="h-24 animate-pulse rounded-lg bg-surface-card" />
      <div className="grid gap-4 lg:grid-cols-4">
        <div className="h-32 animate-pulse rounded-lg bg-surface-card" />
        <div className="h-32 animate-pulse rounded-lg bg-surface-card" />
        <div className="h-32 animate-pulse rounded-lg bg-surface-card" />
        <div className="h-32 animate-pulse rounded-lg bg-surface-card" />
      </div>
      <div className="h-80 animate-pulse rounded-lg bg-surface-card" />
    </div>
  );
}
```

- [ ] **Step 4: Run targeted tests**

Run:

```powershell
npm test -- src/lib/items/items.test.ts src/lib/queries/items.test.ts src/lib/services/items.test.ts src/components/items/items-widgets.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Run typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS. If `.next/types` complains about stale App Router generated types, run `npm run build` once, then rerun `npm run typecheck`.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/app/items/page.tsx src/app/items/[itemId]/page.tsx src/app/items/[itemId]/loading.tsx
git commit -m "feat: add item management pages"
```

Expected: one page commit.

## Task 9: Remote RPC Application and Runtime Smoke

**Files:**
- No source file changes unless remote verification exposes a real defect.

- [ ] **Step 1: Apply the Supabase migration to the linked project**

Run from the repo root after Supabase CLI authentication/linking is available:

```powershell
supabase db push
```

Expected: migration `20260531074636_add_item_management_rpcs.sql` is applied to the linked Supabase project. If the CLI asks for confirmation, confirm only the new item management migration.

- [ ] **Step 2: Verify RPC presence in SQL editor or psql**

Run:

```sql
select
  routine_schema,
  routine_name
from information_schema.routines
where routine_schema in ('public', 'private')
  and routine_name in (
    'buylog_accessible_items',
    'buylog_item_filter_options',
    'buylog_item_list',
    'buylog_item_detail',
    'buylog_item_purchase_history'
  )
order by routine_schema, routine_name;
```

Expected rows:

```text
private | buylog_accessible_items
public  | buylog_item_detail
public  | buylog_item_filter_options
public  | buylog_item_list
public  | buylog_item_purchase_history
```

- [ ] **Step 3: Run full local verification**

Run:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all commands PASS.

- [ ] **Step 4: Start the app**

Run:

```powershell
npm run dev
```

Expected: Next dev server starts, normally at `http://localhost:3000`.

- [ ] **Step 5: Browser smoke**

Open:

```text
http://localhost:3000/items
```

Expected:

- The page redirects to `/login` when no auth/demo cookie exists.
- With demo login enabled, the Items page renders the filter panel and table.
- Searching updates `q`.
- Category and group checkboxes submit repeated query params.
- Sort and direction controls update the table.
- Clicking an item opens `/items/<itemId>`.
- The detail page shows summary metrics, price chart or empty state, purchase history, and repurchase forecast.
- No edit or delete button is visible.

## Self-Review

Spec coverage:

- Search: Task 2 `search_text`, Task 3 param parsing, Task 6 filter bar.
- Sorting: Task 2 `sort_key/sort_direction`, Task 3 validation, Task 6 controls.
- Category filter: Task 2 category options/list filter, Task 6 checkboxes.
- Group filter: Task 2 group options/list filter, Task 6 checkboxes.
- Item detail page: Task 8 `/items/[itemId]`.
- Purchase history: Task 2 history RPC, Task 7 table.
- Price change: Task 2 delta columns, Task 7 chart and delta column.
- Repurchase forecast: Task 2 expected date/days, Task 6 table column, Task 7 summary.
- Edit/delete gate: Task 1 permission model note and Task 9 browser smoke checks no mutation controls.

Placeholder scan:

- No `TBD`.
- No `TODO`.
- No "implement later".
- No unnamed tests.
- No code steps without code.

Type consistency:

- SQL row names match `Item*RpcRow` snake_case fields.
- Query params in `getItemList()` match the SQL RPC argument names.
- `ItemListParams.sort` values match SQL `sort_key` values and filter-bar `<option>` values.
- Detail page uses Next.js 16 `params: Promise<{ itemId: string }>` shape.
