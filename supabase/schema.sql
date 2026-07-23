-- ============================================================================
-- run — pilot database schema
-- Run this in the Supabase SQL Editor (one time).
-- Creates: profiles, runs, invite_codes + Row Level Security + invite redemption
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per user, extends Supabase's built-in auth.users.
create table if not exists public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	display_name text not null,
	created_at timestamptz not null default now()
);

-- One row per logged run.
create table if not exists public.runs (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles (id) on delete cascade,
	distance_km numeric(6, 2) not null check (distance_km > 0 and distance_km < 1000),
	run_date date not null default current_date,
	notes text,
	created_at timestamptz not null default now()
);

create index if not exists runs_user_id_idx on public.runs (user_id);
create index if not exists runs_run_date_idx on public.runs (run_date);

-- Invite codes gate who can join the pilot.
create table if not exists public.invite_codes (
	code text primary key,
	active boolean not null default true,
	max_uses int,
	uses int not null default 0,
	created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- Rules the database enforces on every request — this is what makes a
-- browser-only app safe.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.runs enable row level security;
alter table public.invite_codes enable row level security;

-- profiles: any signed-in user can read (needed to show names on matches);
-- you can only create/edit your own.
create policy "profiles: read (authenticated)"
	on public.profiles for select to authenticated using (true);

create policy "profiles: insert own"
	on public.profiles for insert to authenticated with check (id = auth.uid());

create policy "profiles: update own"
	on public.profiles for update to authenticated
	using (id = auth.uid()) with check (id = auth.uid());

-- runs: any signed-in user can read all runs (needed for distance matching);
-- you can only write your own.
create policy "runs: read (authenticated)"
	on public.runs for select to authenticated using (true);

create policy "runs: insert own"
	on public.runs for insert to authenticated with check (user_id = auth.uid());

create policy "runs: update own"
	on public.runs for update to authenticated
	using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "runs: delete own"
	on public.runs for delete to authenticated using (user_id = auth.uid());

-- invite_codes: intentionally NO policies -> not readable or writable from the
-- browser at all. Only the security-definer function below may touch it.

-- ---------------------------------------------------------------------------
-- Invite redemption
-- Runs with elevated rights (security definer) so it can check invite_codes
-- without exposing them to the client. Called right after signup: it validates
-- the code and creates the user's profile in one step.
-- ---------------------------------------------------------------------------

create or replace function public.redeem_invite(invite_code text, name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	c public.invite_codes%rowtype;
begin
	select * into c from public.invite_codes where code = invite_code for update;

	if not found or not c.active then
		raise exception 'invalid_invite';
	end if;

	if c.max_uses is not null and c.uses >= c.max_uses then
		raise exception 'invite_exhausted';
	end if;

	-- Create the profile for the currently signed-in user.
	insert into public.profiles (id, display_name)
	values (auth.uid(), coalesce(nullif(trim(name), ''), 'Runner'))
	on conflict (id) do nothing;

	update public.invite_codes set uses = uses + 1 where code = c.code;
end;
$$;

grant execute on function public.redeem_invite(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Seed one invite code for the pilot. Change the code / cap as you like.
-- ---------------------------------------------------------------------------

insert into public.invite_codes (code, active, max_uses)
values ('OSAKA2026', true, 50)
on conflict (code) do nothing;
