# U0 Foundation — Business Logic Model

U0 has little "business logic" — it establishes the platform behaviors later units rely on.
Technology-agnostic flows below; concrete implementations land in Code Generation.

---

## Flow 1 — New-user profile creation (Q2: trigger-based)
```
Supabase Auth inserts a new row in auth.users (on signup)
  -> Postgres trigger fires (runs in a privileged context)
  -> INSERT into profiles (user_id = new auth user id) with defaults
       xp = 0, level = 1, current_streak = 0, last_review_date = null
Result: every authenticated user is guaranteed exactly one profile row (no app-side race).
```

## Flow 2 — Request authentication (deny-by-default)
```
Incoming request to a protected route
  -> extract bearer JWT
  -> verify signature + expiry + issuer/audience server-side  (SEC-6, R6.1)
     - invalid/absent  -> 401, fail closed (R5.2)
     - valid           -> resolve user_id, attach to request context
  -> DB access forwards the JWT so RLS applies (R1, defense in depth)
```

## Flow 3 — Configuration load (startup, fail closed)
```
App boot
  -> load settings from environment
  -> validate required vars present + well-formed  (R3.1)
     - missing/invalid -> abort startup with a safe error (do NOT run half-configured)
     - ok              -> expose typed settings (ANTHROPIC_MODEL default Sonnet, AI caps, etc.)
```

## Flow 4 — Structured logging & error handling (cross-cutting)
```
Per request:
  -> assign correlation id
  -> structured log entries (timestamp, correlation id, level, message); never log secrets/PII (R4)
On unhandled error:
  -> global handler logs the error (with correlation id) and returns a generic client message (R5.1)
  -> external-call errors are caught, resources released, operation fails closed (R5.3/R5.2)
```

## Integration points established by U0 (used by later units)
- **Supabase Auth** — identity + JWT issuance (U1 builds on this).
- **PostgreSQL + RLS** — the data foundation and the RLS pattern (all units).
- **CI pipeline** — tests + PBT harness (Hypothesis + fast-check) + dependency scan + type-check/lint gates (all units).
- **Git workflow** — GitHub Flow + Conventional Commits + one-PR-per-unit + no-AI-authorship (all units; R7).

## Testable properties (PBT-01 for U0)
U0 is mostly configuration/wiring, so PBT surface is small:
- **Config validation** — property: for any settings input missing a required key, startup validation rejects it (no partial boot). *(invariant)*
- Most U0 behavior (RLS, triggers, auth) is verified by integration tests, not PBT — recorded as "limited PBT surface" for this unit; the heavy PBT targets are U3 (SM-2, gamification).
