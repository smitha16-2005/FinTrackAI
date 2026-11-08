from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.income import Income
from app.models.budget import Budget
from app.models.savings_goal import SavingsGoal


def get_smart_insights(db: Session, user_id):
    now = datetime.now(timezone.utc)

    month_start = datetime(
        now.year, now.month, 1,
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

    expense_total = Decimal(str(db.scalar(
        select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.user_id == user_id,
            Expense.expense_date >= month_start,
            Expense.expense_date < next_month
        )
    ) or 0))

    income_total = Decimal(str(db.scalar(
        select(func.coalesce(func.sum(Income.amount), 0)).where(
            Income.user_id == user_id,
            Income.income_date >= month_start,
            Income.income_date < next_month
        )
    ) or 0))

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

    insights = []

    if income_total > 0:
        savings = income_total - expense_total
        savings_rate = (savings / income_total) * 100

        if savings < 0:
            insights.append({
                "type": "warning",
                "title": "Spending exceeds income",
                "description": (
                    "Your recorded expenses are higher than "
                    "your recorded income this month."
                )
            })
        elif savings_rate < 10:
            insights.append({
                "type": "suggestion",
                "title": "Low savings rate",
                "description": (
                    "Less than 10% of your recorded income "
                    "remains after expenses this month."
                )
            })
        else:
            insights.append({
                "type": "positive",
                "title": "Positive monthly balance",
                "description": (
                    f"You have retained {savings_rate.quantize(Decimal('0.1'))}% "
                    "of your recorded income so far this month."
                )
            })

    elif expense_total > 0:
        insights.append({
            "type": "information",
            "title": "Income data unavailable",
            "description": (
                "You have recorded expenses but no income "
                "for this month. Add income records for a "
                "more complete financial overview."
            )
        })

    if category_rows:
        top_category = category_rows[0]
        category_total = Decimal(str(top_category.total))
        share = (
            category_total / expense_total * 100
            if expense_total > 0 else Decimal("0")
        )

        insights.append({
            "type": "information",
            "title": "Highest spending category",
            "description": (
                f"{top_category.category} is your largest "
                f"expense category, accounting for "
                f"{share.quantize(Decimal('0.1'))}% "
                "of this month's expenses."
            ),
            "category": top_category.category,
            "amount": str(category_total.quantize(Decimal("0.01")))
        })

    budgets = db.scalars(
        select(Budget).where(
            Budget.user_id == user_id,
            Budget.period_start == month_start.date()
        )
    ).all()

    for budget in budgets:
        spent = Decimal(str(db.scalar(
            select(func.coalesce(func.sum(Expense.amount), 0)).where(
                Expense.user_id == user_id,
                Expense.category == budget.category,
                Expense.expense_date >= month_start,
                Expense.expense_date < next_month
            )
        ) or 0))

        if spent > budget.amount:
            insights.append({
                "type": "warning",
                "title": "Budget exceeded",
                "description": (
                    f"Your {budget.category} spending is above "
                    "its monthly budget."
                ),
                "category": budget.category,
                "budget_amount": str(budget.amount),
                "spent_amount": str(spent)
            })

        elif budget.amount > 0 and spent >= budget.amount * Decimal("0.8"):
            insights.append({
                "type": "warning",
                "title": "Budget nearly reached",
                "description": (
                    f"You have used at least 80% of your "
                    f"{budget.category} budget."
                ),
                "category": budget.category,
                "budget_amount": str(budget.amount),
                "spent_amount": str(spent)
            })

    goals = db.scalars(
        select(SavingsGoal).where(
            SavingsGoal.user_id == user_id
        )
    ).all()

    for goal in goals:
        if goal.target_amount > 0:
            progress = (
                goal.current_amount / goal.target_amount
            ) * 100

            if progress >= 100:
                insights.append({
                    "type": "positive",
                    "title": "Savings goal achieved",
                    "description": (
                        f"You have reached your savings goal: {goal.name}."
                    )
                })

    return {
        "reporting_month": now.strftime("%Y-%m"),
        "monthly_income": str(income_total.quantize(Decimal("0.01"))),
        "monthly_expenses": str(expense_total.quantize(Decimal("0.01"))),
        "monthly_balance": str(
            (income_total - expense_total).quantize(Decimal("0.01"))
        ),
        "insights_count": len(insights),
        "insights": insights
    }