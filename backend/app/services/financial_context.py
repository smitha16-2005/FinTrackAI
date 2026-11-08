from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.income import Income
from app.models.budget import Budget
from app.models.savings_goal import SavingsGoal


def money(value):
    return str(Decimal(value or 0).quantize(Decimal("0.01")))


def get_financial_context(db: Session, user_id):
    now = datetime.now(timezone.utc)

    month_start = datetime(
        now.year,
        now.month,
        1,
        tzinfo=timezone.utc
    )

    if now.month == 12:
        next_month = datetime(
            now.year + 1, 1, 1,
            tzinfo=timezone.utc
        )
    else:
        next_month = datetime(
            now.year, now.month + 1, 1,
            tzinfo=timezone.utc
        )

    expense_total = db.scalar(
        select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.user_id == user_id,
            Expense.expense_date >= month_start,
            Expense.expense_date < next_month
        )
    )

    income_total = db.scalar(
        select(func.coalesce(func.sum(Income.amount), 0)).where(
            Income.user_id == user_id,
            Income.income_date >= month_start,
            Income.income_date < next_month
        )
    )

    category_rows = db.execute(
        select(
            Expense.category,
            func.sum(Expense.amount).label("total")
        )
        .where(
            Expense.user_id == user_id,
            Expense.expense_date >= month_start,
            Expense.expense_date < next_month
        )
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
    ).all()

    categories = [
        {
            "category": row.category,
            "amount": money(row.total)
        }
        for row in category_rows
    ]

    budgets = db.scalars(
        select(Budget).where(
            Budget.user_id == user_id,
            Budget.period_start == month_start.date()
        )
    ).all()

    budget_data = []

    for budget in budgets:
        spent = db.scalar(
            select(
                func.coalesce(func.sum(Expense.amount), 0)
            ).where(
                Expense.user_id == user_id,
                Expense.category == budget.category,
                Expense.expense_date >= month_start,
                Expense.expense_date < next_month
            )
        )

        budget_data.append({
            "category": budget.category,
            "budget_amount": money(budget.amount),
            "spent_amount": money(spent),
            "remaining_amount": money(
                max(Decimal("0"), budget.amount - Decimal(spent or 0))
            )
        })

    goals = db.scalars(
        select(SavingsGoal).where(
            SavingsGoal.user_id == user_id
        )
    ).all()

    goal_data = [
        {
            "name": goal.name,
            "target_amount": money(goal.target_amount),
            "current_amount": money(goal.current_amount),
            "target_date": (
                goal.target_date.isoformat()
                if goal.target_date else None
            )
        }
        for goal in goals
    ]

    return {
        "currency": "INR",
        "reporting_month": now.strftime("%Y-%m"),
        "monthly_income": money(income_total),
        "monthly_expenses": money(expense_total),
        "monthly_balance": money(
            Decimal(income_total or 0) - Decimal(expense_total or 0)
        ),
        "expense_categories": categories,
        "monthly_budgets": budget_data,
        "savings_goals": goal_data
    }