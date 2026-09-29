from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.user import User
from app.models.employee import Employee

from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    CurrentUserResponse
)

from app.security import (
    verify_password,
    create_access_token
)

from app.auth_dependencies import (
    get_current_user
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/login",
    response_model=LoginResponse
)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(
            User.username
            == login_data.username
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not verify_password(
        login_data.password,
        user.password_hash
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not user.is_active:

        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    employee = (
        db.query(Employee)
        .filter(
            Employee.user_id
            == user.id
        )
        .first()
    )

    employee_id = (
        employee.id
        if employee
        else None
    )

    token = create_access_token(
        {
            "user_id": user.id,
            "username": user.username,
            "role": user.role
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "employee_id": employee_id
    }


@router.get(
    "/me",
    response_model=CurrentUserResponse
)
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db)
):

    employee = (
        db.query(Employee)
        .filter(
            Employee.user_id
            == current_user.id
        )
        .first()
    )

    return {
        "user_id":
            current_user.id,

        "username":
            current_user.username,

        "email":
            current_user.email,

        "role":
            current_user.role,

        "employee_id":
            employee.id
            if employee
            else None
    }