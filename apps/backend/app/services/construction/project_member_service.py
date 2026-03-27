from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.construction.project_member_repository import ProjectMemberRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.repositories.notification_repository import NotificationRepository
from app.schemas.construction.project_member import (
    ProjectMemberCreate,
    ProjectMemberResponse,
    ProjectMemberUpdate,
)


def _to_response(member) -> ProjectMemberResponse:
    return ProjectMemberResponse(
        id=member.id,
        project_id=member.project_id,
        user_id=member.user_id,
        username=member.user.username,
        email=member.user.email,
        global_role=member.user.role.value,
        construction_role=member.construction_role,
        joined_at=member.joined_at,
        notes=member.notes,
        created_at=member.created_at,
    )


class ProjectMemberService:
    def __init__(
        self,
        member_repo: ProjectMemberRepository,
        project_repo: ConstructionProjectRepository,
        db: AsyncSession,
    ) -> None:
        self.member_repo = member_repo
        self.project_repo = project_repo
        self.db = db

    async def list_members(self, project_id: int) -> list[ProjectMemberResponse]:
        await self._require_project(project_id)
        members = await self.member_repo.get_by_project(project_id)
        return [_to_response(m) for m in members]

    async def add_member(self, project_id: int, body: ProjectMemberCreate) -> ProjectMemberResponse:
        await self._require_project(project_id)
        # Check for duplicate
        existing = await self.member_repo.get_by_project_and_user(project_id, body.user_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Kullanıcı zaten bu projenin üyesi",
            )
        # Verify user exists
        user_result = await self.db.execute(select(User).where(User.id == body.user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kullanıcı bulunamadı")

        data = body.model_dump()
        data["project_id"] = project_id
        member = await self.member_repo.add(data)
        member = await self.member_repo.get_by_id(member.id)

        # Notify the added user
        project = await self.project_repo.get_by_id(project_id)
        if project:
            notif_repo = NotificationRepository(self.db)
            await notif_repo.create(
                user_id=body.user_id,
                message=f"📌 '{project.name}' projesine ekip üyesi olarak eklendini",
            )

        return _to_response(member)

    async def update_member(
        self, project_id: int, member_id: int, body: ProjectMemberUpdate
    ) -> ProjectMemberResponse:
        member = await self._require_member(project_id, member_id)
        updates = body.model_dump(exclude_unset=True)
        await self.member_repo.update_role(member, updates)
        member = await self.member_repo.get_by_id(member_id)
        return _to_response(member)

    async def remove_member(self, project_id: int, member_id: int) -> None:
        member = await self._require_member(project_id, member_id)
        user_id = member.user_id
        project = await self.project_repo.get_by_id(project_id)
        await self.member_repo.remove(member)

        if project:
            notif_repo = NotificationRepository(self.db)
            await notif_repo.create(
                user_id=user_id,
                message=f"📌 '{project.name}' projesinden çıkarıldınız",
            )

    async def get_user_projects_ids(self, user_id: int) -> set[int]:
        return await self.member_repo.get_project_ids_for_user(user_id)

    async def count_members(self) -> int:
        return await self.member_repo.count_distinct_members()

    async def _require_project(self, project_id: int) -> None:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")

    async def _require_member(self, project_id: int, member_id: int):
        member = await self.member_repo.get_by_id(member_id)
        if not member or member.project_id != project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Üye bulunamadı")
        return member
