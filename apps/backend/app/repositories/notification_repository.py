from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


class NotificationRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, user_id: int, message: str, requirement_id: int | None = None) -> Notification:
        notif = Notification(user_id=user_id, message=message, requirement_id=requirement_id)
        self.db.add(notif)
        await self.db.commit()
        await self.db.refresh(notif)
        return notif

    async def get_for_user(self, user_id: int, limit: int = 30) -> list[Notification]:
        result = await self.db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_unread(self, user_id: int) -> int:
        result = await self.db.execute(
            select(Notification)
            .where(Notification.user_id == user_id, Notification.read == False)  # noqa: E712
        )
        return len(result.scalars().all())

    async def mark_all_read(self, user_id: int) -> None:
        await self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.read == False)  # noqa: E712
            .values(read=True)
        )
        await self.db.commit()
