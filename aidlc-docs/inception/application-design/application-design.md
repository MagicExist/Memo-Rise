# MemoRise — Application Design (Consolidated)

Consolidated high-level design for the MemoRise MVP. Detailed per-unit business rules,
NFR patterns, and infrastructure are produced in the CONSTRUCTION phase. See the companion
docs: `components.md`, `component-methods.md`, `services.md`, `component-dependency.md`.

---

## 1. Design decisions (this stage)
| # | Decision | Choice |
|---|---|---|
| Q1 | Service decomposition | **One service per domain** (Auth/User, Deck, Card, Scheduler, Gamification, AICard, Metering) |
| Q2 | Review-rating logic placement | **Pure Python math** (domain module) **+ atomic `rate_card` Postgres RPC** for persistence |
| Q3 | Pure-logic module | **Dedicated `domain/` module** for SM-2 + XP/level/streak (no I/O) |

Pre-settled by `tech-environment.md` (not re-decided): Pattern A gateway, service-layer convention,
SQLModel query layer, SQL-first migrations, RLS everywhere, `/api/v1` REST + Pydantic, Tailwind +
shadcn/ui + TanStack Query.

## 2. Architecture at a glance
- **Frontend** (`memorise-web/`, Next.js/TS): pages + feature components → `lib/queries` (TanStack) → `lib/api` → FastAPI only.
- **Backend** (`memorise-back/`, FastAPI/Py 3.14): thin routers → domain services → `domain/` pure logic + data access (SQLModel + RPC).
- **Data** (`memorise-supabase/`, Postgres): SQL-first schema, RLS on every table, `rate_card` RPC for the atomic review write.
- **External**: Supabase Auth (JWT), Anthropic API (Sonnet, via `AICardService`).

## 3. Component summary
- **7 backend services** (one per domain) + **pure `domain/` module** (scheduling, gamification).
- **6 routers** (`auth, decks, cards, review, ai, profile`).
- **Frontend feature areas**: auth, dashboard, decks/cards, ReviewSession, AIGenerate, gamification widgets.
- **Data**: `profiles, decks, cards, review_logs, ai_usage, metric_events` + `rate_card` RPC + RLS policies.

## 4. Two defining flows
1. **Review rating (atomic):** router → `SchedulerService.submit_rating` → pure `domain` math → `rate_card` RPC (card + profile + review_log in one transaction) → optimistic UI update. (US-14/FR-20)
2. **AI generation:** router → `AICardService.generate_cards` → validate ≤5k → prompt (text as data) → Anthropic (Sonnet) → parse/validate/cap → meter → drafts returned; user accepts → `CardService`. Graceful fallback to manual on failure. (US-19/20/21)

## 5. Security & testability by design
- **Security isolation (SEC-9/11):** auth/JWT, AI orchestration, and metering are dedicated, isolated services.
- **Defense in depth (SEC-6/5):** app-level ownership checks + DB RLS (JWT forwarded).
- **Input handling (SEC-4/SEC-AI-1):** Pydantic validation; ≤5k AI input cap; user text treated as data.
- **PBT seams (PBT-01):** the pure `domain/` module isolates SM-2 and gamification math as the primary property-based-testing targets — no I/O to mock.

## 6. Requirement traceability (design → requirements/stories)
| Design element | Covers |
|---|---|
| Deck/Card services + routers | FR-5…FR-12, US-05…US-12 |
| SchedulerService + domain.scheduling + rate_card RPC | FR-13/14/15/16/20, US-13/14/15 |
| GamificationService + domain.gamification | FR-17/18/19, US-16/17/18 |
| AICardService + AIRouter | FR-21/22/23/24, US-19/20/21 |
| MeteringService + ai_usage/metric_events | FR-24/29, US-25/26 |
| UserService + Supabase Auth + JWT deps | FR-1/2/3/4, US-01…04 |
| core (logging/errors/security) + RLS policies | NFR-8, SEC-2/5/6/15, US-27/28 |
| Frontend dashboard/onboarding/responsive | FR-25/26/27/28, US-22/23/24 |

## 7. Handoff to next stages
- **Units Generation** will decompose this into buildable units (candidate units: Auth, Decks & Cards, Review & Scheduling, Gamification, AI Assistant, Dashboard/Frontend, Data & RLS, CI/Enablers).
- **Functional Design** (per unit) will define SM-2 constants, the four-button→quality mapping, XP amount, XP→level curve, streak timezone rule, and identify each unit's testable properties (PBT-01).
