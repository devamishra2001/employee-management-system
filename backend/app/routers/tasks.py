from typing import List

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from fastapi.encoders import jsonable_encoder

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db

from app.models.task import Task
from app.models.employee import Employee
from app.models.project import Project
from app.models.user import User
from app.models.task_history import TaskHistory
from app.models.activity_log import ActivityLog

from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse
)

from app.auth_dependencies import (
    require_admin
)

from app.websocket_manager import manager


router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"]
)


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
            Project.id == project_id
        )
        .first()
    )

    if not project:

        raise HTTPException(
            status_code=400,
            detail="Invalid project_id"
        )

    return project


# ============================================================
# HELPER: VALIDATE EMPLOYEE
# ============================================================

def validate_employee(
    employee_id,
    db: Session
):

    if employee_id is None:

        raise HTTPException(
            status_code=400,
            detail="assigned_to employee ID is required"
        )

    employee = (
        db.query(Employee)
        .filter(
            Employee.id == employee_id
        )
        .first()
    )

    if not employee:

        raise HTTPException(
            status_code=400,
            detail="Invalid assigned_to employee ID"
        )

    return employee


# ============================================================
# HELPER: TASK DICTIONARY FOR WEBSOCKET
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
                float(task.estimated_hours)
                if task.estimated_hours is not None
                else None
            ),

        "actual_hours":
            (
                float(task.actual_hours)
                if task.actual_hours is not None
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
# GET ALL TASKS
# ADMIN / MANAGER
# ============================================================

@router.get(
    "",
    response_model=List[TaskResponse]
)
def get_tasks(
    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_admin
    )
):

    tasks = (
        db.query(Task)
        .order_by(
            Task.id.desc()
        )
        .all()
    )

    return tasks


# ============================================================
# GET SINGLE TASK
# ADMIN / MANAGER
# ============================================================

@router.get(
    "/{task_id}",
    response_model=TaskResponse
)
def get_task(
    task_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_admin
    )
):

    task = (
        db.query(Task)
        .filter(
            Task.id == task_id
        )
        .first()
    )

    if not task:

        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    return task


# ============================================================
# CREATE TASK
# ADMIN / MANAGER
# ============================================================

@router.post(
    "",
    response_model=TaskResponse,
    status_code=201
)
async def create_task(
    task: TaskCreate,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_admin
    )
):

    # --------------------------------------------------------
    # Convert Pydantic model to dictionary
    # --------------------------------------------------------

    task_data = task.model_dump()


    # --------------------------------------------------------
    # Never trust created_by from frontend
    # Logged-in admin/manager becomes creator
    # --------------------------------------------------------

    task_data["created_by"] = (
        current_user.id
    )


    # --------------------------------------------------------
    # Validate project
    # --------------------------------------------------------

    validate_project(
        task_data.get(
            "project_id"
        ),
        db
    )


    # --------------------------------------------------------
    # Validate assigned employee
    # --------------------------------------------------------

    employee = validate_employee(
        task_data.get(
            "assigned_to"
        ),
        db
    )


    # --------------------------------------------------------
    # Create task
    # --------------------------------------------------------

    try:

        new_task = Task(
            **task_data
        )

        db.add(
            new_task
        )

        # Obtain ID before creating activity log
        db.flush()


        # ----------------------------------------------------
        # Activity log
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
                f"Task {new_task.id} created: "
                f"{new_task.title}. "
                f"Assigned to employee "
                f"{employee.employee_code}."
            )
        )

        db.add(
            activity
        )


        # ----------------------------------------------------
        # Commit task + activity together
        # ----------------------------------------------------

        db.commit()

        db.refresh(
            new_task
        )


    except Exception:

        db.rollback()

        raise


    # ========================================================
    # REAL-TIME BROADCAST
    # ========================================================

    websocket_task = jsonable_encoder(
        task_to_dict(
            new_task
        )
    )


    await manager.broadcast({

        "event":
            "task_created",

        "task_id":
            new_task.id,

        "employee_id":
            new_task.assigned_to,

        "project_id":
            new_task.project_id,

        "title":
            new_task.title,

        "status":
            new_task.status,

        "progress_percentage":
            new_task.progress_percentage,

        "task":
            websocket_task,

        "username":
            current_user.username
    })


    return new_task


