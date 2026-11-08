
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, extract
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.user import User
from app.models.expense import Expense
from app.models.income import Income


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


@router.get("/summary")
def get_financial_summary(
    year: int | None = Query(default=None, ge=2000, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if year is None:
        year = date.today().year

    if month is not None and month < 1:
        month = None

    expense_filters = [
        Expense.user_id == current_user.id,
        extract("year", Expense.expense_date) == year
    ]

    income_filters = [
        Income.user_id == current_user.id,
        extract("year", Income.income_date) == year
    ]

    if month is not None:
        expense_filters.append(
            extract("month", Expense.expense_date) == month
        )
        income_filters.append(
            extract("month", Income.income_date) == month
        )

    total_expenses = db.scalar(
        select(func.coalesce(func.sum(Expense.amount), 0))
        .where(*expense_filters)
    )

    total_income = db.scalar(
        select(func.coalesce(func.sum(Income.amount), 0))
        .where(*income_filters)
    )

    total_expenses = Decimal(str(total_expenses))
    total_income = Decimal(str(total_income))

    category_query = (
        select(
            Expense.category,
            func.sum(Expense.amount).label("total")
        )
        .where(*expense_filters)
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
    )

    category_rows = db.execute(category_query).all()

    monthly_expense_query = (
        select(
            extract("month", Expense.expense_date).label("month"),
            func.sum(Expense.amount).label("total")
        )
        .where(
            Expense.user_id == current_user.id,
            extract("year", Expense.expense_date) == year
        )
        .group_by(extract("month", Expense.expense_date))
        .order_by(extract("month", Expense.expense_date))
    )

    monthly_income_query = (
        select(
            extract("month", Income.income_date).label("month"),
            func.sum(Income.amount).label("total")
        )
        .where(
            Income.user_id == current_user.id,
            extract("year", Income.income_date) == year
        )
        .group_by(extract("month", Income.income_date))
        .order_by(extract("month", Income.income_date))
    )

    monthly_expenses = {
        int(row.month): Decimal(str(row.total))
        for row in db.execute(monthly_expense_query)
    }

    monthly_incomes = {
        int(row.month): Decimal(str(row.total))
        for row in db.execute(monthly_income_query)
    }

    monthly_trend = [
        {
            "month": month_number,
            "income": float(monthly_incomes.get(month_number, 0)),
            "expenses": float(monthly_expenses.get(month_number, 0)),
            "savings": float(
                monthly_incomes.get(month_number, 0)
                - monthly_expenses.get(month_number, 0)
            )
        }
        for month_number in range(1, 13)
    ]

    return {
        "year": year,
        "month": month,
        "total_income": float(total_income),
        "total_expenses": float(total_expenses),
        "net_savings": float(total_income - total_expenses),
        "category_breakdown": [
            {
                "category": row.category,
                "total": float(row.total)
            }
            for row in category_rows
        ],
        "monthly_trend": monthly_trend
    }
