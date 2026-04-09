create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_cents bigint not null,
  region text not null check (region in ('us', 'eu', 'apac')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

do $$ begin
  create policy "users read own orders"
    on public.orders for select
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

create or replace function public.run_safe_query(query_sql text)
returns jsonb
language plpgsql
security invoker
as $$
declare
  result jsonb;
begin
  set local statement_timeout = '10s';
  execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (%s) t', query_sql)
    into result;
  return result;
end;
$$;

revoke all on function public.run_safe_query from public;
grant execute on function public.run_safe_query to authenticated;
