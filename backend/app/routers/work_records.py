from datetime import date
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)

from fastapi.encoders import jsonable_encoder

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db

from app.models.user import User
from app.models.employee import Employee
from app.models.task import Task
from app.models.project import Project
from app.models.work_record import WorkRecord
from app.models.activity_log import ActivityLog

from app.schemas.work_record import (
    WorkRecordCreate,
    WorkRecordUpdate,
    WorkRecordResponse
)

from app.auth_dependencies import (
    get_current_user
)

from app.websocket_manager import manager


router = APIRouter(
    prefix="/work-records",
    tags=["Work Records"]
)


# ============================================================
# HELPER: GET LOGGED-IN EMPLOYEE
# ============================================================

def get_logged_in_employee(
    current_user: User,
    db: Session
):

    employee = (
        db.query(Employee)
        .filter(
            Employee.user_id == current_user.id
        )
        .first()
    )

    if not employee:

        raise HTTPException(
            status_code=404,
            detail="Employee profile not found"
        )

    if (
        employee.employment_status
        != "active"
    ):

        raise HTTPException(
            status_code=403,
            detail="Employee account is not active"
        )

    return employee


# ============================================================
# HELPER: VALIDATE EMPLOYEE TASK
# ============================================================

def validate_employee_task(
    task_id: Optional[int],
    employee: Employee,
    db: Session
):

    if task_id is None:
        return None

    task = (
        db.query(Task)
        .filter(
            Task.id == task_id,
            Task.assigned_to == employee.id
        )
        .first()
    )

    if not task:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid task ID or the task "
                "is not assigned to you"
            )
        )

    return task


# ============================================================
# HELPER: VALIDATE PROJECT
# ============================================================

def validate_project(
    project_id: Optional[int],
    db: Session
):

    if project_id is None:
        return None

    project = (
        db.query(Project)
        .filter(
            Project.id == project_id
        )
        .first()
    )

    if not project:

        raise HTTPException(
            status_code=400,
            detail="Invalid project ID"
        )

    return project


# ============================================================
# HELPER: WORK RECORD DICTIONARY
# ============================================================

