begin;

create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.current_buylog_user_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (select auth.uid()),
    '08cccfe3-766f-43bd-b06c-8d909e0f9fe8'::uuid
  );
$$;

revoke all on function private.current_buylog_user_id() from public;
grant execute on function private.current_buylog_user_id() to anon, authenticated;

create or replace function public.buylog_dashboard_kpis(
  scope_type text,
  scope_id uuid,
  anchor_date date
)
returns table (
  month_total bigint,
  previous_month_total bigint,
  purchase_count bigint,
  top_category text,
  next_30_cost bigint,
  next_60_cost bigint,
  next_90_cost bigint
)
language sql
stable
set search_path = ''
as $$
  with viewer_user as (
    select private.current_buylog_user_id() as id
  ),
  scoped_items as (
    select pi.id, pi.category_id, pi.replacement_cycle_days
    from public.product_items as pi
    cross join viewer_user as u
    where (
      scope_type = 'personal'
      and pi.user_id = u.id
      and pi.group_id is null
    ) or (
      scope_type = 'group'
      and scope_id is not null
      and pi.group_id = scope_id
      and private.is_group_member(scope_id, u.id)
    )
  ),
  bounds as (
    select
      date_trunc('month', anchor_date)::date as month_start,
      (date_trunc('month', anchor_date)::date + interval '1 month')::date as next_month_start,
      (date_trunc('month', anchor_date)::date - interval '1 month')::date as previous_month_start
  ),
  current_purchases as (
    select p.price, c.name as category
    from public.purchases as p
    join scoped_items as si on si.id = p.product_item_id
    left join public.categories as c on c.id = si.category_id
    cross join bounds as b
    where p.purchase_date >= b.month_start
      and p.purchase_date < b.next_month_start
  ),
  previous_purchases as (
    select p.price
    from public.purchases as p
    join scoped_items as si on si.id = p.product_item_id
    cross join bounds as b
    where p.purchase_date >= b.previous_month_start
      and p.purchase_date < b.month_start
  ),
  top_category_row as (
    select cp.category
    from current_purchases as cp
    group by cp.category
    order by sum(cp.price) desc nulls last
    limit 1
  ),
  latest_purchase as (
    select distinct on (p.product_item_id)
      p.product_item_id,
      p.purchase_date,
      p.price
    from public.purchases as p
    join scoped_items as si on si.id = p.product_item_id
    order by p.product_item_id, p.purchase_date desc, p.created_at desc
  ),
  forecast as (
    select
      greatest(0, (lp.purchase_date + coalesce(si.replacement_cycle_days, 30)) - anchor_date) as days_until,
      coalesce(lp.price, 0) as expected_price
    from scoped_items as si
    join latest_purchase as lp on lp.product_item_id = si.id
    where lp.purchase_date + coalesce(si.replacement_cycle_days, 30) <= anchor_date + 90
  )
  select
    coalesce((select sum(price) from current_purchases), 0)::bigint as month_total,
    coalesce((select sum(price) from previous_purchases), 0)::bigint as previous_month_total,
    coalesce((select count(*) from current_purchases), 0)::bigint as purchase_count,
    (select category from top_category_row) as top_category,
    coalesce((select sum(expected_price) from forecast where days_until <= 30), 0)::bigint as next_30_cost,
    coalesce((select sum(expected_price) from forecast where days_until <= 60), 0)::bigint as next_60_cost,
    coalesce((select sum(expected_price) from forecast where days_until <= 90), 0)::bigint as next_90_cost;
$$;

