from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db
from app.chat.construction_service import run_construction_chat

router = APIRouter()

_rate_store: dict[int, list[datetime]] = defaultdict(list)
RATE_LIMIT = 30
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


MAX_MESSAGES = 40
MAX_MESSAGE_CHARS = 2_000


class ConstructionChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

    @field_validator("content")
    @classmethod
    def content_length(cls, v: str) -> str:
        if len(v) > MAX_MESSAGE_CHARS:
            raise ValueError(f"Mesaj {MAX_MESSAGE_CHARS} karakterden uzun olamaz.")
        return v


class ConstructionChatRequest(BaseModel):
    messages: list[ConstructionChatMessage]

    @field_validator("messages")
    @classmethod
    def message_count(cls, v: list[ConstructionChatMessage]) -> list[ConstructionChatMessage]:
        if not v:
            raise ValueError("En az bir mesaj gereklidir.")
        if len(v) > MAX_MESSAGES:
            raise ValueError(f"Konuşma geçmişi {MAX_MESSAGES} mesajdan fazla olamaz.")
        return v


class ConstructionChatResponse(BaseModel):
    message: str


@router.post("/chat", response_model=ConstructionChatResponse)
async def construction_chat(
    body: ConstructionChatRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    _check_rate_limit(current_user.id)
    messages = [{"role": m.role, "content": m.content} for m in body.messages]
    reply = await run_construction_chat(messages=messages, db=db, current_user=current_user)
    return ConstructionChatResponse(message=reply)
