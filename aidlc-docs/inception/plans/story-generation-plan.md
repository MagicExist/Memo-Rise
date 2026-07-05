# MemoRise — Story Generation Plan (User Stories · Part 1: Planning)

**Stage:** INCEPTION → User Stories · **Part:** Planning (approval gate before generation)
**Inputs:** `aidlc-docs/inception/requirements/requirements.md` (approved), `inputs/vision.md`

**How to answer:** pick a letter after each `[Answer]:` tag (or choose **X) Other** and describe).
Each question has a **recommended** default so you can move fast. When done, reply "approve" (or say what to change).

---

## 1. Methodology / Execution Checklist (what Part 2 will do)

- [x] Load approved requirements and this plan
- [x] Generate `personas.md` — user archetypes with goals, context, pain points, and success signals
- [x] Generate `stories.md` — user stories following **INVEST** (Independent, Negotiable, Valuable, Estimable, Small, Testable)
- [x] Organize stories using the approved **breakdown approach** (Q1)
- [x] Write acceptance criteria per story in the approved **format** (Q3)
- [x] Set story **granularity** per Q2
- [x] Map each persona to the stories they touch (Q4)
- [x] Add a **traceability** column linking each story to FR-*/NFR-*/SEC-*/TST-* IDs
- [x] Handle cross-cutting security/testing concerns per Q5
- [x] Validate content (per content-validation.md) and present at the completion gate

---

## 2. Story Breakdown Approaches (choose in Q1)

| Approach | What it looks like | Trade-off |
|---|---|---|
| **Feature-based (epics)** | Epics = requirement areas (Accounts, Decks, Cards, Review & Scheduling, Gamification, AI Assistant, Dashboard); stories under each | Clean mapping to requirements + future build units; persona view is secondary |
| **Persona-based** | Stories grouped by persona (student / self-directed / lapsed) | Great empathy view; features get duplicated across personas |
| **User-journey-based** | Stories follow the flow: onboard → build a deck → review → stay motivated | Strong UX narrative; less clean mapping to components |
| **Hybrid (recommended)** | Feature-based epics, **each story tagged with persona(s)** and mapped to requirement IDs | Best of both: requirement + build alignment *and* persona visibility; slightly more metadata per story |

---

## 3. Planning Questions

### Question 1 — Breakdown approach
A) Hybrid — feature epics, stories tagged with persona(s) + requirement IDs *(recommended)*
B) Feature-based epics only
C) Persona-based
D) User-journey-based
X) Other
[Answer]: A

### Question 2 — Story granularity
A) One story per user-facing capability (~25–35 stories, roughly one per functional requirement) *(recommended)*
B) Coarser — epic-level stories only (fewer, larger)
C) Finer — split most acceptance criteria into their own stories (many small stories)
X) Other
[Answer]: A

### Question 3 — Acceptance-criteria format
A) Gherkin — Given / When / Then *(recommended: testable, feeds the E2E + example-based tests directly)*
B) Bullet checklist of conditions
C) Short narrative paragraph
X) Other
[Answer]: A

### Question 4 — Personas
A) Use the three vision personas as-is: Student (primary), Self-directed learner, Lapsed returner *(recommended)*
B) Same three, but add a lightweight "admin/operator" persona (you, running the beta)
C) Just the primary Student persona for the MVP
X) Other
[Answer]: A

### Question 5 — Cross-cutting security & testing concerns
A) Fold security (SEC-*) and testing (TST-*/PBT-*) into the acceptance criteria of the relevant feature stories, **plus** a few explicit "technical enabler" stories for system-wide items (metering, logging, RLS, CI) *(recommended)*
B) Only fold them into feature-story acceptance criteria (no separate enabler stories)
C) Create a separate dedicated epic of security/testing stories
X) Other
[Answer]: A (recommended default — applied 2026-07-05; user may override at the gate)

---

## 4. Mandatory Artifacts (produced in Part 2)
- [x] `aidlc-docs/inception/user-stories/personas.md`
- [x] `aidlc-docs/inception/user-stories/stories.md` (INVEST, acceptance criteria, persona mapping, requirement traceability)

## 5. Answers Summary
- **Q1 = A** Hybrid (feature epics, persona-tagged, requirement-traced)
- **Q2 = A** One story per capability (~25–35 stories)
- **Q3 = A** Gherkin (Given/When/Then)
- **Q4 = A** Three vision personas (Student / Self-directed / Lapsed)
- **Q5 = A** Fold SEC-*/TST-* into feature-story ACs + a few enabler stories (recommended default)
