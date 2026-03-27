from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.construction.budget_line import ConstructionBudgetLine


class BudgetLineRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, line_id: int) -> ConstructionBudgetLine | None:
        result = await self.db.execute(
            select(ConstructionBudgetLine).where(ConstructionBudgetLine.id == line_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[ConstructionBudgetLine]:
        result = await self.db.execute(
            select(ConstructionBudgetLine)
            .where(ConstructionBudgetLine.project_id == project_id)
            .order_by(ConstructionBudgetLine.category)
        )
        return list(result.scalars().all())

    async def create(self, data: dict) -> ConstructionBudgetLine:
        line = ConstructionBudgetLine(**data)
        self.db.add(line)
        await self.db.flush()
        return (await self.get_by_id(line.id))  # type: ignore[return-value]

    async def update(self, line: ConstructionBudgetLine, data: dict) -> ConstructionBudgetLine:
        for key, value in data.items():
            setattr(line, key, value)
        await self.db.flush()
        return line

    async def delete(self, line: ConstructionBudgetLine) -> None:
        await self.db.delete(line)
        await self.db.flush()

    async def get_summary(self, project_id: int) -> dict:
        lines = await self.get_by_project(project_id)
        total_planned = sum(Decimal(str(ln.planned_amount)) for ln in lines)
        total_actual = sum(Decimal(str(ln.actual_amount)) for ln in lines)
        variance = total_planned - total_actual
        utilization_pct = float((total_actual / total_planned * 100) if total_planned > 0 else 0)
        return {
            "lines": lines,
            "total_planned": total_planned,
            "total_actual": total_actual,
            "variance": variance,
            "utilization_pct": round(utilization_pct, 1),
        }
