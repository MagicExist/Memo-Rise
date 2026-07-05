# MemoRise — User Stories

**Breakdown:** Hybrid — feature epics; each story tagged with persona(s) and traced to
requirement IDs. **Acceptance criteria:** Gherkin (Given/When/Then). **INVEST**-aligned.
Personas: **Sofía** (student), **Marco** (self-directed), **Elena** (lapsed returner).

Traceability legend: FR = functional requirement, NFR = non-functional, SEC = security,
TST/PBT = testing — all from `requirements.md`. Priority: **M** = MVP-must.

---

## Epic 1 — Accounts & Authentication

### US-01 — Sign up with email and password  ·  M
**Personas:** Sofía, Marco, Elena · **Traces:** FR-1, SEC-10, SEC-4
_As a new learner, I want to create an account with my email and password so that my decks and progress are saved to me._
```gherkin
Scenario: Successful signup
  Given I am on the signup page and have no account
  When I submit a valid email and a password of at least 8 characters
  Then my account is created and I am signed in
  And a verification email is sent to my address
  And I am NOT blocked from using the app before verifying (I can start immediately)

Scenario: Weak or breached password rejected
  Given I am on the signup page
  When I submit a password shorter than 8 characters or found on a breached-password list
  Then signup is rejected with a clear, generic message
  And no account is created

Scenario: Duplicate or invalid email
  Given an account already exists for that email (or the email is malformed)
  When I submit the signup form
  Then I receive a generic error that does not reveal whether the email is registered
```

### US-02 — Log in and log out  ·  M
**Personas:** Sofía, Marco, Elena · **Traces:** FR-2, SEC-10, SEC-6
_As a returning learner, I want to log in and out so that I can access my data securely on any device._
```gherkin
Scenario: Successful login
  Given I have an account
  When I submit my correct email and password
  Then I receive an authenticated session (Supabase JWT) and land on my dashboard

Scenario: Invalid credentials
  Given I have an account
  When I submit an incorrect password
  Then I see a generic "invalid credentials" error (no user enumeration)

Scenario: Brute-force protection
  Given repeated failed login attempts on an account
  When the failure threshold is exceeded
  Then further attempts are throttled or temporarily locked

Scenario: Logout
  Given I am logged in
  When I log out
  Then my session is invalidated and cannot be reused
```

### US-03 — Reset a forgotten password  ·  M
**Personas:** Sofía, Marco, Elena · **Traces:** FR-3, SEC-10
_As a learner who forgot my password, I want to reset it by email so that I can get back into my account._
```gherkin
Scenario: Request reset
  Given I am on the "forgot password" page
  When I submit any email address
  Then I always see the same generic confirmation (no account enumeration)
  And if the address has an account, a reset email is sent via Supabase Auth

Scenario: Complete reset
  Given I follow a valid reset link
  When I set a new password meeting the policy
  Then my password is updated and I can log in with it
```

### US-04 — Account-gated access  ·  M
**Personas:** Sofía, Marco, Elena · **Traces:** FR-4, SEC-6
_As the product owner, I want all features to require an account so that every user's data is isolated and the onboarding metric is measured from signup._
```gherkin
Scenario: Unauthenticated access blocked
  Given I am not logged in
  When I request any deck, card, review, or AI endpoint
  Then the request is rejected (deny-by-default) and I am prompted to log in

Scenario: No guest mode
  Given I have not signed up
  When I open the app
  Then I cannot create or review decks until I create an account
```

---

## Epic 2 — Decks

### US-05 — Create a deck  ·  M
**Personas:** Marco, Sofía · **Traces:** FR-5, SEC-6
_As a learner, I want to create a deck so that I can group cards for a subject._
```gherkin
Scenario: Create a deck
  Given I am logged in
  When I create a deck with a valid name
  Then the deck is saved and owned by me
  And it appears in my deck list with 0 cards
```

### US-06 — Edit / rename a deck  ·  M
**Personas:** Marco · **Traces:** FR-6, SEC-6
_As a learner, I want to rename or edit a deck so that its purpose stays clear._
```gherkin
Scenario: Rename my deck
  Given I own a deck
  When I change its name to a valid value
  Then the new name is saved and shown

Scenario: Cannot edit another user's deck
  Given a deck owned by someone else
  When I attempt to edit it
  Then the request is denied (object-level authorization + RLS)
```

### US-07 — Delete a deck  ·  M
**Personas:** Marco · **Traces:** FR-7, SEC-6
_As a learner, I want to delete a deck so that I can remove material I no longer need._
```gherkin
Scenario: Delete my deck
  Given I own a deck with cards
  When I delete it and confirm
  Then the deck, its cards, and their review state are removed
  And the deck disappears from my list
```

