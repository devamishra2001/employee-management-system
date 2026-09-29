from datetime import date
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
from app.models.work_record import WorkRecord
from app.models.task import Task
from app.models.project import Project

from app.auth_dependencies import (
    require_admin
)


router = APIRouter(
    prefix="/admin/work-records",
    tags=["Admin Work Records"]
)


# ============================================================
# HELPER
# ============================================================

def record_to_dict(
    record: WorkRecord,
    db: Session
):

    employee = (
        db.query(Employee)
        .filter(
            Employee.id
            == record.employee_id
        )
        .first()
    )

    task = None

    if record.task_id:

        task = (
            db.query(Task)
            .filter(
                Task.id
                == record.task_id
            )
            .first()
        )

    project = None

    if record.project_id:

        project = (
            db.query(Project)
            .filter(
                Project.id
                == record.project_id
            )
            .first()
        )


    return {

        "id":
            record.id,

        "employee_id":
            record.employee_id,

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
            else None,

        "task_id":
            record.task_id,

        "task_title":
            task.title
            if task
            else None,

        "project_id":
            record.project_id,

        "project_code":
            project.project_code
            if project
            else None,

        "work_date":
            record.work_date,

        "work_type":
            record.work_type,

        "title":
            record.title,

        "description":
            record.description,

        "hours_spent":
            (
                float(
                    record.hours_spent
                )
                if record.hours_spent
                is not None
                else None
            ),

        "status":
            record.status,

        "progress_percentage":
            record.progress_percentage,

        "remarks":
            record.remarks,

        "created_at":
            record.created_at,

        "updated_at":
            record.updated_at
    }


# ============================================================
# GET ALL WORK RECORDS
# ============================================================

@router.get("")
def get_all_work_records(

    employee_id: Optional[int] = Query(
        default=None
    ),

    work_date: Optional[date] = Query(
        default=None
    ),

    status: Optional[str] = Query(
        default=None
    ),

    task_id: Optional[int] = Query(
        default=None
    ),

    db: Session = Depends(
        get_db
    ),

    admin_user: User = Depends(
        require_admin
    )
):

    query = db.query(
        WorkRecord
    )


    if employee_id:

        query = query.filter(
            WorkRecord.employee_id
            == employee_id
        )


    if work_date:

        query = query.filter(
            WorkRecord.work_date
            == work_date
        )


    if status:

        query = query.filter(
            WorkRecord.status
            == status
        )


    if task_id:

        query = query.filter(
            WorkRecord.task_id
            == task_id
        )


    records = (
        query
        .order_by(
            WorkRecord.work_date.desc(),
            WorkRecord.id.desc()
        )
        .all()
    )


    return [
        record_to_dict(
            record,
            db
        )
        for record in records
    ]


# ============================================================
# GET SINGLE WORK RECORD
# ============================================================

@router.get("/{record_id}")
def get_admin_work_record(
    record_id: int,

    db: Session = Depends(
        get_db
    ),

    admin_user: User = Depends(
        require_admin
    )
):

    record = (
        db.query(WorkRecord)
        .filter(
            WorkRecord.id
            == record_id
        )
        .first()
    )


    if not record:

        raise HTTPException(
            status_code=404,
            detail="Work record not found"
        )


    return record_to_dict(
        record,
        db
    )