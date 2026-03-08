from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, get_db
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationResponse

router = APIRouter()


@router.get("/", response_model=list[NotificationResponse])
async def list_notifications(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = NotificationRepository(db)
    return await repo.get_for_user(current_user.id)


@router.get("/unread-count")
async def unread_count(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = NotificationRepository(db)
    count = await repo.count_unread(current_user.id)
    return {"count": count}


@router.patch("/read-all", status_code=204)
async def mark_all_read(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    repo = NotificationRepository(db)
    await repo.mark_all_read(current_user.id)
