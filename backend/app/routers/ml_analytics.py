from datetime import date, datetime, timedelta
from statistics import mean
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
from app.models.task import Task
from app.models.work_record import WorkRecord
from app.models.task_history import TaskHistory

from app.auth_dependencies import require_admin


router = APIRouter(
    prefix="/admin/ml-analytics",
    tags=["Admin ML Analytics"]
)


# ============================================================
# CONSTANTS
# ============================================================

DEFAULT_WINDOW_DAYS = 30

MINIMUM_EMPLOYEES_FOR_MODEL = 5
MINIMUM_TASKS_FOR_MODEL = 50
MINIMUM_COMPLETED_TASKS = 20


# ============================================================
# HELPERS
# ============================================================

def get_employee_name(
    employee: Employee
):

    return (
        f"{employee.first_name} "
        f"{employee.last_name or ''}"
    ).strip()


def safe_percentage(
    numerator,
    denominator
):

    if not denominator:
        return 0.0

    return round(
        (
            float(numerator)
            /
            float(denominator)
        )
        * 100,
        2
    )


def safe_average(
    values
):

    values = [
        float(value)
        for value in values
        if value is not None
    ]

    if not values:
        return 0.0

    return round(
        mean(values),
        2
    )


def to_date(
    value
):

    if value is None:
        return None

    if isinstance(
        value,
        datetime
    ):
        return value.date()

    if isinstance(
        value,
        date
    ):
        return value

    return None


def date_inside_range(
    value,
    start_date,
    end_date
):

    converted = to_date(
        value
    )

    if converted is None:
        return False

    return (
        start_date
        <= converted
        <= end_date
    )


# ============================================================
# BUILD FEATURES FOR ONE EMPLOYEE
# ============================================================

