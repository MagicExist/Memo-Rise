# U1 — Accounts & Auth — NFR Requirements Plan

**Unit:** U1 — Accounts & Auth · **Stage:** NFR Requirements (Construction) · **Depends on:** U0
**Inputs:** U1 functional design (approved), U0 NFR requirements + tech-stack decisions.

**Note:** The application/CI tech stack is already fixed in U0 (Next.js + FastAPI + Supabase; Hypothesis/fast-check; GitHub Actions). U1 adds **no new stack** beyond the `@supabase/ssr` frontend dependency. U0-SEC-7 explicitly **deferred auth rate-limit thresholds to this stage**. So U1 NFR = auth-specific security, session, performance, availability, and monitoring choices.

---

## NFR Requirements Plan (checkboxes)

- [x] Analyze functional design (flows, rules AR-1..18, delegated-to-Supabase model)
- [x] Resolve NFR decisions (4 questions answered — all option A)
- [x] `nfr-requirements/nfr-requirements.md` — security, session, performance, availability, reliability, maintainability, usability NFRs (traced)
- [x] `nfr-requirements/tech-stack-decisions.md` — confirm "no new stack" + `@supabase/ssr`; record auth config settings
- [x] Extension compliance pass (Security Baseline; PBT-09 already satisfied by U0)
- [x] Present 2-option completion

---

## Clarifying Questions

## Question 1 — Session lifetime & "remember me"
Supabase issues a short-lived access token (default ~1h) + a refresh token. How should we set session persistence?

A) **Supabase defaults + persistent refresh** — ~1h access token auto-refreshed via middleware; user stays logged in across browser restarts until they log out or the refresh token expires from inactivity. *(Recommended — best UX, standard.)*
B) **Session-only** — session ends when the browser closes (no persistent refresh). Stricter, more re-logins.
C) **"Remember me" toggle** — user chooses persistent vs session-only at login. More UI/logic.
X) Other

[Answer]: A

## Question 2 — Login/reset rate-limit thresholds (U0-SEC-7 deferred here)
US-02 requires brute-force throttling; Q3 of functional design chose Supabase built-in. What thresholds?

A) **Accept Supabase Auth's default rate limits** for the MVP; document them; revisit if abused. *(Recommended — no tuning needed, managed.)*
B) **Set custom thresholds** in Supabase Auth config (e.g. N failed logins / window, reset-email send limits).
X) Other

[Answer]: A

## Question 3 — Performance & availability targets for auth
What formal targets should U1 commit to?

A) **Best-effort MVP, no hard SLA** — bounded by Supabase/Vercel managed platforms; measure but don't gate. *(Recommended for MVP.)*
B) **Define explicit targets** — e.g. auth request p95 < 1s, uptime objective — and treat as acceptance criteria.
X) Other

[Answer]: A  (explained interactively; best-effort MVP, measure but don't gate)

## Question 4 — Security monitoring / alerting for auth (SEC-14)
SEC-14 wants alerting on repeated auth failures. U0 marked SEC-14 partially deferred. Scope for U1?

A) **Rely on U0 structured logging now; defer real alerting to the Operations phase** (placeholder). *(Recommended — MVP; Supabase also surfaces auth logs.)*
B) **Wire a basic auth-failure metric/log signal now** (emit an event on repeated failures) ahead of full alerting.
X) Other

[Answer]: A
