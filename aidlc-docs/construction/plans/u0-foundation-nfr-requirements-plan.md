# U0 Foundation — NFR Requirements Plan (CONSTRUCTION)

**Unit:** U0 Foundation & Platform · **Depth:** Light — platform NFRs are largely fixed by
`tech-environment.md` (§3 cost, §5 security, §6 testing) and the enabled Security + PBT extensions.
This stage documents U0's NFRs + tech-stack decisions and resolves the two open SEC-10 items.

**How to answer:** pick a letter after each `[Answer]:` (recommended marked). Reply "approve" when done.

---

## 1. Execution Checklist (artifacts to generate)
- [x] `nfr-requirements.md` — U0 NFRs (security, testing/PBT, maintainability, cost; perf/availability N/A-light)
- [x] `tech-stack-decisions.md` — confirmed stack + CI/tooling choices for U0

## 2. Pre-settled (not re-asked)
Stack per tech-environment: Next.js/TS, FastAPI/Python 3.14, Supabase (CLI, RLS), Vercel/Railway/Supabase
hosting, `pytest`+TestClient, `Vitest`+RTL, `Playwright`, **Hypothesis** + **fast-check** (PBT-09),
CI on GitHub Actions (GitHub Flow), Conventional Commits + commitlint, `.env`/`.env.example` hygiene.

## 3. Questions (SEC-10 supply chain — the only open items)

### Question 1 — Dependency vulnerability scanning (SEC-10)
A) GitHub **Dependabot** + `pip-audit` (Python) + `npm audit` (JS) in CI *(recommended: native + language-specific, free)*
B) Dependabot only
C) A third-party scanner (e.g. Snyk)
X) Other
[Answer]: A

### Question 2 — SBOM generation (SEC-10 requires an SBOM for production deployments)
A) Generate an SBOM in CI from the start (e.g. CycloneDX action) *(recommended: fully satisfies SEC-10; low effort)*
B) Defer SBOM for the MVP with a documented exception (revisit before scaling)
X) Other
[Answer]: A

## 4. Answers Summary
- **Q1 = A** Dependabot + `pip-audit` + `npm audit` in CI
- **Q2 = A** Generate an SBOM (CycloneDX) in CI from the start
