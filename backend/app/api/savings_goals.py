
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.savings_goal import SavingsGoal
from app.models.user import User
from app.schemas.savings_goal import (
    SavingsGoalCreate,
    SavingsGoalUpdate,
    SavingsGoalResponse,
)


router = APIRouter(
    prefix="/savings-goals",
    tags=["Savings Goals"]
)


@router.post(
    "/",
    response_model=SavingsGoalResponse,
    status_code=status.HTTP_201_CREATED
)
def create_savings_goal(
    goal_data: SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if goal_data.current_amount > goal_data.target_amount:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Current amount cannot exceed target amount."
        )

    new_goal = SavingsGoal(
        **goal_data.model_dump(),
        user_id=current_user.id
    )

    try:
        db.add(new_goal)
        db.commit()
        db.refresh(new_goal)

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create savings goal."
        )

    return new_goal


@router.get(
    "/",
    response_model=list[SavingsGoalResponse]
)
def list_savings_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(SavingsGoal)
        .where(SavingsGoal.user_id == current_user.id)
        .order_by(SavingsGoal.created_at.desc())
    )

    return db.scalars(query).all()


@router.put(
    "/{goal_id}",
    response_model=SavingsGoalResponse
)
def update_savings_goal(
    goal_id: UUID,
    goal_data: SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.scalar(
        select(SavingsGoal).where(
            SavingsGoal.id == goal_id,
            SavingsGoal.user_id == current_user.id
        )
    )

    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found."
        )

    update_data = goal_data.model_dump(exclude_unset=True)

    for field in ("name", "target_amount", "current_amount"):
        if field in update_data and update_data[field] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{field} cannot be null."
            )

    new_target = update_data.get(
        "target_amount", goal.target_amount
    )
    new_current = update_data.get(
        "current_amount", goal.current_amount
    )

    if new_current > new_target:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Current amount cannot exceed target amount."
        )

    for field, value in update_data.items():
        setattr(goal, field, value)

    try:
        db.commit()
        db.refresh(goal)

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update savings goal."
        )

    return goal


@router.delete(
    "/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_savings_goal(
    goal_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.scalar(
        select(SavingsGoal).where(
            SavingsGoal.id == goal_id,
            SavingsGoal.user_id == current_user.id
        )
    )

    if goal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings goal not found."
        )

    try:
        db.delete(goal)
        db.commit()

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete savings goal."
        )

    return None
