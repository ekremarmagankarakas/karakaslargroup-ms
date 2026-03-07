from decimal import Decimal

from pydantic import BaseModel


class StatisticsResponse(BaseModel):
    total_count: int
    pending_count: int
    accepted_count: int
    declined_count: int
    total_price: Decimal
    pending_price: Decimal
    accepted_price: Decimal
    declined_price: Decimal
