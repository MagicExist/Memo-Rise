"""
EXAMPLE BACKEND SLICE — canonical pattern for MemoRise (FastAPI).

Shows the full vertical slice for ONE resource (decks):
    route handler (thin)  ->  service (logic)  ->  SQLModel (query)  ->  Pydantic (response)

In a real project these live in separate files (see the structure in
tech-environment.md):
    app/api/v1/routes/decks.py   <- route handler
    app/services/decks.py        <- service layer
    app/models/deck.py           <- SQLModel
    app/schemas/deck.py          <- Pydantic request/response
    app/api/v1/deps.py           <- shared dependencies (auth, db)

They are combined here in one file ONLY so the example reads top-to-bottom.
"""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, SQLModel, select


# ── MODEL (app/models/deck.py) ──────────────────────────────
# SQLModel mirrors the SQL table. The SQL migration OWNS the schema;
# this class is hand-written to match it. It is the query layer only.
class Deck(SQLModel, table=True):
    __tablename__ = "decks"

    id: UUID | None = Field(default=None, primary_key=True)
    user_id: UUID
    name: str
    created_at: datetime | None = None


# ── SCHEMAS (app/schemas/deck.py) ───────────────────────────
# Pydantic models define the API SHAPE — what comes in, what goes out.
# Kept separate from the DB model so we never leak internal fields.
class DeckCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class DeckRead(BaseModel):
    id: UUID
    name: str
    created_at: datetime


# ── DEPENDENCIES (app/api/v1/deps.py) ───────────────────────
# Stubs here; real implementations verify the Supabase JWT and yield
# a DB session. `get_current_user_id` extracts auth.uid() equivalent
# from the verified token.
def get_db() -> Session:  # real version: yields a SQLModel Session
    ...


def get_current_user_id() -> UUID:  # real version: verifies Supabase JWT
    ...


# ── SERVICE (app/services/decks.py) ─────────────────────────
# All business logic lives here, NOT in the route. Independently testable:
# you can call these functions in a unit test without HTTP.
class DeckService:
    def __init__(self, db: Session):
        self.db = db

    def list_for_user(self, user_id: UUID) -> list[Deck]:
        return self.db.exec(
            select(Deck).where(Deck.user_id == user_id)
        ).all()

    def create_for_user(self, user_id: UUID, data: DeckCreate) -> Deck:
        deck = Deck(user_id=user_id, name=data.name)
        self.db.add(deck)
        self.db.commit()
        self.db.refresh(deck)
        return deck

    def get_owned(self, user_id: UUID, deck_id: UUID) -> Deck:
        deck = self.db.get(Deck, deck_id)
        # Authorization check in code — even though RLS also guards this.
        # Defense in depth: both layers enforce ownership.
        if deck is None or deck.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found"
            )
        return deck


# ── ROUTES (app/api/v1/routes/decks.py) ─────────────────────
# Thin handlers: validate input (Pydantic does it automatically) ->
# call service -> return response. No logic here.
router = APIRouter(prefix="/api/v1/decks", tags=["decks"])


@router.get("", response_model=list[DeckRead])
def list_decks(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return DeckService(db).list_for_user(user_id)


@router.post("", response_model=DeckRead, status_code=status.HTTP_201_CREATED)
def create_deck(
    data: DeckCreate,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return DeckService(db).create_for_user(user_id, data)