### US-08 — View my decks with due counts  ·  M
**Personas:** Marco, Sofía, Elena · **Traces:** FR-8, FR-16, NFR-5
_As a learner, I want to see my decks with how many cards are due today so that I know what to study._
```gherkin
Scenario: List decks with due counts
  Given I am logged in and own several decks
  When I open my deck list
  Then I see each deck with its count of cards due today
  And I see only my own decks
```

---

## Epic 3 — Cards

### US-09 — Create a card  ·  M
**Personas:** Marco, Sofía · **Traces:** FR-9, SEC-4
_As a learner, I want to add a basic front/back card so that I can study a fact._
```gherkin
Scenario: Add a card
  Given I own a deck
  When I create a card with front and back text within the allowed length
  Then the card is saved in that deck as new/unseen (ready for scheduling)

Scenario: Oversized input rejected
  Given I am adding a card
  When front or back text exceeds the maximum length
  Then the input is rejected with a clear message
```

### US-10 — Edit a card  ·  M
**Personas:** Marco · **Traces:** FR-10, SEC-4, SEC-6
_As a learner, I want to edit a card so that I can fix or improve it._
```gherkin
Scenario: Edit my card
  Given I own a card
  When I change its front or back text (within limits)
  Then the changes are saved
  And its scheduling state is preserved
```

### US-11 — Delete a card  ·  M
**Personas:** Marco · **Traces:** FR-11, SEC-6
_As a learner, I want to delete a card so that I can remove mistakes or duplicates._
```gherkin
Scenario: Delete my card
  Given I own a card
  When I delete it
  Then it is removed from the deck and from the due queue
```

### US-12 — List cards in a deck  ·  M
**Personas:** Marco · **Traces:** FR-12, SEC-6
_As a learner, I want to see all cards in a deck so that I can manage its contents._
```gherkin
Scenario: View cards
  Given I own a deck with cards
  When I open the deck
  Then I see the list of its cards (front/back)
  And only for decks I own
```

---

## Epic 4 — Review & Scheduling

### US-13 — Review a specific deck's due cards  ·  M
**Personas:** Sofía, Marco, Elena · **Traces:** FR-14, FR-16
_As a learner, I want to start a review session for one specific deck so that I study that subject's due (and new) cards on their own — not mixed together with every other deck._
```gherkin
Scenario: Choose a deck to study
  Given I am on my dashboard or deck list
  When I select a specific deck to review
  Then a review session starts scoped to that deck only
  And it draws from that deck's "due today" queue plus its new cards (per the scheduler's new-card policy)

Scenario: Run the per-deck review session
  Given the selected deck has cards due today
  When the session runs
  Then I see one card front at a time, only from that deck
  And I can reveal the answer, then rate my recall
  And the session advances to the next due card until that deck's queue is empty
  And cards from other decks never appear in this session

Scenario: Nothing due in this deck
  Given the selected deck has no cards due today
  When I open it to review
  Then I am told there is nothing to review in this deck right now

# Note: A combined "study all due cards across every deck" session is intentionally OUT of the MVP (per-deck only, matching the vision). Candidate for a later phase.
```

### US-14 — Rate recall with four buttons (atomic)  ·  M
**Personas:** Sofía, Elena · **Traces:** FR-15, FR-20, SEC-15
_As a learner, I want to rate a card as Again/Hard/Good/Easy so that scheduling and my progress update together._
```gherkin
Scenario: Rate a revealed card
  Given a card's answer is revealed
  When I choose Again, Hard, Good, or Easy
  Then in one atomic transaction the card is rescheduled, XP is awarded, and my streak is updated
  And if any part fails, none of the changes are applied

Scenario: Immediate feedback
  Given I rate a card
  When the rating is submitted
  Then the UI advances optimistically without a visible delay
```

### US-15 — Schedule the next review with SM-2  ·  M
**Personas:** Marco, Sofía · **Traces:** FR-13, PBT-C, PBT-E
_As a learner, I want the app to decide when I next see a card so that I review it right before I'd forget it._
```gherkin
Scenario: Reschedule after a rating
  Given a card with SM-2 state (ease, interval, repetitions)
  When I rate it
  Then its ease, interval, repetition count, and due date update per documented SM-2 rules

Scenario: Invariants hold (property-based)
  Given any valid card state and rating sequence
  When scheduling is applied
  Then the ease factor never drops below the documented floor
  And a "Good"/"Easy" rating never produces a shorter next interval than "Again" for the same state
```

