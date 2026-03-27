from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, ManagerOrAdmin, get_db
from app.models.construction.invoice import InvoiceStatus
from app.repositories.construction.invoice_repository import InvoiceRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.invoice import InvoiceCreate, InvoiceResponse, InvoiceUpdate
from app.services.construction.invoice_service import InvoiceService

router = APIRouter()


def _get_service(db: AsyncSession) -> InvoiceService:
    return InvoiceService(
        invoice_repo=InvoiceRepository(db),
        project_repo=ConstructionProjectRepository(db),
    )


@router.get("/invoices/overdue", response_model=list[InvoiceResponse])
async def list_overdue_invoices(
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).list_overdue()


@router.get("/{project_id}/invoices", response_model=list[InvoiceResponse])
async def list_invoices(
    project_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    filter_status: InvoiceStatus | None = Query(default=None, alias="status"),
):
    return await _get_service(db).list_invoices(project_id, filter_status)


@router.post("/{project_id}/invoices", response_model=InvoiceResponse, status_code=201)
async def create_invoice(
    project_id: int,
    body: InvoiceCreate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).create_invoice(project_id, body)


@router.patch("/{project_id}/invoices/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    project_id: int,
    invoice_id: int,
    body: InvoiceUpdate,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).update_invoice(project_id, invoice_id, body)


@router.post("/{project_id}/invoices/{invoice_id}/pay", response_model=InvoiceResponse)
async def mark_invoice_paid(
    project_id: int,
    invoice_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await _get_service(db).mark_paid(current_user, project_id, invoice_id)


@router.delete("/{project_id}/invoices/{invoice_id}", status_code=204)
async def delete_invoice(
    project_id: int,
    invoice_id: int,
    current_user: ManagerOrAdmin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await _get_service(db).delete_invoice(project_id, invoice_id)
