from decimal import Decimal

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.procurement.budget_limit import BudgetLimit


class BudgetRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_for_period(
        self, month: int, year: int, location_id: int | None = None
    ) -> BudgetLimit | None:
        stmt = (
            select(BudgetLimit)
            .where(
                BudgetLimit.period_month == month,
                BudgetLimit.period_year == year,
                BudgetLimit.location_id == location_id,
            )
            .order_by(BudgetLimit.created_at.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_many_for_periods(
        self,
        periods: list[tuple[int, int]],
        location_id: int | None = None,
    ) -> dict[tuple[int, int], "BudgetLimit"]:
        """Return a {(month, year): BudgetLimit} map for the given periods."""
        if not periods:
            return {}
        stmt = (
            select(BudgetLimit)
            .where(
                BudgetLimit.location_id == location_id,
                or_(
                    *[
                        and_(BudgetLimit.period_month == m, BudgetLimit.period_year == y)
                        for m, y in periods
                    ]
                ),
            )
            .order_by(BudgetLimit.created_at.desc())
        )
        result = await self.db.execute(stmt)
        seen: dict[tuple[int, int], BudgetLimit] = {}
        for row in result.scalars().all():
            key = (row.period_month, row.period_year)
            if key not in seen:
                seen[key] = row
        return seen

    async def upsert(
        self,
        amount: Decimal,
        month: int,
        year: int,
        set_by: int,
        location_id: int | None = None,
    ) -> BudgetLimit:
        existing = await self.get_for_period(month, year, location_id=location_id)
        if existing:
            existing.amount = amount
            existing.set_by = set_by
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        budget = BudgetLimit(
            amount=amount,
            period_month=month,
            period_year=year,
            set_by=set_by,
            location_id=location_id,
        )
        self.db.add(budget)
        await self.db.commit()
        await self.db.refresh(budget)
        return budget
