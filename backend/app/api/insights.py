from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.user import User

from app.services.forecasting import get_expense_forecast
from app.services.anomaly_detection import get_expense_anomalies
from app.services.recurring_transaction import detect_recurring_transactions
from app.services.smart_insights import get_smart_insights


router = APIRouter(
    prefix="/insights",
    tags=["AI Insights"]
)


@router.get("/expense-forecast")
def expense_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_expense_forecast(db, current_user.id)


@router.get("/anomalies")
def expense_anomalies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_expense_anomalies(db, current_user.id)


@router.get("/recurring")
def recurring_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return detect_recurring_transactions(db, current_user.id)


@router.get("/smart")
def smart_financial_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_smart_insights(db, current_user.id)