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
    require_admin
)


router = APIRouter(
    prefix="/admin/performance",
    tags=["Admin Performance"]
)


# ============================================================
# HELPER: EMPLOYEE NAME
# ============================================================

def employee_name(
    employee: Employee
):

    return (
        f"{employee.first_name} "
        f"{employee.last_name or ''}"
    ).strip()


# ============================================================
# HELPER: CALCULATE EMPLOYEE PERFORMANCE
# ============================================================

def calculate_employee_performance(
    employee: Employee,
    db: Session
):

    today = date.today()

    week_start = (
        today
        - timedelta(
            days=6
        )
    )


    # ========================================================
    # TASKS
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


    revision_tasks = sum(
        1
        for task in tasks
        if task.status
        == "revision"
    )


    cancelled_tasks = sum(
        1
        for task in tasks
        if task.status
        == "cancelled"
    )


    # ========================================================
    # COMPLETION RATE
    # ========================================================

    completion_rate = (
        (
            completed_tasks
            / total_tasks
        )
        * 100
        if total_tasks > 0
        else 0
    )


    completion_rate = round(
        completion_rate,
        2
    )


    # ========================================================
    # DELIVERY RATE
    #
    # Delivered + Completed are counted as delivered outcomes.
    # ========================================================

    delivered_outcomes = (
        delivered_tasks
        + completed_tasks
    )


    delivery_rate = (
        (
            delivered_outcomes
            / total_tasks
        )
        * 100
        if total_tasks > 0
        else 0
    )


    delivery_rate = round(
        delivery_rate,
        2
    )


    # ========================================================
    # AVERAGE TASK PROGRESS
    # ========================================================

    average_progress = (
        sum(
            int(
                task.progress_percentage
                or 0
            )
            for task in tasks
        )
        / total_tasks
        if total_tasks > 0
        else 0
    )


    average_progress = round(
        average_progress,
        2
    )


    # ========================================================
    # REVISION COUNT
    # ========================================================

    revision_count = sum(
        int(
            task.revision_count
            or 0
        )
        for task in tasks
    )


    # ========================================================
    # TODAY'S WORK
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


    today_hours = round(
        sum(
            float(
                record.hours_spent
                or 0
            )
            for record in today_records
        ),
        2
    )


    today_entries = len(
        today_records
    )


    # ========================================================
    # LAST 7 DAYS
    # ========================================================

    week_records = (
        db.query(WorkRecord)
        .filter(
            WorkRecord.employee_id
            == employee.id,

            WorkRecord.work_date
            >= week_start,

            WorkRecord.work_date
            <= today
        )
        .all()
    )


    weekly_hours = round(
        sum(
            float(
                record.hours_spent
                or 0
            )
            for record in week_records
        ),
        2
    )


    weekly_entries = len(
        week_records
    )


    # ========================================================
    # WORK CONSISTENCY
    #
    # Percentage of the last 7 calendar days on which the
    # employee submitted at least one work record.
    # ========================================================

    active_dates = {
        record.work_date
        for record in week_records
    }


    active_days = len(
        active_dates
    )


    work_consistency = round(
        (
            active_days
            / 7
        )
        * 100,
        2
    )


    # ========================================================
    # PERFORMANCE INDEX
    #
    # Transparent comparative indicator:
    #
    # 40% Completion Rate
    # 30% Average Task Progress
    # 20% Delivery Rate
    # 10% Work Consistency
    #
    # This is a configurable management indicator,
    # not an absolute measure of employee quality.
    # ========================================================

    performance_index = (
        (
            completion_rate
            * 0.40
        )
        +
        (
            average_progress
            * 0.30
        )
        +
        (
            delivery_rate
            * 0.20
        )
        +
        (
            work_consistency
            * 0.10
        )
    )


    performance_index = round(
        performance_index,
        2
    )


    # ========================================================
    # RETURN SUMMARY
    # ========================================================

    return {

        "employee_id":
            employee.id,

        "employee_code":
            employee.employee_code,

        "employee_name":
            employee_name(
                employee
            ),

        "designation":
            employee.designation,

        "employment_status":
            employee.employment_status,

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

            "revision":
                revision_tasks,

            "cancelled":
                cancelled_tasks,

            "completion_rate":
                completion_rate,

            "delivery_rate":
                delivery_rate,

            "average_progress":
                average_progress,

            "revision_count":
                revision_count
        },

        "today": {

            "hours":
                today_hours,

            "entries":
                today_entries
        },

        "week": {

            "hours":
                weekly_hours,

            "entries":
                weekly_entries,

            "active_days":
                active_days,

            "work_consistency":
                work_consistency
        },

        "performance_index":
            performance_index
    }


# ============================================================
# TEAM PERFORMANCE
# ============================================================

@router.get("")
def get_team_performance(

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_admin
    )
):

    employees = (
        db.query(Employee)
        .order_by(
            Employee.employee_code.asc()
        )
        .all()
    )


    results = [

        calculate_employee_performance(
            employee,
            db
        )

        for employee
        in employees

    ]


    return {

        "total_employees":
            len(results),

        "employees":
            results
    }


# ============================================================
# INDIVIDUAL EMPLOYEE PERFORMANCE
# ============================================================

@router.get(
    "/{employee_id}"
)
def get_employee_performance(

    employee_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
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


    summary = (
        calculate_employee_performance(
            employee,
            db
        )
    )


    today = date.today()


    # ========================================================
    # 7-DAY DAILY DATA
    # ========================================================

    daily = []


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


        records = (
            db.query(WorkRecord)
            .filter(
                WorkRecord.employee_id
                == employee.id,

                WorkRecord.work_date
                == current_date
            )
            .all()
        )


        hours = round(
            sum(
                float(
                    record.hours_spent
                    or 0
                )
                for record in records
            ),
            2
        )


        daily.append({

            "date":
                str(
                    current_date
                ),

            "day":
                current_date.strftime(
                    "%a"
                ),

            "hours":
                hours,

            "entries":
                len(
                    records
                )
        })


    # ========================================================
    # RECENT WORK
    # ========================================================

    recent_work_records = (
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


    recent_work = [

        {

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

        }

        for record
        in recent_work_records

    ]


    # ========================================================
    # RECENT TASKS
    # ========================================================

    recent_tasks_query = (
        db.query(Task)
        .filter(
            Task.assigned_to
            == employee.id
        )
        .order_by(
            Task.id.desc()
        )
        .limit(10)
        .all()
    )


    recent_tasks = [

        {

            "id":
                task.id,

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

            "deadline":
                task.deadline,

            "revision_count":
                task.revision_count

        }

        for task
        in recent_tasks_query

    ]


    return {

        **summary,

        "week": {

            **summary[
                "week"
            ],

            "daily":
                daily
        },

        "recent_work":
            recent_work,

        "recent_tasks":
            recent_tasks
    }