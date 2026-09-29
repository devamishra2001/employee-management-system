from datetime import (
    date,
    datetime,
    time,
    timedelta
)

from typing import (
    Literal,
    Optional
)

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
from app.models.task_history import TaskHistory
from app.models.work_record import WorkRecord

from app.auth_dependencies import (
    require_admin
)


router = APIRouter(
    prefix="/admin/reports",
    tags=["Admin Reports"]
)


ReportPeriod = Literal[
    "daily",
    "weekly",
    "monthly"
]


# ============================================================
# EMPLOYEE NAME
# ============================================================

def employee_name(
    employee: Employee
):

    return (
        f"{employee.first_name} "
        f"{employee.last_name or ''}"
    ).strip()


# ============================================================
# DATE RANGE
# ============================================================

def get_date_range(
    period: ReportPeriod,
    target_date: date
):

    # --------------------------------------------------------
    # DAILY
    # --------------------------------------------------------

    if period == "daily":

        return (
            target_date,
            target_date
        )


    # --------------------------------------------------------
    # WEEKLY
    #
    # Monday -> Sunday
    # --------------------------------------------------------

    if period == "weekly":

        start_date = (
            target_date
            - timedelta(
                days=target_date.weekday()
            )
        )

        end_date = (
            start_date
            + timedelta(
                days=6
            )
        )

        return (
            start_date,
            end_date
        )


    # --------------------------------------------------------
    # MONTHLY
    # --------------------------------------------------------

    if period == "monthly":

        start_date = (
            target_date.replace(
                day=1
            )
        )


        if target_date.month == 12:

            next_month = (
                target_date.replace(
                    year=target_date.year + 1,
                    month=1,
                    day=1
                )
            )

        else:

            next_month = (
                target_date.replace(
                    month=target_date.month + 1,
                    day=1
                )
            )


        end_date = (
            next_month
            - timedelta(
                days=1
            )
        )


        return (
            start_date,
            end_date
        )


    raise HTTPException(
        status_code=400,
        detail="Invalid report period"
    )


# ============================================================
# DATETIME RANGE
#
# We use:
#
# start_datetime <= timestamp < end_datetime_exclusive
#
# This avoids missing events occurring late on the end date.
# ============================================================

def get_datetime_range(
    start_date: date,
    end_date: date
):

    start_datetime = datetime.combine(
        start_date,
        time.min
    )

    end_datetime_exclusive = datetime.combine(
        end_date
        + timedelta(days=1),
        time.min
    )

    return (
        start_datetime,
        end_datetime_exclusive
    )


# ============================================================
# DATE VALUE HELPER
#
# Handles date or datetime database values safely.
# ============================================================

