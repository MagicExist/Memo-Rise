# MemoRise — Technical Environment Document

One document, per-layer sections. The three layers (Next.js frontend, FastAPI backend, Supabase/PostgreSQL data) have different tooling, so each section addresses them separately where relevant.

---

## 1. Languages

### Frontend (`web/` — Next.js)
| | |
| --- | --- |
| **Required** | TypeScript, targeting current Next.js defaults |
| **Permitted** | JSX/TSX; CSS Modules where needed |
| **Prohibited** | Plain/untyped JavaScript for application code (`.js`/`.jsx` source) — all app code is typed |

### Backend (`backend/` — FastAPI)
| | |
| --- | --- |
| **Required** | Python 3.14.x (target 3.14.6 or later patch) |
| **Permitted** | Standard library + approved frameworks (see §2) |
| **Prohibited** | Python 2.x; any Python version below 3.14; non-Python backend languages |

### Data layer (`supabase/` — Supabase / PostgreSQL)
| | |
| --- | --- |
| **Required** | SQL (PostgreSQL dialect) for all schema. Migrations managed **SQL-first via the Supabase CLI**: timestamped SQL files in `supabase/migrations/`, created with `supabase migration new`, applied with `supabase db push` / tested with `supabase db reset` |
| **Permitted** | Postgres extensions supported by Supabase; SQL functions and RLS policies; `supabase db diff` to capture Studio changes into a migration file |
| **Prohibited** | ORM/code-first auto-generated migrations as the source of truth; ad-hoc changes to the live database that aren't captured as a committed migration file |

**Cross-cutting rules**
- No untyped JavaScript anywhere in application code.
- No Python version other than 3.14.x.
- Schema changes flow through committed SQL migration files, never ad-hoc edits to the live database.

---

## 2. Frameworks & Libraries

### Frontend (`web/` — Next.js + TypeScript)
| Category | Choice | Rationale |
| --- | --- | --- |
| Required | Next.js (App Router), React, TypeScript | Core stack; Server Components for initial data loads |
| Styling — required | Tailwind CSS | Primary styling approach |
| Styling — permitted | Plain CSS Modules | Allowed where Tailwind is awkward or a one-off is cleaner |
| UI components — required | shadcn/ui (on Radix primitives) | Accessible base kit; speeds up gamification UI |
| Server state — required | TanStack Query | Client-side caching, background refetch, optimistic updates for the review loop |
| Initial data loading — required | Next.js native fetching / Server Components | First paint of dashboard, deck lists, etc. |

### Backend (`backend/` — FastAPI + Python 3.14.x)
| Category | Choice | Rationale |
| --- | --- | --- |
| Required | FastAPI | API framework |
| Data access — primary | SQLModel (query/runtime layer only) | Typed load/save for ordinary CRUD; hand-written to match the SQL-first schema. Does **not** own schema or migrations |
| Data access — atomic ops | PostgreSQL RPC function (called from backend) | Multi-step atomic writes — the review-rating action (reschedule card + award XP + update streak) runs as one transaction |
| AI integration — required | Anthropic Python SDK (`anthropic`) | Powers the card-generation agent (paste text → draft cards) |
| Auth — required | Supabase Auth (verify Supabase-issued JWTs in FastAPI) | Backend validates the user's Supabase JWT on protected routes |

### Data layer (`supabase/` — Supabase / PostgreSQL)
| Category | Choice | Rationale |
| --- | --- | --- |
| Required | PostgreSQL via Supabase; SQL-first migrations (Supabase CLI) | Per §1 |
| Required — security | Row-Level Security (RLS) enabled on every table from day one | Per-user data isolation at the database level |
| Required — atomic logic | Postgres functions for multi-step transactions (e.g. `rate_card`) | Backs the RPC data-access pattern above |

### Prohibited (all layers)
| Prohibited | Reason | Use instead |
| --- | --- | --- |
| Bootstrap (and other CSS frameworks) | Project standardizes on Tailwind; mixing frameworks bloats the bundle and fragments styling | Tailwind CSS (or CSS Modules for one-offs) |
| Plain/untyped JavaScript in app code | Type safety is a project rule (§1) | TypeScript |
| ORM/code-first auto-generated migrations as source of truth | Schema is SQL-first (§1) | SQL migrations via Supabase CLI; SQLModel only as a query layer |

---

## 3. Cloud Services

### Allow list (services in use)
| Service | Role | Tier intent |
| --- | --- | --- |
| **Vercel** | Frontend hosting (Next.js) | Hobby/free tier at low usage |
| **Railway** | Backend hosting (FastAPI) | Low-cost tier; scale up only if needed |
| **Supabase** | PostgreSQL database + Auth (+ built-in transactional email via Auth) | Free tier at low usage |
| **Anthropic API** | AI card-generation agent | Pay-as-you-go usage |

