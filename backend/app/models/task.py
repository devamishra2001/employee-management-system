from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Enum,
    ForeignKey,
    DateTime,
    DECIMAL,
    TIMESTAMP
)

from sqlalchemy.sql import func

from app.database import Base


class Task(Base):

    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=True
    )

    assigned_to = Column(
        Integer,
        ForeignKey("employees.id"),
        nullable=False
    )

    title = Column(
        String(255),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    work_type = Column(
        Enum(
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
        ),
        default="other"
    )

    priority = Column(
        Enum(
            "low",
            "medium",
            "high",
            "urgent"
        ),
        default="medium"
    )

    status = Column(
        Enum(
            "received",
            "pending",
            "in_progress",
            "delivered",
            "revision",
            "completed",
            "cancelled"
        ),
        default="received"
    )

    progress_percentage = Column(
        Integer,
        default=0
    )

    assigned_date = Column(
        DateTime,
        server_default=func.now()
    )

    start_date = Column(
        DateTime,
        nullable=True
    )

    deadline = Column(
        DateTime,
        nullable=True
    )

    completed_at = Column(
        DateTime,
        nullable=True
    )

    estimated_hours = Column(
        DECIMAL(8, 2),
        nullable=True
    )

    actual_hours = Column(
        DECIMAL(8, 2),
        nullable=True
    )

    revision_count = Column(
        Integer,
        default=0
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    created_at = Column(
        TIMESTAMP,
        server_default=func.now()
    )

    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now()
    )