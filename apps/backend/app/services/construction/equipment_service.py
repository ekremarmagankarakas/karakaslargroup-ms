from datetime import date

from fastapi import HTTPException

from app.repositories.construction.equipment_repository import EquipmentRepository
from app.schemas.construction.equipment import EquipmentCreate, EquipmentResponse, EquipmentUpdate


def _to_response(e) -> EquipmentResponse:
    today = date.today()
    maintenance_overdue = bool(e.next_maintenance_date and e.next_maintenance_date < today)
    return EquipmentResponse(
        maintenance_overdue=maintenance_overdue,
        id=e.id,
        project_id=e.project_id,
        name=e.name,
        category=e.category,
        status=e.status,
        model_number=e.model_number,
        serial_number=e.serial_number,
        supplier=e.supplier,
        rental_rate_daily=e.rental_rate_daily,
        mobilization_date=e.mobilization_date,
        demobilization_date=e.demobilization_date,
        last_maintenance_date=e.last_maintenance_date,
        next_maintenance_date=e.next_maintenance_date,
        notes=e.notes,
        created_by=e.created_by,
        creator_username=e.creator.username if e.creator else None,
        created_at=e.created_at,
    )


class EquipmentService:
    def __init__(self, repo: EquipmentRepository) -> None:
        self.repo = repo

    async def list_equipment(self, project_id: int) -> list[EquipmentResponse]:
        items = await self.repo.get_by_project(project_id)
        return [_to_response(e) for e in items]

    async def create_equipment(self, project_id: int, body: EquipmentCreate, created_by: int) -> EquipmentResponse:
        data = body.model_dump()
        data["project_id"] = project_id
        data["created_by"] = created_by
        item = await self.repo.create(data)
        return _to_response(item)

    async def update_equipment(self, project_id: int, equipment_id: int, body: EquipmentUpdate) -> EquipmentResponse:
        item = await self.repo.get_by_id(equipment_id)
        if not item or item.project_id != project_id:
            raise HTTPException(status_code=404, detail="Equipment not found")
        data = body.model_dump(exclude_none=True)
        await self.repo.update(item, data)
        refreshed = await self.repo.get_by_id(equipment_id)
        return _to_response(refreshed)

    async def delete_equipment(self, project_id: int, equipment_id: int) -> None:
        item = await self.repo.get_by_id(equipment_id)
        if not item or item.project_id != project_id:
            raise HTTPException(status_code=404, detail="Equipment not found")
        await self.repo.delete(item)
