from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, get_db
from app.repositories.construction.material_repository import ConstructionMaterialRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.repositories.construction.shipment_repository import ShipmentRepository
from app.schemas.construction.shipment import ShipmentCreate, ShipmentResponse, ShipmentUpdate
from app.services.construction.shipment_service import ShipmentService

router = APIRouter()


def _get_service(db: AsyncSession) -> ShipmentService:
    return ShipmentService(
        shipment_repo=ShipmentRepository(db),
        project_repo=ConstructionProjectRepository(db),
        material_repo=ConstructionMaterialRepository(db),
    )


@router.get("/shipments/pending", response_model=list[ShipmentResponse])
async def list_pending_shipments(
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Cross-project view of all ordered + in_transit shipments."""
    service = _get_service(db)
    return await service.get_pending_all()


@router.get("/shipments/pending/count")
async def count_pending_shipments(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    service = _get_service(db)
    count = await service.count_pending()
    return {"count": count}


@router.get("/{project_id}/shipments", response_model=list[ShipmentResponse])
async def list_shipments(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    status: str | None = Query(default=None),
    material_id: int | None = Query(default=None),
):
    service = _get_service(db)
    return await service.list_shipments(project_id, status=status, material_id=material_id)


@router.post("/{project_id}/shipments", response_model=ShipmentResponse, status_code=201)
async def create_shipment(
    project_id: int,
    body: ShipmentCreate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.create_shipment(project_id, body)


@router.patch("/{project_id}/shipments/{shipment_id}", response_model=ShipmentResponse)
async def update_shipment(
    project_id: int,
    shipment_id: int,
    body: ShipmentUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    return await service.update_shipment(project_id, shipment_id, body)


@router.delete("/{project_id}/shipments/{shipment_id}", status_code=204)
async def delete_shipment(
    project_id: int,
    shipment_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    service = _get_service(db)
    await service.delete_shipment(project_id, shipment_id)
