
import csv
import io
from datetime import date
from decimal import Decimal, InvalidOperation

from app.services.categorization import categorize_transaction


MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_ROWS = 5000

REQUIRED_COLUMNS = {
    "date",
    "description",
    "amount",
    "type"
}


def parse_transactions(file_content: bytes) -> list[dict]:
    if not file_content:
        raise ValueError("The uploaded CSV file is empty.")

    if len(file_content) > MAX_FILE_SIZE:
        raise ValueError("CSV file must not exceed 5 MB.")

    try:
        content = file_content.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise ValueError("CSV file must use UTF-8 encoding.") from error

    try:
        reader = csv.DictReader(io.StringIO(content))

        if not reader.fieldnames:
            raise ValueError("CSV file does not contain headers.")

        headers = [
            header.strip().lower() if header else ""
            for header in reader.fieldnames
        ]

        if any(not header for header in headers):
            raise ValueError("CSV contains an empty column name.")

        if len(headers) != len(set(headers)):
            raise ValueError("CSV contains duplicate column names.")

        missing_columns = REQUIRED_COLUMNS - set(headers)

        if missing_columns:
            raise ValueError(
                "Missing required columns: "
                + ", ".join(sorted(missing_columns))
            )

        reader.fieldnames = headers
        transactions = []

        for row_number, row in enumerate(reader, start=2):

            if None in row and any(
                str(value).strip() for value in row[None]
            ):
                raise ValueError(
                    f"Unexpected extra columns on row {row_number}."
                )

            if not any(
                value and str(value).strip()
                for value in row.values()
                if value is not None
            ):
                continue

            if len(transactions) >= MAX_ROWS:
                raise ValueError(
                    f"CSV cannot contain more than {MAX_ROWS} transactions."
                )

            try:
                transaction_date = date.fromisoformat(
                    (row.get("date") or "").strip()
                )

                description = (
                    row.get("description") or ""
                ).strip()

                amount = Decimal(
                    (row.get("amount") or "").strip()
                )

                transaction_type = (
                    row.get("type") or ""
                ).strip().lower()

                provided_category = (
                    row.get("category") or ""
                ).strip()

                if not description or len(description) > 500:
                    raise ValueError(
                        "Description must contain 1–500 characters."
                    )

                if not amount.is_finite() or amount <= 0:
                    raise ValueError(
                        "Amount must be a positive number."
                    )

                if amount.as_tuple().exponent < -2:
                    raise ValueError(
                        "Amount cannot have more than 2 decimal places."
                    )

                if amount.adjusted() > 9:
                    raise ValueError("Amount exceeds the supported limit.")

                if transaction_type not in {"expense", "income"}:
                    raise ValueError(
                        "Type must be 'expense' or 'income'."
                    )

                if len(provided_category) > 50:
                    raise ValueError(
                        "Category cannot exceed 50 characters."
                    )

                category = categorize_transaction(
                    description,
                    transaction_type,
                    provided_category
                )

                transactions.append({
                    "date": transaction_date,
                    "description": description,
                    "amount": amount,
                    "type": transaction_type,
                    "category": category
                })

            except (ValueError, InvalidOperation, AttributeError) as error:
                raise ValueError(
                    f"Invalid data on CSV row {row_number}: {error}"
                ) from error

        if not transactions:
            raise ValueError("CSV contains no valid transactions.")

        return transactions

    except csv.Error as error:
        raise ValueError("Unable to read the CSV file.") from error
