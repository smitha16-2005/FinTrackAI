
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.user import User
from app.schemas.imports import (
    ImportPreviewResponse,
    ImportResultResponse,
)
from app.services.csv_import import (
    MAX_FILE_SIZE,
    parse_transactions,
)
from app.services.transaction_import import (
    classify_transactions,
    create_database_records,
)


router = APIRouter(
    prefix="/imports",
    tags=["Transaction Import"]
)


async def read_csv_upload(file: UploadFile) -> bytes:

    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a CSV file."
        )

    try:
        content = await file.read(MAX_FILE_SIZE + 1)
    finally:
        await file.close()

    return content


async def get_classified_transactions(
    file: UploadFile,
    db: Session,
    current_user: User
) -> list[dict]:

    content = await read_csv_upload(file)

    try:
        transactions = parse_transactions(content)

        return classify_transactions(
            db,
            current_user.id,
            transactions
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error)
        ) from error


@router.post(
    "/preview",
    response_model=ImportPreviewResponse
)
async def preview_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        transactions = await get_classified_transactions(
            file,
            db,
            current_user
        )

    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to preview transactions."
        )

    duplicate_count = sum(
        1 for transaction in transactions
        if transaction["duplicate_in_file"]
        or transaction["possible_duplicate"]
    )

    new_count = len(transactions) - duplicate_count

    return {
        "total_transactions": len(transactions),
        "new_transactions": new_count,
        "duplicate_transactions": duplicate_count,
        "transactions": transactions
    }


@router.post(
    "/confirm",
    response_model=ImportResultResponse
)
async def confirm_csv_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        transactions = await get_classified_transactions(
            file,
            db,
            current_user
        )

        new_transactions = [
            transaction
            for transaction in transactions
            if not transaction["duplicate_in_file"]
            and not transaction["possible_duplicate"]
        ]

        expenses, incomes = create_database_records(
            new_transactions,
            current_user.id
        )

        db.add_all(expenses + incomes)
        db.commit()

    except ValueError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error)
        ) from error

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to import transactions."
        )

    return {
        "total_transactions": len(transactions),
        "imported_expenses": len(expenses),
        "imported_incomes": len(incomes),
        "skipped_duplicates": (
            len(transactions) - len(new_transactions)
        )
    }
