# MemoRise — Units of Work

Decomposition strategy: **vertical feature slices** (each unit spans frontend + backend + data for its
feature). **6 units**, built in order, each fully completed (design → code) before the next.
Deployment: single Next.js frontend (Vercel) + single FastAPI backend (Railway) + Supabase — not microservices.

---

## Code Organization Strategy (greenfield)

Code lives in the existing repo folders (Q11); documentation stays in `aidlc-docs/`.

```
memorise-web/        # Next.js frontend (app/, components/, lib/api, lib/queries, hooks, types)
memorise-back/       # FastAPI backend (app/api/v1, app/services, app/domain, app/models,
                     #   app/schemas, app/core, app/db, tests/)
memorise-supabase/   # migrations/ (SQL-first), functions/ (rate_card, etc.)
```
Each unit adds vertical increments across these folders (its routes/services/domain/models,
its migrations + RLS, its frontend components/queries, and its tests incl. PBT where applicable).

---

## Units

### U0 — Foundation & Platform  *(prerequisite for all)*
- **Purpose:** stand up the skeleton so feature units can be built and tested.
- **Backend:** FastAPI app entry, config/settings (`ANTHROPIC_MODEL` default Sonnet, input caps, secret refs), JWT verification dependency, structured logging, global error handler, DB session/engine with JWT forwarding.
- **Data:** Supabase project; base migrations for `profiles`, and the RLS *skeleton/pattern*; `.env.example`.
- **Cross-cutting:** CI pipeline (pytest + Vitest + Playwright scaffold, Hypothesis + fast-check harness, dependency vulnerability scan, type-check + lint), branch/merge gates.
- **Version control & dev workflow (NFR-12):** GitHub Flow (feature branch per unit), Conventional Commits, one PR per unit with squash-merge, branch protection on `main` requiring green CI; `.github/workflows/ci.yml`, PR template, `CONTRIBUTING.md`, commitlint hook, `.env.example`. **Mandatory:** no AI author/co-author attribution on any commit or PR.
- **Stories:** US-27 (logging), US-28 (RLS), US-29 (CI/PBT/scan + version-control workflow).
- **Depends on:** none.

### U1 — Accounts & Auth
- **Purpose:** account creation and gated access.
- **Backend:** `AuthRouter`, `UserService`; Supabase Auth integration; deny-by-default guard.
- **Frontend:** `app/(auth)` login/signup/reset pages; session bootstrap.
- **Data:** link `profiles` to auth users (trigger/row on signup).
- **Stories:** US-01, US-02, US-03, US-04.
- **Depends on:** U0.

### U2 — Decks & Cards
- **Purpose:** deck and card CRUD.
- **Backend:** `DeckService`, `CardService`, `DeckRouter`, `CardRouter`; ownership checks.
- **Frontend:** deck list, deck detail, card management (`lib/api` + `lib/queries`).
- **Data:** `decks`, `cards` tables (+ SM-2 columns placeholder) with RLS policies.
- **Stories:** US-05, US-06, US-07, US-08, US-09, US-10, US-11, US-12.
- **Depends on:** U0, U1.

### U3 — Review, Scheduling & Gamification  *(the atomic core)*
- **Purpose:** the review loop plus rewards, in one atomic transaction.
- **Backend:** `SchedulerService`, `GamificationService`; `domain/scheduling.py` (SM-2) and `domain/gamification.py` (XP/level/streak) pure modules; `ReviewRouter`, `ProfileRouter`.
- **Data:** SM-2 columns on `cards`; XP/level/streak on `profiles`; `review_logs`; **`rate_card` RPC** (atomic update card + profile + insert review_log).
- **Frontend:** `ReviewSession` (front→reveal→4 buttons, optimistic), gamification widgets.
- **Stories:** US-13, US-14, US-15, US-16, US-17, US-18.
- **Depends on:** U2.
- **PBT focus:** SM-2 invariants (PBT-C), XP/level monotonicity (PBT-C), oracle vs reference SM-2 (PBT-E), stateful review sequences (PBT-F).

### U4 — AI Assistant
- **Purpose:** paste text → draft cards → review/accept; metered.
- **Backend:** `AICardService` (prompt build with text-as-data, Anthropic call, parse/validate, cap, fallback), `MeteringService.record_ai_usage`, `AIRouter`.
- **Frontend:** `AIGenerate` (paste ≤5k, optional target count, review/edit/accept into a deck).
- **Data:** `ai_usage` table (RLS).
- **Stories:** US-19, US-20, US-21, US-25.
- **Depends on:** U2 (cards).

### U5 — Dashboard & Onboarding
- **Purpose:** the at-a-glance home + fast first-run + metric events.
- **Backend:** aggregate reads for dashboard; `MeteringService.log_event` wiring across flows.
- **Frontend:** `app/dashboard` (Server Components), onboarding path to first review, responsive/English polish.
- **Data:** `metric_events` table (RLS).
- **Stories:** US-22, US-23, US-24, US-26.
- **Depends on:** U1–U4 (surfaces their data).

---

## Build Order
`U0 → U1 → U2 → U3 → U4 → U5`
(U4 depends only on U2, so it could move earlier, but the linear order keeps the core review loop
proven before AI. Build and Test runs once after all units.)