def value_to_date(
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


# ============================================================
# CHECK IF DATE IS INSIDE REPORT PERIOD
# ============================================================

def is_date_in_period(
    value,
    start_date: date,
    end_date: date
):

    value_date = value_to_date(
        value
    )


    if value_date is None:
        return False


    return (
        start_date
        <= value_date
        <= end_date
    )


# ============================================================
# GET TASK STATUS EVENTS
#
# Historical status transitions are read from task_history.
# ============================================================

def get_status_history_events(
    task_ids,
    start_datetime,
    end_datetime_exclusive,
    db: Session
):

    if not task_ids:
        return []


    return (
        db.query(TaskHistory)
        .filter(
            TaskHistory.task_id.in_(
                task_ids
            ),

            TaskHistory.field_name
            == "status",

            TaskHistory.changed_at
            >= start_datetime,

            TaskHistory.changed_at
            < end_datetime_exclusive
        )
        .order_by(
            TaskHistory.changed_at.asc()
        )
        .all()
    )


# ============================================================
# BUILD EMPLOYEE REPORT
# ============================================================

def build_employee_report(
    employee: Employee,
    start_date: date,
    end_date: date,
    db: Session
):

    (
        start_datetime,
        end_datetime_exclusive
    ) = get_datetime_range(
        start_date,
        end_date
    )


    # ========================================================
    # ALL TASKS BELONGING TO EMPLOYEE
    #
    # These are required because historical task outcomes
    # may occur during the selected period even when the task
    # was originally assigned before that period.
    # ========================================================

    all_tasks = (
        db.query(Task)
        .filter(
            Task.assigned_to
            == employee.id
        )
        .all()
    )


    task_ids = [
        task.id
        for task in all_tasks
    ]


    # ========================================================
    # TASKS ASSIGNED DURING PERIOD
    # ========================================================

    tasks_assigned_in_period = [

        task

        for task in all_tasks

        if is_date_in_period(
            task.assigned_date,
            start_date,
            end_date
        )

    ]


    assigned_count = len(
        tasks_assigned_in_period
    )


    # ========================================================
    # TASKS COMPLETED DURING PERIOD
    #
    # completed_at provides a real historical timestamp and
    # therefore is preferred over current status.
    # ========================================================

    tasks_completed_in_period = [

        task

        for task in all_tasks

        if (
            task.completed_at
            is not None

            and

            start_datetime
            <= task.completed_at
            < end_datetime_exclusive
        )

    ]


    completed_count = len(
        tasks_completed_in_period
    )


    # ========================================================
    # STATUS TRANSITIONS DURING PERIOD
    #
    # Used for delivered/revision/completed historical events.
    # ========================================================

    status_events = (
        get_status_history_events(
            task_ids,
            start_datetime,
            end_datetime_exclusive,
            db
        )
    )


    delivered_event_task_ids = {
        event.task_id

        for event in status_events

        if event.new_value
        == "delivered"
    }


    revision_event_task_ids = {
        event.task_id

        for event in status_events

        if event.new_value
        == "revision"
    }


    completed_event_task_ids = {
        event.task_id

        for event in status_events

        if event.new_value
        == "completed"
    }


    # completed_at is authoritative where present.
    # Historical status transitions provide additional coverage.

    completed_task_ids = {
        task.id
        for task in tasks_completed_in_period
    }


    completed_task_ids.update(
        completed_event_task_ids
    )


    delivered_count = len(
        delivered_event_task_ids
    )


    revision_task_count = len(
        revision_event_task_ids
    )


    completed_count = len(
        completed_task_ids
    )


    # ========================================================
    # REVISION EVENTS
    #
    # This counts actual revision status transitions in the
    # selected period rather than lifetime revision_count.
    # ========================================================

    revision_events = sum(
        1

        for event in status_events

        if event.new_value
        == "revision"
    )


    # ========================================================
    # PERIOD TASK SET
    #
    # Relevant tasks are tasks that were:
    #
    # - assigned in period
    # - completed in period
    # - delivered in period
    # - sent to revision in period
    #
    # This prevents old unrelated tasks from contaminating
    # historical reports.
    # ========================================================

    relevant_task_ids = set(
        task.id
        for task in tasks_assigned_in_period
    )


    relevant_task_ids.update(
        completed_task_ids
    )

    relevant_task_ids.update(
        delivered_event_task_ids
    )

    relevant_task_ids.update(
        revision_event_task_ids
    )


    relevant_tasks = [

        task

        for task in all_tasks

        if task.id
        in relevant_task_ids

    ]


    period_task_count = len(
        relevant_tasks
    )


    # ========================================================
    # AVERAGE PROGRESS
    #
    # This remains the latest known progress for tasks that
    # were relevant to the selected report period.
    #
    # It is intentionally not presented as historical
    # point-in-time progress because task_history may not
    # contain every original progress value.
    # ========================================================

    average_progress = (

        sum(
            int(
                task.progress_percentage
                or 0
            )

            for task in relevant_tasks
        )
        /
        period_task_count

        if period_task_count > 0

        else 0
    )


    average_progress = round(
        average_progress,
        2
    )


    # ========================================================
    # PERIOD COMPLETION RATE
    #
    # Denominator:
    # tasks assigned during selected period.
    #
    # Numerator:
    # those assigned-period tasks whose completion happened
    # during the same selected period.
    #
    # This avoids using all lifetime employee tasks.
    # ========================================================

    assigned_task_ids = {
        task.id
        for task in tasks_assigned_in_period
    }


    assigned_and_completed_ids = (
        assigned_task_ids
        &
        completed_task_ids
    )


    completion_rate = (

        (
            len(
                assigned_and_completed_ids
            )
            /
            assigned_count
        )
        *
        100

        if assigned_count > 0

        else 0
    )


    completion_rate = round(
        completion_rate,
        2
    )


    # ========================================================
    # PERIOD DELIVERY RATE
    #
    # Number of tasks assigned during the selected period that
    # reached delivered or completed during that same period.
    # ========================================================

    successful_delivery_ids = (
        delivered_event_task_ids
        |
        completed_task_ids
    )


    assigned_and_delivered_ids = (
        assigned_task_ids
        &
        successful_delivery_ids
    )


    delivery_rate = (

        (
            len(
                assigned_and_delivered_ids
            )
            /
            assigned_count
        )
        *
        100

        if assigned_count > 0

        else 0
    )


    delivery_rate = round(
        delivery_rate,
        2
    )


    # ========================================================
    # CURRENT STATUS OF PERIOD-RELEVANT TASKS
    #
    # This is clearly separated from historical outcomes.
    # ========================================================

    current_in_progress = sum(

        1

        for task in relevant_tasks

        if task.status
        == "in_progress"

    )


    current_pending = sum(

        1

        for task in relevant_tasks

        if task.status
        == "pending"

    )


    current_received = sum(

        1

        for task in relevant_tasks

        if task.status
        == "received"

    )


    current_cancelled = sum(

        1

        for task in relevant_tasks

        if task.status
        == "cancelled"

    )


    # ========================================================
    # WORK RECORDS STRICTLY INSIDE REPORT PERIOD
    # ========================================================

    records = (
        db.query(WorkRecord)
        .filter(
            WorkRecord.employee_id
            == employee.id,

            WorkRecord.work_date
            >= start_date,

            WorkRecord.work_date
            <= end_date
        )
        .order_by(
            WorkRecord.work_date.asc(),
            WorkRecord.id.asc()
        )
        .all()
    )


    total_entries = len(
        records
    )


    total_hours = round(

        sum(
            float(
                record.hours_spent
                or 0
            )

            for record in records
        ),

        2
    )


    completed_entries = sum(

        1

        for record in records

        if record.status
        == "completed"

    )


    delivered_entries = sum(

        1

        for record in records

        if record.status
        == "delivered"

    )


    active_dates = {
        record.work_date
        for record in records
    }


    active_days = len(
        active_dates
    )


    # ========================================================
    # DAILY BREAKDOWN
    # ========================================================

    daily_breakdown = []


    current_date = start_date


    while current_date <= end_date:

        day_records = [

            record

            for record in records

            if record.work_date
            == current_date

        ]


        day_hours = round(

            sum(
                float(
                    record.hours_spent
                    or 0
                )

                for record in day_records
            ),

            2
        )


        daily_breakdown.append({

            "date":
                str(
                    current_date
                ),

            "day":
                current_date.strftime(
                    "%a"
                ),

            "hours":
                day_hours,

            "entries":
                len(
                    day_records
                ),

            "completed_entries":
                sum(
                    1

                    for record in day_records

                    if record.status
                    == "completed"
                ),

            "delivered_entries":
                sum(
                    1

                    for record in day_records

                    if record.status
                    == "delivered"
                )

        })


        current_date += timedelta(
            days=1
        )


    # ========================================================
    # WORK ENTRIES
    # ========================================================

    work_entries = [

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

                    else 0
                ),

            "status":
                record.status,

            "progress_percentage":
                record.progress_percentage,

            "remarks":
                record.remarks

        }

        for record in records

    ]


    # ========================================================
    # TASK EVENT LIST
    # ========================================================

    task_events = []


    for task in tasks_assigned_in_period:

        task_events.append({

            "task_id":
                task.id,

            "event":
                "assigned",

            "date":
                (
                    str(
                        value_to_date(
                            task.assigned_date
                        )
                    )
                    if task.assigned_date
                    else None
                ),

            "title":
                task.title,

            "work_type":
                task.work_type

        })


    for task in all_tasks:

        if task.id in completed_task_ids:

            event_date = None


            if task.completed_at:

                event_date = str(
                    task.completed_at.date()
                )


            task_events.append({

                "task_id":
                    task.id,

                "event":
                    "completed",

                "date":
                    event_date,

                "title":
                    task.title,

                "work_type":
                    task.work_type

            })


    for event in status_events:

        if event.new_value not in [
            "delivered",
            "revision"
        ]:

            continue


        related_task = next(
            (
                task
                for task in all_tasks
                if task.id
                == event.task_id
            ),
            None
        )


        task_events.append({

            "task_id":
                event.task_id,

            "event":
                event.new_value,

            "date":
                (
                    str(
                        event.changed_at.date()
                    )
                    if event.changed_at
                    else None
                ),

            "title":
                (
                    related_task.title
                    if related_task
                    else None
                ),

            "work_type":
                (
                    related_task.work_type
                    if related_task
                    else None
                )

        })


    task_events.sort(
        key=lambda item: (
            item.get("date") or "",
            item.get("task_id") or 0
        )
    )


    # ========================================================
    # RETURN EMPLOYEE REPORT
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


        # ----------------------------------------------------
        # HISTORICAL PERIOD TASK METRICS
        # ----------------------------------------------------

        "tasks": {

            "total":
                period_task_count,

            "assigned":
                assigned_count,

            "completed":
                completed_count,

            "delivered":
                delivered_count,

            "revision":
                revision_task_count,

            "revision_count":
                revision_events,

            "completion_rate":
                completion_rate,

            "delivery_rate":
                delivery_rate,

            "average_progress":
                average_progress,

            # Current state of tasks relevant to this period.

            "in_progress":
                current_in_progress,

            "pending":
                current_pending,

            "received":
                current_received,

            "cancelled":
                current_cancelled

        },


        # ----------------------------------------------------
        # PERIOD WORK METRICS
        # ----------------------------------------------------

        "work": {

            "entries":
                total_entries,

            "hours":
                total_hours,

            "completed_entries":
                completed_entries,

            "delivered_entries":
                delivered_entries,

            "active_days":
                active_days

        },


        "daily_breakdown":
            daily_breakdown,

        "work_entries":
            work_entries,

        "task_events":
            task_events

    }


