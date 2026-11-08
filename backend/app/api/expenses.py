
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, desc
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
)


router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"]
)


@router.post(
    "/",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED
)
def create_expense(
    expense_data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_expense = Expense(
        **expense_data.model_dump(),
        user_id=current_user.id
    )

    try:
        db.add(new_expense)
        db.commit()
        db.refresh(new_expense)

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create expense."
        )

    return new_expense


@router.get(
    "/",
    response_model=list[ExpenseResponse]
)
def list_expenses(
    category: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Expense).where(
        Expense.user_id == current_user.id
    )

    if category:
        query = query.where(Expense.category == category)

    query = (
        query
        .order_by(desc(Expense.expense_date))
        .limit(limit)
        .offset(offset)
    )

    return db.scalars(query).all()


@router.put(
    "/{expense_id}",
    response_model=ExpenseResponse
)
def update_expense(
    expense_id: UUID,
    expense_data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.scalar(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.user_id == current_user.id
        )
    )

    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found."
        )

    update_data = expense_data.model_dump(exclude_unset=True)

    # Do not allow NULL for required database columns.
    for field in ("amount", "category", "expense_date"):
        if field in update_data and update_data[field] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{field} cannot be null."
            )

    for field, value in update_data.items():
        setattr(expense, field, value)

    try:
        db.commit()
        db.refresh(expense)

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update expense."
        )

    return expense


@router.delete(
    "/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_expense(
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.scalar(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.user_id == current_user.id
        )
    )

    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found."
        )

    try:
        db.delete(expense)
        db.commit()

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete expense."
        )

    return None
