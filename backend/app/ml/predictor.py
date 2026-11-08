
from functools import lru_cache
from pathlib import Path

import joblib


MODEL_PATH = (
    Path(__file__).resolve().parent
    / "models"
    / "transaction_classifier.joblib"
)


@lru_cache(maxsize=1)
def load_model():
    if not MODEL_PATH.exists():
        return None

    return joblib.load(MODEL_PATH)


def predict_category(
    description: str,
    transaction_type: str
) -> dict | None:

    model = load_model()

    if model is None:
        return None

    normalized_type = transaction_type.strip().lower()

    if normalized_type not in {"expense", "income"}:
        return None

    text = f"{normalized_type} {description.lower()}"

    probabilities = model.predict_proba([text])[0]

    best_index = probabilities.argmax()

    category = model.classes_[best_index]
    confidence = float(probabilities[best_index])

    return {
        "category": category,
        "confidence": round(confidence, 4)
    }
