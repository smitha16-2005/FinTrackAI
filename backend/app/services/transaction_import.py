
from datetime import datetime, time, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.income import Income


def transaction_key(transaction: dict) -> tuple:
    return (
        transaction["type"],
        transaction["date"],
        transaction["amount"],
        transaction["description"].strip().casefold()
    )


def find_existing_transactions(
    db: Session,
    user_id,
    transactions: list[dict]
) -> set[tuple]:

    if not transactions:
        return set()

    start_date = min(item["date"] for item in transactions)
    end_date = max(item["date"] for item in transactions)

    start_datetime = datetime.combine(
        start_date,
        time.min,
        tzinfo=timezone.utc
    )

    end_datetime = datetime.combine(
        end_date + timedelta(days=1),
        time.min,
        tzinfo=timezone.utc
    )

    existing = set()

    expense_rows = db.execute(
        select(
            Expense.expense_date,
            Expense.amount,
            Expense.description
        ).where(
            Expense.user_id == user_id,
            Expense.expense_date >= start_datetime,
            Expense.expense_date < end_datetime
        )
    ).all()

    for transaction_date, amount, description in expense_rows:
        if description is not None:
            existing.add((
                "expense",
                transaction_date.date(),
                Decimal(str(amount)),
                description.strip().casefold()
            ))

    income_rows = db.execute(
        select(
            Income.income_date,
            Income.amount,
            Income.description
        ).where(
            Income.user_id == user_id,
            Income.income_date >= start_datetime,
            Income.income_date < end_datetime
        )
    ).all()

    for transaction_date, amount, description in income_rows:
        if description is not None:
            existing.add((
                "income",
                transaction_date.date(),
                Decimal(str(amount)),
                description.strip().casefold()
            ))

    return existing


def classify_transactions(
    db: Session,
    user_id,
    transactions: list[dict]
) -> list[dict]:

    existing = find_existing_transactions(
        db,
        user_id,
        transactions
    )

    seen_in_file = set()
    classified = []

    for transaction in transactions:
        key = transaction_key(transaction)

        duplicate_in_file = key in seen_in_file
        possible_duplicate = key in existing

        seen_in_file.add(key)

        classified.append({
            **transaction,
            "duplicate_in_file": duplicate_in_file,
            "possible_duplicate": possible_duplicate
        })

    return classified


def create_database_records(
    transactions: list[dict],
    user_id
) -> tuple[list[Expense], list[Income]]:

    expenses = []
    incomes = []

    for transaction in transactions:

        transaction_datetime = datetime.combine(
            transaction["date"],
            time.min,
            tzinfo=timezone.utc
        )

        if transaction["type"] == "expense":
            expenses.append(
                Expense(
                    user_id=user_id,
                    amount=transaction["amount"],
                    category=transaction["category"] or "Uncategorized",
                    description=transaction["description"],
                    expense_date=transaction_datetime
                )
            )

        elif transaction["type"] == "income":
            incomes.append(
                Income(
                    user_id=user_id,
                    amount=transaction["amount"],
                    source=transaction["category"] or "Other",
                    description=transaction["description"],
                    income_date=transaction_datetime
                )
            )

    return expenses, incomes
