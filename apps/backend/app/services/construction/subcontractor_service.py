from fastapi import HTTPException

from app.models.user import User
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.repositories.construction.subcontractor_repository import ConstructionSubcontractorRepository
from app.schemas.construction.subcontractor import (
    SubcontractorCreate,
    SubcontractorResponse,
    SubcontractorUpdate,
)


def _build_sub_response(sub) -> SubcontractorResponse:
    return SubcontractorResponse(
        id=sub.id,
        project_id=sub.project_id,
        company_name=sub.company_name,
        trade=sub.trade,
        contact_name=sub.contact_name,
        contact_phone=sub.contact_phone,
        contact_email=sub.contact_email,
        contract_value=sub.contract_value,
        status=sub.status,
        notes=sub.notes,
        created_at=sub.created_at,
    )


class ConstructionSubcontractorService:
    def __init__(
        self,
        sub_repo: ConstructionSubcontractorRepository,
        project_repo: ConstructionProjectRepository,
    ) -> None:
        self.sub_repo = sub_repo
        self.project_repo = project_repo

    async def list_subcontractors(self, project_id: int) -> list[SubcontractorResponse]:
        subs = await self.sub_repo.get_by_project(project_id)
        return [_build_sub_response(s) for s in subs]

    async def create_subcontractor(
        self, current_user: User, project_id: int, body: SubcontractorCreate
    ) -> SubcontractorResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Proje bulunamadı")

        sub = await self.sub_repo.create(
            {
                "project_id": project_id,
                **body.model_dump(),
            }
        )
        return _build_sub_response(sub)

    async def update_subcontractor(
        self,
        current_user: User,
        project_id: int,
        sub_id: int,
        body: SubcontractorUpdate,
    ) -> SubcontractorResponse:
        sub = await self.sub_repo.get_by_id(sub_id)
        if not sub or sub.project_id != project_id:
            raise HTTPException(status_code=404, detail="Taşeron bulunamadı")

        update_data = {k: v for k, v in body.model_dump().items() if v is not None}
        sub = await self.sub_repo.update(sub, update_data)
        return _build_sub_response(sub)

    async def delete_subcontractor(
        self, current_user: User, project_id: int, sub_id: int
    ) -> None:
        sub = await self.sub_repo.get_by_id(sub_id)
        if not sub or sub.project_id != project_id:
            raise HTTPException(status_code=404, detail="Taşeron bulunamadı")
        await self.sub_repo.delete(sub)
