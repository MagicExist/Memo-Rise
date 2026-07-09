# U1 — Accounts & Auth — Frontend Components

Next.js App Router. Auth is frontend-direct against Supabase (Q1) with `@supabase/ssr` cookie
sessions (Q2). U1 delivers the `app/(auth)` route group, the session/middleware plumbing, and a
minimal authenticated placeholder (Q6). Copy is English-only (US-24). shadcn/ui + Tailwind base.

---

## Component hierarchy

```
memorise-web/
├── middleware.ts                      # route gate: refresh session + redirect unauth → /login (AR-12)
├── lib/supabase/
│   ├── client.ts                      # browser Supabase client (@supabase/ssr)
│   ├── server.ts                      # server Supabase client (reads cookies)
│   └── middleware.ts                  # session refresh helper used by middleware.ts
├── lib/auth/
│   ├── validation.ts                  # PURE: isValidEmail(), isValidPasswordLength()  [PBT target]
│   └── errors.ts                      # mapAuthError() → generic non-enumerating messages (AR-4)
├── app/(auth)/
│   ├── layout.tsx                     # centered card layout for auth screens
│   ├── login/page.tsx                 # <LoginForm>
│   ├── signup/page.tsx                # <SignupForm>
│   └── reset/
│       ├── page.tsx                   # <ResetRequestForm>  (step 1)
│       └── confirm/page.tsx           # <ResetConfirmForm>  (step 2, from email link)
├── app/(app)/
│   ├── layout.tsx                     # authenticated shell (reads session server-side)
│   └── page.tsx                       # <AuthedPlaceholder> — "You're signed in" (Q6; U5 replaces)
└── components/features/auth/
    ├── LoginForm.tsx
    ├── SignupForm.tsx
    ├── ResetRequestForm.tsx
    ├── ResetConfirmForm.tsx
    ├── LogoutButton.tsx
    └── AuthField.tsx                  # shared labelled input + inline error
```

---

## Component specs

### `LoginForm`
- **State:** `email`, `password`, `submitting`, `error`.
- **Interactions:** validate (`isValidEmail`, length ≥ 8) → `supabase.auth.signInWithPassword` → on success redirect to intended route or `/(app)`; on failure show `mapAuthError` generic message.
- **Rules:** AR-4 (generic errors), AR-7 (surface throttle message), AR-8 (session→cookies via client).

### `SignupForm`
- **State:** `email`, `password`, `submitting`, `error`.
- **Interactions:** pre-check → `supabase.auth.signUp` → on success **immediately** redirect to `/(app)` (AR-5); show generic error otherwise.
- **Rules:** AR-1 (length pre-check), AR-4, AR-5/AR-6 (no verification gate; email sent by Supabase).

### `ResetRequestForm` (step 1)
- **State:** `email`, `submitting`, `submitted`.
- **Interactions:** `supabase.auth.resetPasswordForEmail(email, {redirectTo})` → **always** show identical confirmation (AR-10).

### `ResetConfirmForm` (step 2)
- **State:** `newPassword`, `submitting`, `error`, `done`.
- **Interactions:** relies on the recovery session from the email link → `supabase.auth.updateUser({password})` → on success prompt to log in; expired/invalid → generic error (AR-11).

### `LogoutButton`
- **Interactions:** `supabase.auth.signOut()` (local, AR-9) → clear cookies → redirect `/login`.

### `AuthedPlaceholder` (Q6)
- **Purpose:** minimal authenticated landing ("You're signed in") + `LogoutButton`; a stub the U5 dashboard replaces. Rendered inside `app/(app)/layout.tsx` which reads the session server-side and redirects out if absent (defense in depth with middleware).

### `AuthField`
- **Props:** `label`, `type`, `value`, `onChange`, `error?`, `autoComplete`. Sets correct `autocomplete` (`email`, `current-password`, `new-password`) and never echoes password to logs.

---

## Session bootstrap & route protection
- **`middleware.ts`** runs on all non-static routes: refreshes the Supabase session (silent) and redirects unauthenticated users away from protected routes to `/login`, preserving the target (AR-12, Flow 5/6).
- **Public routes:** `/login`, `/signup`, `/reset`, `/reset/confirm` (+ static assets).
- **Server Components** read the session via `lib/supabase/server.ts` for first-paint auth state (enables SSR dashboard in U5).
- **Backend calls:** the typed client (`lib/api/client.ts`, U0) attaches the current access token; the backend re-verifies it (never trusts the client gate alone).

---

## Form validation rules (client-side; authoritative checks server/Supabase-side)
| Field | Rule | Rule ref |
|---|---|---|
| email (all forms) | required, trimmed, valid shape via `isValidEmail` | AR-18 |
| password (login) | required, non-empty | AR-15 |
| password (signup / reset-confirm) | required, length ≥ 8 (Supabase enforces breach + policy) | AR-1/AR-2 |
| error display | map all auth failures through `mapAuthError` → generic copy | AR-4 |

---

## API / integration points
| Screen | Calls | Layer |
|---|---|---|
| Login | `supabase.auth.signInWithPassword` | FE → Supabase |
| Signup | `supabase.auth.signUp` | FE → Supabase |
| Reset (req) | `supabase.auth.resetPasswordForEmail` | FE → Supabase |
| Reset (confirm) | `supabase.auth.updateUser` | FE → Supabase |
| Logout | `supabase.auth.signOut` | FE → Supabase |
| Any protected FastAPI call | attaches access token; `get_current_user_id` verifies | FE → BE |

No new FastAPI auth endpoints are required for U1 (AuthRouter reduced to nothing / optional `/auth/me`).

---

## Accessibility / responsive (US-24)
- Auth forms are single-column, mobile-first, large tap targets; labelled inputs; visible focus states; English-only copy. Full responsive polish is completed in U5 but auth screens are built responsive from the start.
