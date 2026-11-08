
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class BudgetCreate(BaseModel):
    category: str = Field(min_length=2, max_length=50)
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    period_start: date


class BudgetUpdate(BaseModel):
    category: str | None = Field(default=None, min_length=2, max_length=50)
    amount: Decimal | None = Field(
        default=None, gt=0, max_digits=12, decimal_places=2
    )
    period_start: date | None = None


class BudgetResponse(BaseModel):
    id: UUID
    user_id: UUID
    category: str
    amount: Decimal
    period_start: date
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
