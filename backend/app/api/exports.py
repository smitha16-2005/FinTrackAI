import csv
import io
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.user import User
from app.models.expense import Expense
from app.models.income import Income


router = APIRouter(
    prefix="/exports",
    tags=["Exports"]
)


@router.get("/transactions")
def export_transactions(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    transaction_type: str = Query(
        default="all",
        pattern="^(all|expense|income)$"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date cannot be after end date."
        )

    start_datetime = (
        datetime.combine(start_date, time.min, tzinfo=timezone.utc)
        if start_date else None
    )

    end_datetime = (
        datetime.combine(
            end_date + timedelta(days=1),
            time.min,
            tzinfo=timezone.utc
        )
        if end_date else None
    )

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "date",
        "type",
        "description",
        "category",
        "amount",
        "currency"
    ])

    if transaction_type in {"all", "expense"}:
        query = select(Expense).where(
            Expense.user_id == current_user.id
        )

        if start_datetime:
            query = query.where(
                Expense.expense_date >= start_datetime
            )

        if end_datetime:
            query = query.where(
                Expense.expense_date < end_datetime
            )

        expenses = db.scalars(
            query.order_by(Expense.expense_date.desc())
        ).all()

        for expense in expenses:
            writer.writerow([
                expense.expense_date.isoformat(),
                "expense",
                expense.description or "",
                expense.category,
                str(Decimal(expense.amount)),
                "INR"
            ])

    if transaction_type in {"all", "income"}:
        query = select(Income).where(
            Income.user_id == current_user.id
        )

        if start_datetime:
            query = query.where(
                Income.income_date >= start_datetime
            )

        if end_datetime:
            query = query.where(
                Income.income_date < end_datetime
            )

        incomes = db.scalars(
            query.order_by(Income.income_date.desc())
        ).all()

        for income in incomes:
            writer.writerow([
                income.income_date.isoformat(),
                "income",
                income.description or "",
                income.source,
                str(Decimal(income.amount)),
                "INR"
            ])

    output.seek(0)

    filename = f"fintrack_transactions_{date.today().isoformat()}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )