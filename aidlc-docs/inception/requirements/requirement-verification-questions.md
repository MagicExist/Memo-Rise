# MemoRise — Requirements Verification Questions

**How to answer:** Write your choice (the letter) after each `[Answer]:` tag. You can always pick the last option (**Other / X**) and describe your own answer after the tag. Many questions mark a **recommended-for-MVP** option so you can move quickly — you're free to override any of them. When you're done, reply "done" (or tell me which ones you'd like to revisit).

**Scope note:** Most *technical* decisions are already settled in `inputs/tech-environment.md` and are **not** re-asked here. These questions target the **product/requirement** decisions the vision left open (see its "Risks & Open Questions"), plus a few choices needed to write precise requirements, and the extension opt-ins required by AI-DLC.

**Status:** ✅ Answered on 2026-07-05 via the assistant conversation (answers captured below and logged in `audit.md`).

**Assumptions I'll record unless you object** (surfaced again at the requirements approval gate, so you can change them there):
- AI card generation produces **up to ~20 draft cards** per request (fewer for short input), shown for review/edit/accept before saving.
- AI failures/timeouts **degrade gracefully to manual card creation** (per tech-environment).
- **Password reset** ("forgot password") is in MVP scope via Supabase Auth's built-in email.
- Success-metric **events are logged to Supabase tables from day one** (no dedicated analytics tool in MVP).

---

## Section A — Onboarding & Accounts

## Question 1
The vision asks how much a user can do before signing up. What should the MVP do?

A) Account required from the start — must sign up before creating decks or reviewing *(recommended for MVP: simplest, and the <5-min onboarding metric is measured from signup)*

B) Limited guest mode — try a built-in demo deck/review without an account, but creating or saving requires signup

C) Full guest mode — use everything locally, with an optional account to persist data later

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
Email verification on signup (Supabase Auth):

A) Allow immediate use after signup; send a verification email but don't block the first review *(recommended for MVP: protects the <5-min first-review metric)*

B) Require email verification before the user can use the app

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3
Interface language for the MVP:

A) English only

B) Spanish only

C) Bilingual — user-selectable English / Spanish from day one

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Section B — Core Learning Engine

## Question 4
Spaced-repetition scheduling algorithm (the vision flags this as an open decision):

A) SM-2 as-is — classic, well-documented default parameters *(recommended for MVP: simplest and fully documented)*

B) SM-2 tuned variant — SM-2 with adjusted ease/interval parameters (note any preferences under Other)

C) FSRS — a newer, more accurate scheduler (more complex to implement and validate)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
Recall-rating scale shown when the user reveals an answer:

A) Four buttons — Again / Hard / Good / Easy (Anki-style; maps cleanly onto SM-2) *(recommended for MVP)*

B) Binary — Got it / Missed (simplest; less scheduling nuance)

C) SM-2 0–5 quality scale (most granular; higher cognitive load)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Section C — Gamification

## Question 6
What happens when a daily streak breaks (the vision flags this as open)?

A) Hard reset to 0 the day a review is missed (simplest)

B) One-day grace / "streak freeze" buffer that auto-protects a single missed day, then resets *(recommended for MVP: gentler, supports the "lapsed user" persona and avoids streak anxiety)*

C) Earnable streak-freeze items the user can spend to protect a day

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 7
How is XP awarded for reviews (high level — exact numbers tuned later in design)?

A) Fixed XP per completed review, regardless of rating *(recommended for MVP: simplest and predictable)*

B) Performance-weighted XP — more for correct / "Good" / "Easy", less for "Again" (rewards accuracy)

C) Fixed XP per review plus a small daily-streak bonus

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Section D — AI Card-Generation Assistant

## Question 8
Which Anthropic model should power card generation? (The vision flags model choice as open; cost matters for a free/student product. The backend uses the `anthropic` Python SDK either way.)

A) Claude Haiku 4.5 — lowest cost and fastest; good for straightforward card extraction *(recommended for MVP cost posture)*

B) Claude Sonnet 4.6 — balanced quality/cost; stronger on messy or complex notes