create or replace function public.buylog_monthly_spending(
  scope_type text,
  scope_id uuid,
  anchor_date date,
  months int default 6
)
returns table (
  month date,
  total_amount bigint,
  purchase_count bigint
)
language sql
stable
set search_path = ''
as $$
  with viewer_user as (
    select private.current_buylog_user_id() as id
  ),
  scoped_items as (
    select pi.id
    from public.product_items as pi
    cross join viewer_user as u
    where (
      scope_type = 'personal'
      and pi.user_id = u.id
      and pi.group_id is null
    ) or (
      scope_type = 'group'
      and scope_id is not null
      and pi.group_id = scope_id
      and private.is_group_member(scope_id, u.id)
    )
  ),
  buckets as (
    select generate_series(
      date_trunc('month', anchor_date)::date - make_interval(months => greatest(months, 1) - 1),
      date_trunc('month', anchor_date)::date,
      interval '1 month'
    )::date as bucket_month
  )
  select
    b.bucket_month as month,
    coalesce(sum(p.price), 0)::bigint as total_amount,
    count(p.id)::bigint as purchase_count
  from buckets as b
  left join public.purchases as p
    on p.purchase_date >= b.bucket_month
   and p.purchase_date < (b.bucket_month + interval '1 month')::date
   and exists (
     select 1
     from scoped_items as si
     where si.id = p.product_item_id
   )
  group by b.bucket_month
  order by b.bucket_month;
$$;

create or replace function public.buylog_category_spending(
  scope_type text,
  scope_id uuid,
  period_start date,
  period_end date
)
returns table (
  category text,
  amount bigint,
  purchase_count bigint
)
language sql
stable
set search_path = ''
as $$
  with viewer_user as (
    select private.current_buylog_user_id() as id
  ),
  scoped_items as (
    select pi.id, pi.category_id
    from public.product_items as pi
    cross join viewer_user as u
    where (
      scope_type = 'personal'
      and pi.user_id = u.id
      and pi.group_id is null
    ) or (
      scope_type = 'group'
      and scope_id is not null
      and pi.group_id = scope_id
      and private.is_group_member(scope_id, u.id)
    )
  )
  select
    c.name as category,
    coalesce(sum(p.price), 0)::bigint as amount,
    count(p.id)::bigint as purchase_count
  from public.purchases as p
  join scoped_items as si on si.id = p.product_item_id
  left join public.categories as c on c.id = si.category_id
  where p.purchase_date >= period_start
    and p.purchase_date <= period_end
  group by c.name
  order by amount desc;
$$;

create or replace function public.buylog_replacement_due(
  scope_type text,
  scope_id uuid,
  anchor_date date,
  days int default 30
)
returns table (
  item_id uuid,
  item_name text,
  brand text,
  category text,
  last_purchase_date date,
  expected_replacement_date date,
  days_until_replacement int,
  expected_price int,
  remaining_quantity int
)
language sql
stable
set search_path = ''
as $$
  with viewer_user as (
    select private.current_buylog_user_id() as id
  ),
  scoped_items as (
    select pi.id, pi.name, pi.brand, pi.category_id, pi.replacement_cycle_days
    from public.product_items as pi
    cross join viewer_user as u
    where (
      scope_type = 'personal'
      and pi.user_id = u.id
      and pi.group_id is null
    ) or (
      scope_type = 'group'
      and scope_id is not null
      and pi.group_id = scope_id
      and private.is_group_member(scope_id, u.id)
    )
  ),
  latest_purchase as (
    select distinct on (p.product_item_id)
      p.product_item_id,
      p.purchase_date,
      p.price
    from public.purchases as p
    join scoped_items as si on si.id = p.product_item_id
    order by p.product_item_id, p.purchase_date desc, p.created_at desc
  )
  select
    si.id as item_id,
    si.name as item_name,
    si.brand,
    c.name as category,
    lp.purchase_date as last_purchase_date,
    (lp.purchase_date + coalesce(si.replacement_cycle_days, 30))::date as expected_replacement_date,
    ((lp.purchase_date + coalesce(si.replacement_cycle_days, 30)) - anchor_date)::int as days_until_replacement,
    coalesce(lp.price, 0)::int as expected_price,
    pis.remaining_quantity
  from scoped_items as si
  join latest_purchase as lp on lp.product_item_id = si.id
  left join public.categories as c on c.id = si.category_id
  left join public.product_inventory_snapshots as pis on pis.product_item_id = si.id
  where lp.purchase_date + coalesce(si.replacement_cycle_days, 30)
    between anchor_date and anchor_date + greatest(days, 0)
  order by expected_replacement_date, si.name;
$$;

