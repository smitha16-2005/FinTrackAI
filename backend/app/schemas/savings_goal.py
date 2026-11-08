
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SavingsGoalCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    target_amount: Decimal = Field(
        gt=0, max_digits=12, decimal_places=2
    )
    current_amount: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        max_digits=12,
        decimal_places=2
    )
    target_date: date | None = None


class SavingsGoalUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    target_amount: Decimal | None = Field(
        default=None, gt=0, max_digits=12, decimal_places=2
    )
    current_amount: Decimal | None = Field(
        default=None, ge=0, max_digits=12, decimal_places=2
    )
    target_date: date | None = None


class SavingsGoalResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: str | None
    target_amount: Decimal
    current_amount: Decimal
    target_date: date | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
