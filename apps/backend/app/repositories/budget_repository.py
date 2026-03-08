from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.budget_limit import BudgetLimit


class BudgetRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_for_period(self, month: int, year: int) -> BudgetLimit | None:
        result = await self.db.execute(
            select(BudgetLimit)
            .where(BudgetLimit.period_month == month, BudgetLimit.period_year == year)
            .order_by(BudgetLimit.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def upsert(self, amount: Decimal, month: int, year: int, set_by: int) -> BudgetLimit:
        existing = await self.get_for_period(month, year)
        if existing:
            existing.amount = amount
            existing.set_by = set_by
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        budget = BudgetLimit(amount=amount, period_month=month, period_year=year, set_by=set_by)
        self.db.add(budget)
        await self.db.commit()
        await self.db.refresh(budget)
        return budget
