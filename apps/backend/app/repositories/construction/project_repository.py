from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.project import ConstructionProject


class ConstructionProjectRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, project_id: int) -> ConstructionProject | None:
        result = await self.db.execute(
            select(ConstructionProject)
            .options(
                joinedload(ConstructionProject.location),
                joinedload(ConstructionProject.creator),
                joinedload(ConstructionProject.materials),
                joinedload(ConstructionProject.milestones),
            )
            .where(ConstructionProject.id == project_id)
        )
        return result.unique().scalar_one_or_none()

    async def get_paginated(
        self,
        *,
        status: str | None = None,
        project_type: str | None = None,
        location_id: int | None = None,
        search: str | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[ConstructionProject], int]:
        query = select(ConstructionProject).options(
            joinedload(ConstructionProject.location),
            joinedload(ConstructionProject.creator),
        )
        if status:
            query = query.where(ConstructionProject.status == status)
        if project_type:
            query = query.where(ConstructionProject.project_type == project_type)
        if location_id:
            query = query.where(ConstructionProject.location_id == location_id)
        if search:
            query = query.where(ConstructionProject.name.ilike(f"%{search}%"))

        count_q = select(func.count()).select_from(query.subquery())
        total = await self.db.scalar(count_q) or 0

        offset = (page - 1) * limit
        result = await self.db.execute(
            query.order_by(ConstructionProject.created_at.desc()).offset(offset).limit(limit)
        )
        return list(result.scalars().unique().all()), total

    async def create(self, data: dict) -> ConstructionProject:
        project = ConstructionProject(**data)
        self.db.add(project)
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def update(self, project: ConstructionProject, data: dict) -> ConstructionProject:
        for key, value in data.items():
            setattr(project, key, value)
        await self.db.flush()
        return project

    async def delete(self, project: ConstructionProject) -> None:
        await self.db.delete(project)
        await self.db.flush()