### Deferred (not in MVP — add when needed)
| Service | Why deferred |
| --- | --- |
| Supabase Storage (file storage) | MVP is text-only flashcards; no uploads needed yet |
| Dedicated email (Resend/Postmark/etc.) | Supabase Auth's built-in email covers MVP signup/reset |
| Product analytics (e.g. PostHog) | Success-metric events logged to Supabase tables for MVP; dedicated analytics is a later add |
| Error monitoring (e.g. Sentry) | Deferrable for MVP; revisit before scaling |

### Disallow list (do not introduce without an explicit decision)
| Disallowed | Reason | Use instead |
| --- | --- | --- |
| AWS, GCP, Azure (and their services — S3, Lambda, Cloud Functions, etc.) | The chosen stack already covers hosting, DB, auth, and AI; introducing a general cloud provider signals drift off-plan | Vercel / Railway / Supabase / Anthropic |
| Alternative hosts (Netlify, Render, Fly.io, Heroku) | Hosting decisions are settled | Vercel + Railway |
| Third-party managed caches/queues (e.g. external Redis) | Not needed at MVP scale; adds a vendor and cost | Revisit only if a real NFR demands it |

### Forward-looking constraints (not built in MVP)
- **AI usage must be meterable per user.** AI features are intended to sit behind a paid tier (payment model TBD — see Vision risks); the architecture should make it possible to count/track AI generations per user so limits can be enforced later. Recording the constraint now; not implementing billing in the MVP.
- **Cost posture:** prefer free/low tiers across all services at low usage; AI (Anthropic) is the one inherently pay-per-use cost.

---

## 4. Architecture & Patterns

### API style
| Rule | Choice |
| --- | --- |
| Protocol | REST over HTTP, JSON request/response |
| Versioning | All routes prefixed `/api/v1/...` from day one |
| Framework | FastAPI (backend exposes the API; frontend consumes it) |

### Data flow — Pattern A (backend as single gateway)
- The Next.js frontend **only** calls the FastAPI backend. It never talks to Supabase directly.
- FastAPI is the **single gateway** to Supabase (Postgres + Auth).
- Flow: **Next.js → FastAPI → Supabase**.
- Rationale: one place for all business logic; security and AI-usage metering (§3) are enforceable because all traffic passes through the backend.

### Data access patterns (from §1–2)
| Pattern | Rule |
| --- | --- |
| Schema ownership | SQL-first migrations (Supabase CLI) own the schema |
| Runtime CRUD | SQLModel as the typed query layer |
| Atomic multi-step writes | Postgres RPC function (e.g. `rate_card`: reschedule + XP + streak in one transaction) |
| Row security | RLS enabled on every table |

### Business logic convention
- **Service-layer convention:** business logic lives in a dedicated service layer, **not** in route handlers.
- Route handlers stay thin: validate input → call a service → return a response.
- Services contain the real logic (scheduling, XP rules, AI orchestration) and are independently testable.

### Project structure — Backend (`backend/`)
```
backend/
├── app/
│   ├── main.py              # FastAPI app entry, router registration
│   ├── api/
│   │   └── v1/
│   │       ├── routes/      # thin route handlers (decks, cards, reviews, ai)
│   │       └── deps.py      # shared dependencies (auth, db session)
│   ├── services/            # business logic (scheduling, gamification, ai)
│   ├── models/              # SQLModel classes (mirror the SQL schema)
│   ├── schemas/             # Pydantic request/response models
│   ├── core/                # config, settings, security (JWT verification)
│   └── db/                  # session/engine setup, RPC call wrappers
└── tests/
```

### Project structure — Frontend (`web/`)
```
web/
├── app/                     # App Router: routes, layouts, server components
│   ├── (auth)/              # auth route group (login, signup)
│   ├── dashboard/
│   └── decks/
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── features/            # feature components (review, gamification widgets)
├── lib/
│   ├── api/                 # FastAPI client functions
│   └── queries/             # TanStack Query hooks
├── hooks/
└── types/                   # shared TypeScript types
```

### Data layer (`supabase/`)
```
supabase/
├── migrations/              # timestamped SQL migration files (source of truth)
└── functions/               # SQL function definitions (e.g. rate_card)
```

---

## 5. Security

