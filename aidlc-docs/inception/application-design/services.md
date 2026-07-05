# MemoRise — Services & Orchestration

One service per domain (Q1). Services hold the business logic; routers stay thin; pure math is
delegated to the `domain/` module (Q3); atomic writes go through the `rate_card` RPC (Q2).

---

## Service catalog

| Service | Owns | Calls | Notes |
|---|---|---|---|
| `UserService` | profile reads | DB (profiles) | Auth itself is Supabase; backend verifies JWT |
| `DeckService` | deck lifecycle | DB (decks) | ownership + RLS |
| `CardService` | card lifecycle | DB (cards) | ownership via parent deck |
| `SchedulerService` | due queue + rating orchestration | `domain.scheduling`, `GamificationService`, `rate_card` RPC | the core review transaction |
| `GamificationService` | XP/level/streak | `domain.gamification`, DB (profiles) | pure math delegated |
| `AICardService` | AI draft generation | Anthropic SDK, `MeteringService` | security-isolated (SEC-9) |
| `MeteringService` | AI usage + metric events | DB (ai_usage, metric_events) | enables future limits (US-25) |

---

## Key orchestration 1 — Submit a review rating (atomic)

Implements US-14 / FR-20 with the Q2 design (Python math, RPC persistence).

```
ReviewRouter.POST /reviews {card_id, rating}
  -> deps.get_current_user_id  (verify JWT)                        [SEC-6]
  -> SchedulerService.submit_rating(user_id, card_id, rating)
       1. load card SM-2 state + profile (RLS-scoped)
       2. new_state = domain.scheduling.schedule_next(state, rating, today)   [pure]
       3. rewards  = GamificationService.apply_review_rewards(profile, rating, today)
                      -> domain.gamification.award_xp / level_for_xp / update_streak  [pure]
       4. db.rate_card(user_id, card_id, new_state, rewards...) -> ONE transaction:
              UPDATE cards (ease, interval, reps, due_date)
              UPDATE profiles (xp, level, streak)
              INSERT review_logs
       5. MeteringService.log_event(user_id, "review_completed", ...)
       6. return RatingResult {next_due, xp, level, streak}
  -> Pydantic response model
```
Atomicity guarantee: steps in (4) succeed or fail together. If the RPC fails, no partial state;
the service returns a safe error (fail closed, SEC-15). Frontend applies the result optimistically.

---

## Key orchestration 2 — AI card generation

Implements US-19/20/21, FR-21/22/23.

```
AIRouter.POST /ai/generate-cards {text, target_count?}
  -> deps.get_current_user_id
  -> AICardService.generate_cards(user_id, text, target_count)
       1. validate length <= ~5,000 chars  (reject BEFORE any AI call)   [SEC-4]
       2. build prompt: system instructions + user text as DATA          [SEC-AI-1]
       3. call Anthropic (settings.ANTHROPIC_MODEL = Sonnet default)
       4. parse + validate JSON; reject malformed (fail closed)          [SEC-15]
       5. cap results at min(target_count or max, ~20)
       6. MeteringService.record_ai_usage(user_id, usage, model)         [US-25]
       on error/timeout: return graceful fallback signal -> UI offers manual creation [FR-23]
  -> returns DraftCard[] (NOT yet persisted)

Later: UI accepts drafts -> CardService.create_card(...) per accepted card (US-20)
```

---

## Cross-cutting service concerns
- **Metering everywhere AI is used:** `AICardService` always routes through `MeteringService` so usage is attributable per user (future paid tier).
- **Event logging:** state-changing flows (signup, review completed, streak change, AI deck created, cards kept/discarded) emit `metric_events` (US-26).
- **Security isolation (SEC-9):** auth/JWT, AI orchestration, and metering are each isolated services — not scattered through routers.
- **Rate limiting (SEC-9):** applied at router/gateway level on auth and AI endpoints (thresholds set in NFR Design).
