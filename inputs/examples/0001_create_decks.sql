-- ============================================================
-- EXAMPLE MIGRATION — canonical pattern for MemoRise
-- File naming: <timestamp>_<description>.sql  (Supabase CLI convention)
-- This file is the SOURCE OF TRUTH for the `decks` table schema.
-- ============================================================

-- 1. The table -----------------------------------------------
create table decks (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        not null references auth.users (id) on delete cascade,
    name        text        not null check (char_length(name) between 1 and 100),
    created_at  timestamptz not null default now()
);

-- Index the foreign key we filter on constantly ("my decks")
create index decks_user_id_idx on decks (user_id);

-- 2. Enable Row-Level Security (RLS) -------------------------
-- Without this line, the policies below do nothing AND the table
-- is wide open. RLS-on from day one is a project rule.
alter table decks enable row level security;

-- 3. Policies — one per operation ----------------------------
-- auth.uid() returns the id of the user making the request
-- (derived from the JWT). Each policy restricts rows to that user.

create policy "users select own decks"
    on decks for select
    using (auth.uid() = user_id);

create policy "users insert own decks"
    on decks for insert
    with check (auth.uid() = user_id);

create policy "users update own decks"
    on decks for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "users delete own decks"
    on decks for delete
    using (auth.uid() = user_id);