### Authentication & authorization
| Rule | Detail |
| --- | --- |
| Identity provider | Supabase Auth issues JWTs on signup/login |
| Token verification | FastAPI verifies the Supabase JWT on every protected route |
| Backend → Supabase | FastAPI **forwards the user's JWT** to Supabase so RLS applies at the database level (defense in depth) |
| Row security | RLS enabled on every table; backend authorization checks do **not** replace RLS — both apply |
| Service role key | Used only for privileged system operations that genuinely require it; never the default path for user data |

### Input validation
| Rule | Detail |
| --- | --- |
| Request validation | All request bodies/params validated via Pydantic schemas; raw request data is never trusted |
| AI generation input | User-pasted text is capped at a maximum length (cost + abuse protection) and treated as untrusted input |
| Output to clients | Responses shaped by Pydantic response models; internal fields never exposed |

### Secrets management
| Rule | Detail |
| --- | --- |
| Storage | All secrets (Supabase keys, Anthropic API key, DB connection string) in environment variables only |
| Repo hygiene | No secrets in the repository, ever; `.env` is gitignored; a `.env.example` documents required vars without values |
| Platform stores | Managed via Vercel env vars (frontend) and Railway variables (backend) |

### Encryption
| Rule | Detail |
| --- | --- |
| At rest | Rely on Supabase's built-in encryption at rest |
| In transit | All traffic over HTTPS/TLS (enforced by Vercel, Railway, Supabase) |
| Custom field encryption | Not used in MVP; revisit only if sensitive data types are introduced later |

### AI-specific safety
| Rule | Detail |
| --- | --- |
| Prompt construction | User-pasted content is treated as **data, not instructions** — never interpolated so it can override the system prompt |
| Failure handling | AI generation failures degrade gracefully back to manual card creation (Vision risk) |
| Usage metering | AI calls are attributable per user (supports the future paid-tier limit from §3) |

---

## 6. Testing

### Testing posture
**Lean for MVP:** prioritize unit tests on critical logic, add targeted integration tests on core endpoints, defer broad E2E to a happy-path smoke test. No hard coverage gate while the design stabilizes; tighten later.

### Test types
| Type | Scope for MVP | Priority |
| --- | --- | --- |
| Unit | Spaced-repetition scheduling logic, XP/level/streak rules, service-layer functions | **High** — pure logic, costly if wrong |
| Integration | Core FastAPI endpoints against a test database (decks, cards, review, AI generation) | Medium |
| End-to-end | One happy-path flow: signup → create deck → complete a review | Lower — add once core is stable |

### Tooling
| Layer | Tools |
| --- | --- |
| Backend (FastAPI / Python) | `pytest` + FastAPI `TestClient` |
| Frontend (Next.js / TypeScript) | `Vitest` + React Testing Library |
| End-to-end | Playwright |

### Coverage targets
- **Direction over number:** cover the critical paths — scheduling, gamification math, auth-protected endpoints, AI-generation happy + failure paths.
- **No hard coverage percentage** enforced for the MVP. Revisit once the product stabilizes.

### CI gates
| Gate | Rule |
| --- | --- |
| Test run | Full test suite runs automatically on every pull request (e.g. GitHub Actions) |
| Merge blocking | A merge is blocked if any test fails. All existing tests must pass — no red builds merged |
| Coverage blocking | Not enforced — low/missing coverage does not block a merge; only failing tests do |
| Lint/type-check | TypeScript type-check and linting run in CI alongside tests; failures block merge |

---

## 7. Example Code

Canonical samples live in `inputs/examples/` — one per layer. Every unit of work in construction imitates these patterns, so they are deliberately small, complete, and aligned to every decision above. **Review these before construction begins.**

| File | Layer | What it demonstrates |
| --- | --- | --- |
| `examples/0001_create_decks.sql` | Data | SQL-first migration: table definition, index on the filtered FK, `enable row level security`, and one RLS policy per operation using `auth.uid()` |
| `examples/deck_slice.py` | Backend | Full vertical slice — thin route → service layer → SQLModel query → Pydantic response — with JWT-based `get_current_user_id`, and in-code ownership checks layered on top of RLS (defense in depth) |
| `examples/DeckList.tsx` | Frontend | The `lib/api` → `lib/queries` (TanStack Query) → component layering; Pattern A (frontend calls FastAPI only); shadcn/ui + Tailwind; loading/error/optimistic states |

**Notes on the samples**
- The backend sample combines route/service/model/schema into one file *for readability only*. In the real project they split across the folders in §4.
- The migration filename uses a simple `0001_` prefix for the example; real Supabase CLI migrations use a full timestamp prefix.
- These show *mainstream, defensible* patterns — not the only valid way. They are the chosen baseline so generated code stays consistent, not a claim that alternatives are wrong.