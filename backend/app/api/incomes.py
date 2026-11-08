
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, desc
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.income import Income
from app.models.user import User
from app.schemas.income import (
    IncomeCreate,
    IncomeUpdate,
    IncomeResponse,
)


router = APIRouter(
    prefix="/incomes",
    tags=["Income"]
)


@router.post(
    "/",
    response_model=IncomeResponse,
    status_code=status.HTTP_201_CREATED
)
def create_income(
    income_data: IncomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_income = Income(
        **income_data.model_dump(),
        user_id=current_user.id
    )

    try:
        db.add(new_income)
        db.commit()
        db.refresh(new_income)

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create income."
        )

    return new_income


@router.get(
    "/",
    response_model=list[IncomeResponse]
)
def list_incomes(
    source: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Income).where(
        Income.user_id == current_user.id
    )

    if source:
        query = query.where(Income.source == source)

    query = (
        query
        .order_by(desc(Income.income_date))
        .limit(limit)
        .offset(offset)
    )

    return db.scalars(query).all()


@router.put(
    "/{income_id}",
    response_model=IncomeResponse
)
def update_income(
    income_id: UUID,
    income_data: IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    income = db.scalar(
        select(Income).where(
            Income.id == income_id,
            Income.user_id == current_user.id
        )
    )

    if income is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income not found."
        )

    update_data = income_data.model_dump(exclude_unset=True)

    for field in ("amount", "source", "income_date"):
        if field in update_data and update_data[field] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{field} cannot be null."
            )

    for field, value in update_data.items():
        setattr(income, field, value)

    try:
        db.commit()
        db.refresh(income)

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update income."
        )

    return income


@router.delete(
    "/{income_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_income(
    income_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    income = db.scalar(
        select(Income).where(
            Income.id == income_id,
            Income.user_id == current_user.id
        )
    )

    if income is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income not found."
        )

    try:
        db.delete(income)
        db.commit()

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete income."
        )

    return None
