from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, ConfigDict, Field


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


class TaskBase(BaseModel):
    project_id: Optional[int] = Field(
        default=None,
        gt=0
    )

    assigned_to: int = Field(
        gt=0
    )

    title: str

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


class TaskCreate(TaskBase):
    created_by: Optional[int] = Field(
        default=None,
        gt=0
    )


class TaskUpdate(BaseModel):

    assigned_to: Optional[int] = Field(
        default=None,
        gt=0
    )

    title: Optional[str] = None

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

    changed_by: Optional[int] = Field(
        default=None,
        gt=0
    )


class TaskResponse(TaskBase):
    id: int

    actual_hours: Optional[float] = None

    revision_count: int

    created_by: Optional[int] = None

    created_at: Optional[datetime] = None

    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True
    )