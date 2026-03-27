from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.project_member import ConstructionProjectMember


class ProjectMemberRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, member_id: int) -> ConstructionProjectMember | None:
        result = await self.db.execute(
            select(ConstructionProjectMember)
            .options(joinedload(ConstructionProjectMember.user))
            .where(ConstructionProjectMember.id == member_id)
        )
        return result.scalar_one_or_none()

    async def get_by_project(self, project_id: int) -> list[ConstructionProjectMember]:
        result = await self.db.execute(
            select(ConstructionProjectMember)
            .options(joinedload(ConstructionProjectMember.user))
            .where(ConstructionProjectMember.project_id == project_id)
            .order_by(ConstructionProjectMember.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_by_user(self, user_id: int) -> list[ConstructionProjectMember]:
        result = await self.db.execute(
            select(ConstructionProjectMember)
            .options(joinedload(ConstructionProjectMember.user))
            .where(ConstructionProjectMember.user_id == user_id)
        )
        return list(result.scalars().all())

    async def get_project_ids_for_user(self, user_id: int) -> set[int]:
        result = await self.db.execute(
            select(ConstructionProjectMember.project_id).where(
                ConstructionProjectMember.user_id == user_id
            )
        )
        return set(result.scalars().all())

    async def get_by_project_and_user(
        self, project_id: int, user_id: int
    ) -> ConstructionProjectMember | None:
        result = await self.db.execute(
            select(ConstructionProjectMember).where(
                ConstructionProjectMember.project_id == project_id,
                ConstructionProjectMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def count_distinct_members(self) -> int:
        from sqlalchemy import func
        result = await self.db.scalar(
            select(func.count()).select_from(ConstructionProjectMember)
        )
        return result or 0

    async def add(self, data: dict) -> ConstructionProjectMember:
        member = ConstructionProjectMember(**data)
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def update_role(
        self, member: ConstructionProjectMember, data: dict
    ) -> ConstructionProjectMember:
        for key, value in data.items():
            setattr(member, key, value)
        await self.db.flush()
        return member

    async def remove(self, member: ConstructionProjectMember) -> None:
        await self.db.delete(member)
        await self.db.flush()