# ============================================================
# TEAM REPORT
# ============================================================

@router.get("")
def get_team_report(

    period: ReportPeriod = Query(
        default="weekly"
    ),

    target_date: Optional[date] = Query(
        default=None
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

    if target_date is None:

        target_date = date.today()


    (
        start_date,
        end_date
    ) = get_date_range(
        period,
        target_date
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


    employee_reports = [

        build_employee_report(
            employee,
            start_date,
            end_date,
            db
        )

        for employee in employees

    ]


    # ========================================================
    # TEAM WORK TOTALS
    # ========================================================

    total_hours = round(

        sum(
            employee["work"]["hours"]

            for employee
            in employee_reports
        ),

        2
    )


    total_entries = sum(

        employee["work"]["entries"]

        for employee
        in employee_reports

    )


    # ========================================================
    # TEAM PERIOD TASK TOTALS
    # ========================================================

    period_tasks = sum(

        employee["tasks"]["total"]

        for employee
        in employee_reports

    )


    assigned_tasks = sum(

        employee["tasks"]["assigned"]

        for employee
        in employee_reports

    )


    completed_tasks = sum(

        employee["tasks"]["completed"]

        for employee
        in employee_reports

    )


    delivered_tasks = sum(

        employee["tasks"]["delivered"]

        for employee
        in employee_reports

    )


    revision_events = sum(

        employee["tasks"]["revision_count"]

        for employee
        in employee_reports

    )


    # ========================================================
    # WEIGHTED TEAM PROGRESS
    #
    # This avoids giving an employee with 1 task the same
    # statistical influence as an employee with 20 tasks.
    # ========================================================

    weighted_progress_numerator = sum(

        (
            employee["tasks"]["average_progress"]
            *
            employee["tasks"]["total"]
        )

        for employee
        in employee_reports

    )


    average_progress = (

        weighted_progress_numerator
        /
        period_tasks

        if period_tasks > 0

        else 0
    )


    average_progress = round(
        average_progress,
        2
    )


    # ========================================================
    # TEAM COMPLETION RATE
    # ========================================================

    completed_assigned_tasks = 0


    for employee in employee_reports:

        employee_assigned = (
            employee[
                "tasks"
            ][
                "assigned"
            ]
        )


        employee_completion_rate = (
            employee[
                "tasks"
            ][
                "completion_rate"
            ]
        )


        estimated_completed_assigned = (
            employee_assigned
            *
            (
                employee_completion_rate
                /
                100
            )
        )


        completed_assigned_tasks += (
            estimated_completed_assigned
        )


    team_completion_rate = (

        (
            completed_assigned_tasks
            /
            assigned_tasks
        )
        *
        100

        if assigned_tasks > 0

        else 0
    )


    team_completion_rate = round(
        team_completion_rate,
        2
    )


    return {

        "period":
            period,

        "target_date":
            str(
                target_date
            ),

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
                    employee_reports
                ),

            "total_hours":
                total_hours,

            "work_entries":
                total_entries,

            "total_tasks":
                period_tasks,

            "assigned_tasks":
                assigned_tasks,

            "completed_tasks":
                completed_tasks,

            "delivered_tasks":
                delivered_tasks,

            "revision_events":
                revision_events,

            "completion_rate":
                team_completion_rate,

            "average_progress":
                average_progress

        },


        "employees":
            employee_reports

    }


# ============================================================
# SINGLE EMPLOYEE REPORT
# ============================================================

@router.get(
    "/employee/{employee_id}"
)
def get_employee_report(

    employee_id: int,

    period: ReportPeriod = Query(
        default="weekly"
    ),

    target_date: Optional[date] = Query(
        default=None
    ),

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_admin
    )

):

    if target_date is None:

        target_date = date.today()


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


    (
        start_date,
        end_date
    ) = get_date_range(
        period,
        target_date
    )


    report = build_employee_report(
        employee,
        start_date,
        end_date,
        db
    )


    return {

        "period":
            period,

        "target_date":
            str(
                target_date
            ),

        "start_date":
            str(
                start_date
            ),

        "end_date":
            str(
                end_date
            ),

        **report

    }