from datetime import date

from fastapi import HTTPException, status

from app.models.construction.rfi import RFIStatus
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.repositories.construction.rfi_repository import RFIRepository
from app.schemas.construction.rfi import RFICreate, RFIResponse, RFIUpdate


def _to_response(rfi) -> RFIResponse:
    today = date.today()
    days_open: int | None = None
    if rfi.submitted_date:
        if rfi.response_date:
            days_open = (rfi.response_date - rfi.submitted_date).days
        else:
            days_open = (today - rfi.submitted_date).days

    is_overdue = (
        rfi.due_date is not None
        and rfi.due_date < today
        and rfi.status not in (RFIStatus.answered, RFIStatus.closed)
    )

    return RFIResponse(
        id=rfi.id,
        project_id=rfi.project_id,
        rfi_number=rfi.rfi_number,
        subject=rfi.subject,
        question=rfi.question,
        response=rfi.response,
        status=rfi.status,
        priority=rfi.priority,
        submitted_to=rfi.submitted_to,
        submitted_date=rfi.submitted_date,
        response_date=rfi.response_date,
        due_date=rfi.due_date,
        submitted_by=rfi.submitted_by,
        submitter_username=rfi.submitter.username if rfi.submitter else None,
        answered_by_name=rfi.answered_by_name,
        days_open=days_open,
        is_overdue=is_overdue,
        created_at=rfi.created_at,
    )


class RFIService:
    def __init__(
        self,
        rfi_repo: RFIRepository,
        project_repo: ConstructionProjectRepository,
    ) -> None:
        self.rfi_repo = rfi_repo
        self.project_repo = project_repo

    async def list_rfis(self, project_id: int) -> list[RFIResponse]:
        await self._require_project(project_id)
        rfis = await self.rfi_repo.get_by_project(project_id)
        return [_to_response(r) for r in rfis]

    async def create_rfi(self, current_user, project_id: int, body: RFICreate) -> RFIResponse:
        await self._require_project(project_id)
        rfi_number = await self.rfi_repo.next_rfi_number(project_id)
        data = body.model_dump()
        data["project_id"] = project_id
        data["rfi_number"] = rfi_number
        data["submitted_by"] = current_user.id
        data["status"] = RFIStatus.submitted
        data["submitted_date"] = date.today()
        rfi = await self.rfi_repo.create(data)
        return _to_response(rfi)

    async def update_rfi(self, project_id: int, rfi_id: int, body: RFIUpdate) -> RFIResponse:
        rfi = await self._require_rfi(project_id, rfi_id)
        updates = body.model_dump(exclude_unset=True)
        if "response" in updates and updates["response"] and rfi.status not in (RFIStatus.answered, RFIStatus.closed):
            if "status" not in updates:
                updates["status"] = RFIStatus.answered
            if "response_date" not in updates:
                updates["response_date"] = date.today()
        await self.rfi_repo.update(rfi, updates)
        rfi = await self.rfi_repo.get_by_id(rfi_id)
        return _to_response(rfi)

    async def delete_rfi(self, project_id: int, rfi_id: int) -> None:
        rfi = await self._require_rfi(project_id, rfi_id)
        await self.rfi_repo.delete(rfi)

    async def _require_project(self, project_id: int):
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")
        return project

    async def _require_rfi(self, project_id: int, rfi_id: int):
        rfi = await self.rfi_repo.get_by_id(rfi_id)
        if not rfi or rfi.project_id != project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFI bulunamadı")
        return rfi
