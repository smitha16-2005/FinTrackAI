
from datetime import date, datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, extract
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.user import User
from app.models.expense import Expense
from app.models.income import Income
from app.models.budget import Budget
from app.models.savings_goal import SavingsGoal


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    month_start = date(today.year, today.month, 1)

    if today.month == 12:
        next_month = date(today.year + 1, 1, 1)
    else:
        next_month = date(today.year, today.month + 1, 1)

    month_start_datetime = datetime.combine(
        month_start,
        datetime.min.time(),
        tzinfo=timezone.utc
    )

    next_month_datetime = datetime.combine(
        next_month,
        datetime.min.time(),
        tzinfo=timezone.utc
    )

    expense_filters = [
        Expense.user_id == current_user.id,
        Expense.expense_date >= month_start_datetime,
        Expense.expense_date < next_month_datetime
    ]

    income_filters = [
        Income.user_id == current_user.id,
        Income.income_date >= month_start_datetime,
        Income.income_date < next_month_datetime
    ]

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

    budgets = db.scalars(
        select(Budget).where(
            Budget.user_id == current_user.id,
            Budget.period_start == month_start
        )
    ).all()

    budget_overview = []

    for budget in budgets:
        spent = db.scalar(
            select(func.coalesce(func.sum(Expense.amount), 0))
            .where(
                Expense.user_id == current_user.id,
                Expense.category == budget.category,
                Expense.expense_date >= month_start_datetime,
                Expense.expense_date < next_month_datetime
            )
        )

        spent = Decimal(str(spent))
        remaining = budget.amount - spent

        budget_overview.append({
            "category": budget.category,
            "budget_amount": float(budget.amount),
            "spent": float(spent),
            "remaining": float(remaining),
            "usage_percentage": round(
                float(spent / budget.amount * 100), 2
            )
        })

    savings_goals = db.scalars(
        select(SavingsGoal)
        .where(SavingsGoal.user_id == current_user.id)
        .order_by(SavingsGoal.created_at.desc())
    ).all()

    savings_goal_overview = []

    for goal in savings_goals:
        remaining = goal.target_amount - goal.current_amount

        savings_goal_overview.append({
            "id": str(goal.id),
            "name": goal.name,
            "target_amount": float(goal.target_amount),
            "current_amount": float(goal.current_amount),
            "remaining_amount": float(remaining),
            "progress_percentage": round(
                float(goal.current_amount / goal.target_amount * 100), 2
            ),
            "target_date": (
                goal.target_date.isoformat()
                if goal.target_date else None
            )
        })

    return {
        "period": {
            "year": today.year,
            "month": today.month
        },
        "financial_summary": {
            "total_income": float(total_income),
            "total_expenses": float(total_expenses),
            "net_savings": float(total_income - total_expenses)
        },
        "category_breakdown": [
            {
                "category": row.category,
                "total": float(row.total)
            }
            for row in category_rows
        ],
        "budgets": budget_overview,
        "savings_goals": savings_goal_overview
    }
