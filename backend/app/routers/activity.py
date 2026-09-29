from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.user import User
from app.models.employee import Employee
from app.models.activity_log import ActivityLog

from app.auth_dependencies import (
    require_admin
)


router = APIRouter(
    prefix="/admin/activity",
    tags=["Admin Activity"]
)


# ============================================================
# HELPER: USER DISPLAY INFORMATION
# ============================================================

def get_user_details(
    user_id: Optional[int],
    db: Session
):

    if user_id is None:

        return {
            "username": None,
            "role": None,
            "employee_id": None,
            "employee_code": None,
            "employee_name": None
        }


    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )


    if not user:

        return {
            "username": None,
            "role": None,
            "employee_id": None,
            "employee_code": None,
            "employee_name": None
        }


    employee = (
        db.query(Employee)
        .filter(
            Employee.user_id == user.id
        )
        .first()
    )


    return {

        "username":
            user.username,

        "role":
            user.role,

        "employee_id":
            employee.id
            if employee
            else None,

        "employee_code":
            employee.employee_code
            if employee
            else None,

        "employee_name":
            (
                f"{employee.first_name} "
                f"{employee.last_name or ''}"
            ).strip()
            if employee
            else None

    }


# ============================================================
# HELPER: SERIALIZE ACTIVITY
# ============================================================

def activity_to_dict(
    activity: ActivityLog,
    db: Session
):

    user_details = get_user_details(
        activity.user_id,
        db
    )


    return {

        "id":
            activity.id,

        "user_id":
            activity.user_id,

        "username":
            user_details[
                "username"
            ],

        "role":
            user_details[
                "role"
            ],

        "employee_id":
            user_details[
                "employee_id"
            ],

        "employee_code":
            user_details[
                "employee_code"
            ],

        "employee_name":
            user_details[
                "employee_name"
            ],

        "action":
            activity.action,

        "entity_type":
            activity.entity_type,

        "entity_id":
            activity.entity_id,

        "details":
            activity.details,

        "ip_address":
            activity.ip_address,

        "created_at":
            activity.created_at
    }


# ============================================================
# GET ALL ACTIVITY
# ============================================================

@router.get("")
def get_activity_logs(

    employee_id: Optional[int] = Query(
        default=None
    ),

    action: Optional[str] = Query(
        default=None
    ),

    entity_type: Optional[str] = Query(
        default=None
    ),

    limit: int = Query(
        default=100,
        ge=1,
        le=500
    ),

    db: Session = Depends(
        get_db
    ),

    admin_user: User = Depends(
        require_admin
    )
):

    query = db.query(
        ActivityLog
    )


    # ========================================================
    # FILTER BY EMPLOYEE
    # ========================================================

    if employee_id is not None:

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


        query = query.filter(
            ActivityLog.user_id
            == employee.user_id
        )


    # ========================================================
    # FILTER BY ACTION
    # ========================================================

    if action:

        query = query.filter(
            ActivityLog.action
            == action
        )


    # ========================================================
    # FILTER BY ENTITY TYPE
    # ========================================================

    if entity_type:

        query = query.filter(
            ActivityLog.entity_type
            == entity_type
        )


    # ========================================================
    # LATEST FIRST
    # ========================================================

    activities = (
        query
        .order_by(
            ActivityLog.created_at.desc(),
            ActivityLog.id.desc()
        )
        .limit(
            limit
        )
        .all()
    )


    return [

        activity_to_dict(
            activity,
            db
        )

        for activity
        in activities
    ]


# ============================================================
# GET SINGLE ACTIVITY
# ============================================================

@router.get("/{activity_id}")
def get_activity_log(

    activity_id: int,

    db: Session = Depends(
        get_db
    ),

    admin_user: User = Depends(
        require_admin
    )
):

    activity = (
        db.query(ActivityLog)
        .filter(
            ActivityLog.id
            == activity_id
        )
        .first()
    )


    if not activity:

        raise HTTPException(
            status_code=404,
            detail="Activity log not found"
        )


    return activity_to_dict(
        activity,
        db
    )