---

## Epic 5 — Gamification

### US-16 — Earn XP for completing reviews  ·  M
**Personas:** Sofía, Elena · **Traces:** FR-17, PBT-C
_As a learner, I want to earn XP for each review so that studying feels rewarding._
```gherkin
Scenario: Award XP per review
  Given I complete a review by rating a card
  When the rating is recorded
  Then a fixed amount of XP is added to my total, regardless of the rating chosen

Scenario: XP invariant (property-based)
  Given any sequence of completed reviews
  When XP accrues
  Then my XP total is non-negative and only ever increases
```

### US-17 — Level up from accumulated XP  ·  M
**Personas:** Elena, Sofía · **Traces:** FR-18, PBT-C
_As a learner, I want a level that grows with my XP so that I see long-term progress._
```gherkin
Scenario: Compute level from XP
  Given my accumulated XP
  When my XP crosses a level threshold
  Then my level increases per the documented XP→level function
  And my level is shown on the dashboard

Scenario: Level monotonic (property-based)
  Given XP only increases
  Then my level never decreases
```

### US-18 — Keep a daily streak (hard reset)  ·  M
**Personas:** Sofía, Elena, Marco · **Traces:** FR-19
_As a learner, I want a daily streak counter so that I'm motivated to study every day._
```gherkin
Scenario: Increment on an active day
  Given I have a current streak
  When I complete at least one review on a new calendar day
  Then my streak increments by one

Scenario: Hard reset on a missed day
  Given I have a current streak
  When a full day passes with no completed review
  Then my streak resets to 0 (no grace or freeze)

Scenario: Visible counter
  Given I am on my dashboard
  Then my current streak is displayed
```
> ⚠️ Elena (lapsed returner) is most exposed to streak anxiety here — see personas.md and requirements OI-1.

---

## Epic 6 — AI Card-Generation Assistant

### US-19 — Generate draft cards from pasted text  ·  M
**Personas:** Sofía, Marco · **Traces:** FR-21, SEC-4, SEC-AI-1, FR-24
_As a learner, I want to paste my notes and get draft flashcards so that I don't have to make cards by hand._
```gherkin
Scenario: Generate drafts
  Given I am logged in and paste text within ~5,000 characters
  When I request card generation
  Then the assistant (Claude Sonnet, configurable) returns draft front/back cards
  And the call is metered against my account

Scenario: Choose how many cards to generate
  Given I am requesting card generation
  When I optionally set a target number of cards (e.g. 5)
  Then the assistant returns at most that many draft cards
  And if I set no target, the assistant decides how many to return
  And in every case the count is capped at the ~20-card maximum

Scenario: Input over the cap
  Given I paste more than ~5,000 characters
  When I request generation
  Then the request is rejected before any AI call, with a clear message

Scenario: Pasted text is data, not instructions
  Given my pasted text contains phrases that look like instructions
  When cards are generated
  Then the content is treated as data and cannot override the system prompt

# Note: The MVP does NOT enforce a per-user AI usage cap or paid plan (Q9/Q12). Generation is metered per user (US-25 / FR-24) so a per-user limit or paid tier can be enabled later without redesign. Cost is bounded now by the ~5,000-char input cap and the ~20-card output cap.
```

### US-20 — Review, edit, and accept AI drafts  ·  M
**Personas:** Sofía, Marco · **Traces:** FR-22
_As a learner, I want to review and edit generated cards before saving so that only good cards enter my deck._
```gherkin
Scenario: Curate drafts before saving
  Given the assistant returned draft cards
  When I edit some, discard others, and accept the rest into a chosen deck
  Then only the accepted cards are saved
  And discarded/unaccepted drafts are never persisted
```

### US-21 — Graceful fallback when AI fails  ·  M
**Personas:** Sofía, Marco · **Traces:** FR-23, SEC-15
_As a learner, I want a smooth fallback when generation fails so that I can still make cards._
```gherkin
Scenario: AI error or timeout
  Given I requested generation
  When the AI call is slow, fails, or times out
  Then I see a friendly message and a path to create cards manually
  And the app does not crash or lose my pasted text

Scenario: Malformed AI output
  Given the AI returns malformed or unparseable content
  When the response is processed
  Then it is validated and rejected safely (fail closed) and I am offered manual creation
```

---

## Epic 7 — Dashboard & Onboarding