create or replace function public.buylog_price_movements(
  scope_type text,
  scope_id uuid,
  anchor_date date,
  limit_count int default 5
)
returns table (
  item_id uuid,
  item_name text,
  brand text,
  category text,
  current_price int,
  previous_price int,
  current_store text,
  previous_store text
)
language sql
stable
set search_path = ''
as $$
  with viewer_user as (
    select private.current_buylog_user_id() as id
  ),
  scoped_items as (
    select pi.id, pi.name, pi.brand, pi.category_id
    from public.product_items as pi
    cross join viewer_user as u
    where (
      scope_type = 'personal'
      and pi.user_id = u.id
      and pi.group_id is null
    ) or (
      scope_type = 'group'
      and scope_id is not null
      and pi.group_id = scope_id
      and private.is_group_member(scope_id, u.id)
    )
  ),
  ranked as (
    select
      si.id,
      si.name,
      si.brand,
      c.name as category,
      p.price,
      p.store_name,
      row_number() over (
        partition by si.id
        order by p.purchase_date desc, p.created_at desc
      ) as purchase_rank
    from scoped_items as si
    join public.purchases as p on p.product_item_id = si.id
    left join public.categories as c on c.id = si.category_id
    where p.purchase_date <= anchor_date
  ),
  paired as (
    select
      r.id,
      r.name,
      r.brand,
      r.category,
      max(r.price) filter (where r.purchase_rank = 1) as current_price,
      max(r.price) filter (where r.purchase_rank = 2) as previous_price,
      max(r.store_name) filter (where r.purchase_rank = 1) as current_store,
      max(r.store_name) filter (where r.purchase_rank = 2) as previous_store
    from ranked as r
    where r.purchase_rank <= 2
    group by r.id, r.name, r.brand, r.category
  )
  select
    p.id as item_id,
    p.name as item_name,
    p.brand,
    p.category,
    p.current_price::int,
    p.previous_price::int,
    p.current_store,
    p.previous_store
  from paired as p
  where p.current_price is not null
    and p.previous_price is not null
    and p.current_price <> p.previous_price
  order by abs(p.current_price - p.previous_price) desc
  limit greatest(limit_count, 0);
$$;

create or replace function public.buylog_recent_purchases(
  scope_type text,
  scope_id uuid,
  anchor_date date,
  limit_count int default 8
)
returns table (
  purchase_id uuid,
  item_id uuid,
  item_name text,
  brand text,
  category text,
  purchase_date date,
  price int,
  quantity int,
  store_name text
)
language sql
stable
set search_path = ''
as $$
  with viewer_user as (
    select private.current_buylog_user_id() as id
  ),
  scoped_items as (
    select pi.id, pi.name, pi.brand, pi.category_id
    from public.product_items as pi
    cross join viewer_user as u
    where (
      scope_type = 'personal'
      and pi.user_id = u.id
      and pi.group_id is null
    ) or (
      scope_type = 'group'
      and scope_id is not null
      and pi.group_id = scope_id
      and private.is_group_member(scope_id, u.id)
    )
  )
  select
    p.id as purchase_id,
    si.id as item_id,
    si.name as item_name,
    si.brand,
    c.name as category,
    p.purchase_date,
    p.price,
    p.quantity,
    p.store_name
  from public.purchases as p
  join scoped_items as si on si.id = p.product_item_id
  left join public.categories as c on c.id = si.category_id
  where p.purchase_date <= anchor_date
  order by p.purchase_date desc, p.created_at desc
  limit greatest(limit_count, 0);
$$;

grant execute on function public.buylog_dashboard_kpis(text, uuid, date) to anon, authenticated;
grant execute on function public.buylog_monthly_spending(text, uuid, date, int) to anon, authenticated;
grant execute on function public.buylog_category_spending(text, uuid, date, date) to anon, authenticated;
grant execute on function public.buylog_replacement_due(text, uuid, date, int) to anon, authenticated;
grant execute on function public.buylog_price_movements(text, uuid, date, int) to anon, authenticated;
grant execute on function public.buylog_recent_purchases(text, uuid, date, int) to anon, authenticated;

commit;