def work_record_to_dict(
    record: WorkRecord
):

    return {

        "id":
            record.id,

        "employee_id":
            record.employee_id,

        "task_id":
            record.task_id,

        "project_id":
            record.project_id,

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
                float(record.hours_spent)
                if record.hours_spent is not None
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
# GET MY WORK RECORDS
# ============================================================

@router.get(
    "/my",
    response_model=list[WorkRecordResponse]
)
def get_my_work_records(

    work_date: Optional[date] = Query(
        default=None
    ),

    task_id: Optional[int] = Query(
        default=None
    ),

    status: Optional[str] = Query(
        default=None
    ),

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    employee = get_logged_in_employee(
        current_user,
        db
    )

    query = (
        db.query(WorkRecord)
        .filter(
            WorkRecord.employee_id
            == employee.id
        )
    )

    if work_date is not None:

        query = query.filter(
            WorkRecord.work_date
            == work_date
        )

    if task_id is not None:

        query = query.filter(
            WorkRecord.task_id
            == task_id
        )

    if status:

        query = query.filter(
            WorkRecord.status
            == status
        )

    records = (
        query
        .order_by(
            WorkRecord.work_date.desc(),
            WorkRecord.id.desc()
        )
        .all()
    )

    return records


# ============================================================
# GET ONE MY WORK RECORD
# ============================================================

@router.get(
    "/my/{record_id}",
    response_model=WorkRecordResponse
)
def get_my_work_record(

    record_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    employee = get_logged_in_employee(
        current_user,
        db
    )

    record = (
        db.query(WorkRecord)
        .filter(
            WorkRecord.id == record_id,
            WorkRecord.employee_id == employee.id
        )
        .first()
    )

    if not record:

        raise HTTPException(
            status_code=404,
            detail="Work record not found"
        )

    return record


# ============================================================
# CREATE MY WORK RECORD
# ============================================================

@router.post(
    "/my",
    response_model=WorkRecordResponse,
    status_code=201
)
async def create_my_work_record(

    record_data: WorkRecordCreate,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    employee = get_logged_in_employee(
        current_user,
        db
    )

    # --------------------------------------------------------
    # Validate linked task
    # --------------------------------------------------------

    task = validate_employee_task(
        record_data.task_id,
        employee,
        db
    )

    # --------------------------------------------------------
    # Determine project
    # --------------------------------------------------------

    project_id = (
        record_data.project_id
    )

    if (
        task is not None
        and project_id is None
    ):

        project_id = (
            task.project_id
        )

    # --------------------------------------------------------
    # If both task and project are supplied,
    # make sure they are consistent
    # --------------------------------------------------------

    if (
        task is not None
        and task.project_id is not None
        and project_id is not None
        and task.project_id != project_id
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Selected project does not match "
                "the selected task"
            )
        )

    validate_project(
        project_id,
        db
    )

    # --------------------------------------------------------
    # Create record
    # --------------------------------------------------------

    try:

        new_record = WorkRecord(

            employee_id=
                employee.id,

            task_id=
                record_data.task_id,

            project_id=
                project_id,

            work_date=
                record_data.work_date,

            work_type=
                record_data.work_type,

            title=
                record_data.title,

            description=
                record_data.description,

            hours_spent=
                record_data.hours_spent,

            status=
                record_data.status,

            progress_percentage=
                record_data.progress_percentage,

            remarks=
                record_data.remarks
        )

        db.add(
            new_record
        )

        # Get ID before logging activity
        db.flush()

        # ----------------------------------------------------
        # Activity log
        # ----------------------------------------------------

        activity = ActivityLog(

            user_id=
                current_user.id,

            action=
                "work_record_created",

            entity_type=
                "work_record",

            entity_id=
                new_record.id,

            details=(
                f"Employee "
                f"{employee.employee_code} "
                f"created work record "
                f"{new_record.id}: "
                f"{new_record.title}"
            )
        )

        db.add(
            activity
        )

        # ----------------------------------------------------
        # Commit work record + activity together
        # ----------------------------------------------------

        db.commit()

        db.refresh(
            new_record
        )

    except Exception:

        db.rollback()

        raise

    # ========================================================
    # REAL-TIME WEBSOCKET
    # ========================================================

    websocket_record = jsonable_encoder(
        work_record_to_dict(
            new_record
        )
    )

    await manager.broadcast({

        "event":
            "work_record_created",

        "source":
            "employee",

        "record_id":
            new_record.id,

        "employee_id":
            employee.id,

        "employee_code":
            employee.employee_code,

        "task_id":
            new_record.task_id,

        "project_id":
            new_record.project_id,

        "work_date":
            str(
                new_record.work_date
            ),

        "title":
            new_record.title,

        "work_type":
            new_record.work_type,

        "hours_spent":
            (
                float(
                    new_record.hours_spent
                )
                if new_record.hours_spent
                is not None
                else None
            ),

        "status":
            new_record.status,

        "progress_percentage":
            new_record.progress_percentage,

        "record":
            websocket_record,

        "username":
            current_user.username
    })

    return new_record


# ============================================================
# UPDATE MY WORK RECORD
# ============================================================

@router.put(
    "/my/{record_id}",
    response_model=WorkRecordResponse
)
async def update_my_work_record(

    record_id: int,

    record_data: WorkRecordUpdate,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    employee = get_logged_in_employee(
        current_user,
        db
    )

    # --------------------------------------------------------
    # Find own record only
    # --------------------------------------------------------

    record = (
        db.query(WorkRecord)
        .filter(
            WorkRecord.id == record_id,
            WorkRecord.employee_id == employee.id
        )
        .first()
    )

    if not record:

        raise HTTPException(
            status_code=404,
            detail="Work record not found"
        )

    update_data = (
        record_data.model_dump(
            exclude_unset=True
        )
    )

    if not update_data:

        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )

    # --------------------------------------------------------
    # Resolve effective task ID
    # --------------------------------------------------------

    effective_task_id = (
        update_data["task_id"]
        if "task_id" in update_data
        else record.task_id
    )

    effective_task = validate_employee_task(
        effective_task_id,
        employee,
        db
    )

    # --------------------------------------------------------
    # Resolve effective project ID
    # --------------------------------------------------------

    effective_project_id = (
        update_data["project_id"]
        if "project_id" in update_data
        else record.project_id
    )

    # If task changed and project was not explicitly changed,
    # automatically follow the task's project
    if (
        "task_id" in update_data
        and "project_id" not in update_data
    ):

        effective_project_id = (
            effective_task.project_id
            if effective_task is not None
            else None
        )

        update_data[
            "project_id"
        ] = effective_project_id

    # --------------------------------------------------------
    # Check task/project consistency
    # --------------------------------------------------------

    if (
        effective_task is not None
        and effective_task.project_id is not None
        and effective_project_id is not None
        and effective_task.project_id
        != effective_project_id
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Selected project does not match "
                "the selected task"
            )
        )

    validate_project(
        effective_project_id,
        db
    )

    # --------------------------------------------------------
    # Detect actual changes
    # --------------------------------------------------------

    changes = []

    for field, new_value in (
        update_data.items()
    ):

        if not hasattr(
            record,
            field
        ):

            continue

        old_value = getattr(
            record,
            field
        )

        if old_value != new_value:

            changes.append({

                "field":
                    field,

                "old":
                    old_value,

                "new":
                    new_value
            })

    if not changes:

        return record

    # --------------------------------------------------------
    # Apply update
    # --------------------------------------------------------

    try:

        for field, value in (
            update_data.items()
        ):

            if hasattr(
                record,
                field
            ):

                setattr(
                    record,
                    field,
                    value
                )

        changed_fields = ", ".join(
            change["field"]
            for change in changes
        )

        # ----------------------------------------------------
        # Activity log
        # ----------------------------------------------------

        activity = ActivityLog(

            user_id=
                current_user.id,

            action=
                "work_record_updated",

            entity_type=
                "work_record",

            entity_id=
                record.id,

            details=(
                f"Employee "
                f"{employee.employee_code} "
                f"updated work record "
                f"{record.id}. "
                f"Changed fields: "
                f"{changed_fields}"
            )
        )

        db.add(
            activity
        )

        # ----------------------------------------------------
        # Commit record + activity together
        # ----------------------------------------------------

        db.commit()

        db.refresh(
            record
        )

    except Exception:

        db.rollback()

        raise

    # ========================================================
    # REAL-TIME WEBSOCKET
    # ========================================================

    websocket_record = jsonable_encoder(
        work_record_to_dict(
            record
        )
    )

    websocket_changes = jsonable_encoder([

        {

            "field":
                change["field"],

            "old":
                (
                    None
                    if change["old"] is None
                    else str(
                        change["old"]
                    )
                ),

            "new":
                (
                    None
                    if change["new"] is None
                    else str(
                        change["new"]
                    )
                )
        }

        for change in changes
    ])

    await manager.broadcast({

        "event":
            "work_record_updated",

        "source":
            "employee",

        "record_id":
            record.id,

        "employee_id":
            employee.id,

        "employee_code":
            employee.employee_code,

        "task_id":
            record.task_id,

        "project_id":
            record.project_id,

        "work_date":
            str(
                record.work_date
            ),

        "title":
            record.title,

        "work_type":
            record.work_type,

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

        "changes":
            websocket_changes,

        "record":
            websocket_record,

        "username":
            current_user.username
    })

    return record


# ============================================================
# DELETE MY WORK RECORD
# ============================================================

@router.delete(
    "/my/{record_id}"
)
async def delete_my_work_record(

    record_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    )
):

    employee = get_logged_in_employee(
        current_user,
        db
    )

    # --------------------------------------------------------
    # Employee can delete only own record
    # --------------------------------------------------------

    record = (
        db.query(WorkRecord)
        .filter(
            WorkRecord.id == record_id,
            WorkRecord.employee_id == employee.id
        )
        .first()
    )

    if not record:

        raise HTTPException(
            status_code=404,
            detail="Work record not found"
        )

    # --------------------------------------------------------
    # Preserve values for audit/WebSocket
    # --------------------------------------------------------

    deleted_record = {

        "id":
            record.id,

        "employee_id":
            record.employee_id,

        "task_id":
            record.task_id,

        "project_id":
            record.project_id,

        "work_date":
            str(
                record.work_date
            ),

        "work_type":
            record.work_type,

        "title":
            record.title,

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
            record.progress_percentage
    }

    try:

        # ----------------------------------------------------
        # Delete record
        # ----------------------------------------------------

        db.delete(
            record
        )

        db.flush()

        # ----------------------------------------------------
        # Preserve activity log
        # ----------------------------------------------------

        activity = ActivityLog(

            user_id=
                current_user.id,

            action=
                "work_record_deleted",

            entity_type=
                "work_record",

            entity_id=
                record_id,

            details=(
                f"Employee "
                f"{employee.employee_code} "
                f"deleted work record "
                f"{record_id}: "
                f"{deleted_record['title']}"
            )
        )

        db.add(
            activity
        )

        db.commit()

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "This work record cannot be deleted "
                "because another record still references it."
            )
        )

    except Exception:

        db.rollback()

        raise

    # ========================================================
    # REAL-TIME WEBSOCKET
    # ========================================================

    await manager.broadcast({

        "event":
            "work_record_deleted",

        "source":
            "employee",

        "record_id":
            record_id,

        "employee_id":
            employee.id,

        "employee_code":
            employee.employee_code,

        "task_id":
            deleted_record[
                "task_id"
            ],

        "project_id":
            deleted_record[
                "project_id"
            ],

        "work_date":
            deleted_record[
                "work_date"
            ],

        "title":
            deleted_record[
                "title"
            ],

        "work_type":
            deleted_record[
                "work_type"
            ],

        "hours_spent":
            deleted_record[
                "hours_spent"
            ],

        "status":
            deleted_record[
                "status"
            ],

        "progress_percentage":
            deleted_record[
                "progress_percentage"
            ],

        "username":
            current_user.username
    })

    return {

        "message":
            "Work record deleted successfully",

        "record_id":
            record_id
    }