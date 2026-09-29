from datetime import date, datetime
from typing import Optional, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field
)


WorkRecordStatus = Literal[
    "received",
    "pending",
    "in_progress",
    "delivered",
    "revision",
    "completed",
    "cancelled"
]


class WorkRecordCreate(BaseModel):

    task_id: Optional[int] = Field(
        default=None,
        gt=0
    )

    project_id: Optional[int] = Field(
        default=None,
        gt=0
    )

    work_date: date

    work_type: Optional[str] = Field(
        default=None,
        max_length=100
    )

    title: str = Field(
        min_length=1,
        max_length=255
    )

    description: Optional[str] = None

    hours_spent: Optional[float] = Field(
        default=None,
        ge=0
    )

    status: Optional[
        WorkRecordStatus
    ] = "in_progress"

    progress_percentage: Optional[int] = Field(
        default=0,
        ge=0,
        le=100
    )

    remarks: Optional[str] = None


class WorkRecordUpdate(BaseModel):

    task_id: Optional[int] = Field(
        default=None,
        gt=0
    )

    project_id: Optional[int] = Field(
        default=None,
        gt=0
    )

    work_date: Optional[date] = None

    work_type: Optional[str] = Field(
        default=None,
        max_length=100
    )

    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=255
    )

    description: Optional[str] = None

    hours_spent: Optional[float] = Field(
        default=None,
        ge=0
    )

    status: Optional[
        WorkRecordStatus
    ] = None

    progress_percentage: Optional[int] = Field(
        default=None,
        ge=0,
        le=100
    )

    remarks: Optional[str] = None


class WorkRecordResponse(BaseModel):

    id: int

    employee_id: int

    task_id: Optional[int] = None

    project_id: Optional[int] = None

    work_date: date

    work_type: Optional[str] = None

    title: Optional[str] = None

    description: Optional[str] = None

    hours_spent: Optional[float] = None

    status: Optional[str] = None

    progress_percentage: Optional[int] = None

    remarks: Optional[str] = None

    created_at: Optional[datetime] = None

    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True
    )