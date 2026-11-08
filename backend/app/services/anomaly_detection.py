from collections import defaultdict
from statistics import median

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.expense import Expense


MINIMUM_HISTORY = 10
RECENT_TRANSACTIONS = 20
MAX_TRANSACTIONS = 520


def get_expense_anomalies(db: Session, user_id):
    expenses = db.scalars(
        select(Expense)
        .where(Expense.user_id == user_id)
        .order_by(
            Expense.expense_date.desc(),
            Expense.id.desc()
        )
        .limit(MAX_TRANSACTIONS)
    ).all()

    recent_expenses = expenses[:RECENT_TRANSACTIONS]
    historical_expenses = expenses[RECENT_TRANSACTIONS:]

    category_history = defaultdict(list)

    for expense in historical_expenses:
        category_history[expense.category].append(
            float(expense.amount)
        )

    anomalies = []
    insufficient_history = set()

    for expense in recent_expenses:
        history = category_history[expense.category]

        if len(history) < MINIMUM_HISTORY:
            insufficient_history.add(expense.category)
            continue

        historical_median = median(history)

        deviations = [
            abs(value - historical_median)
            for value in history
        ]

        mad = median(deviations)

        # Robust statistical threshold.
        threshold = historical_median + max(
            3 * 1.4826 * mad,
            historical_median * 0.5,
            1.0
        )

        amount = float(expense.amount)

        if amount > threshold:
            anomalies.append({
                "expense_id": str(expense.id),
                "date": expense.expense_date.isoformat(),
                "description": expense.description,
                "category": expense.category,
                "amount": round(amount, 2),
                "usual_category_median": round(
                    historical_median, 2
                ),
                "anomaly_threshold": round(threshold, 2),
                "historical_transactions_used": len(history),
                "message": (
                    "This expense is unusually high compared "
                    "with your previous spending in this category."
                )
            })

    return {
        "anomalies_found": len(anomalies),
        "anomalies": anomalies,
        "insufficient_history_categories": sorted(
            insufficient_history
        ),
        "transactions_analyzed": len(recent_expenses),
        "historical_transactions_available": len(
            historical_expenses
        ),
        "analysis": (
            "Recent expenses are compared with historical "
            "expenses from the same category using the "
            "median absolute deviation method."
        )
    }