def build_employee_features(
    employee: Employee,
    start_date: date,
    end_date: date,
    db: Session
):

    # ========================================================
    # ALL EMPLOYEE TASKS
    # ========================================================

    all_tasks = (
        db.query(Task)
        .filter(
            Task.assigned_to
            == employee.id
        )
        .all()
    )


    # ========================================================
    # TASKS RELEVANT TO SELECTED WINDOW
    # ========================================================

    period_tasks = []

    for task in all_tasks:

        assigned_in_period = (
            date_inside_range(
                task.assigned_date,
                start_date,
                end_date
            )
        )

        completed_in_period = (
            date_inside_range(
                task.completed_at,
                start_date,
                end_date
            )
        )

        if (
            assigned_in_period
            or completed_in_period
        ):
            period_tasks.append(
                task
            )


    period_task_ids = {
        task.id
        for task in period_tasks
    }


    # ========================================================
    # WORK RECORDS
    # ========================================================

    work_records = (
        db.query(WorkRecord)
        .filter(
            WorkRecord.employee_id
            == employee.id,

            WorkRecord.work_date
            >= start_date,

            WorkRecord.work_date
            <= end_date
        )
        .all()
    )


    # ========================================================
    # TASK HISTORY
    # ========================================================

    if period_task_ids:

        histories = (
            db.query(TaskHistory)
            .filter(
                TaskHistory.task_id.in_(
                    list(
                        period_task_ids
                    )
                )
            )
            .all()
        )

    else:

        histories = []


    # ========================================================
    # BASIC TASK COUNTS
    # ========================================================

    total_tasks = len(
        period_tasks
    )


    completed_tasks = sum(
        1
        for task in period_tasks
        if task.status == "completed"
    )


    delivered_tasks = sum(
        1
        for task in period_tasks
        if task.status == "delivered"
    )


    in_progress_tasks = sum(
        1
        for task in period_tasks
        if task.status == "in_progress"
    )


    pending_tasks = sum(
        1
        for task in period_tasks
        if task.status == "pending"
    )


    revision_tasks = sum(
        1
        for task in period_tasks
        if task.status == "revision"
    )


    cancelled_tasks = sum(
        1
        for task in period_tasks
        if task.status == "cancelled"
    )


    # ========================================================
    # TASK PROGRESS
    # ========================================================

    average_progress = safe_average(
        [
            task.progress_percentage
            for task in period_tasks
        ]
    )


    # ========================================================
    # COMPLETION RATE
    # ========================================================

    completion_rate = safe_percentage(
        completed_tasks,
        total_tasks
    )


    # ========================================================
    # DELIVERY RATE
    # ========================================================

    delivery_rate = safe_percentage(
        completed_tasks
        + delivered_tasks,
        total_tasks
    )


    # ========================================================
    # REVISION ACTIVITY
    # ========================================================

    revision_events = sum(
        1
        for history in histories
        if (
            history.field_name
            == "status"
            and history.new_value
            == "revision"
        )
    )


    # ========================================================
    # WORK HOURS
    # ========================================================

    total_hours = round(
        sum(
            float(
                record.hours_spent
                or 0
            )
            for record in work_records
        ),
        2
    )


    # ========================================================
    # WORK ENTRIES
    # ========================================================

    work_entries = len(
        work_records
    )


    # ========================================================
    # ACTIVE DAYS
    # ========================================================

    active_dates = {
        record.work_date
        for record in work_records
    }


    active_days = len(
        active_dates
    )


    # ========================================================
    # PERIOD LENGTH
    # ========================================================

    period_days = (
        end_date
        - start_date
    ).days + 1


    work_consistency = safe_percentage(
        active_days,
        period_days
    )


    # ========================================================
    # AVERAGE HOURS PER ACTIVE DAY
    # ========================================================

    average_hours_per_active_day = (

        round(
            total_hours
            / active_days,
            2
        )

        if active_days > 0

        else 0.0
    )


    # ========================================================
    # DAILY WORK DISTRIBUTION
    # ========================================================

    daily_hours = []


    current_date = start_date

    while current_date <= end_date:

        day_hours = sum(
            float(
                record.hours_spent
                or 0
            )
            for record in work_records
            if record.work_date
            == current_date
        )


        daily_hours.append(
            round(
                day_hours,
                2
            )
        )


        current_date += timedelta(
            days=1
        )


    # ========================================================
    # HOURS VARIABILITY
    #
    # Simple dispersion measure without external ML libraries.
    # ========================================================

    if daily_hours:

        avg_daily_hours = (
            sum(
                daily_hours
            )
            /
            len(
                daily_hours
            )
        )


        variance = (
            sum(
                (
                    value
                    - avg_daily_hours
                )
                ** 2

                for value in daily_hours
            )
            /
            len(
                daily_hours
            )
        )


        hours_variability = round(
            variance ** 0.5,
            2
        )

    else:

        hours_variability = 0.0


    # ========================================================
    # COMPLETION DURATION
    #
    # Days from start/assignment to completed_at.
    # ========================================================

    completion_durations = []


    for task in period_tasks:

        if not task.completed_at:
            continue


        start_value = (
            task.start_date
            or task.assigned_date
        )


        start_day = to_date(
            start_value
        )


        completed_day = to_date(
            task.completed_at
        )


        if (
            start_day
            and completed_day
            and completed_day
            >= start_day
        ):

            completion_durations.append(
                (
                    completed_day
                    - start_day
                ).days
            )


    average_completion_days = (
        safe_average(
            completion_durations
        )
    )


    # ========================================================
    # DEADLINE PERFORMANCE
    # ========================================================

    tasks_with_deadline = 0
    completed_on_time = 0
    overdue_current = 0


    today = date.today()


    for task in period_tasks:

        deadline_day = to_date(
            task.deadline
        )


        if deadline_day is None:
            continue


        tasks_with_deadline += 1


        completed_day = to_date(
            task.completed_at
        )


        if completed_day:

            if (
                completed_day
                <= deadline_day
            ):

                completed_on_time += 1

        else:

            if (
                deadline_day
                < today
                and task.status
                not in [
                    "completed",
                    "cancelled"
                ]
            ):

                overdue_current += 1


    on_time_completion_rate = (
        safe_percentage(
            completed_on_time,
            tasks_with_deadline
        )
    )


    # ========================================================
    # PRIORITY COUNTS
    # ========================================================

    low_priority = sum(
        1
        for task in period_tasks
        if task.priority == "low"
    )


    medium_priority = sum(
        1
        for task in period_tasks
        if task.priority == "medium"
    )


    high_priority = sum(
        1
        for task in period_tasks
        if task.priority == "high"
    )


    urgent_priority = sum(
        1
        for task in period_tasks
        if task.priority == "urgent"
    )


    # ========================================================
    # WORK-TYPE DIVERSITY
    # ========================================================

    work_types = {
        task.work_type
        for task in period_tasks
        if task.work_type
    }


    work_type_diversity = len(
        work_types
    )


    # ========================================================
    # RETURN FEATURE VECTOR
    # ========================================================

    return {

        "employee_id":
            employee.id,

        "employee_code":
            employee.employee_code,

        "employee_name":
            get_employee_name(
                employee
            ),

        "designation":
            employee.designation,

        "employment_status":
            employee.employment_status,

        "features": {

            "total_tasks":
                total_tasks,

            "completed_tasks":
                completed_tasks,

            "delivered_tasks":
                delivered_tasks,

            "in_progress_tasks":
                in_progress_tasks,

            "pending_tasks":
                pending_tasks,

            "revision_tasks":
                revision_tasks,

            "cancelled_tasks":
                cancelled_tasks,

            "completion_rate":
                completion_rate,

            "delivery_rate":
                delivery_rate,

            "average_progress":
                average_progress,

            "revision_events":
                revision_events,

            "total_work_hours":
                total_hours,

            "work_entries":
                work_entries,

            "active_days":
                active_days,

            "work_consistency":
                work_consistency,

            "average_hours_per_active_day":
                average_hours_per_active_day,

            "hours_variability":
                hours_variability,

            "average_completion_days":
                average_completion_days,

            "tasks_with_deadline":
                tasks_with_deadline,

            "completed_on_time":
                completed_on_time,

            "on_time_completion_rate":
                on_time_completion_rate,

            "overdue_current":
                overdue_current,

            "low_priority_tasks":
                low_priority,

            "medium_priority_tasks":
                medium_priority,

            "high_priority_tasks":
                high_priority,

            "urgent_priority_tasks":
                urgent_priority,

            "work_type_diversity":
                work_type_diversity
        }
    }


