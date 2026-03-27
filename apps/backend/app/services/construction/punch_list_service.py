from datetime import date

from fastapi import HTTPException, status

from app.models.construction.punch_list_item import PunchListStatus
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.repositories.construction.punch_list_repository import PunchListRepository
from app.schemas.construction.punch_list import (
    PunchListItemCreate,
    PunchListItemResponse,
    PunchListItemUpdate,
)


def _to_response(item) -> PunchListItemResponse:
    today = date.today()
    is_overdue = (
        item.due_date is not None
        and item.due_date < today
        and item.status not in (PunchListStatus.verified, PunchListStatus.completed)
    )
    return PunchListItemResponse(
        id=item.id,
        project_id=item.project_id,
        title=item.title,
        description=item.description,
        location_on_site=item.location_on_site,
        subcontractor_id=item.subcontractor_id,
        subcontractor_name=item.subcontractor.company_name if item.subcontractor else None,
        assigned_to=item.assigned_to,
        assignee_username=item.assignee.username if item.assignee else None,
        status=item.status,
        due_date=item.due_date,
        completed_date=item.completed_date,
        verified_by=item.verified_by,
        verifier_username=item.verifier.username if item.verifier else None,
        created_by=item.created_by,
        creator_username=item.creator.username if item.creator else None,
        is_overdue=is_overdue,
        created_at=item.created_at,
    )


class PunchListService:
    def __init__(
        self,
        punch_repo: PunchListRepository,
        project_repo: ConstructionProjectRepository,
    ) -> None:
        self.punch_repo = punch_repo
        self.project_repo = project_repo

    async def list_items(self, project_id: int, filter_status: PunchListStatus | None = None) -> list[PunchListItemResponse]:
        await self._require_project(project_id)
        items = await self.punch_repo.get_by_project(project_id, filter_status)
        return [_to_response(i) for i in items]

    async def create_item(self, current_user, project_id: int, body: PunchListItemCreate) -> PunchListItemResponse:
        await self._require_project(project_id)
        data = body.model_dump()
        data["project_id"] = project_id
        data["created_by"] = current_user.id
        item = await self.punch_repo.create(data)
        return _to_response(item)

    async def update_item(self, current_user, project_id: int, item_id: int, body: PunchListItemUpdate) -> PunchListItemResponse:
        item = await self._require_item(project_id, item_id)
        updates = body.model_dump(exclude_unset=True)
        if "status" in updates and updates["status"] == PunchListStatus.completed and "completed_date" not in updates:
            updates["completed_date"] = date.today()
        await self.punch_repo.update(item, updates)
        item = await self.punch_repo.get_by_id(item_id)
        return _to_response(item)

    async def verify_item(self, current_user, project_id: int, item_id: int) -> PunchListItemResponse:
        item = await self._require_item(project_id, item_id)
        if item.status not in (PunchListStatus.completed,):
            raise HTTPException(status_code=400, detail="Sadece tamamlanmış kalemler doğrulanabilir")
        await self.punch_repo.update(item, {"status": PunchListStatus.verified, "verified_by": current_user.id})
        item = await self.punch_repo.get_by_id(item_id)
        return _to_response(item)

    async def delete_item(self, project_id: int, item_id: int) -> None:
        item = await self._require_item(project_id, item_id)
        await self.punch_repo.delete(item)

    async def _require_project(self, project_id: int):
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")
        return project

    async def _require_item(self, project_id: int, item_id: int):
        item = await self.punch_repo.get_by_id(item_id)
        if not item or item.project_id != project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teslim listesi kalemi bulunamadı")
        return item
