from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.expense import Expense


def get_previous_months(current_date: date, count: int = 3):
    months = []

    year = current_date.year
    month = current_date.month

    for _ in range(count):
        month -= 1

        if month == 0:
            month = 12
            year -= 1

        months.append((year, month))

    return list(reversed(months))


def get_expense_forecast(db: Session, user_id):
    today = datetime.now(timezone.utc).date()

    historical_months = get_previous_months(today, 3)

    first_year, first_month = historical_months[0]

    start_date = datetime(
        first_year,
        first_month,
        1,
        tzinfo=timezone.utc
    )

    end_date = datetime(
        today.year,
        today.month,
        1,
        tzinfo=timezone.utc
    )

    expenses = db.scalars(
        select(Expense).where(
            Expense.user_id == user_id,
            Expense.expense_date >= start_date,
            Expense.expense_date < end_date
        )
    ).all()

    monthly_totals = {
        (year, month): Decimal("0.00")
        for year, month in historical_months
    }

    for expense in expenses:
        key = (
            expense.expense_date.year,
            expense.expense_date.month
        )

        if key in monthly_totals:
            monthly_totals[key] += expense.amount

    history = []

    for year, month in historical_months:
        history.append({
            "month": f"{year}-{month:02d}",
            "total": round(
                float(monthly_totals[(year, month)]), 2
            )
        })

    # Count months with actual expense activity.
    active_months = sum(
        1 for total in monthly_totals.values()
        if total > 0
    )

    # Require three months of expense activity.
    if active_months < 3:
        return {
            "forecast_available": False,
            "message": (
                "Insufficient historical data. "
                "Expense activity in three previous months "
                "is required for forecasting."
            ),
            "historical_months_available": active_months,
            "required_months": 3,
            "historical_months": history
        }

    values = [
        float(monthly_totals[key])
        for key in historical_months
    ]

    # Weighted average: more recent spending has greater weight.
    forecast = (
        values[0] * 0.20
        + values[1] * 0.30
        + values[2] * 0.50
    )

    next_month = today.month + 1
    next_year = today.year

    if next_month == 13:
        next_month = 1
        next_year += 1

    return {
        "forecast_available": True,
        "forecast_month": f"{next_year}-{next_month:02d}",
        "predicted_expenses": round(forecast, 2),
        "currency": "INR",
        "method": "Weighted average of the previous three completed months",
        "historical_months": history
    }