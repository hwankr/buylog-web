begin;

create or replace function private.buylog_report_filtered_purchases(
  scope_type text,
  scope_id uuid,
  period_start date,
  period_end date,
  category_ids uuid[] default '{}'::uuid[],
  item_ids uuid[] default '{}'::uuid[],
  store_names text[] default '{}'::text[]
)
returns table (
  purchase_id uuid,
  purchase_date date,
  item_id uuid,
  item_name text,
  brand text,
  category_id uuid,
  category text,
  store_name text,
  quantity int,
  price int
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
  normalized_purchases as (
    select
      p.id as purchase_id,
      p.purchase_date,
      si.id as item_id,
      si.name as item_name,
      si.brand,
      si.category_id,
      c.name as category,
      coalesce(nullif(trim(p.store_name), ''), '미지정 매장') as store_name,
      p.quantity,
      p.price
    from public.purchases as p
    join scoped_items as si on si.id = p.product_item_id
    left join public.categories as c on c.id = si.category_id
    where p.purchase_date >= period_start
      and p.purchase_date <= period_end
  )
  select
    np.purchase_id,
    np.purchase_date,
    np.item_id,
    np.item_name,
    np.brand,
    np.category_id,
    np.category,
    np.store_name,
    np.quantity,
    np.price
  from normalized_purchases as np
  where (
      coalesce(array_length(category_ids, 1), 0) = 0
      or np.category_id = any(category_ids)
    )
    and (
      coalesce(array_length(item_ids, 1), 0) = 0
      or np.item_id = any(item_ids)
    )
    and (
      coalesce(array_length(store_names, 1), 0) = 0
      or np.store_name = any(store_names)
    );
$$;

revoke all on function private.buylog_report_filtered_purchases(
  text,
  uuid,
  date,
  date,
  uuid[],
  uuid[],
  text[]
) from public;
grant execute on function private.buylog_report_filtered_purchases(
  text,
  uuid,
  date,
  date,
  uuid[],
  uuid[],
  text[]
) to anon, authenticated;

create or replace function public.buylog_report_filter_options(
  scope_type text,
  scope_id uuid
)
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
  store_options as (
    select distinct coalesce(nullif(trim(p.store_name), ''), '미지정 매장') as store_name
    from public.purchases as p
    join scoped_items as si on si.id = p.product_item_id
  )
  select distinct
    'category'::text as option_type,
    c.id::text as option_id,
    c.name as label,
    null::text as secondary_label
  from scoped_items as si
  join public.categories as c on c.id = si.category_id
  union all
  select
    'item'::text as option_type,
    si.id::text as option_id,
    si.name as label,
    coalesce(nullif(si.brand, ''), c.name) as secondary_label
  from scoped_items as si
  left join public.categories as c on c.id = si.category_id
  union all
  select
    'store'::text as option_type,
    so.store_name as option_id,
    so.store_name as label,
    null::text as secondary_label
  from store_options as so
  order by option_type, label;
$$;

create or replace function public.buylog_report_spending_trend(
  scope_type text,
  scope_id uuid,
  period_start date,
  period_end date,
  category_ids uuid[] default '{}'::uuid[],
  item_ids uuid[] default '{}'::uuid[],
  store_names text[] default '{}'::text[],
  trend_grain text default 'month'
)
returns table (
  bucket date,
  total_amount bigint,
  purchase_count bigint
)
language sql
stable
set search_path = ''
as $$
  with bucket_config as (
    select
      case
        when trend_grain = 'year' then date_trunc('year', period_start)::date
        else date_trunc('month', period_start)::date
      end as first_bucket,
      case
        when trend_grain = 'year' then date_trunc('year', period_end)::date
        else date_trunc('month', period_end)::date
      end as last_bucket,
      case
        when trend_grain = 'year' then interval '1 year'
        else interval '1 month'
      end as step_interval
  ),
  buckets as (
    select generate_series(
      bc.first_bucket,
      bc.last_bucket,
      bc.step_interval
    )::date as bucket
    from bucket_config as bc
  ),
  purchases as (
    select *
    from private.buylog_report_filtered_purchases(
      scope_type,
      scope_id,
      period_start,
      period_end,
      category_ids,
      item_ids,
      store_names
    )
  )
  select
    b.bucket,
    coalesce(sum(p.price), 0)::bigint as total_amount,
    count(p.purchase_id)::bigint as purchase_count
  from buckets as b
  cross join bucket_config as bc
  left join purchases as p
    on p.purchase_date >= b.bucket
   and p.purchase_date < (b.bucket + bc.step_interval)::date
  group by b.bucket
  order by b.bucket;
$$;

create or replace function public.buylog_report_category_share(
  scope_type text,
  scope_id uuid,
  period_start date,
  period_end date,
  category_ids uuid[] default '{}'::uuid[],
  item_ids uuid[] default '{}'::uuid[],
  store_names text[] default '{}'::text[]
)
returns table (
  category_id uuid,
  category text,
  amount bigint,
  purchase_count bigint
)
language sql
stable
set search_path = ''
as $$
  select
    p.category_id,
    p.category,
    coalesce(sum(p.price), 0)::bigint as amount,
    count(p.purchase_id)::bigint as purchase_count
  from private.buylog_report_filtered_purchases(
    scope_type,
    scope_id,
    period_start,
    period_end,
    category_ids,
    item_ids,
    store_names
  ) as p
  group by p.category_id, p.category
  order by amount desc, category;
$$;

create or replace function public.buylog_report_item_spending(
  scope_type text,
  scope_id uuid,
  period_start date,
  period_end date,
  category_ids uuid[] default '{}'::uuid[],
  item_ids uuid[] default '{}'::uuid[],
  store_names text[] default '{}'::text[]
)
returns table (
  item_id uuid,
  item_name text,
  brand text,
  category text,
  amount bigint,
  purchase_count bigint
)
language sql
stable
set search_path = ''
as $$
  select
    p.item_id,
    p.item_name,
    p.brand,
    p.category,
    coalesce(sum(p.price), 0)::bigint as amount,
    count(p.purchase_id)::bigint as purchase_count
  from private.buylog_report_filtered_purchases(
    scope_type,
    scope_id,
    period_start,
    period_end,
    category_ids,
    item_ids,
    store_names
  ) as p
  group by p.item_id, p.item_name, p.brand, p.category
  order by amount desc, p.item_name;
$$;

create or replace function public.buylog_report_store_spending(
  scope_type text,
  scope_id uuid,
  period_start date,
  period_end date,
  category_ids uuid[] default '{}'::uuid[],
  item_ids uuid[] default '{}'::uuid[],
  store_names text[] default '{}'::text[]
)
returns table (
  store_name text,
  amount bigint,
  purchase_count bigint
)
language sql
stable
set search_path = ''
as $$
  select
    p.store_name,
    coalesce(sum(p.price), 0)::bigint as amount,
    count(p.purchase_id)::bigint as purchase_count
  from private.buylog_report_filtered_purchases(
    scope_type,
    scope_id,
    period_start,
    period_end,
    category_ids,
    item_ids,
    store_names
  ) as p
  group by p.store_name
  order by amount desc, p.store_name;
$$;

create or replace function public.buylog_report_purchase_export(
  scope_type text,
  scope_id uuid,
  period_start date,
  period_end date,
  category_ids uuid[] default '{}'::uuid[],
  item_ids uuid[] default '{}'::uuid[],
  store_names text[] default '{}'::text[]
)
returns table (
  purchase_id uuid,
  purchase_date date,
  item_name text,
  brand text,
  category text,
  store_name text,
  quantity int,
  price int
)
language sql
stable
set search_path = ''
as $$
  select
    p.purchase_id,
    p.purchase_date,
    p.item_name,
    p.brand,
    p.category,
    p.store_name,
    p.quantity,
    p.price
  from private.buylog_report_filtered_purchases(
    scope_type,
    scope_id,
    period_start,
    period_end,
    category_ids,
    item_ids,
    store_names
  ) as p
  order by p.purchase_date desc, p.item_name, p.purchase_id;
$$;

grant execute on function public.buylog_report_filter_options(text, uuid) to anon, authenticated;
grant execute on function public.buylog_report_spending_trend(text, uuid, date, date, uuid[], uuid[], text[], text) to anon, authenticated;
grant execute on function public.buylog_report_category_share(text, uuid, date, date, uuid[], uuid[], text[]) to anon, authenticated;
grant execute on function public.buylog_report_item_spending(text, uuid, date, date, uuid[], uuid[], text[]) to anon, authenticated;
grant execute on function public.buylog_report_store_spending(text, uuid, date, date, uuid[], uuid[], text[]) to anon, authenticated;
grant execute on function public.buylog_report_purchase_export(text, uuid, date, date, uuid[], uuid[], text[]) to anon, authenticated;

commit;
