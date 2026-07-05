-- U0 Foundation — auto-create a profiles row for every new auth user (Q2: trigger-based).
-- Guarantees a 1:1 profile with no application-side race.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
