from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.user import User

from app.services.smart_insights import get_smart_insights
from app.services.anomaly_detection import get_expense_anomalies


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    smart_data = get_smart_insights(
        db,
        current_user.id
    )

    anomaly_data = get_expense_anomalies(
        db,
        current_user.id
    )

    notifications = []

    for index, insight in enumerate(smart_data["insights"]):
        notifications.append({
            "id": f"insight-{index}",
            "type": insight["type"],
            "title": insight["title"],
            "message": insight["description"],
            "source": "financial_insights"
        })

    for anomaly in anomaly_data["anomalies"]:
        notifications.append({
            "id": f"anomaly-{anomaly['expense_id']}",
            "type": "warning",
            "title": "Unusual transaction detected",
            "message": anomaly["message"],
            "category": anomaly["category"],
            "amount": anomaly["amount"],
            "source": "anomaly_detection"
        })

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "notification_count": len(notifications),
        "notifications": notifications
    }