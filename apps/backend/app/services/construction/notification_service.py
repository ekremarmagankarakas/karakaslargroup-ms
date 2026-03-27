"""
Construction notification service.
Reuses the existing notifications table via NotificationRepository.
All notify_* functions query for manager/admin users and create notifications for them.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.repositories.notification_repository import NotificationRepository


async def _get_manager_admin_ids(db: AsyncSession) -> list[int]:
    result = await db.execute(
        select(User.id).where(
            User.role.in_([UserRole.manager, UserRole.admin]),
            User.is_active.is_(True),
        )
    )
    return list(result.scalars().all())


async def notify_critical_issue(db: AsyncSession, issue_title: str, project_name: str) -> None:
    user_ids = await _get_manager_admin_ids(db)
    repo = NotificationRepository(db)
    msg = f"🔴 Kritik sorun bildirildi: '{issue_title}' — Proje: {project_name}"
    for uid in user_ids:
        await repo.create(user_id=uid, message=msg)


async def notify_change_order_submitted(
    db: AsyncSession, co_title: str, project_name: str
) -> None:
    user_ids = await _get_manager_admin_ids(db)
    repo = NotificationRepository(db)
    msg = f"📋 Revizyon siparişi gönderildi: '{co_title}' — Proje: {project_name}"
    for uid in user_ids:
        await repo.create(user_id=uid, message=msg)


async def notify_budget_exceeded(
    db: AsyncSession, project_name: str, actual_cost: float, budget: float
) -> None:
    user_ids = await _get_manager_admin_ids(db)
    repo = NotificationRepository(db)
    pct = round((actual_cost / budget) * 100)
    msg = f"💰 Bütçe aşıldı: {project_name} — Gerçekleşen: ₺{actual_cost:,.0f} / Bütçe: ₺{budget:,.0f} (%{pct})"
    for uid in user_ids:
        await repo.create(user_id=uid, message=msg)


async def notify_permit_expiring(
    db: AsyncSession, permit_type: str, project_name: str, days_remaining: int
) -> None:
    user_ids = await _get_manager_admin_ids(db)
    repo = NotificationRepository(db)
    msg = f"⚠️ İzin süresi dolmak üzere: {permit_type} — Proje: {project_name} ({days_remaining} gün kaldı)"
    for uid in user_ids:
        await repo.create(user_id=uid, message=msg)


async def notify_milestone_overdue(
    db: AsyncSession, milestone_title: str, project_name: str, days_late: int
) -> None:
    user_ids = await _get_manager_admin_ids(db)
    repo = NotificationRepository(db)
    msg = f"⏰ Aşama gecikiyor: '{milestone_title}' — Proje: {project_name} ({days_late} gün gecikmeli)"
    for uid in user_ids:
        await repo.create(user_id=uid, message=msg)
