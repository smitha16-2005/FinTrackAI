
from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict


class TransactionPreviewItem(BaseModel):
    date: date
    description: str
    amount: Decimal
    type: Literal["expense", "income"]
    category: str | None

    duplicate_in_file: bool
    possible_duplicate: bool

    model_config = ConfigDict(from_attributes=True)


class ImportPreviewResponse(BaseModel):
    total_transactions: int
    new_transactions: int
    duplicate_transactions: int
    transactions: list[TransactionPreviewItem]


class ImportResultResponse(BaseModel):
    total_transactions: int
    imported_expenses: int
    imported_incomes: int
    skipped_duplicates: int
