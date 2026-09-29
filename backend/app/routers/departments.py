from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.department import Department

from app.models.user import User

from app.auth_dependencies import (
    get_current_user
)


router = APIRouter(
    prefix="/departments",
    tags=["Departments"]
)


@router.get("")
def get_departments(
    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    departments = (
        db.query(Department)
        .order_by(
            Department.name
        )
        .all()
    )

    return departments