# U0 Foundation — Functional Design Plan (CONSTRUCTION)

**Unit:** U0 Foundation & Platform · **Stories:** US-27 (logging), US-28 (RLS), US-29 (CI + version-control workflow)
**Depth:** Light — U0 is mostly infrastructure; the only domain content is the `profiles` entity, the
RLS policy pattern (inherited by every later unit), and config/settings + cross-cutting rules.

**How to answer:** pick a letter after each `[Answer]:` (recommended marked). Reply "approve" when done.

---

## 1. Execution Checklist (artifacts to generate)
- [x] `domain-entities.md` — the `profiles` entity + the RLS-enabled table pattern
- [x] `business-rules.md` — RLS rules, profile defaults, config validation, logging/authorship rules
- [x] `business-logic-model.md` — profile-creation flow, JWT verification, error-handling/fail-closed patterns
- [x] (no `frontend-components.md` — U0 has no UI)

## 2. Design Questions

### Question 1 — `profiles.level` storage
A) **Stored column** on `profiles`, updated atomically inside `rate_card` (level logic lands in U3) *(recommended: single atomic write; dashboard reads are trivial)*
B) **Derived** from XP on read (computed each time, never stored)
X) Other
[Answer]: A

### Question 2 — How a `profiles` row is created for a new user
A) **Postgres trigger** on `auth.users` insert auto-creates the matching `profiles` row *(recommended: guaranteed 1:1, no app race)*
B) **Backend** creates the profile lazily on first authenticated request
X) Other
[Answer]: A

## 3. Answers Summary
- **Q1 = A** `profiles.level` is a stored column (updated atomically in `rate_card`, logic in U3)
- **Q2 = A** A Postgres trigger on `auth.users` insert auto-creates the `profiles` row
