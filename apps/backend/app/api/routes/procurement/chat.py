from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db
from app.chat.service import run_chat

router = APIRouter()

# ── Rate limiting ────────────────────────────────────────────────────────────
# Simple in-memory store: user_id → list of request timestamps in the window.
# Resets on process restart; good enough for a single-process deployment.
_rate_store: dict[int, list[datetime]] = defaultdict(list)
RATE_LIMIT = 30          # max requests per user
RATE_WINDOW = timedelta(hours=1)


def _check_rate_limit(user_id: int) -> None:
    now = datetime.now(timezone.utc)
    cutoff = now - RATE_WINDOW
    timestamps = [t for t in _rate_store[user_id] if t > cutoff]
    _rate_store[user_id] = timestamps
    if len(timestamps) >= RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Saatlik mesaj limitine ulaştınız. Lütfen daha sonra tekrar deneyin.",
        )
    _rate_store[user_id].append(now)


# ── Request / response models ────────────────────────────────────────────────
MAX_MESSAGES = 40         # max turns in history the client may send
MAX_MESSAGE_CHARS = 2_000 # max chars per individual message


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

    @field_validator("content")
    @classmethod
    def content_length(cls, v: str) -> str:
        if len(v) > MAX_MESSAGE_CHARS:
            raise ValueError(f"Mesaj {MAX_MESSAGE_CHARS} karakterden uzun olamaz.")
        return v


class ChatRequest(BaseModel):
    messages: list[ChatMessage]

    @field_validator("messages")
    @classmethod
    def message_count(cls, v: list[ChatMessage]) -> list[ChatMessage]:
        if not v:
            raise ValueError("En az bir mesaj gereklidir.")
        if len(v) > MAX_MESSAGES:
            raise ValueError(f"Konuşma geçmişi {MAX_MESSAGES} mesajdan fazla olamaz.")
        return v


class ChatResponse(BaseModel):
    message: str


# ── Endpoint ─────────────────────────────────────────────────────────────────
@router.post("/", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    _check_rate_limit(current_user.id)
    messages = [{"role": m.role, "content": m.content} for m in body.messages]
    reply = await run_chat(messages=messages, db=db, current_user=current_user)
    return ChatResponse(message=reply)
