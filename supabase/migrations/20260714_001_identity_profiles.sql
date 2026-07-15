-- FOT AI identity foundation. Run this migration in the Supabase SQL editor
-- or through the Supabase CLI after creating the project.
-- The public browser never talks to these tables directly; only the FOT AI
-- backend uses a server-side Supabase secret key.

create extension if not exists pgcrypto;

create table if not exists public.fot_profiles (
  id text primary key,
  username text,
  display_name text,
  avatar_emoji text not null default '✨',
  avatar_gradient text not null default 'lime',
  avatar_url text,
  preferences jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'disabled', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.fot_identities (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null references public.fot_profiles(id) on delete cascade,
  provider text not null check (provider in ('browser', 'telegram', 'password')),
  provider_subject text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subject)
);

create index if not exists fot_identities_profile_id_idx on public.fot_identities(profile_id);

create table if not exists public.fot_credentials (
  profile_id text primary key references public.fot_profiles(id) on delete cascade,
  password_hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.fot_devices (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null references public.fot_profiles(id) on delete cascade,
  provider text not null check (provider in ('browser', 'telegram', 'password')),
  device_name text,
  user_agent text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (profile_id, provider, device_name)
);

create or replace function public.fot_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fot_profiles_touch_updated_at on public.fot_profiles;
create trigger fot_profiles_touch_updated_at
before update on public.fot_profiles
for each row execute function public.fot_touch_updated_at();

drop trigger if exists fot_identities_touch_updated_at on public.fot_identities;
create trigger fot_identities_touch_updated_at
before update on public.fot_identities
for each row execute function public.fot_touch_updated_at();

alter table public.fot_profiles enable row level security;
alter table public.fot_identities enable row level security;
alter table public.fot_credentials enable row level security;
alter table public.fot_devices enable row level security;

-- Deny all direct browser/API access. The FOT AI server uses SUPABASE_SECRET_KEY
-- and is the only component allowed to access user identities.
revoke all on table public.fot_profiles from anon, authenticated;
revoke all on table public.fot_identities from anon, authenticated;
revoke all on table public.fot_credentials from anon, authenticated;
revoke all on table public.fot_devices from anon, authenticated;
grant select, insert, update, delete on table public.fot_profiles to service_role;
grant select, insert, update, delete on table public.fot_identities to service_role;
grant select, insert, update, delete on table public.fot_credentials to service_role;
grant select, insert, update, delete on table public.fot_devices to service_role;
