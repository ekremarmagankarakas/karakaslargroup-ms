from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models.requirement import Requirement, RequirementStatus
from app.models.user import User, UserRole


class RequirementRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, requirement_id: int) -> Requirement | None:
        result = await self.db.execute(
            select(Requirement)
            .options(
                joinedload(Requirement.user),
                joinedload(Requirement.approver),
                selectinload(Requirement.images),
            )
            .where(Requirement.id == requirement_id)
        )
        return result.scalar_one_or_none()

    async def get_paginated(
        self,
        *,
        user_id: int,
        role: UserRole,
        page: int,
        limit: int,
        search: str | None = None,
        filter_user_id: int | None = None,
        status: RequirementStatus | None = None,
        paid: bool | None = None,
        month: int | None = None,
        year: int | None = None,
    ) -> tuple[list[Requirement], int]:
        stmt = (
            select(Requirement)
            .options(
                joinedload(Requirement.user),
                joinedload(Requirement.approver),
                selectinload(Requirement.images),
            )
        )

        # Role-scoped visibility
        if role == UserRole.employee:
            stmt = stmt.where(Requirement.user_id == user_id)
        elif role == UserRole.accountant:
            stmt = stmt.where(Requirement.status == RequirementStatus.accepted)
            if paid is None:
                paid = False

        # Filters
        if search:
            stmt = stmt.where(
                or_(
                    Requirement.item_name.ilike(f"%{search}%"),
                    Requirement.explanation.ilike(f"%{search}%"),
                )
            )

        if filter_user_id is not None and role in (UserRole.manager, UserRole.admin, UserRole.accountant):
            stmt = stmt.where(Requirement.user_id == filter_user_id)

        if status is not None and role != UserRole.accountant:
            stmt = stmt.where(Requirement.status == status)

        if paid is not None:
            stmt = stmt.where(Requirement.paid == paid)

        if month is not None:
            stmt = stmt.where(func.extract("month", Requirement.created_at) == month)

        if year is not None:
            stmt = stmt.where(func.extract("year", Requirement.created_at) == year)

        # Count
        count_result = await self.db.execute(
            select(func.count()).select_from(stmt.subquery())
        )
        total = count_result.scalar_one()

        # Paginate
        stmt = stmt.order_by(Requirement.created_at.desc()).offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(stmt)
        items = list(result.scalars().unique().all())

        return items, total

    async def create(self, user_id: int, item_name: str, price: Decimal, explanation: str | None) -> Requirement:
        req = Requirement(user_id=user_id, item_name=item_name, price=price, explanation=explanation)
        self.db.add(req)
        await self.db.commit()
        await self.db.refresh(req)
        return req

    async def update_status(
        self, req: Requirement, status: RequirementStatus, approved_by: int | None
    ) -> None:
        req.status = status
        req.approved_by = approved_by
        await self.db.commit()

    async def set_paid(self, req: Requirement, paid: bool) -> None:
        req.paid = paid
        await self.db.commit()

    async def delete(self, req: Requirement) -> None:
        await self.db.delete(req)
        await self.db.commit()

    async def get_spend_over_time(
        self,
        *,
        user_id: int,
        role: UserRole,
        filter_user_id: int | None = None,
        paid: bool | None = None,
        month: int | None = None,
        year: int | None = None,
    ) -> list[dict]:
        from datetime import timedelta

        stmt = select(
            func.extract("year", Requirement.created_at).label("year"),
            func.extract("month", Requirement.created_at).label("month"),
            func.coalesce(func.sum(Requirement.price), 0).label("total_price"),
            func.coalesce(
                func.sum(case((Requirement.status == RequirementStatus.accepted, Requirement.price))), 0
            ).label("accepted_price"),
            func.count().label("count"),
        )

        if year is None:
            now = datetime.now(timezone.utc)
            cutoff = now.replace(day=1) - timedelta(days=365)
            stmt = stmt.where(Requirement.created_at >= cutoff)
        else:
            stmt = stmt.where(func.extract("year", Requirement.created_at) == year)

        if month is not None:
            stmt = stmt.where(func.extract("month", Requirement.created_at) == month)

        if role == UserRole.employee:
            stmt = stmt.where(Requirement.user_id == user_id)

        if filter_user_id is not None and role in (UserRole.manager, UserRole.admin, UserRole.accountant):
            stmt = stmt.where(Requirement.user_id == filter_user_id)

        if paid is not None:
            stmt = stmt.where(Requirement.paid == paid)

        stmt = stmt.group_by(
            func.extract("year", Requirement.created_at),
            func.extract("month", Requirement.created_at),
        ).order_by(
            func.extract("year", Requirement.created_at),
            func.extract("month", Requirement.created_at),
        )

        result = await self.db.execute(stmt)
        rows = result.all()
        return [
            {
                "year": int(row.year),
                "month": int(row.month),
                "total_price": row.total_price,
                "accepted_price": row.accepted_price,
                "count": row.count,
            }
            for row in rows
        ]

    async def get_top_requesters(
        self,
        *,
        limit: int = 8,
        paid: bool | None = None,
        month: int | None = None,
        year: int | None = None,
    ) -> list[dict]:
        stmt = select(
            Requirement.user_id,
            User.username,
            func.coalesce(func.sum(Requirement.price), 0).label("total_price"),
            func.count().label("total_count"),
            func.count(case((Requirement.status == RequirementStatus.accepted, 1))).label("accepted_count"),
        ).join(User, User.id == Requirement.user_id)

        if paid is not None:
            stmt = stmt.where(Requirement.paid == paid)

        if month is not None:
            stmt = stmt.where(func.extract("month", Requirement.created_at) == month)

        if year is not None:
            stmt = stmt.where(func.extract("year", Requirement.created_at) == year)

        stmt = stmt.group_by(Requirement.user_id, User.username).order_by(
            func.sum(Requirement.price).desc()
        ).limit(limit)

        result = await self.db.execute(stmt)
        rows = result.all()
        return [
            {
                "user_id": row.user_id,
                "username": row.username,
                "total_price": row.total_price,
                "total_count": row.total_count,
                "accepted_count": row.accepted_count,
            }
            for row in rows
        ]

    async def get_statistics(
        self,
        *,
        user_id: int,
        role: UserRole,
        search: str | None = None,
        filter_user_id: int | None = None,
        paid: bool | None = None,
        month: int | None = None,
        year: int | None = None,
    ) -> dict:
        stmt = select(
            func.count().label("total_count"),
            func.count(case((Requirement.status == RequirementStatus.pending, 1))).label("pending_count"),
            func.count(case((Requirement.status == RequirementStatus.accepted, 1))).label("accepted_count"),
            func.count(case((Requirement.status == RequirementStatus.declined, 1))).label("declined_count"),
            func.coalesce(func.sum(Requirement.price), 0).label("total_price"),
            func.coalesce(
                func.sum(case((Requirement.status == RequirementStatus.pending, Requirement.price))), 0
            ).label("pending_price"),
            func.coalesce(
                func.sum(case((Requirement.status == RequirementStatus.accepted, Requirement.price))), 0
            ).label("accepted_price"),
            func.coalesce(
                func.sum(case((Requirement.status == RequirementStatus.declined, Requirement.price))), 0
            ).label("declined_price"),
        )

        if role == UserRole.employee:
            stmt = stmt.where(Requirement.user_id == user_id)

        if search:
            stmt = stmt.where(
                or_(
                    Requirement.item_name.ilike(f"%{search}%"),
                    Requirement.explanation.ilike(f"%{search}%"),
                )
            )

        if filter_user_id is not None and role in (UserRole.manager, UserRole.admin, UserRole.accountant):
            stmt = stmt.where(Requirement.user_id == filter_user_id)

        if paid is not None:
            stmt = stmt.where(Requirement.paid == paid)

        if month is not None:
            stmt = stmt.where(func.extract("month", Requirement.created_at) == month)

        if year is not None:
            stmt = stmt.where(func.extract("year", Requirement.created_at) == year)

        result = await self.db.execute(stmt)
        row = result.one()
        return {
            "total_count": row.total_count,
            "pending_count": row.pending_count,
            "accepted_count": row.accepted_count,
            "declined_count": row.declined_count,
            "total_price": row.total_price,
            "pending_price": row.pending_price,
            "accepted_price": row.accepted_price,
            "declined_price": row.declined_price,
        }
