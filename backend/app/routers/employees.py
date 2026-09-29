from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.employee import Employee
from app.models.user import User
from app.models.department import Department

from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeStatusUpdate
)

from app.security import hash_password

from app.auth_dependencies import (
    get_current_user,
    require_admin
)


router = APIRouter(
    prefix="/employees",
    tags=["Employees"]
)


def employee_to_dict(
    employee: Employee,
    db: Session
):
    user = None

    if employee.user_id:
        user = (
            db.query(User)
            .filter(
                User.id == employee.user_id
            )
            .first()
        )

    department = None

    if employee.department_id:
        department = (
            db.query(Department)
            .filter(
                Department.id
                == employee.department_id
            )
            .first()
        )

    return {
        "id": employee.id,

        "user_id":
            employee.user_id,

        "username":
            user.username
            if user
            else None,

        "email":
            user.email
            if user
            else None,

        "employee_code":
            employee.employee_code,

        "first_name":
            employee.first_name,

        "last_name":
            employee.last_name,

        "phone":
            employee.phone,

        "designation":
            employee.designation,

        "department_id":
            employee.department_id,

        "department_name":
            department.name
            if department
            else None,

        "joining_date":
            employee.joining_date,

        "employment_status":
            employee.employment_status,

        "created_at":
            employee.created_at,

        "updated_at":
            employee.updated_at
    }


# ============================================================
# GET ALL EMPLOYEES
# Search + filters
# ============================================================

@router.get("")
def get_employees(
    q: Optional[str] = Query(
        default=None
    ),

    status: Optional[str] = Query(
        default=None
    ),

    department_id: Optional[int] = Query(
        default=None
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    )
):

    query = db.query(Employee)


    if q:

        search = f"%{q}%"

        query = query.outerjoin(
            User,
            Employee.user_id
            == User.id
        )

        query = query.filter(
            or_(
                Employee.employee_code.like(
                    search
                ),

                Employee.first_name.like(
                    search
                ),

                Employee.last_name.like(
                    search
                ),

                Employee.designation.like(
                    search
                ),

                User.username.like(
                    search
                ),

                User.email.like(
                    search
                )
            )
        )


    if status:

        query = query.filter(
            Employee.employment_status
            == status
        )


    if department_id:

        query = query.filter(
            Employee.department_id
            == department_id
        )


    employees = (
        query
        .order_by(
            Employee.id.desc()
        )
        .all()
    )


    return [
        employee_to_dict(
            employee,
            db
        )
        for employee in employees
    ]


# ============================================================
# GET SINGLE EMPLOYEE
# ============================================================

@router.get("/{employee_id}")
def get_employee(
    employee_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    employee = (
        db.query(Employee)
        .filter(
            Employee.id
            == employee_id
        )
        .first()
    )

    if not employee:

        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    return employee_to_dict(
        employee,
        db
    )


# ============================================================
# CREATE EMPLOYEE
# ============================================================

@router.post(
    "",
    status_code=201
)
def create_employee(
    employee_data: EmployeeCreate,

    db: Session = Depends(
        get_db
    ),

    admin_user: User = Depends(
        require_admin
    )
):

    existing_username = (
        db.query(User)
        .filter(
            User.username
            == employee_data.username
        )
        .first()
    )

    if existing_username:

        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )


    existing_email = (
        db.query(User)
        .filter(
            User.email
            == employee_data.email
        )
        .first()
    )

    if existing_email:

        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )


    existing_code = (
        db.query(Employee)
        .filter(
            Employee.employee_code
            == employee_data.employee_code
        )
        .first()
    )

    if existing_code:

        raise HTTPException(
            status_code=400,
            detail="Employee code already exists"
        )


    if employee_data.department_id:

        department = (
            db.query(Department)
            .filter(
                Department.id
                == employee_data.department_id
            )
            .first()
        )

        if not department:

            raise HTTPException(
                status_code=400,
                detail="Invalid department"
            )


    try:

        new_user = User(
            username=
                employee_data.username,

            email=
                employee_data.email,

            password_hash=
                hash_password(
                    employee_data.password
                ),

            role="employee",

            is_active=True
        )

        db.add(new_user)

        db.flush()


        new_employee = Employee(
            user_id=
                new_user.id,

            employee_code=
                employee_data.employee_code,

            first_name=
                employee_data.first_name,

            last_name=
                employee_data.last_name,

            phone=
                employee_data.phone,

            designation=
                employee_data.designation,

            department_id=
                employee_data.department_id,

            joining_date=
                employee_data.joining_date,

            employment_status=
                employee_data.employment_status
        )

        db.add(new_employee)

        db.commit()

        db.refresh(
            new_employee
        )


        return employee_to_dict(
            new_employee,
            db
        )


    except Exception:

        db.rollback()

        raise


