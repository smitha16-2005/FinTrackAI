
from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.budget import Budget
from app.models.user import User
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
)


router = APIRouter(
    prefix="/budgets",
    tags=["Budgets"]
)


@router.post(
    "/",
    response_model=BudgetResponse,
    status_code=status.HTTP_201_CREATED
)
def create_budget(
    budget_data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_budget = Budget(
        **budget_data.model_dump(),
        user_id=current_user.id
    )

    try:
        db.add(new_budget)
        db.commit()
        db.refresh(new_budget)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A budget for this category and period already exists."
        )

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create budget."
        )

    return new_budget


@router.get(
    "/",
    response_model=list[BudgetResponse]
)
def list_budgets(
    year: int | None = Query(default=None, ge=2000, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Budget).where(
        Budget.user_id == current_user.id
    )

    if year is not None:
        query = query.where(
            Budget.period_start >= date(year, 1, 1),
            Budget.period_start <= date(year, 12, 31)
        )

    if month is not None:
        if year is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Year is required when filtering by month."
            )

        query = query.where(
            Budget.period_start == date(year, month, 1)
        )

    query = query.order_by(Budget.period_start.desc())

    return db.scalars(query).all()


@router.put(
    "/{budget_id}",
    response_model=BudgetResponse
)
def update_budget(
    budget_id: UUID,
    budget_data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budget = db.scalar(
        select(Budget).where(
            Budget.id == budget_id,
            Budget.user_id == current_user.id
        )
    )

    if budget is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found."
        )

    update_data = budget_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if value is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{field} cannot be null."
            )
        setattr(budget, field, value)

    try:
        db.commit()
        db.refresh(budget)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A budget for this category and period already exists."
        )

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update budget."
        )

    return budget


@router.delete(
    "/{budget_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_budget(
    budget_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    budget = db.scalar(
        select(Budget).where(
            Budget.id == budget_id,
            Budget.user_id == current_user.id
        )
    )

    if budget is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found."
        )

    try:
        db.delete(budget)
        db.commit()

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete budget."
        )

    return None