# ============================================================
# UPDATE TASK
# ADMIN / MANAGER
# ============================================================

@router.put(
    "/{task_id}",
    response_model=TaskResponse
)
async def update_task(
    task_id: int,

    task_update: TaskUpdate,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_admin
    )
):

    # --------------------------------------------------------
    # Find task
    # --------------------------------------------------------

    task = (
        db.query(Task)
        .filter(
            Task.id == task_id
        )
        .first()
    )


    if not task:

        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )


    # --------------------------------------------------------
    # Only fields actually sent
    # --------------------------------------------------------

    update_data = (
        task_update.model_dump(
            exclude_unset=True
        )
    )


    # --------------------------------------------------------
    # Ignore changed_by supplied by frontend
    # Logged-in user is always authoritative
    # --------------------------------------------------------

    update_data.pop(
        "changed_by",
        None
    )


    # --------------------------------------------------------
    # Prevent frontend from changing creator
    # --------------------------------------------------------

    update_data.pop(
        "created_by",
        None
    )


    if not update_data:

        raise HTTPException(
            status_code=400,
            detail="No task fields provided for update"
        )


    # --------------------------------------------------------
    # Validate project if changed
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


    # --------------------------------------------------------
    # Validate employee if changed
    # --------------------------------------------------------

    if (
        "assigned_to"
        in update_data
    ):

        validate_employee(
            update_data[
                "assigned_to"
            ],
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


    # --------------------------------------------------------
    # Nothing changed
    # --------------------------------------------------------

    if not changes:

        return task


    # --------------------------------------------------------
    # Apply changes
    # --------------------------------------------------------

    try:

        # ----------------------------------------------------
        # Store one history row per changed field
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
                        if change["old"] is None
                        else str(
                            change["old"]
                        )
                    ),

                new_value=
                    (
                        None
                        if change["new"] is None
                        else str(
                            change["new"]
                        )
                    )
            )

            db.add(
                history
            )


        # ----------------------------------------------------
        # Apply task values
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
        # Activity log
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
                f"Task {task.id} updated. "
                f"Changed fields: "
                f"{changed_fields}"
            )
        )


        db.add(
            activity
        )


        # ----------------------------------------------------
        # Commit history + task + activity
        # ----------------------------------------------------

        db.commit()

        db.refresh(
            task
        )


    except Exception:

        db.rollback()

        raise


    # ========================================================
    # REAL-TIME WEBSOCKET BROADCAST
    # ========================================================

    websocket_task = jsonable_encoder(
        task_to_dict(
            task
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
            "task_updated",

        "task_id":
            task.id,

        "employee_id":
            task.assigned_to,

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


    return task


# ============================================================
# DELETE TASK
# ADMIN / MANAGER
# ============================================================

@router.delete(
    "/{task_id}"
)
async def delete_task(
    task_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_admin
    )
):

    task = (
        db.query(Task)
        .filter(
            Task.id == task_id
        )
        .first()
    )


    if not task:

        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )


    # Store information before deletion

    deleted_task = {

        "id":
            task.id,

        "project_id":
            task.project_id,

        "employee_id":
            task.assigned_to,

        "title":
            task.title,

        "status":
            task.status
    }


    try:

        # ----------------------------------------------------
        # Task history references task_id.
        # Delete history first.
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
        # Keep audit record
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
                f"Task {task_id} deleted: "
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
                "other records still reference it. "
                "Cancel the task instead of deleting it."
            )
        )


    except Exception:

        db.rollback()

        raise


    # ========================================================
    # REAL-TIME WEBSOCKET BROADCAST
    # ========================================================

    await manager.broadcast({

        "event":
            "task_deleted",

        "task_id":
            task_id,

        "employee_id":
            deleted_task[
                "employee_id"
            ],

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