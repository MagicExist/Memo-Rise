-- AR-17 integration test (pgTAP): a new signup creates EXACTLY ONE profiles row via the U0 trigger.
-- Authored in U1 Code Generation; executed by `supabase test db` against local Supabase in Build & Test.

begin;
select plan(2);

-- Simulate Supabase Auth creating a new user; the handle_new_user() trigger (0002) should fire.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'ar17@example.com',
  crypt('irrelevant', gen_salt('bf')),
  now(),
  now()
);

select is(
  (select count(*) from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  1::bigint,
  'exactly one profile row is created for the new user (AR-17)'
);

select is(
  (select count(*) from public.profiles),
  1::bigint,
  'no extra profile rows are created'
);

select * from finish();
rollback;
