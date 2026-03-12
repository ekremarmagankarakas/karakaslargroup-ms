from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.construction.invoice import ConstructionInvoice, InvoiceStatus


class InvoiceRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _base_query(self):
        return (
            select(ConstructionInvoice)
            .options(
                joinedload(ConstructionInvoice.subcontractor),
                joinedload(ConstructionInvoice.payer),
            )
        )

    async def get_by_id(self, invoice_id: int) -> ConstructionInvoice | None:
        result = await self.db.execute(
            self._base_query().where(ConstructionInvoice.id == invoice_id)
        )
        return result.unique().scalar_one_or_none()

    async def get_by_project(self, project_id: int, status: InvoiceStatus | None = None) -> list[ConstructionInvoice]:
        q = self._base_query().where(ConstructionInvoice.project_id == project_id)
        if status:
            q = q.where(ConstructionInvoice.status == status)
        q = q.order_by(ConstructionInvoice.invoice_date.desc())
        result = await self.db.execute(q)
        return list(result.scalars().unique().all())

    async def get_overdue(self) -> list[ConstructionInvoice]:
        today = date.today()
        result = await self.db.execute(
            self._base_query()
            .where(
                ConstructionInvoice.due_date < today,
                ConstructionInvoice.status.not_in([InvoiceStatus.paid, InvoiceStatus.cancelled]),
            )
            .order_by(ConstructionInvoice.due_date)
        )
        return list(result.scalars().unique().all())

    async def create(self, data: dict) -> ConstructionInvoice:
        invoice = ConstructionInvoice(**data)
        self.db.add(invoice)
        await self.db.flush()
        return (await self.get_by_id(invoice.id))  # type: ignore[return-value]

    async def update(self, invoice: ConstructionInvoice, data: dict) -> ConstructionInvoice:
        for key, value in data.items():
            setattr(invoice, key, value)
        await self.db.flush()
        return invoice

    async def delete(self, invoice: ConstructionInvoice) -> None:
        await self.db.delete(invoice)
        await self.db.flush()
