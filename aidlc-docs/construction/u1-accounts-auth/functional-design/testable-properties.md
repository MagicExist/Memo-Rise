# U1 — Accounts & Auth — Testable Properties (PBT-01)

Mandatory property identification for the Property-Based Testing extension (rule **PBT-01**). U1's
auth is delegated to Supabase (I/O over the network), so the algorithmic/pure surface is small.
Per Q8 (minimal surface), we identify properties for the **pure input-validation helpers** and
explicitly justify the absence of PBT for the delegated flows. Framework: **fast-check** (frontend
TS, established in U0). Seeds logged in CI (PBT-08).

---

## Component-by-component property analysis

### `lib/auth/validation.ts` → `isValidEmail(input: string): boolean`  — HAS PROPERTIES
| Property | Category | Statement |
|---|---|---|
| P1 Idempotence of normalization | Idempotence | `normalize(normalize(x)) === normalize(x)` for the trim+lowercase step feeding the check. |
| P2 Case/space invariance | Invariant | For any address `a`, `isValidEmail(a) === isValidEmail(pad+upper(a))` — leading/trailing space and case never change validity. |
| P3 Structural invariant | Invariant | Any generated string lacking exactly one `@` with non-empty local and domain-with-dot parts is rejected; any well-formed generated address is accepted. |
- **Generators (PBT-07):** a domain-specific *valid-email* generator (random local part + domain + TLD) and an *invalid-email* generator (missing `@`, empty parts, whitespace, unicode edge cases) — not raw `string`.

### `lib/auth/validation.ts` → `isValidPasswordLength(input: string): boolean`  — HAS PROPERTIES
| Property | Category | Statement |
|---|---|---|
| P4 Threshold monotonicity | Invariant | For any string of length ≥ 8 the predicate is `true`; length < 8 is `false` — boundary at 8 exactly. |
- **Generators:** strings sized across the boundary (0–20+), including unicode multi-byte chars to confirm length semantics. Pairs with an example-based test pinning length 7 = false, 8 = true (PBT-10).

### `lib/auth/errors.ts` → `mapAuthError(raw): AuthError`  — HAS ONE PROPERTY
| Property | Category | Statement |
|---|---|---|
| P5 Non-enumeration invariant | Invariant | For **any** raw Supabase error input, the mapped user-facing message is drawn from the fixed generic set and never contains the email, "user not found", "already registered", or internal detail (AR-4). |
- **Generator:** random raw error shapes/codes (including ones that embed an email string) → assert output message ∈ allowed generic set and does not contain the injected email.

---

## Components with NO PBT properties (documented rationale — PBT-01)
| Component | Why no PBT |
|---|---|
| `SignupForm` / `LoginForm` / `ResetRequestForm` / `ResetConfirmForm` / `LogoutButton` | Thin orchestration over Supabase network calls — delegated I/O, no pure invariant to generate against. Covered by example-based unit tests (mocked Supabase) + Playwright E2E in Build & Test (TST-1..3). |
| `middleware.ts` route gate | I/O + framework redirect behavior; covered by example-based/integration tests, not PBT. |
| Backend `get_current_user_id` | JWT verification is delegated to the `jwt` library; covered by example-based tests (valid/expired/wrong-audience). No new pure logic in U1. |
| `profiles` trigger (U0) | Owned by U0; U1 adds an example-based integration test asserting AR-17 (one profile per user on signup), not PBT. |

---

## Carry-forward to Code Generation (PBT-01 → PBT-02..10)
- Implement `validation.ts` as **pure** functions so P1–P4 are directly testable.
- Author fast-check properties P1–P5 with domain generators (PBT-03/07), shrinking on, seed logged (PBT-08).
- Add complementary example-based tests for the boundary/known cases (PBT-10).
- No round-trip (PBT-02), stateful (PBT-06), or oracle (PBT-05) properties apply to U1 → marked **N/A** with the rationale above.