C) Claude Opus — highest quality, highest cost

D) Start on Haiku but keep the model configurable, so we can upgrade if the "cards kept" rate is too low

X) Other (please describe after [Answer]: tag below)

[Answer]: B — Claude Sonnet. Balanced quality/cost: cheaper than Opus, stronger than Haiku on messy/complex notes. The model stays configurable via environment/settings so it can be swapped without a code change; Sonnet is the default for launch. (Changed from an earlier C/Opus choice on 2026-07-05.)

## Question 9
Per-user AI usage limit for the MVP. (The architecture will meter usage per user either way — this is about whether an enforced cap exists *now*.)

A) No enforced cap for MVP — meter usage only, defer limits to the future paid tier *(recommended if the beta audience is small/trusted)*

B) Daily cap per user (e.g., N generations/day)

C) Monthly cap per user

D) Total cap during beta (e.g., N generations per account)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 10
Maximum length of pasted text accepted per AI generation (cost + abuse protection — the security spec requires a cap):

A) ~2,000 characters (~1 page) — tightest cost control

B) ~5,000 characters (~2–3 pages) *(recommended balance for MVP)*

C) ~10,000 characters (~5 pages) — most generous, higher per-call cost

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Section E — Technical & Project Context

## Question 11
The repo already contains empty folders `memorise-web/`, `memorise-back/`, `memorise-supabase/`, but `inputs/tech-environment.md` describes the structure as `web/`, `backend/`, `supabase/`. Where should application code live?

A) Use the existing folders — map tech-env's `web/` → `memorise-web/`, `backend/` → `memorise-back/`, `supabase/` → `memorise-supabase/` *(recommended: reuses the folders you already created)*

B) Use the tech-env names — create `web/`, `backend/`, `supabase/` at the repo root and remove the empty placeholder folders

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 12
Payment/billing is flagged "to be decided before construction." For the MVP build:

A) Keep billing fully OUT of the MVP; only ensure AI usage is meterable per user so limits / paid tiers can be added later *(recommended — matches the vision and tech-environment intent)*

B) Include a basic paid-tier gate in the MVP (adds significant scope)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 13
Should the MVP web UI be mobile-responsive (usable in a phone browser), even though native mobile apps are out of scope?

A) Yes — responsive web, usable on phone browsers *(recommended: students often study on their phones)*

B) Desktop/laptop web only for the MVP; optimize for mobile later

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Section F — AI-DLC Extension Opt-Ins

These decide which AI-DLC extension rule sets are enforced for this project. Asked verbatim from the extension definitions.

## Question 14 — Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 15 — Resiliency Extensions
Should the resiliency baseline be applied to this project?

**What this extension is.** Enabling it applies a set of **directional, design-time best practices** for building resilient systems, derived from the **AWS Well-Architected Framework (Reliability Pillar)** and resilience-review guidance. It steers requirements, design, and code toward fault tolerance, high availability, observability, and recoverability — covering 15 practice areas across business goals, change management, observability, high availability, disaster recovery, and continuous improvement.

**What this extension is NOT.** Enabling it does **not** make your workload production-ready, nor does it certify or guarantee any availability, RTO, or RPO target. It is a **starting point** that scaffolds good resiliency decisions early — it is not a substitute for a formal **AWS Well-Architected Review** of the built system.

Treat the output as a well-grounded **first draft of your resiliency posture** to build on and validate — not a finished, production-certified result.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance (recommended for business-critical workloads, as an informed starting point that you can validate and harden before go-live)

B) No — skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects where rapid iteration matters more than reliability)

X) Other (please describe after [Answer]: tag below)

[Answer]: B — Skip for the MVP. (Rationale: early greenfield MVP on managed platforms; revisit before scaling. The tech-environment already defers error monitoring/observability tooling.)

## Question 16 — Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)

B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)

C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)

X) Other (please describe after [Answer]: tag below)

[Answer]: A — Full enforcement. (Rationale: the SM-2 scheduler and XP/level/streak math are exactly the pure, easy-to-get-wrong logic PBT targets.)
