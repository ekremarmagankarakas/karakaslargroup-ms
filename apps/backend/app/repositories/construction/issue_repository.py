from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.issue import ConstructionIssue


class ConstructionIssueRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, issue_id: int) -> ConstructionIssue | None:
        result = await self.db.execute(
            select(ConstructionIssue)
            .options(joinedload(ConstructionIssue.reporter))
            .where(ConstructionIssue.id == issue_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[ConstructionIssue]:
        result = await self.db.execute(
            select(ConstructionIssue)
            .options(joinedload(ConstructionIssue.reporter))
            .where(ConstructionIssue.project_id == project_id)
            .order_by(ConstructionIssue.created_at.desc())
        )
        return list(result.scalars().unique().all())

    async def create(self, data: dict) -> ConstructionIssue:
        issue = ConstructionIssue(**data)
        self.db.add(issue)
        await self.db.flush()
        return await self.get_by_id(issue.id)  # type: ignore[return-value]

    async def update(self, issue: ConstructionIssue, data: dict) -> ConstructionIssue:
        for key, value in data.items():
            setattr(issue, key, value)
        await self.db.flush()
        return issue

    async def delete(self, issue: ConstructionIssue) -> None:
        await self.db.delete(issue)
        await self.db.flush()
