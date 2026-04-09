create extension if not exists pgcrypto;

-- Profiles table to store user info on signup
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile
do $$ begin
  create policy "users read own profile"
    on public.profiles for select
    using (auth.uid() = id);
exception when duplicate_object then null;
end $$;

-- Users can update their own profile
do $$ begin
  create policy "users update own profile"
    on public.profiles for update
    using (auth.uid() = id);
exception when duplicate_object then null;
end $$;

-- Allow insert from service role or the user themselves
do $$ begin
  create policy "users insert own profile"
    on public.profiles for insert
    with check (auth.uid() = id);
exception when duplicate_object then null;
end $$;

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  );
  return new;
end;
$$;

-- Drop trigger if it already exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Safe query helper
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
