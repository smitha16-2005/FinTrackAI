from uuid import UUID
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class IncomeCreate(BaseModel):
    amount: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2
    )

    source: str = Field(
        min_length=2,
        max_length=50
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    income_date: datetime


class IncomeUpdate(BaseModel):
    amount: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=12,
        decimal_places=2
    )

    source: str | None = Field(
        default=None,
        min_length=2,
        max_length=50
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    income_date: datetime | None = None


class IncomeResponse(BaseModel):
    id: UUID
    user_id: UUID
    amount: Decimal
    source: str
    description: str | None
    income_date: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)