from collections import defaultdict
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.income import Income


LOOKBACK_DAYS = 400
MINIMUM_OCCURRENCES = 3
MINIMUM_INTERVAL_DAYS = 25
MAXIMUM_INTERVAL_DAYS = 35
MAXIMUM_AMOUNT_VARIATION = 0.25


def normalize_description(value: str | None) -> str:
    """
    Normalize descriptions so transactions with minor
    formatting differences can be grouped together.
    """
    if not value:
        return ""

    return " ".join(value.casefold().split())


def calculate_average_amount(transactions: list) -> Decimal:
    amounts = [
        transaction["amount"]
        for transaction in transactions
    ]

    return sum(amounts) / len(amounts)


def calculate_average_interval(transactions: list) -> float:
    intervals = []

    for index in range(1, len(transactions)):
        difference = (
            transactions[index]["date"].date()
            - transactions[index - 1]["date"].date()
        ).days

        intervals.append(difference)

    return sum(intervals) / len(intervals)


def detect_recurring_transactions(
    db: Session,
    user_id
):
    """
    Detect likely monthly recurring expenses and income.

    This function:
    - Examines the user's previous 400 days of transactions.
    - Groups transactions by type, category/source and description.
    - Requires at least three occurrences.
    - Checks whether intervals are approximately monthly.
    - Checks whether transaction amounts are reasonably consistent.

    It does not create or modify financial records.
    """

    cutoff = datetime.now(timezone.utc) - timedelta(
        days=LOOKBACK_DAYS
    )

    expenses = db.scalars(
        select(Expense)
        .where(
            Expense.user_id == user_id,
            Expense.expense_date >= cutoff
        )
        .order_by(Expense.expense_date.asc())
    ).all()

    incomes = db.scalars(
        select(Income)
        .where(
            Income.user_id == user_id,
            Income.income_date >= cutoff
        )
        .order_by(Income.income_date.asc())
    ).all()

    groups = defaultdict(list)

    # Group expense transactions.
    for expense in expenses:
        normalized_description = normalize_description(
            expense.description
        )

        if not normalized_description:
            continue

        key = (
            "expense",
            expense.category.casefold(),
            normalized_description
        )

        groups[key].append({
            "type": "expense",
            "date": expense.expense_date,
            "amount": Decimal(str(expense.amount)),
            "description": expense.description,
            "category": expense.category
        })

    # Group income transactions.
    for income in incomes:
        normalized_description = normalize_description(
            income.description
        )

        if not normalized_description:
            continue

        key = (
            "income",
            income.source.casefold(),
            normalized_description
        )

        groups[key].append({
            "type": "income",
            "date": income.income_date,
            "amount": Decimal(str(income.amount)),
            "description": income.description,
            "category": income.source
        })

    recurring_transactions = []

    for key, transactions in groups.items():

        if len(transactions) < MINIMUM_OCCURRENCES:
            continue

        transactions.sort(
            key=lambda transaction: transaction["date"]
        )

        average_interval = calculate_average_interval(
            transactions
        )

        # Check whether the pattern is approximately monthly.
        if not (
            MINIMUM_INTERVAL_DAYS
            <= average_interval
            <= MAXIMUM_INTERVAL_DAYS
        ):
            continue

        amounts = [
            float(transaction["amount"])
            for transaction in transactions
        ]

        average_amount = sum(amounts) / len(amounts)

        if average_amount <= 0:
            continue

        # Reject patterns with large amount variations.
        amount_variation = (
            max(amounts) - min(amounts)
        ) / average_amount

        if amount_variation > MAXIMUM_AMOUNT_VARIATION:
            continue

        latest_transaction = transactions[-1]

        recurring_transactions.append({
            "type": key[0],
            "description": (
                latest_transaction["description"]
                or key[1]
            ),
            "category": latest_transaction["category"],
            "average_amount": round(average_amount, 2),
            "occurrences": len(transactions),
            "average_interval_days": round(
                average_interval, 1
            ),
            "last_transaction_date": (
                latest_transaction["date"].isoformat()
            ),
            "amount_variation_percent": round(
                amount_variation * 100, 2
            ),
            "confidence": (
                "high"
                if len(transactions) >= 4
                and amount_variation <= 0.10
                else "moderate"
            )
        })

    # Display higher-value recurring transactions first.
    recurring_transactions.sort(
        key=lambda item: item["average_amount"],
        reverse=True
    )

    return {
        "recurring_count": len(recurring_transactions),
        "recurring_transactions": recurring_transactions,
        "lookback_days": LOOKBACK_DAYS,
        "minimum_occurrences": MINIMUM_OCCURRENCES,
        "note": (
            "These are statistically detected recurring patterns. "
            "They are not confirmed subscriptions or guaranteed "
            "future payments."
        )
    }