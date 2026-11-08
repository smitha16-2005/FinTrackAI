
import csv
from pathlib import Path

import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "transaction_classifier.joblib"
DATA_PATH = BASE_DIR / "training_data.csv"


def load_training_data():
    descriptions = []
    labels = []

    with open(DATA_PATH, "r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)

        for row in reader:
            description = row["description"].strip()
            transaction_type = row["type"].strip().lower()
            category = row["category"].strip()

            if not description or not category:
                continue

            if transaction_type not in {"expense", "income"}:
                continue

            descriptions.append(
                f"{transaction_type} {description.lower()}"
            )
            labels.append(category)

    if len(set(labels)) < 2:
        raise ValueError("Training requires at least two categories.")

    return descriptions, labels


def train_model():
    descriptions, labels = load_training_data()

    X_train, X_test, y_train, y_test = train_test_split(
        descriptions,
        labels,
        test_size=0.25,
        random_state=42,
        stratify=labels
    )

    model = Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                ngram_range=(1, 2),
                analyzer="word",
                sublinear_tf=True
            )
        ),
        (
            "classifier",
            LogisticRegression(
                max_iter=1000,
                class_weight="balanced",
                random_state=42
            )
        )
    ])

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)

    print(f"Training samples: {len(X_train)}")
    print(f"Evaluation samples: {len(X_test)}")
    print(f"Accuracy: {accuracy:.2%}")
    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0
        )
    )

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, MODEL_PATH)

    print(f"Model saved to: {MODEL_PATH}")


if __name__ == "__main__":
    train_model()
