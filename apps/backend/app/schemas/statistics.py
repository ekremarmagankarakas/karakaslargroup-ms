from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class StatisticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_count: int
    pending_count: int
    accepted_count: int
    declined_count: int
    total_price: Decimal
    pending_price: Decimal
    accepted_price: Decimal
    declined_price: Decimal


class SpendDataPoint(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    year: int
    month: int
    month_label: str
    total_price: Decimal
    accepted_price: Decimal
    count: int


class SpendOverTimeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    data: list[SpendDataPoint]


class TopRequesterItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    username: str
    total_price: Decimal
    total_count: int
    accepted_count: int


class TopRequestersResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    data: list[TopRequesterItem]


class LocationStatsItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    location_id: int
    location_name: str
    total_count: int
    pending_count: int
    accepted_count: int
    declined_count: int
    total_price: Decimal
    accepted_price: Decimal


class LocationStatsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    data: list[LocationStatsItem]
