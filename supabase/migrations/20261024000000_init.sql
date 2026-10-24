-- PitchTest initial schema.
--
-- Security model
--   * RLS is enabled on every table and no policies are defined, so neither the publishable
--     key (anon role) nor a signed-in user can read or write any table directly.
--   * All access goes through the functions below (SECURITY DEFINER, fixed search_path).
--   * Public functions (granted to anon) only expose data that is public by design (a pitch
--     and its aggregate results) and the creation of an unpaid, locked order.
--   * Anything that must be trustworthy (casting a vote, marking paid / test, webhook dedupe)
--     is granted to service_role only, i.e. callable only with the server-side secret key.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- tables

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  round            smallint not null default 1 check (round between 1 and 20),
  parent_order_id  uuid references public.orders(id) on delete set null,
  company_name     text not null check (char_length(company_name) between 1 and 120),
  description      text not null check (char_length(description) between 10 and 1000),
  -- pending_payment -> paid (verified Whop payment) | test (judge demo; never counted as paid)
  status           text not null default 'pending_payment'
                   check (status in ('pending_payment', 'paid', 'test')),
  whop_checkout_id text,
  whop_payment_id  text unique,
  paid_at          timestamptz,
  created_at       timestamptz not null default now()
);
create index orders_parent_idx on public.orders(parent_order_id);

create table public.features (
  id       uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  position smallint not null check (position between 0 and 4),
  label    text not null check (char_length(label) between 2 and 120),
  unique (order_id, position)
);

create table public.votes (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders(id) on delete cascade,
  reason              text not null check (char_length(reason) between 3 and 200),
  -- salted hash computed server-side (Terac submission id, else ip + user agent)
  voter_key           text not null check (char_length(voter_key) = 64),
  terac_submission_id text,
  created_at          timestamptz not null default now(),
  unique (order_id, voter_key)
);
create index votes_order_idx on public.votes(order_id);

