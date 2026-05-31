begin;

drop function if exists public.buylog_item_purchase_history(uuid, int);
drop function if exists public.buylog_item_detail(uuid, date);
drop function if exists public.buylog_item_list(text, uuid[], text[], text, text, int, date);
drop function if exists public.buylog_item_filter_options();
drop function if exists private.buylog_accessible_items();

create or replace function private.buylog_accessible_items()
returns table (
  item_id uuid,
  item_name text,
  brand text,
  image_url text,
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
    pi.image_url,
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
  image_url text,
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
      ai.image_url,
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
    fi.image_url,
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
  image_url text,
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
    ai.image_url,
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
