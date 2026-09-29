from datetime import datetime
from typing import Literal, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from fastapi.encoders import jsonable_encoder

from pydantic import (
    BaseModel,
    Field
)

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db

from app.models.user import User
from app.models.employee import Employee
from app.models.project import Project
from app.models.task import Task
from app.models.task_history import TaskHistory
from app.models.activity_log import ActivityLog

from app.auth_dependencies import (
    get_current_user
)

from app.websocket_manager import manager


router = APIRouter(
    prefix="/employee-portal",
    tags=["Employee Portal"]
)


# ============================================================
# ALLOWED VALUES
# ============================================================

WorkType = Literal[
    "article",
    "code",
    "addition",
    "modification",
    "correction",
    "rewrite",
    "dataset",
    "reviewers_comments",
    "thesis",
    "ppt",
    "research",
    "other"
]


TaskPriority = Literal[
    "low",
    "medium",
    "high",
    "urgent"
]


TaskStatus = Literal[
    "received",
    "pending",
    "in_progress",
    "delivered",
    "revision",
    "completed",
    "cancelled"
]


# ============================================================
# EMPLOYEE TASK CREATE SCHEMA
# ============================================================

class EmployeeTaskCreate(BaseModel):

    project_id: Optional[int] = Field(
        default=None,
        gt=0
    )

    title: str = Field(
        min_length=1,
        max_length=255
    )

    description: Optional[str] = None

    work_type: WorkType = "other"

    priority: TaskPriority = "medium"

    status: TaskStatus = "received"

    progress_percentage: int = Field(
        default=0,
        ge=0,
        le=100
    )

    deadline: Optional[datetime] = None

    estimated_hours: Optional[float] = Field(
        default=None,
        ge=0
    )


# ============================================================
# EMPLOYEE TASK UPDATE SCHEMA
# ============================================================

class EmployeeTaskUpdate(BaseModel):

    project_id: Optional[int] = Field(
        default=None,
        gt=0
    )

    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=255
    )

    description: Optional[str] = None

    work_type: Optional[WorkType] = None

    priority: Optional[TaskPriority] = None

    status: Optional[TaskStatus] = None

    progress_percentage: Optional[int] = Field(
        default=None,
        ge=0,
        le=100
    )

    deadline: Optional[datetime] = None

    estimated_hours: Optional[float] = Field(
        default=None,
        ge=0
    )

    actual_hours: Optional[float] = Field(
        default=None,
        ge=0
    )


# ============================================================
# HELPER: LOGGED-IN EMPLOYEE
# ============================================================

