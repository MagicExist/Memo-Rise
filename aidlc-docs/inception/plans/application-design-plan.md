# MemoRise — Application Design Plan (INCEPTION → Application Design)

**Inputs:** approved `requirements.md`, `stories.md`, `personas.md`, and `inputs/tech-environment.md`.
**Note:** Most architecture is already settled in tech-environment.md and is NOT re-asked:
Pattern A (Next.js → FastAPI → Supabase), service-layer convention (logic out of route handlers),
SQLModel as the typed query layer, Postgres RPC for atomic multi-step writes, RLS on every table,
`/api/v1` REST + Pydantic. This stage designs **components, methods, services, and dependencies** —
detailed business rules come later in Functional Design.

**How to answer:** pick a letter after each `[Answer]:` (recommended defaults marked). Reply "approve" when done.

---

## 1. Execution Checklist (what Part 2 generates)
- [x] `components.md` — components + responsibilities + interfaces
- [x] `component-methods.md` — method signatures + I/O (business rules deferred to Functional Design)
- [x] `services.md` — service definitions + orchestration patterns
- [x] `component-dependency.md` — dependency matrix + communication + data flow
- [x] `application-design.md` — consolidated design doc
- [x] Validate completeness/consistency (and Security isolation per SEC-9; pure-logic seams for PBT-01)

## 2. Design Questions

### Question 1 — Service decomposition granularity
A) Fine-grained, one service per domain: `Auth/UserService`, `DeckService`, `CardService`, `SchedulerService`, `GamificationService`, `AICardService`, `MeteringService` *(recommended: matches the service-layer convention and keeps each independently testable)*
B) Coarser: fewer grouped services (e.g. a single `StudyService` covering decks + cards + review)
X) Other
[Answer]: A

### Question 2 — Where the review-rating logic runs (the atomic `rate_card` design)
A) Compute SM-2 reschedule + XP + streak as **pure Python functions in the service layer**, then persist all three effects atomically via the `rate_card` Postgres RPC in one transaction *(recommended: pure functions are ideal for property-based tests; the RPC still guarantees atomicity)*
B) Compute everything **inside the `rate_card` SQL function** (logic lives in Postgres)
C) Hybrid (some math in Python, some in SQL)
X) Other
[Answer]: A

### Question 3 — Dedicated pure-logic (domain) module
A) Yes — put SM-2 scheduling and XP/level/streak math in a **dedicated pure module** (no I/O), separate from the services that call it *(recommended: cleanest seam for PBT-01 and reuse)*
B) No — keep the math inside service methods
X) Other
[Answer]: A

## 3. Answers Summary
- **Q1 = A** One service per domain (Auth/User, Deck, Card, Scheduler, Gamification, AICard, Metering)
- **Q2 = A** Pure Python math + atomic `rate_card` Postgres RPC for persistence
- **Q3 = A** Dedicated pure-logic domain module for SM-2 + XP/level/streak
