from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException

from app.models.construction.change_order import ChangeOrderStatus
from app.models.user import User, UserRole
from app.repositories.construction.change_order_repository import ConstructionChangeOrderRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.change_order import ChangeOrderCreate, ChangeOrderResponse
from app.services.construction import notification_service


def _build_co_response(co) -> ChangeOrderResponse:
    return ChangeOrderResponse(
        id=co.id,
        project_id=co.project_id,
        title=co.title,
        description=co.description,
        cost_delta=co.cost_delta,
        schedule_delta_days=co.schedule_delta_days,
        status=co.status,
        requested_by=co.requested_by,
        requester_username=co.requester.username if co.requester else None,
        reviewed_by=co.reviewed_by,
        reviewer_username=co.reviewer.username if co.reviewer else None,
        created_at=co.created_at,
        reviewed_at=co.reviewed_at,
    )


class ConstructionChangeOrderService:
    def __init__(
        self,
        co_repo: ConstructionChangeOrderRepository,
        project_repo: ConstructionProjectRepository,
    ) -> None:
        self.co_repo = co_repo
        self.project_repo = project_repo

    async def list_change_orders(self, project_id: int) -> list[ChangeOrderResponse]:
        cos = await self.co_repo.get_by_project(project_id)
        return [_build_co_response(co) for co in cos]

    async def create_change_order(
        self, current_user: User, project_id: int, body: ChangeOrderCreate
    ) -> ChangeOrderResponse:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Proje bulunamadı")
        data = body.model_dump()
        data["project_id"] = project_id
        data["status"] = ChangeOrderStatus.draft
        data["requested_by"] = current_user.id
        co = await self.co_repo.create(data)
        co = await self.co_repo.get_by_id(co.id)
        return _build_co_response(co)

    async def submit_change_order(
        self, current_user: User, project_id: int, co_id: int
    ) -> ChangeOrderResponse:
        co = await self.co_repo.get_by_id(co_id)
        if not co or co.project_id != project_id:
            raise HTTPException(status_code=404, detail="Revizyon siparişi bulunamadı")
        if co.status != ChangeOrderStatus.draft:
            raise HTTPException(status_code=400, detail="Sadece taslak revizyonlar gönderilebilir")
        if co.requested_by != current_user.id and current_user.role not in (UserRole.manager, UserRole.admin):
            raise HTTPException(status_code=403, detail="Yetersiz yetki")
        co = await self.co_repo.update(co, {"status": ChangeOrderStatus.submitted})
        co = await self.co_repo.get_by_id(co.id)
        # Notify managers/admins
        project = await self.project_repo.get_by_id(project_id)
        if project:
            await notification_service.notify_change_order_submitted(
                db=self.co_repo.db,
                co_title=co.title,
                project_name=project.name,
            )
        return _build_co_response(co)

    async def approve_change_order(
        self, current_user: User, project_id: int, co_id: int
    ) -> ChangeOrderResponse:
        co = await self.co_repo.get_by_id(co_id)
        if not co or co.project_id != project_id:
            raise HTTPException(status_code=404, detail="Revizyon siparişi bulunamadı")
        if co.status != ChangeOrderStatus.submitted:
            raise HTTPException(status_code=400, detail="Sadece gönderilmiş revizyonlar onaylanabilir")
        now = datetime.now(timezone.utc)
        co = await self.co_repo.update(
            co,
            {
                "status": ChangeOrderStatus.approved,
                "reviewed_by": current_user.id,
                "reviewed_at": now,
            },
        )
        # Update project budget by cost_delta
        project = await self.project_repo.get_by_id(project_id)
        if project:
            new_budget = (project.budget or Decimal("0")) + co.cost_delta
            await self.project_repo.update(project, {"budget": new_budget})
        co = await self.co_repo.get_by_id(co.id)
        return _build_co_response(co)

    async def reject_change_order(
        self, current_user: User, project_id: int, co_id: int
    ) -> ChangeOrderResponse:
        co = await self.co_repo.get_by_id(co_id)
        if not co or co.project_id != project_id:
            raise HTTPException(status_code=404, detail="Revizyon siparişi bulunamadı")
        if co.status != ChangeOrderStatus.submitted:
            raise HTTPException(status_code=400, detail="Sadece gönderilmiş revizyonlar reddedilebilir")
        now = datetime.now(timezone.utc)
        co = await self.co_repo.update(
            co,
            {
                "status": ChangeOrderStatus.rejected,
                "reviewed_by": current_user.id,
                "reviewed_at": now,
            },
        )
        co = await self.co_repo.get_by_id(co.id)
        return _build_co_response(co)

    async def delete_change_order(
        self, current_user: User, project_id: int, co_id: int
    ) -> None:
        co = await self.co_repo.get_by_id(co_id)
        if not co or co.project_id != project_id:
            raise HTTPException(status_code=404, detail="Revizyon siparişi bulunamadı")
        await self.co_repo.delete(co)
