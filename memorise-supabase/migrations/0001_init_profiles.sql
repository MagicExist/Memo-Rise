-- U0 Foundation — profiles table + RLS.
-- Establishes the reusable RLS pattern (US-28 / SEC-5/6): every user-data table created in
-- later units MUST follow this shape — enable RLS + per-operation policies keyed to auth.uid().

create table if not exists public.profiles (
    user_id          uuid primary key references auth.users (id) on delete cascade,
    xp               integer not null default 0 check (xp >= 0),
    level            integer not null default 1 check (level >= 1),
    current_streak   integer not null default 0 check (current_streak >= 0),
    last_review_date date,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);

-- RLS: deny by default, then allow only own-row access.
alter table public.profiles enable row level security;

create policy "profiles_select_own"
    on public.profiles for select
    using (user_id = auth.uid());

create policy "profiles_update_own"
    on public.profiles for update
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- Note: INSERT is performed by the signup trigger (security definer) in 0002 — no direct
-- user INSERT policy. DELETE cascades from auth.users — no direct user DELETE policy.