# ============================================================
# UPDATE EMPLOYEE
# ============================================================

@router.put("/{employee_id}")
def update_employee(
    employee_id: int,

    employee_data: EmployeeUpdate,

    db: Session = Depends(
        get_db
    ),

    admin_user: User = Depends(
        require_admin
    )
):

    employee = (
        db.query(Employee)
        .filter(
            Employee.id
            == employee_id
        )
        .first()
    )

    if not employee:

        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )


    user = None

    if employee.user_id:

        user = (
            db.query(User)
            .filter(
                User.id
                == employee.user_id
            )
            .first()
        )


    update_data = (
        employee_data.model_dump(
            exclude_unset=True
        )
    )


    username = update_data.pop(
        "username",
        None
    )

    email = update_data.pop(
        "email",
        None
    )


    if username is not None:

        duplicate = (
            db.query(User)
            .filter(
                User.username
                == username,

                User.id
                != employee.user_id
            )
            .first()
        )

        if duplicate:

            raise HTTPException(
                status_code=400,
                detail="Username already exists"
            )

        if user:
            user.username = username


    if email is not None:

        duplicate = (
            db.query(User)
            .filter(
                User.email
                == email,

                User.id
                != employee.user_id
            )
            .first()
        )

        if duplicate:

            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

        if user:
            user.email = email


    if "employee_code" in update_data:

        duplicate = (
            db.query(Employee)
            .filter(
                Employee.employee_code
                == update_data[
                    "employee_code"
                ],

                Employee.id
                != employee_id
            )
            .first()
        )

        if duplicate:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Employee code "
                    "already exists"
                )
            )


    if (
        "department_id"
        in update_data
        and
        update_data[
            "department_id"
        ]
        is not None
    ):

        department = (
            db.query(Department)
            .filter(
                Department.id
                == update_data[
                    "department_id"
                ]
            )
            .first()
        )

        if not department:

            raise HTTPException(
                status_code=400,
                detail="Invalid department"
            )


    for field, value in (
        update_data.items()
    ):

        setattr(
            employee,
            field,
            value
        )


    if (
        "employment_status"
        in update_data
        and user
    ):

        user.is_active = (
            update_data[
                "employment_status"
            ]
            == "active"
        )


    try:

        db.commit()

        db.refresh(employee)

        return employee_to_dict(
            employee,
            db
        )


    except Exception:

        db.rollback()

        raise


# ============================================================
# UPDATE EMPLOYEE STATUS
# ============================================================

@router.patch(
    "/{employee_id}/status"
)
def update_employee_status(
    employee_id: int,

    status_data: EmployeeStatusUpdate,

    db: Session = Depends(
        get_db
    ),

    admin_user: User = Depends(
        require_admin
    )
):

    employee = (
        db.query(Employee)
        .filter(
            Employee.id
            == employee_id
        )
        .first()
    )

    if not employee:

        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )


    employee.employment_status = (
        status_data.employment_status
    )


    if employee.user_id:

        user = (
            db.query(User)
            .filter(
                User.id
                == employee.user_id
            )
            .first()
        )

        if user:

            user.is_active = (
                status_data.employment_status
                == "active"
            )


    try:

        db.commit()

        db.refresh(employee)

        return employee_to_dict(
            employee,
            db
        )


    except Exception:

        db.rollback()

        raise