# ============================================================
# DATASET READINESS
# ============================================================

@router.get(
    "/readiness"
)
def get_ml_readiness(

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_admin
    )

):

    total_employees = (
        db.query(Employee)
        .count()
    )


    active_employees = (
        db.query(Employee)
        .filter(
            Employee.employment_status
            == "active"
        )
        .count()
    )


    total_tasks = (
        db.query(Task)
        .count()
    )


    completed_tasks = (
        db.query(Task)
        .filter(
            Task.status
            == "completed"
        )
        .count()
    )


    total_work_records = (
        db.query(WorkRecord)
        .count()
    )


    total_history_records = (
        db.query(TaskHistory)
        .count()
    )


    checks = {

        "employees_sufficient":
            total_employees
            >= MINIMUM_EMPLOYEES_FOR_MODEL,

        "tasks_sufficient":
            total_tasks
            >= MINIMUM_TASKS_FOR_MODEL,

        "completed_tasks_sufficient":
            completed_tasks
            >= MINIMUM_COMPLETED_TASKS,

        "work_records_available":
            total_work_records
            > 0,

        "task_history_available":
            total_history_records
            > 0
    }


    ready_for_training = all(
        checks.values()
    )


    if ready_for_training:

        recommendation = (
            "The current database satisfies the minimum "
            "technical checks for beginning an experimental "
            "machine-learning pipeline."
        )

    else:

        recommendation = (
            "Continue collecting real task, work-record, "
            "and task-history data before training a "
            "predictive model. Descriptive analytics can "
            "already be used."
        )


    return {

        "ready_for_training":
            ready_for_training,

        "minimum_requirements": {

            "employees":
                MINIMUM_EMPLOYEES_FOR_MODEL,

            "tasks":
                MINIMUM_TASKS_FOR_MODEL,

            "completed_tasks":
                MINIMUM_COMPLETED_TASKS
        },

        "current_data": {

            "total_employees":
                total_employees,

            "active_employees":
                active_employees,

            "total_tasks":
                total_tasks,

            "completed_tasks":
                completed_tasks,

            "total_work_records":
                total_work_records,

            "task_history_records":
                total_history_records
        },

        "checks":
            checks,

        "recommendation":
            recommendation
    }


