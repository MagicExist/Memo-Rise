# MemoRise — Story → Unit Map

Every one of the 29 stories is assigned to exactly one unit. Enabler stories (US-25/26/27/28/29)
land in the unit that owns their surface.

| Unit | Stories | Count |
|---|---|:--:|
| **U0 — Foundation & Platform** | US-27 (structured logging), US-28 (RLS on every table), US-29 (CI + PBT + dependency scan) | 3 |
| **U1 — Accounts & Auth** | US-01 (signup), US-02 (login/logout), US-03 (password reset), US-04 (account-gated access) | 4 |
| **U2 — Decks & Cards** | US-05 (create deck), US-06 (edit deck), US-07 (delete deck), US-08 (list decks + due counts), US-09 (create card), US-10 (edit card), US-11 (delete card), US-12 (list cards) | 8 |
| **U3 — Review, Scheduling & Gamification** | US-13 (per-deck review), US-14 (rate recall, atomic), US-15 (SM-2 scheduling), US-16 (earn XP), US-17 (levels), US-18 (streak, hard reset) | 6 |
| **U4 — AI Assistant** | US-19 (generate drafts + count), US-20 (review/edit/accept), US-21 (graceful fallback), US-25 (per-user AI metering) | 4 |
| **U5 — Dashboard & Onboarding** | US-22 (dashboard), US-23 (fast onboarding), US-24 (responsive/English UI), US-26 (metric-event logging) | 4 |
| **Total** | | **29** |

## Coverage check
- **All 29 stories assigned:** ✅ (3 + 4 + 8 + 6 + 4 + 4 = 29)
- **No story in two units:** ✅
- **Cross-cutting concerns:**
  - US-26 (metric events) is *owned* by U5 but its emit-points are wired incrementally as each flow is built (signup in U1, review in U3, AI in U4) — U5 completes and surfaces them.
  - US-25 (AI metering) sits in U4 with the AI feature it meters.
  - US-27/28/29 sit in U0 because they are platform-wide; later units extend the patterns U0 establishes (each new table gets RLS; each new module gets logging + tests in CI).

## Per-unit requirement traceability (summary)
| Unit | Key FR / NFR / SEC / PBT |
|---|---|
| U0 | NFR-4/8/9, SEC-2/5/6/8/15, TST-4, PBT-H/I |
| U1 | FR-1…4, SEC-6/10 |
| U2 | FR-5…12, SEC-4/6 |
| U3 | FR-13…20, PBT-C/E/F, SEC-15 |
| U4 | FR-21…24, SEC-4/9/11/15, SEC-AI-1..3 |
| U5 | FR-25…29, NFR-5/6/10 |
