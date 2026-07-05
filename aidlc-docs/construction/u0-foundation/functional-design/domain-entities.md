# U0 Foundation — Domain Entities

U0 introduces one domain entity (`profiles`) and the **RLS-enabled table pattern** that every
later unit's tables must follow. Technology-agnostic; concrete SQL types land in Code Generation.

---

## Entity: `profiles`
One row per user, 1:1 with the Supabase Auth user. Holds gamification state read by the dashboard.

| Field | Type (indicative) | Rules / default |
|---|---|---|
| `user_id` | UUID (PK, FK → `auth.users.id`) | identity; on-delete cascade with the auth user |
| `xp` | integer | default `0`; never negative; monotonically non-decreasing (enforced by U3 logic) |
| `level` | integer | default `1`; **stored**, updated atomically in `rate_card` (Q1); derivation function defined in U3 |
| `current_streak` | integer | default `0`; hard-reset rule defined in U3 |
| `last_review_date` | date (nullable) | null until first review; used by streak logic (U3) |
| `created_at` | timestamptz | set on insert |
| `updated_at` | timestamptz | set on write |

**Notes**
- The `level`/`streak`/`last_review_date` *update logic* belongs to U3; U0 only defines the schema + defaults so later units have a stable profile to write to.
- No PII beyond the auth linkage is stored here.

---

## Pattern: RLS-enabled table (inherited by U1–U5)
Every user-data table created in any unit MUST follow this pattern (US-28, SEC-5/6):

1. `enable row level security` on the table.
2. A per-operation policy set (select / insert / update / delete) keyed to `auth.uid()` so a user can only reach their own rows.
3. Ownership is expressed via a direct `user_id` column or via a foreign key chain to an owned row (e.g. cards → decks → user).
4. The backend forwards the user JWT so these policies apply at the DB (defense in depth, on top of app-level checks).

**`profiles` policies (concrete example of the pattern):**
- select/update: `user_id = auth.uid()`
- insert: performed by the signup trigger (see business-logic-model.md), not by end users.
- delete: cascaded from the auth user; no direct user delete policy.

---

## Config / settings (not a DB entity — runtime shape)
U0 also defines the settings object loaded from environment (validated at startup):
`ANTHROPIC_MODEL` (default = Claude Sonnet), `AI_INPUT_MAX_CHARS` (~5000), `AI_MAX_CARDS` (~20),
Supabase URL/keys, DB connection string, JWT/JWKS config, environment name. Secrets come only from
env vars; `.env` is gitignored and `.env.example` documents the keys (SEC-10/12).