# ============================================================
# FEATURE DATASET
# ============================================================

@router.get(
    "/features"
)
def get_ml_features(

    days: int = Query(
        default=DEFAULT_WINDOW_DAYS,
        ge=7,
        le=365
    ),

    employee_id: Optional[int] = Query(
        default=None
    ),

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_admin
    )

):

    end_date = date.today()

    start_date = (
        end_date
        - timedelta(
            days=days - 1
        )
    )


    query = db.query(
        Employee
    )


    if employee_id is not None:

        query = query.filter(
            Employee.id
            == employee_id
        )


    employees = (
        query
        .order_by(
            Employee.employee_code.asc()
        )
        .all()
    )


    if (
        employee_id is not None
        and not employees
    ):

        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )


    rows = [

        build_employee_features(
            employee,
            start_date,
            end_date,
            db
        )

        for employee in employees

    ]


    return {

        "window_days":
            days,

        "start_date":
            str(
                start_date
            ),

        "end_date":
            str(
                end_date
            ),

        "employee_count":
            len(
                rows
            ),

        "employees":
            rows
    }


# ============================================================
# ANALYTICS OVERVIEW
#
# Descriptive only.
# No employee ranking or employment decision is made here.
# ============================================================

@router.get(
    "/overview"
)
def get_ml_analytics_overview(

    days: int = Query(
        default=DEFAULT_WINDOW_DAYS,
        ge=7,
        le=365
    ),

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_admin
    )

):

    end_date = date.today()

    start_date = (
        end_date
        - timedelta(
            days=days - 1
        )
    )


    employees = (
        db.query(Employee)
        .order_by(
            Employee.employee_code.asc()
        )
        .all()
    )


    employee_rows = [

        build_employee_features(
            employee,
            start_date,
            end_date,
            db
        )

        for employee in employees

    ]


    feature_rows = [
        row["features"]
        for row in employee_rows
    ]


    total_hours = round(
        sum(
            row[
                "total_work_hours"
            ]
            for row in feature_rows
        ),
        2
    )


    total_tasks = sum(
        row[
            "total_tasks"
        ]
        for row in feature_rows
    )


    total_completed = sum(
        row[
            "completed_tasks"
        ]
        for row in feature_rows
    )


    average_completion_rate = (
        safe_average(
            [
                row[
                    "completion_rate"
                ]
                for row in feature_rows
            ]
        )
    )


    average_progress = (
        safe_average(
            [
                row[
                    "average_progress"
                ]
                for row in feature_rows
            ]
        )
    )


    average_consistency = (
        safe_average(
            [
                row[
                    "work_consistency"
                ]
                for row in feature_rows
            ]
        )
    )


    overdue_tasks = sum(
        row[
            "overdue_current"
        ]
        for row in feature_rows
    )


    return {

        "window_days":
            days,

        "start_date":
            str(
                start_date
            ),

        "end_date":
            str(
                end_date
            ),

        "summary": {

            "employees":
                len(
                    employee_rows
                ),

            "tasks":
                total_tasks,

            "completed_tasks":
                total_completed,

            "work_hours":
                total_hours,

            "average_completion_rate":
                average_completion_rate,

            "average_progress":
                average_progress,

            "average_work_consistency":
                average_consistency,

            "current_overdue_tasks":
                overdue_tasks
        },

        "employees":
            employee_rows,

        "note": (
            "These values are descriptive operational analytics. "
            "They should not be treated as an automated employment "
            "decision or as a complete measure of employee quality."
        )
    }