def get_logged_in_employee(
    current_user: User,
    db: Session
):

    employee = (
        db.query(Employee)
        .filter(
            Employee.user_id
            == current_user.id
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
# HELPER: VALIDATE PROJECT
# ============================================================

def validate_project(
    project_id,
    db: Session
):

    if project_id is None:
        return None


    project = (
        db.query(Project)
        .filter(
            Project.id
            == project_id
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
# HELPER: TASK TO DICTIONARY
# Used for API/WebSocket payloads
# ============================================================

def task_to_dict(
    task: Task
):

    return {

        "id":
            task.id,

        "project_id":
            task.project_id,

        "assigned_to":
            task.assigned_to,

        "title":
            task.title,

        "description":
            task.description,

        "work_type":
            task.work_type,

        "priority":
            task.priority,

        "status":
            task.status,

        "progress_percentage":
            task.progress_percentage,

        "assigned_date":
            task.assigned_date,

        "start_date":
            task.start_date,

        "deadline":
            task.deadline,

        "completed_at":
            task.completed_at,

        "estimated_hours":
            (
                float(
                    task.estimated_hours
                )
                if task.estimated_hours
                is not None
                else None
            ),

        "actual_hours":
            (
                float(
                    task.actual_hours
                )
                if task.actual_hours
                is not None
                else None
            ),

        "revision_count":
            task.revision_count,

        "created_by":
            task.created_by,

        "created_at":
            task.created_at,

        "updated_at":
            task.updated_at
    }


# ============================================================
# EMPLOYEE DASHBOARD
# ============================================================

@router.get("/dashboard")
def employee_dashboard(

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


    tasks = (
        db.query(Task)
        .filter(
            Task.assigned_to
            == employee.id
        )
        .all()
    )


    def count_status(
        status_value
    ):

        return sum(
            1
            for task in tasks
            if task.status
            == status_value
        )


    return {

        "employee": {

            "id":
                employee.id,

            "employee_code":
                employee.employee_code,

            "first_name":
                employee.first_name,

            "last_name":
                employee.last_name,

            "designation":
                employee.designation
        },

        "task_counts": {

            "total":
                len(tasks),

            "received":
                count_status(
                    "received"
                ),

            "pending":
                count_status(
                    "pending"
                ),

            "in_progress":
                count_status(
                    "in_progress"
                ),

            "delivered":
                count_status(
                    "delivered"
                ),

            "revision":
                count_status(
                    "revision"
                ),

            "completed":
                count_status(
                    "completed"
                ),

            "cancelled":
                count_status(
                    "cancelled"
                )
        }
    }


# ============================================================
# GET MY TASKS
# ============================================================

@router.get("/my-tasks")
def get_my_tasks(

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


    tasks = (
        db.query(Task)
        .filter(
            Task.assigned_to
            == employee.id
        )
        .order_by(
            Task.id.desc()
        )
        .all()
    )


    return [
        task_to_dict(
            task
        )
        for task in tasks
    ]


# ============================================================
# GET ONE OF MY TASKS
# ============================================================

@router.get(
    "/my-tasks/{task_id}"
)
def get_my_task(

    task_id: int,

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


    task = (
        db.query(Task)
        .filter(
            Task.id == task_id,

            Task.assigned_to
            == employee.id
        )
        .first()
    )


    if not task:

        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )


    return task_to_dict(
        task
    )


# ============================================================
# CREATE MY OWN TASK
# ============================================================

@router.post(
    "/my-tasks",
    status_code=201
)
async def create_my_task(

    task_data: EmployeeTaskCreate,

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
    # Validate project
    # --------------------------------------------------------

    validate_project(
        task_data.project_id,
        db
    )


    # --------------------------------------------------------
    # Build new task
    #
    # IMPORTANT:
    # Employee ID and creator ID come from authenticated user.
    # They are never accepted from frontend.
    # --------------------------------------------------------

    try:

        progress = (
            task_data.progress_percentage
        )


        completed_at = None


        if (
            task_data.status
            == "completed"
        ):

            progress = 100

            completed_at = (
                datetime.now()
            )


        new_task = Task(

            project_id=
                task_data.project_id,

            assigned_to=
                employee.id,

            title=
                task_data.title,

            description=
                task_data.description,

            work_type=
                task_data.work_type,

            priority=
                task_data.priority,

            status=
                task_data.status,

            progress_percentage=
                progress,

            deadline=
                task_data.deadline,

            estimated_hours=
                task_data.estimated_hours,

            completed_at=
                completed_at,

            created_by=
                current_user.id
        )


        db.add(
            new_task
        )


        # Get task ID before activity log
        db.flush()


        # ----------------------------------------------------
        # ACTIVITY LOG
        # ----------------------------------------------------

        activity = ActivityLog(

            user_id=
                current_user.id,

            action=
                "task_created",

            entity_type=
                "task",

            entity_id=
                new_task.id,

            details=(
                f"Employee "
                f"{employee.employee_code} "
                f"created task "
                f"{new_task.id}: "
                f"{new_task.title}"
            )
        )


        db.add(
            activity
        )


        # ----------------------------------------------------
        # COMMIT TASK + ACTIVITY TOGETHER
        # ----------------------------------------------------

        db.commit()

        db.refresh(
            new_task
        )


    except Exception:

        db.rollback()

        raise


    # ========================================================
    # REAL-TIME WEBSOCKET EVENT
    # ========================================================

    websocket_task = (
        jsonable_encoder(
            task_to_dict(
                new_task
            )
        )
    )


    await manager.broadcast({

        "event":
            "task_created",

        "source":
            "employee",

        "task_id":
            new_task.id,

        "employee_id":
            employee.id,

        "employee_code":
            employee.employee_code,

        "project_id":
            new_task.project_id,

        "title":
            new_task.title,

        "work_type":
            new_task.work_type,

        "priority":
            new_task.priority,

        "status":
            new_task.status,

        "progress_percentage":
            new_task.progress_percentage,

        "task":
            websocket_task,

        "username":
            current_user.username
    })


    return task_to_dict(
        new_task
    )


# ============================================================
# UPDATE MY TASK
# ============================================================

@router.put(
    "/my-tasks/{task_id}"
)
async def update_my_task(

    task_id: int,

    task_update: EmployeeTaskUpdate,

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
    # Employee may only access tasks assigned to themselves
    # --------------------------------------------------------

    task = (
        db.query(Task)
        .filter(
            Task.id == task_id,

            Task.assigned_to
            == employee.id
        )
        .first()
    )


    if not task:

        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )


    # --------------------------------------------------------
    # Determine ownership
    #
    # created_by == logged-in user:
    # Employee created this task themselves.
    #
    # Otherwise:
    # Admin/manager created the task.
    # --------------------------------------------------------

    self_created = (
        task.created_by
        == current_user.id
    )


    update_data = (
        task_update.model_dump(
            exclude_unset=True
        )
    )


    # ========================================================
    # ADMIN-CREATED TASK RESTRICTION
    #
    # Employee can only update status and progress.
    # ========================================================

    if not self_created:

        allowed_fields = {
            "status",
            "progress_percentage"
        }


        forbidden_fields = [
            field
            for field in update_data
            if field
            not in allowed_fields
        ]


        if forbidden_fields:

            raise HTTPException(
                status_code=403,
                detail=(
                    "You may only update status and "
                    "progress for a task created by "
                    "an administrator."
                )
            )


    # --------------------------------------------------------
    # Validate project for self-created task
    # --------------------------------------------------------

    if (
        "project_id"
        in update_data
    ):

        validate_project(
            update_data[
                "project_id"
            ],
            db
        )


    if not update_data:

        raise HTTPException(
            status_code=400,
            detail="No task fields provided for update"
        )


    # ========================================================
    # COMPLETED TASK LOGIC
    # ========================================================

    requested_status = (
        update_data.get(
            "status",
            task.status
        )
    )


    if (
        requested_status
        == "completed"
    ):

        update_data[
            "progress_percentage"
        ] = 100


        if (
            task.completed_at
            is None
        ):

            update_data[
                "completed_at"
            ] = datetime.now()


    elif (
        "status"
        in update_data
        and task.status
        == "completed"
    ):

        update_data[
            "completed_at"
        ] = None


    # --------------------------------------------------------
    # Detect actual changes
    # --------------------------------------------------------

    changes = []


    for field, new_value in (
        update_data.items()
    ):

        if not hasattr(
            task,
            field
        ):

            continue


        old_value = getattr(
            task,
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


    # Nothing changed
    if not changes:

        return task_to_dict(
            task
        )


    # ========================================================
    # SAVE TASK + HISTORY + ACTIVITY
    # ========================================================

    try:

        # ----------------------------------------------------
        # TASK HISTORY
        # ----------------------------------------------------

        for change in changes:

            history = TaskHistory(

                task_id=
                    task.id,

                changed_by=
                    current_user.id,

                field_name=
                    change[
                        "field"
                    ],

                old_value=
                    (
                        None
                        if change["old"]
                        is None
                        else str(
                            change["old"]
                        )
                    ),

                new_value=
                    (
                        None
                        if change["new"]
                        is None
                        else str(
                            change["new"]
                        )
                    )
            )


            db.add(
                history
            )


        # ----------------------------------------------------
        # APPLY CHANGES
        # ----------------------------------------------------

        for field, value in (
            update_data.items()
        ):

            if hasattr(
                task,
                field
            ):

                setattr(
                    task,
                    field,
                    value
                )


        # ----------------------------------------------------
        # ACTIVITY LOG
        # ----------------------------------------------------

        changed_fields = ", ".join(
            change["field"]
            for change in changes
        )


        activity = ActivityLog(

            user_id=
                current_user.id,

            action=
                "task_updated",

            entity_type=
                "task",

            entity_id=
                task.id,

            details=(
                f"Employee "
                f"{employee.employee_code} "
                f"updated task "
                f"{task.id}. "
                f"Changed fields: "
                f"{changed_fields}"
            )
        )


        db.add(
            activity
        )


        # ----------------------------------------------------
        # COMMIT EVERYTHING TOGETHER
        # ----------------------------------------------------

        db.commit()

        db.refresh(
            task
        )


    except Exception:

        db.rollback()

        raise


    # ========================================================
    # REAL-TIME WEBSOCKET EVENT
    # ========================================================

    websocket_task = (
        jsonable_encoder(
            task_to_dict(
                task
            )
        )
    )


    websocket_changes = (
        jsonable_encoder([

            {

                "field":
                    change["field"],

                "old":
                    (
                        None
                        if change["old"]
                        is None
                        else str(
                            change["old"]
                        )
                    ),

                "new":
                    (
                        None
                        if change["new"]
                        is None
                        else str(
                            change["new"]
                        )
                    )

            }

            for change in changes
        ])
    )


    await manager.broadcast({

        "event":
            "task_updated",

        "source":
            "employee",

        "task_id":
            task.id,

        "employee_id":
            employee.id,

        "employee_code":
            employee.employee_code,

        "project_id":
            task.project_id,

        "title":
            task.title,

        "work_type":
            task.work_type,

        "priority":
            task.priority,

        "status":
            task.status,

        "progress_percentage":
            task.progress_percentage,

        "changes":
            websocket_changes,

        "task":
            websocket_task,

        "username":
            current_user.username
    })


    return task_to_dict(
        task
    )


# ============================================================
# DELETE MY SELF-CREATED TASK
# ============================================================

@router.delete(
    "/my-tasks/{task_id}"
)
async def delete_my_task(

    task_id: int,

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
    # Task must belong to employee
    # --------------------------------------------------------

    task = (
        db.query(Task)
        .filter(
            Task.id == task_id,

            Task.assigned_to
            == employee.id
        )
        .first()
    )


    if not task:

        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )


    # --------------------------------------------------------
    # Employee cannot delete admin-created tasks
    # --------------------------------------------------------

    if (
        task.created_by
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You cannot delete a task created "
                "by an administrator. "
                "You may update its status or progress."
            )
        )


    # --------------------------------------------------------
    # Save values before deletion
    # --------------------------------------------------------

    deleted_task = {

        "id":
            task.id,

        "employee_id":
            task.assigned_to,

        "project_id":
            task.project_id,

        "title":
            task.title,

        "status":
            task.status
    }


    try:

        # ----------------------------------------------------
        # Remove task history first
        # ----------------------------------------------------

        (
            db.query(TaskHistory)
            .filter(
                TaskHistory.task_id
                == task.id
            )
            .delete(
                synchronize_session=False
            )
        )


        # ----------------------------------------------------
        # Delete task
        # ----------------------------------------------------

        db.delete(
            task
        )

        db.flush()


        # ----------------------------------------------------
        # Preserve audit activity
        # ----------------------------------------------------

        activity = ActivityLog(

            user_id=
                current_user.id,

            action=
                "task_deleted",

            entity_type=
                "task",

            entity_id=
                task_id,

            details=(
                f"Employee "
                f"{employee.employee_code} "
                f"deleted self-created task "
                f"{task_id}: "
                f"{deleted_task['title']}"
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
                "This task cannot be deleted because "
                "a Daily Work record or another record "
                "still references it. "
                "Delete or unlink the related record first, "
                "or set the task status to Cancelled."
            )
        )


    except Exception:

        db.rollback()

        raise


    # ========================================================
    # REAL-TIME WEBSOCKET EVENT
    # ========================================================

    await manager.broadcast({

        "event":
            "task_deleted",

        "source":
            "employee",

        "task_id":
            task_id,

        "employee_id":
            employee.id,

        "employee_code":
            employee.employee_code,

        "project_id":
            deleted_task[
                "project_id"
            ],

        "title":
            deleted_task[
                "title"
            ],

        "username":
            current_user.username
    })


    return {

        "message":
            "Task deleted successfully",

        "task_id":
            task_id
    }