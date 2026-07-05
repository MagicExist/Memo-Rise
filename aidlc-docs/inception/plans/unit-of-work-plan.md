# MemoRise — Unit of Work Plan (INCEPTION → Units Generation, Part 1: Planning)

**Inputs:** approved requirements, 29 stories, application design.
**Deployment context:** single FastAPI backend + single Next.js frontend + Supabase (not microservices).
So a "unit of work" = a **vertical feature slice** (stories + the backend/frontend/data changes to deliver them),
built and approved one at a time in Construction. Reply "approve" when the questions are answered.

---

## 1. Execution Checklist (Part 2 generates)
- [x] `unit-of-work.md` — unit definitions, responsibilities, code-organization strategy (greenfield)
- [x] `unit-of-work-dependency.md` — dependency matrix + build order
- [x] `unit-of-work-story-map.md` — every story mapped to exactly one unit
- [x] Validate boundaries; ensure all 29 stories are assigned

## 2. Proposed Units (default — adjustable via the questions)
| Unit | Scope | Stories |
|---|---|---|
| **U0 — Foundation & Platform** | Repo scaffold (`memorise-web/back/supabase`), config/secrets, Supabase project, base migrations + RLS skeleton, JWT wiring, logging/error handler, CI (tests + PBT harness + dependency scan) | US-27, US-28, US-29 |
| **U1 — Accounts & Auth** | Signup/login/logout/reset, account gating | US-01…US-04 |
| **U2 — Decks & Cards** | Deck + card CRUD | US-05…US-12 |
| **U3 — Review, Scheduling & Gamification** | Review loop, SM-2, `rate_card` RPC, XP/level/streak (the atomic core) | US-13…US-18 |
| **U4 — AI Assistant** | Paste→draft cards, review/accept, fallback, metering | US-19, US-20, US-21, US-25 |
| **U5 — Dashboard & Onboarding** | Dashboard, fast onboarding, responsive/English UI, metric events surfacing | US-22, US-23, US-24, US-26 |

## 3. Planning Questions

### Question 1 — Decomposition strategy
A) Vertical feature slices (each unit spans frontend + backend + data for its feature) *(recommended: matches the epics and lets each unit ship end-to-end)*
B) Horizontal layers (separate data unit, backend unit, frontend unit)
C) Fewer, coarser units
X) Other
[Answer]: A

### Question 2 — Foundation unit
A) Yes — build **U0 Foundation & Platform** first as a prerequisite (scaffold, schema/RLS, auth wiring, CI) *(recommended: everything else depends on it)*
B) No — fold foundation work into the Accounts & Auth unit
X) Other
[Answer]: A

### Question 3 — Review & Gamification boundary
A) Keep them **merged** in one unit (U3), because the atomic `rate_card` transaction spans scheduling + XP + streak together *(recommended: avoids a cross-unit atomic dependency)*
B) Split into two units (Review & Scheduling, then Gamification separately)
X) Other
[Answer]: A

## 4. Answers Summary
- **Q1 = A** Vertical feature slices
- **Q2 = A** Foundation unit U0 built first
- **Q3 = A** Review + Gamification merged into one unit (U3)
- **Result:** 6 units (U0–U5) as proposed.
