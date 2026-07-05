# MemoRise — Component Methods

Method **signatures and I/O only**. Detailed business rules (SM-2 constants, XP amounts,
streak timezone) are defined later in Functional Design. Types are indicative (Python type hints
for backend; TS for frontend). All backend service methods receive an authenticated `user_id`.

---

## Domain — pure logic (`domain/`) — primary PBT targets

### `domain/scheduling.py`
```python
@dataclass(frozen=True)
class CardSchedule:
    ease: float
    interval_days: int
    repetitions: int
    due_date: date

def schedule_next(state: CardSchedule, rating: Rating, today: date) -> CardSchedule
    # Pure SM-2: maps rating (AGAIN|HARD|GOOD|EASY) → new schedule. No I/O.

def initial_schedule(today: date) -> CardSchedule
    # New/unseen card starting state.
```

### `domain/gamification.py`
```python
def award_xp(current_xp: int, rating: Rating) -> int          # fixed XP per review (Q7)
def level_for_xp(total_xp: int) -> int                        # XP → level (monotonic)
def update_streak(current: int, last_review: date | None, today: date) -> int
    # Hard reset to 0 on a missed day (Q6); +1 on a new active day.
```

---

## Services (`services/`)

### `UserService`
```python
def get_profile(user_id: UUID) -> ProfileDTO                  # xp, level, streak
```

### `DeckService`
```python
def create_deck(user_id, data: DeckCreate) -> DeckDTO
def edit_deck(user_id, deck_id, data: DeckUpdate) -> DeckDTO
def delete_deck(user_id, deck_id) -> None
def list_decks(user_id) -> list[DeckWithDueCount]            # includes due-today count (FR-8/16)
```

### `CardService`
```python
def create_card(user_id, deck_id, data: CardCreate) -> CardDTO
def edit_card(user_id, card_id, data: CardUpdate) -> CardDTO
def delete_card(user_id, card_id) -> None
def list_cards(user_id, deck_id) -> list[CardDTO]
```

### `SchedulerService`
```python
def get_due_queue(user_id, deck_id) -> list[CardDTO]         # per-deck due + new (FR-16)
def submit_rating(user_id, card_id, rating: Rating) -> RatingResult
    # 1) load card state  2) domain.schedule_next + gamification.award_xp/update_streak
    # 3) persist atomically via rate_card RPC  4) return new due date + xp/level/streak
```

### `GamificationService`
```python
def apply_review_rewards(profile: ProfileDTO, rating, today) -> RewardDelta
    # delegates to domain.gamification; returns xp delta, new level, new streak
```

### `AICardService`
```python
def generate_cards(user_id, text: str, target_count: int | None) -> list[DraftCard]
    # validate length (<=5k), build prompt (text as DATA, SEC-AI-1),
    # call Anthropic (settings.ANTHROPIC_MODEL), parse/validate JSON,
    # cap at ~20, meter usage, graceful fallback on failure (FR-21/23, US-19)
```

### `MeteringService`
```python
def record_ai_usage(user_id, tokens_or_count, model: str) -> None      # US-25
def log_event(user_id, event_type: str, payload: dict) -> None         # US-26 metric events
```

---

## Data access

### `db/` RPC wrapper
```python
def rate_card(
    user_id, card_id,
    new_schedule: CardSchedule,
    xp_delta: int, new_level: int, new_streak: int,
    rating: Rating,
) -> None
    # Calls the Postgres rate_card() function; single transaction:
    # UPDATE cards SET ... ; UPDATE profiles SET xp/level/streak ... ; INSERT review_logs ...
```

---

## Frontend (`lib/api` + `lib/queries`)
```ts
// lib/api
listDecks(): Promise<DeckWithDue[]>
createDeck(input): Promise<Deck>
listCards(deckId): Promise<Card[]>
getDueQueue(deckId): Promise<Card[]>
submitRating(cardId, rating): Promise<RatingResult>
generateCards(text, targetCount?): Promise<DraftCard[]>
acceptDrafts(deckId, cards): Promise<Card[]>
getProfile(): Promise<Profile>

// lib/queries (TanStack Query hooks wrapping the above)
useDecks(), useCards(deckId), useDueQueue(deckId),
useSubmitRating() /* optimistic */, useGenerateCards(), useProfile()
```
