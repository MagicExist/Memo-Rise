# U1 — Accounts & Auth — Domain Entities

Technology-agnostic entities and DTOs for U1. Auth identity is **owned by Supabase Auth**
(`auth.users`); MemoRise owns the 1:1 `profiles` row (created by the U0 signup trigger). U1 adds
no new tables — it introduces request/response DTOs and the in-app session/user representation.

---

## 1. Persistent entities (existing — owned elsewhere)

### `auth.users` (Supabase-managed — NOT ours to migrate)
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | Subject (`sub`) claim in the JWT |
| email | citext | Unique; login identifier |
| encrypted_password | — | Managed by Supabase (adaptive hash — SEC-12) |
| email_confirmed_at | timestamptz \| null | Set when the verification link is followed; **not gated on** (Q5) |
| created_at | timestamptz | |

We never read/write this table directly; we interact via the Supabase Auth API (frontend) and
verify its issued JWT (backend).

### `profiles` (MemoRise-owned — created in U0, unchanged by U1)
1:1 with `auth.users`; auto-created by `handle_new_user()` trigger on signup.
| Field | Type | Notes |
|---|---|---|
| user_id | uuid (PK, FK→auth.users.id, cascade) | |
| xp / level / current_streak | int | Gamification (U3) — untouched in U1 |
| last_review_date | date \| null | |
| created_at / updated_at | timestamptz | |

**U1 relationship rule:** exactly one `profiles` row per `auth.users` row; guaranteed by the
trigger + `on delete cascade`. U1's only data concern is to *verify* this holds (a test), not build it.

---

## 2. Value objects / DTOs (new in U1)

Types are indicative (Pydantic on backend where applicable; TypeScript on frontend). Because auth
is frontend-direct (Q1), most of these live in the **frontend** (`memorise-web/`); the backend gains
only a small `AuthenticatedUser` view derived from the verified JWT.

### `Email` (value object)
- Non-empty string, trimmed, lowercased, matches a pragmatic email shape.
- Used by the pure `is_valid_email` validation helper (PBT target — see `testable-properties.md`).

### `Password` (transient value object — never persisted by us)
- Plaintext only in transit to Supabase over TLS; **never logged, never stored** (SEC-03/12).
- Client-side pre-check: length ≥ 8. Authoritative policy (length + breached-list) enforced by Supabase (Q4).

### `SignupRequest`
| Field | Type |
|---|---|
| email | Email |
| password | Password |

### `LoginRequest`
| Field | Type |
|---|---|
| email | Email |
| password | Password |

### `PasswordResetRequest` (step 1 — request the email)
| Field | Type |
|---|---|
| email | Email |

### `PasswordUpdate` (step 2 — set new password from the reset link session)
| Field | Type |
|---|---|
| new_password | Password |

### `SessionInfo` (frontend view of the Supabase session)
| Field | Type | Notes |
|---|---|---|
| access_token | string (JWT) | Held in httpOnly cookie via `@supabase/ssr` (Q2) |
| refresh_token | string | httpOnly cookie; refreshed by middleware |
| expires_at | epoch seconds | Drives silent refresh |
| user | AuthenticatedUser | |

### `AuthenticatedUser` (the identity both layers agree on)
| Field | Type | Source |
|---|---|---|
| user_id | uuid | JWT `sub` (backend: `get_current_user_id`) |
| email | Email | JWT / Supabase user |
| email_confirmed | bool | Informational only — never blocks access (Q5) |

### `AuthError` (normalized, non-enumerating — SEC-15)
| Field | Type | Notes |
|---|---|---|
| code | enum: `invalid_credentials` \| `weak_password` \| `rate_limited` \| `unknown` | |
| message | string | **Generic** user-facing copy; no user-enumeration, no internals |

---

## 3. Entity relationship (text)

```
auth.users (Supabase)  1 ──── 1  profiles (MemoRise)
      │                              (U0 trigger creates on signup;
      │                               cascade delete)
      └── issues JWT ──► AuthenticatedUser (sub = user_id)
                              │
                              └── every protected request carries it
                                  (verified by deps.get_current_user_id + RLS)
```

No new persistent relationships are introduced by U1.

---

## 4. What U1 explicitly does NOT own
- Password hashing, session/refresh token issuance, reset-token generation, email delivery — **Supabase**.
- The `profiles` schema and RLS — **U0**.
- XP/level/streak fields on `profiles` — **U3** (present but untouched here).
