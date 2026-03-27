from fastapi import HTTPException

from app.repositories.construction.permit_repository import ConstructionPermitRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.permit import PermitCreate, PermitResponse, PermitUpdate


def _build_permit_response(permit) -> PermitResponse:
    return PermitResponse(
        id=permit.id,
        project_id=permit.project_id,
        permit_type=permit.permit_type,
        permit_number=permit.permit_number,
        issuing_authority=permit.issuing_authority,
        status=permit.status,
        applied_date=permit.applied_date,
        approved_date=permit.approved_date,
        expiry_date=permit.expiry_date,
        notes=permit.notes,
        created_at=permit.created_at,
    )


class ConstructionPermitService:
    def __init__(
        self,
        permit_repo: ConstructionPermitRepository,
        project_repo: ConstructionProjectRepository,
    ) -> None:
        self.permit_repo = permit_repo
        self.project_repo = project_repo

    async def list_permits(self, project_id: int) -> list[PermitResponse]:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Proje bulunamadı")
        permits = await self.permit_repo.get_by_project(project_id)
        return [_build_permit_response(p) for p in permits]

    async def create_permit(self, project_id: int, body: PermitCreate) -> PermitResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Proje bulunamadı")
        data = body.model_dump()
        data["project_id"] = project_id
        permit = await self.permit_repo.create(data)
        return _build_permit_response(permit)

    async def update_permit(
        self, project_id: int, permit_id: int, body: PermitUpdate
    ) -> PermitResponse:
        permit = await self.permit_repo.get_by_id(permit_id)
        if not permit or permit.project_id != project_id:
            raise HTTPException(status_code=404, detail="İzin bulunamadı")
        updates = body.model_dump(exclude_unset=True)
        permit = await self.permit_repo.update(permit, updates)
        return _build_permit_response(permit)

    async def delete_permit(self, project_id: int, permit_id: int) -> None:
        permit = await self.permit_repo.get_by_id(permit_id)
        if not permit or permit.project_id != project_id:
            raise HTTPException(status_code=404, detail="İzin bulunamadı")
        await self.permit_repo.delete(permit)
