# memorise-supabase

Supabase project for MemoRise: SQL-first migrations + version-controlled Auth configuration.

The Supabase CLI project lives in the [`supabase/`](./supabase/) subdirectory (`config.toml`,
`migrations/`, `tests/`) — the layout the CLI expects. Run all `supabase` commands from this
directory (`memorise-supabase/`). Local services use the **`5532x`** ports (see `supabase/config.toml`)
so this stack coexists with other local Supabase projects.

## Migrations (SQL-first)

```bash
supabase migration new <name>   # create a migration
supabase db reset               # rebuild local DB from migrations (also runs tests locally)
supabase db push                # apply migrations to the linked project
```

Current migrations:

- `0001_init_profiles.sql` — `profiles` table + RLS policies (U0)
- `0002_profiles_signup_trigger.sql` — trigger creating a `profiles` row on signup (U0)

## Auth configuration (config-as-code)

Auth settings live in [`supabase/config.toml`](./supabase/config.toml) under `[auth]` / `[auth.email]` and are applied
by the Supabase CLI (`supabase db push` / `supabase link`) — version-controlled and reproduced
across local and production. See U1 decision **Q1 = config-as-code**.

Configured in `config.toml`:

| Setting | Value | Rule |
|---|---|---|
| Email/password signup | enabled | US-01/02 |
| Minimum password length | 8 | AR-1 |
| Email confirmations | non-blocking (off locally; sent, non-gating in prod) | AR-5/6 |
| Access-token TTL | 3600s (~1h) | U1-SESS-1 |
| Refresh-token rotation | on | U1-SESS-1 |
| Anonymous sign-ins | disabled | US-04 |
| Rate limiting | Supabase defaults (not overridden) | Q2 |

### Dashboard fallback (settings not expressible in `config.toml`)

Set these once per environment in the Supabase dashboard (Authentication settings):

- [ ] **Leaked-password protection (HaveIBeenPwned)** — **Enable** (AR-2 / Q4).
- [ ] **Production Site URL & Redirect URLs** — set the deployed web origin and `…/reset/confirm`
      (local defaults are in `config.toml`).
- [ ] **Email templates** (confirmation / reset) — minimal MVP copy, English-only (US-24).

No secrets are stored in `config.toml`; keys/URLs come from environment variables.