### US-22 — See my dashboard  ·  M
**Personas:** Marco, Sofía, Elena · **Traces:** FR-25, NFR-5
_As a learner, I want a clean dashboard so that I can see my decks, what's due, and my progress at a glance._
```gherkin
Scenario: Dashboard overview
  Given I am logged in
  When I open the app
  Then I see my decks with due counts and my current streak, level, and XP
  And the initial data loads via server-side rendering for a fast first paint
```

### US-23 — Reach my first review in minutes  ·  M
**Personas:** Sofía, Elena · **Traces:** FR-26, NFR-6
_As a new learner, I want a fast, guided path from signup to my first review so that I feel the value immediately._
```gherkin
Scenario: Guided first run
  Given I just signed up
  When I follow the onboarding path
  Then I can create or AI-generate a deck and complete one review without confusion
  And the time from signup to first completed review is recorded (target ~5 min)
```

### US-24 — Use MemoRise on my phone browser (English)  ·  M
**Personas:** Sofía, Elena · **Traces:** FR-27, FR-28, NFR-10
_As a learner, I want the app to work well in my phone browser so that I can review anywhere._
```gherkin
Scenario: Responsive review on mobile
  Given I open MemoRise in a phone browser
  When I run a review session
  Then the layout is usable and the rating buttons are easily tappable

Scenario: English UI
  Given I use the app
  Then all interface copy is in English (no language toggle in the MVP)
```

---

## Epic 8 — Technical Enablers (system-wide)

### US-25 — Meter AI usage per user  ·  M
**Personas:** Product owner · **Traces:** FR-24, SEC-AI-3, Q12
_As the product owner, I want every AI generation attributed to a user so that a paid tier / limits can be added later without redesign._
```gherkin
Scenario: Record each AI call
  Given a user triggers card generation
  When the AI call is made
  Then a usage record is stored with user ID, timestamp, and a usage measure
  And no hard cap blocks the call in the MVP
```

### US-26 — Log success-metric events  ·  M
**Personas:** Product owner · **Traces:** FR-29
_As the product owner, I want key events logged from day one so that I can validate the success-metric hypotheses._
```gherkin
Scenario: Emit metric events
  Given users act in the app
  When they sign up, complete reviews, change streaks, or create/keep AI cards
  Then corresponding events are recorded in Supabase with timestamp and user reference
  And they are sufficient to compute time-to-first-review, day-7 return, streak length, AI adoption, and cards-kept ratio
```

### US-27 — Structured application logging  ·  M
**Personas:** Product owner · **Traces:** NFR-8, SEC-2
_As the product owner, I want structured logs so that I can operate and debug safely._
```gherkin
Scenario: Structured, safe logs
  Given any backend request
  When it is handled
  Then a structured log entry includes timestamp, request/correlation ID, level, and message
  And no secrets, tokens, or PII appear in the logs
```

### US-28 — Enforce per-user data isolation (RLS)  ·  M
**Personas:** Product owner · **Traces:** SEC-5, SEC-6, NFR-4
_As the product owner, I want row-level security on every table so that users can never reach each other's data._
```gherkin
Scenario: RLS on every table
  Given the database schema
  When any table storing user data is created
  Then RLS is enabled with per-operation policies keyed to the authenticated user
  And backend ownership checks are layered on top (defense in depth)
```

### US-29 — CI pipeline with tests, PBT, and dependency scanning  ·  M
**Personas:** Product owner · **Traces:** TST-4, PBT-H, PBT-I, SEC-8
_As the product owner, I want CI to run the full test suite (including property-based tests) and scan dependencies so that broken or unsafe code can't merge._
```gherkin
Scenario: CI gate on every PR
  Given a pull request
  When CI runs
  Then the full unit/integration/E2E and property-based tests run (Hypothesis + fast-check), with seeds logged
  And type-check, lint, and a dependency vulnerability scan run
  And a merge is blocked if any test, type-check, or lint step fails
```

---

## Coverage & Traceability Summary

- **29 stories** across 8 epics; all MVP-must.
- **Functional coverage:** FR-1…FR-29 each map to at least one story (see per-story Traces).
- **Security:** SEC-* folded into acceptance criteria (US-01/02/04/06/09/10/14/19/21) plus enablers US-27 (logging), US-28 (RLS), US-29 (supply chain).
- **Testing/PBT:** property-based scenarios embedded in US-15/16/17; CI/framework enablement in US-29; example-based + E2E covered by TST-1…TST-3 (Construction).
- **Personas:** Sofía (student) primary across onboarding, review, gamification, AI; Marco (self-directed) across decks/cards/scheduling/AI; Elena (lapsed) across onboarding, review, gamification — with the hard-reset streak tension flagged.
