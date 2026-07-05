# MemoRise — Components

High-level components across the three layers. Boundaries follow the approved design
decisions: **one service per domain**, a **pure-logic domain module**, and **Pattern A**
(frontend → backend → Supabase). Detailed business rules are deferred to Functional Design.

Folder mapping (Q11): frontend = `memorise-web/`, backend = `memorise-back/`, data = `memorise-supabase/`.

---

## A. Backend components (`memorise-back/app/`)

### A.1 API Routers (`api/v1/routes/`) — thin
| Component | Responsibility | Interface |
|---|---|---|
| `AuthRouter` | Signup/login/logout/reset pass-through + session bootstrap | `POST /api/v1/auth/*` |
| `DeckRouter` | Deck CRUD endpoints | `/api/v1/decks` |
| `CardRouter` | Card CRUD endpoints (scoped to a deck) | `/api/v1/decks/{deck_id}/cards` |
| `ReviewRouter` | Due queue + submit rating | `/api/v1/decks/{deck_id}/review`, `/api/v1/reviews` |
| `AIRouter` | Generate draft cards from text | `/api/v1/ai/generate-cards` |
| `ProfileRouter` | Read XP/level/streak for dashboard | `/api/v1/profile` |

Routers stay thin: validate (Pydantic) → call a service → return a response model. All protected
routes go through `deps.get_current_user_id` (JWT verification). (SEC-6)

### A.2 Services (`services/`) — business orchestration (one per domain)
| Service | Responsibility |
|---|---|
| `UserService` | User/profile lookup; expose profile stats; coordinate with Supabase Auth |
| `DeckService` | Create/edit/delete/list decks; enforce ownership |
| `CardService` | Create/edit/delete/list cards; enforce ownership via parent deck |
| `SchedulerService` | Build the per-deck due queue; orchestrate a rating: call domain math → persist atomically via `rate_card` RPC |
| `GamificationService` | Read/compute XP/level/streak (delegates math to domain module) |
| `AICardService` | Anthropic orchestration: prompt build, call, parse/validate, graceful fallback, trigger metering |
| `MeteringService` | Record per-user AI usage (US-25) and success-metric events (US-26) |

### A.3 Domain (pure logic) (`domain/`) — NO I/O (Q3)
| Module | Responsibility |
|---|---|
| `scheduling` | SM-2 pure functions: given card state + rating → new state (ease, interval, reps, due) |
| `gamification` | Pure functions: award XP, compute level from XP, update streak (with hard-reset rule) |

> These are the primary targets for property-based tests (PBT-01/03/05).

### A.4 Data access (`models/`, `db/`)
| Component | Responsibility |
|---|---|
| `SQLModel models` | Typed load/save mirroring the SQL-first schema (query layer only; not schema owner) |
| `DB session/engine` (`db/`) | Session management; forwards the user JWT so RLS applies (SEC-5) |
| `RPC wrappers` (`db/`) | Thin Python wrappers to call Postgres RPCs (e.g. `rate_card`) |

### A.5 Core (`core/`)
| Component | Responsibility |
|---|---|
| `Config/Settings` | Env-based config incl. `ANTHROPIC_MODEL` (default Sonnet), input caps, secrets refs |
| `Security` | JWT verification, CORS, security headers, rate limiting hooks (SEC-6/SEC-9) |
| `Logging` | Structured logger (timestamp, request id, level); no PII (SEC-2) |
| `ErrorHandler` | Global exception handler; fail-closed generic errors (SEC-15) |

---

## B. Frontend components (`memorise-web/`)

| Component | Responsibility |
|---|---|
| `lib/api/*` | Typed client functions calling FastAPI only (Pattern A) |
| `lib/queries/*` | TanStack Query hooks (caching, optimistic updates for the review loop) |
| `app/(auth)` | Login / signup / reset pages |
| `app/dashboard` | Dashboard: decks, due counts, streak/level/XP (Server Components for first paint) |
| `app/decks` | Deck list, deck detail, card management |
| `components/features/ReviewSession` | Review flow: show front → reveal → 4 rating buttons |
| `components/features/AIGenerate` | Paste text (≤5k), optional card-count, review/edit/accept drafts |
| `components/features/gamification` | XP/level/streak widgets |
| `components/ui/*` | shadcn/ui base components (Tailwind) |

---

## C. Data components (`memorise-supabase/`)

| Component | Responsibility |
|---|---|
| `profiles` table | Per-user XP, level, streak, last-review date (1:1 with auth user) |
| `decks` table | User-owned decks (RLS) |
| `cards` table | Cards + SM-2 state (ease, interval, reps, due_date); FK to deck (RLS) |
| `review_logs` table | One row per completed review (rating, timestamp) — supports metrics/recall trend |
| `ai_usage` table | Per-user AI generation records (metering, US-25) |
| `metric_events` table | Success-metric events (US-26) |
| `rate_card` RPC | Atomic: update card SM-2 state + increment XP + update streak + insert review log (US-14/FR-20) |
| RLS policies | Per-operation policies keyed to `auth.uid()` on every table (SEC-5) |

**Note:** schema is SQL-first via Supabase CLI migrations; SQLModel mirrors it (never owns it).
