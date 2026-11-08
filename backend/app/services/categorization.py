
import re

from app.ml.predictor import predict_category


EXPENSE_RULES = {
    "Food": [
        "swiggy", "zomato", "restaurant", "cafe",
        "pizza", "burger", "grocery", "supermarket",
        "zepto", "blinkit", "bigbasket"
    ],
    "Transport": [
        "uber", "ola", "rapido", "metro", "bus",
        "train", "petrol", "fuel", "parking"
    ],
    "Shopping": [
        "amazon", "flipkart", "myntra", "ajio",
        "shopping", "mall"
    ],
    "Utilities": [
        "electricity", "water bill", "internet",
        "broadband", "mobile recharge", "gas bill"
    ],
    "Entertainment": [
        "netflix", "spotify", "prime video",
        "movie", "cinema", "hotstar"
    ],
    "Healthcare": [
        "hospital", "pharmacy", "medical",
        "doctor", "clinic", "medicine"
    ],
    "Education": [
        "college", "university", "course",
        "udemy", "coursera", "tuition"
    ],
    "Rent": [
        "rent", "landlord", "house rent"
    ]
}


INCOME_RULES = {
    "Salary": [
        "salary", "payroll", "monthly pay"
    ],
    "Freelance": [
        "freelance", "client payment", "project payment"
    ],
    "Investment": [
        "dividend", "interest", "mutual fund",
        "investment return"
    ],
    "Business": [
        "business income", "sales revenue"
    ]
}


def categorize_transaction(
    description: str,
    transaction_type: str,
    provided_category: str | None = None
) -> str:

    if provided_category and provided_category.strip():
        return provided_category.strip().title()

    prediction = predict_category(
        description,
        transaction_type
    )

    if prediction and prediction["confidence"] >= 0.65:
        return prediction["category"]

    normalized = re.sub(
        r"[^a-z0-9\s]",
        " ",
        description.lower()
    )

    normalized = " ".join(normalized.split())

    rules = (
        EXPENSE_RULES
        if transaction_type == "expense"
        else INCOME_RULES
    )

    for category, keywords in rules.items():
        for keyword in keywords:
            if keyword in normalized:
                return category

    return (
        "Uncategorized"
        if transaction_type == "expense"
        else "Other"
    )
