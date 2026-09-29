from datetime import date, timedelta

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.user import User
from app.models.employee import Employee
from app.models.task import Task
from app.models.work_record import WorkRecord

from app.auth_dependencies import (
    get_current_user
)


router = APIRouter(
    prefix="/employee-performance",
    tags=["Employee Performance"]
)


# ============================================================
# GET LOGGED-IN EMPLOYEE
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
# MY PERFORMANCE
# ============================================================

@router.get("/my")
def get_my_performance(
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


    today = date.today()


    # ========================================================
    # ALL EMPLOYEE TASKS
    # ========================================================

    tasks = (
        db.query(Task)
        .filter(
            Task.assigned_to
            == employee.id
        )
        .all()
    )


    total_tasks = len(tasks)


    completed_tasks = sum(
        1
        for task in tasks
        if task.status
        == "completed"
    )


    in_progress_tasks = sum(
        1
        for task in tasks
        if task.status
        == "in_progress"
    )


    pending_tasks = sum(
        1
        for task in tasks
        if task.status
        == "pending"
    )


    delivered_tasks = sum(
        1
        for task in tasks
        if task.status
        == "delivered"
    )


    # ========================================================
    # AVERAGE TASK PROGRESS
    # ========================================================

    if tasks:

        total_progress = sum(
            int(
                task.progress_percentage
                or 0
            )
            for task in tasks
        )


        average_progress = (
            total_progress
            / len(tasks)
        )

    else:

        average_progress = 0


    average_progress = round(
        average_progress,
        2
    )


    # ========================================================
    # TODAY'S WORK RECORDS
    # ========================================================

    today_records = (
        db.query(WorkRecord)
        .filter(
            WorkRecord.employee_id
            == employee.id,

            WorkRecord.work_date
            == today
        )
        .all()
    )


    today_entries = len(
        today_records
    )


    today_hours = sum(
        float(
            record.hours_spent
            or 0
        )
        for record
        in today_records
    )


    today_hours = round(
        today_hours,
        2
    )


    # ========================================================
    # TODAY'S COMPLETED WORK ENTRIES
    # ========================================================

    today_completed_entries = sum(
        1
        for record
        in today_records
        if record.status
        == "completed"
    )


    # ========================================================
    # LAST 7 DAYS
    # ========================================================

    seven_day_data = []


    for days_ago in range(
        6,
        -1,
        -1
    ):

        current_date = (
            today
            - timedelta(
                days=days_ago
            )
        )


        day_records = (
            db.query(WorkRecord)
            .filter(
                WorkRecord.employee_id
                == employee.id,

                WorkRecord.work_date
                == current_date
            )
            .all()
        )


        day_hours = sum(
            float(
                record.hours_spent
                or 0
            )
            for record
            in day_records
        )


        seven_day_data.append({

            "date":
                str(
                    current_date
                ),

            "day":
                current_date.strftime(
                    "%a"
                ),

            "hours":
                round(
                    day_hours,
                    2
                ),

            "entries":
                len(
                    day_records
                )
        })


    # ========================================================
    # WEEK TOTAL
    # ========================================================

    weekly_hours = sum(
        item["hours"]
        for item
        in seven_day_data
    )


    weekly_hours = round(
        weekly_hours,
        2
    )


    weekly_entries = sum(
        item["entries"]
        for item
        in seven_day_data
    )


    # ========================================================
    # RECENT WORK RECORDS
    # ========================================================

    recent_records = (
        db.query(WorkRecord)
        .filter(
            WorkRecord.employee_id
            == employee.id
        )
        .order_by(
            WorkRecord.work_date.desc(),
            WorkRecord.id.desc()
        )
        .limit(10)
        .all()
    )


    recent_work = []


    for record in recent_records:

        recent_work.append({

            "id":
                record.id,

            "work_date":
                str(
                    record.work_date
                ),

            "task_id":
                record.task_id,

            "project_id":
                record.project_id,

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
                    else 0
                ),

            "status":
                record.status,

            "progress_percentage":
                record.progress_percentage,

            "remarks":
                record.remarks
        })


    # ========================================================
    # PERFORMANCE RESPONSE
    # ========================================================

    return {

        "employee": {

            "id":
                employee.id,

            "employee_code":
                employee.employee_code,

            "name":
                (
                    f"{employee.first_name} "
                    f"{employee.last_name or ''}"
                ).strip(),

            "designation":
                employee.designation

        },


        "today": {

            "date":
                str(
                    today
                ),

            "hours":
                today_hours,

            "entries":
                today_entries,

            "completed_entries":
                today_completed_entries

        },


        "tasks": {

            "total":
                total_tasks,

            "completed":
                completed_tasks,

            "in_progress":
                in_progress_tasks,

            "pending":
                pending_tasks,

            "delivered":
                delivered_tasks,

            "average_progress":
                average_progress

        },


        "week": {

            "hours":
                weekly_hours,

            "entries":
                weekly_entries,

            "daily":
                seven_day_data

        },


        "recent_work":
            recent_work
    }