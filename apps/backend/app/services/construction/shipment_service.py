from decimal import Decimal

from fastapi import HTTPException, status

from app.models.construction.shipment import ShipmentStatus
from app.repositories.construction.material_repository import ConstructionMaterialRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.repositories.construction.shipment_repository import ShipmentRepository
from app.schemas.construction.shipment import ShipmentCreate, ShipmentResponse, ShipmentUpdate


def _to_response(shipment) -> ShipmentResponse:
    return ShipmentResponse(
        id=shipment.id,
        project_id=shipment.project_id,
        material_id=shipment.material_id,
        material_name=shipment.material_name,
        supplier_name=shipment.supplier_name,
        quantity_ordered=shipment.quantity_ordered,
        quantity_delivered=shipment.quantity_delivered,
        unit=shipment.unit,
        unit_cost=shipment.unit_cost,
        total_cost=shipment.total_cost,
        status=shipment.status,
        order_date=shipment.order_date,
        expected_delivery_date=shipment.expected_delivery_date,
        actual_delivery_date=shipment.actual_delivery_date,
        delivery_note_number=shipment.delivery_note_number,
        notes=shipment.notes,
        received_by=shipment.received_by,
        receiver_username=shipment.receiver.username if shipment.receiver else None,
        created_at=shipment.created_at,
    )


# Statuses where quantity_delivered has been applied to material.quantity_used
_APPLIED_STATUSES = {ShipmentStatus.delivered, ShipmentStatus.partial}
# Statuses that reverse the applied quantity
_REVERSED_STATUSES = {ShipmentStatus.rejected, ShipmentStatus.returned}


class ShipmentService:
    def __init__(
        self,
        shipment_repo: ShipmentRepository,
        project_repo: ConstructionProjectRepository,
        material_repo: ConstructionMaterialRepository,
    ) -> None:
        self.shipment_repo = shipment_repo
        self.project_repo = project_repo
        self.material_repo = material_repo

    async def list_shipments(
        self,
        project_id: int,
        status: str | None = None,
        material_id: int | None = None,
    ) -> list[ShipmentResponse]:
        await self._require_project(project_id)
        shipments = await self.shipment_repo.get_by_project(
            project_id, status=status, material_id=material_id
        )
        return [_to_response(s) for s in shipments]

    async def create_shipment(self, project_id: int, body: ShipmentCreate) -> ShipmentResponse:
        await self._require_project(project_id)
        data = body.model_dump()
        data["project_id"] = project_id
        shipment = await self.shipment_repo.create(data)
        # Fetch with receiver relationship
        shipment = await self.shipment_repo.get_by_id(shipment.id)
        return _to_response(shipment)

    async def update_shipment(
        self, project_id: int, shipment_id: int, body: ShipmentUpdate
    ) -> ShipmentResponse:
        shipment = await self._require_shipment(project_id, shipment_id)
        updates = body.model_dump(exclude_unset=True)

        old_status = shipment.status
        new_status = updates.get("status", old_status)

        # Handle quantity_used sync on material
        if shipment.material_id and new_status != old_status:
            qty_delivered = updates.get("quantity_delivered", shipment.quantity_delivered)
            if qty_delivered is not None:
                material = await self.material_repo.get_by_id(shipment.material_id)
                if material:
                    delta = Decimal(str(qty_delivered))
                    if new_status in _APPLIED_STATUSES and old_status not in _APPLIED_STATUSES:
                        # Apply quantity
                        await self.material_repo.update(
                            material, {"quantity_used": (material.quantity_used or Decimal("0")) + delta}
                        )
                    elif new_status in _REVERSED_STATUSES and old_status in _APPLIED_STATUSES:
                        # Reverse previously applied quantity
                        old_qty = shipment.quantity_delivered or Decimal("0")
                        new_qty = max(Decimal("0"), (material.quantity_used or Decimal("0")) - Decimal(str(old_qty)))
                        await self.material_repo.update(material, {"quantity_used": new_qty})

        await self.shipment_repo.update(shipment, updates)
        shipment = await self.shipment_repo.get_by_id(shipment_id)
        return _to_response(shipment)

    async def delete_shipment(self, project_id: int, shipment_id: int) -> None:
        shipment = await self._require_shipment(project_id, shipment_id)
        await self.shipment_repo.delete(shipment)

    async def get_pending_all(self) -> list[ShipmentResponse]:
        shipments = await self.shipment_repo.get_pending_all()
        return [_to_response(s) for s in shipments]

    async def count_pending(self) -> int:
        return await self.shipment_repo.count_pending()

    async def _require_project(self, project_id: int) -> None:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")

    async def _require_shipment(self, project_id: int, shipment_id: int):
        shipment = await self.shipment_repo.get_by_id(shipment_id)
        if not shipment or shipment.project_id != project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sevkiyat bulunamadı")
        return shipment
