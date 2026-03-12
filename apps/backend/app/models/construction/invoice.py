import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP as TIMESTAMPTZ
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class InvoiceStatus(str, enum.Enum):
    received = "received"
    under_review = "under_review"
    approved = "approved"
    paid = "paid"
    disputed = "disputed"
    cancelled = "cancelled"


class ConstructionInvoice(Base):
    __tablename__ = "construction_invoices"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False
    )
    invoice_number: Mapped[str] = mapped_column(String(100), nullable=False)
    subcontractor_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("construction_subcontractors.id", ondelete="SET NULL"), nullable=True
    )
    shipment_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("construction_shipments.id", ondelete="SET NULL"), nullable=True
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal("0"))
    status: Mapped[InvoiceStatus] = mapped_column(
        SAEnum(InvoiceStatus, name="invoice_status"),
        nullable=False,
        default=InvoiceStatus.received,
    )
    invoice_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    paid_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    paid_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ(timezone=True), server_default=func.now())

    project: Mapped["ConstructionProject"] = relationship(back_populates="invoices")
    subcontractor: Mapped["ConstructionSubcontractor | None"] = relationship(foreign_keys=[subcontractor_id])
    payer: Mapped["User | None"] = relationship(foreign_keys=[paid_by])
