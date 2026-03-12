from datetime import date
from decimal import Decimal

from fastapi import HTTPException, status

from app.models.construction.invoice import InvoiceStatus
from app.repositories.construction.invoice_repository import InvoiceRepository
from app.repositories.construction.project_repository import ConstructionProjectRepository
from app.schemas.construction.invoice import InvoiceCreate, InvoiceResponse, InvoiceUpdate


def _to_response(invoice) -> InvoiceResponse:
    today = date.today()
    total = Decimal(str(invoice.amount)) + Decimal(str(invoice.tax_amount))
    is_overdue = (
        invoice.due_date is not None
        and invoice.due_date < today
        and invoice.status not in (InvoiceStatus.paid, InvoiceStatus.cancelled)
    )
    return InvoiceResponse(
        id=invoice.id,
        project_id=invoice.project_id,
        invoice_number=invoice.invoice_number,
        subcontractor_id=invoice.subcontractor_id,
        subcontractor_name=invoice.subcontractor.company_name if invoice.subcontractor else None,
        shipment_id=invoice.shipment_id,
        description=invoice.description,
        amount=invoice.amount,
        tax_amount=invoice.tax_amount,
        total_amount=total,
        status=invoice.status,
        invoice_date=invoice.invoice_date,
        due_date=invoice.due_date,
        paid_date=invoice.paid_date,
        paid_by=invoice.paid_by,
        payer_username=invoice.payer.username if invoice.payer else None,
        notes=invoice.notes,
        is_overdue=is_overdue,
        created_at=invoice.created_at,
    )


class InvoiceService:
    def __init__(
        self,
        invoice_repo: InvoiceRepository,
        project_repo: ConstructionProjectRepository,
    ) -> None:
        self.invoice_repo = invoice_repo
        self.project_repo = project_repo

    async def list_invoices(self, project_id: int, filter_status: InvoiceStatus | None = None) -> list[InvoiceResponse]:
        await self._require_project(project_id)
        invoices = await self.invoice_repo.get_by_project(project_id, filter_status)
        return [_to_response(i) for i in invoices]

    async def list_overdue(self) -> list[InvoiceResponse]:
        invoices = await self.invoice_repo.get_overdue()
        return [_to_response(i) for i in invoices]

    async def create_invoice(self, project_id: int, body: InvoiceCreate) -> InvoiceResponse:
        await self._require_project(project_id)
        data = body.model_dump()
        data["project_id"] = project_id
        invoice = await self.invoice_repo.create(data)
        return _to_response(invoice)

    async def update_invoice(self, project_id: int, invoice_id: int, body: InvoiceUpdate) -> InvoiceResponse:
        invoice = await self._require_invoice(project_id, invoice_id)
        updates = body.model_dump(exclude_unset=True)
        await self.invoice_repo.update(invoice, updates)
        invoice = await self.invoice_repo.get_by_id(invoice_id)
        return _to_response(invoice)

    async def mark_paid(self, current_user, project_id: int, invoice_id: int) -> InvoiceResponse:
        invoice = await self._require_invoice(project_id, invoice_id)
        updates = {
            "status": InvoiceStatus.paid,
            "paid_date": date.today(),
            "paid_by": current_user.id,
        }
        await self.invoice_repo.update(invoice, updates)
        invoice = await self.invoice_repo.get_by_id(invoice_id)

        # Notify accountant-role users
        from sqlalchemy import select as sa_select
        from app.models.user import User, UserRole
        from app.models.notification import Notification
        db = self.invoice_repo.db
        accountants_res = await db.execute(
            sa_select(User).where(User.role.in_([UserRole.accountant, UserRole.admin]))
        )
        for acct in accountants_res.scalars().all():
            db.add(Notification(
                user_id=acct.id,
                message=f"Fatura ödendi: #{invoice.invoice_number} — {invoice.description[:60]}",
            ))

        return _to_response(invoice)

    async def delete_invoice(self, project_id: int, invoice_id: int) -> None:
        invoice = await self._require_invoice(project_id, invoice_id)
        await self.invoice_repo.delete(invoice)

    async def _require_project(self, project_id: int):
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proje bulunamadı")
        return project

    async def _require_invoice(self, project_id: int, invoice_id: int):
        invoice = await self.invoice_repo.get_by_id(invoice_id)
        if not invoice or invoice.project_id != project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fatura bulunamadı")
        return invoice