create table public.vote_rankings (
  vote_id    uuid not null references public.votes(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  rank       smallint not null check (rank between 1 and 5),  -- 1 = voter's top pick
  primary key (vote_id, feature_id),
  unique (vote_id, rank)
);
create index vote_rankings_feature_idx on public.vote_rankings(feature_id);

-- Processed Whop webhook deliveries, keyed by the webhook-id header.
create table public.webhook_events (
  id          text primary key,
  type        text not null,
  received_at timestamptz not null default now()
);

alter table public.orders         enable row level security;
alter table public.features       enable row level security;
alter table public.votes          enable row level security;
alter table public.vote_rankings  enable row level security;
alter table public.webhook_events enable row level security;

-- ---------------------------------------------------------------- results

-- Borda count per feature: top pick earns (n - 1) points, last earns 0.
create view public.feature_results with (security_invoker = true) as
select
  f.order_id,
  f.id        as feature_id,
  f.position,
  f.label,
  coalesce(sum(n.cnt - r.rank), 0)::int              as points,
  count(*) filter (where r.rank = 1)::int            as first_place_votes,
  round(avg(r.rank)::numeric, 2)                     as avg_rank,
  count(r.vote_id)::int                              as vote_count
from public.features f
join lateral (select count(*)::int as cnt from public.features f2 where f2.order_id = f.order_id) n on true
left join public.vote_rankings r on r.feature_id = f.id
group by f.order_id, f.id, f.position, f.label, n.cnt;

-- ---------------------------------------------------------------- public functions

create function public.create_order(
  p_company_name text,
  p_description  text,
  p_features     text[],
  p_parent_id    uuid default null
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_round smallint := 1;
  v_id    uuid;
  v_n     int := coalesce(array_length(p_features, 1), 0);
begin
  if v_n < 3 or v_n > 5 then
    raise exception 'Provide 3 to 5 features' using errcode = '22023';
  end if;
  if (select count(distinct lower(btrim(x))) from unnest(p_features) x) <> v_n then
    raise exception 'Features must be distinct' using errcode = '22023';
  end if;
  if p_parent_id is not null then
    select o.round + 1 into v_round from public.orders o where o.id = p_parent_id;
    if v_round is null then
      raise exception 'Parent order not found' using errcode = '22023';
    end if;
  end if;

  insert into public.orders (company_name, description, parent_order_id, round)
  values (btrim(p_company_name), btrim(p_description), p_parent_id, v_round)
  returning id into v_id;

  insert into public.features (order_id, position, label)
  select v_id, (ord - 1)::smallint, btrim(label)
  from unnest(p_features) with ordinality as t(label, ord);

  return v_id;
end $$;

create function public.get_order(p_id uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'id', o.id,
    'round', o.round,
    'parent_order_id', o.parent_order_id,
    'company_name', o.company_name,
    'description', o.description,
    'status', o.status,
    'created_at', o.created_at,
    'features', (
      select coalesce(jsonb_agg(f.label order by f.position), '[]'::jsonb)
      from public.features f where f.order_id = o.id
    )
  )
  from public.orders o where o.id = p_id
$$;

create function public.get_child_order_ids(p_id uuid) returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select o.id from public.orders o where o.parent_order_id = p_id order by o.created_at
$$;

create function public.get_results(p_order_id uuid)
returns table (position smallint, label text, points int, first_place_votes int, avg_rank numeric, vote_count int)
language sql stable security definer set search_path = ''
as $$
  select r.position, r.label, r.points, r.first_place_votes, r.avg_rank, r.vote_count
  from public.feature_results r where r.order_id = p_order_id order by r.position
$$;

create function public.get_vote_reasons(p_order_id uuid)
returns table (top_feature text, reason text, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select f.label, v.reason, v.created_at
  from public.votes v
  join public.vote_rankings r on r.vote_id = v.id and r.rank = 1
  join public.features f on f.id = r.feature_id
  where v.order_id = p_order_id
  order by v.created_at
$$;

-- ---------------------------------------------------------------- server-only functions

-- p_ranking lists feature positions, top pick first. Returns ok | duplicate | locked | invalid | not_found.
create function public.cast_vote(
  p_order_id            uuid,
  p_ranking             smallint[],
  p_reason              text,
  p_voter_key           text,
  p_terac_submission_id text default null
) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_status text;
  v_n      int;
  v_vote   uuid;
begin
  select o.status into v_status from public.orders o where o.id = p_order_id for share;
  if v_status is null then return 'not_found'; end if;
  if v_status not in ('paid', 'test') then return 'locked'; end if;

  select count(*) into v_n from public.features f where f.order_id = p_order_id;
  if coalesce(array_length(p_ranking, 1), 0) <> v_n
     or (select count(distinct x) from unnest(p_ranking) x where x between 0 and v_n - 1) <> v_n
     or char_length(btrim(coalesce(p_reason, ''))) not between 3 and 200 then
    return 'invalid';
  end if;

  begin
    insert into public.votes (order_id, reason, voter_key, terac_submission_id)
    values (p_order_id, btrim(p_reason), p_voter_key, p_terac_submission_id)
    returning id into v_vote;
  exception when unique_violation then
    return 'duplicate';
  end;

  insert into public.vote_rankings (vote_id, feature_id, rank)
  select v_vote, f.id, t.ord::smallint
  from unnest(p_ranking) with ordinality as t(pos, ord)
  join public.features f on f.order_id = p_order_id and f.position = t.pos;

  return 'ok';
end $$;

create function public.set_checkout_id(p_order_id uuid, p_checkout_id text) returns void
language sql security definer set search_path = ''
as $$
  update public.orders set whop_checkout_id = p_checkout_id where id = p_order_id
$$;

-- Only moves a pending order forward; never overwrites an existing payment.
create function public.mark_paid(p_order_id uuid, p_payment_id text) returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  update public.orders
     set status = 'paid', whop_payment_id = p_payment_id, paid_at = now()
   where id = p_order_id and status = 'pending_payment';
  return found;
end $$;

create function public.mark_test(p_order_id uuid) returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  update public.orders set status = 'test' where id = p_order_id and status = 'pending_payment';
  return found;
end $$;

-- Returns false when this delivery was already processed.
create function public.record_webhook_event(p_id text, p_type text) returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.webhook_events (id, type) values (p_id, p_type);
  return true;
exception when unique_violation then
  return false;
end $$;

-- ---------------------------------------------------------------- grants

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant execute on function public.create_order(text, text, text[], uuid) to anon, service_role;
grant execute on function public.get_order(uuid)                      to anon, service_role;
grant execute on function public.get_child_order_ids(uuid)            to anon, service_role;
grant execute on function public.get_results(uuid)                    to anon, service_role;
grant execute on function public.get_vote_reasons(uuid)               to anon, service_role;

grant execute on function public.cast_vote(uuid, smallint[], text, text, text) to service_role;
grant execute on function public.set_checkout_id(uuid, text)                   to service_role;
grant execute on function public.mark_paid(uuid, text)                         to service_role;
grant execute on function public.mark_test(uuid)                               to service_role;
grant execute on function public.record_webhook_event(text, text)              to service_role;
