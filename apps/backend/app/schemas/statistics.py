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


class SpendDataPoint(BaseModel):
    year: int
    month: int
    month_label: str
    total_price: Decimal
    accepted_price: Decimal
    count: int


class SpendOverTimeResponse(BaseModel):
    data: list[SpendDataPoint]


class TopRequesterItem(BaseModel):
    user_id: int
    username: str
    total_price: Decimal
    total_count: int
    accepted_count: int


class TopRequestersResponse(BaseModel):
    data: list[TopRequesterItem]


class LocationStatsItem(BaseModel):
    location_id: int
    location_name: str
    total_count: int
    pending_count: int
    accepted_count: int
    declined_count: int
    total_price: Decimal
    accepted_price: Decimal


class LocationStatsResponse(BaseModel):
    data: list[LocationStatsItem]
