from sqlalchemy import (
    Column,
    Date,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    TIMESTAMP
)

from sqlalchemy.sql import func

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    project_code = Column(
        String(50),
        unique=True,
        nullable=False
    )

    project_title = Column(
        String(255),
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    priority = Column(
        Enum(
            "low",
            "medium",
            "high",
            "urgent"
        ),
        nullable=False,
        default="medium"
    )

    status = Column(
        Enum(
            "new",
            "in_progress",
            "on_hold",
            "completed",
            "cancelled"
        ),
        nullable=False,
        default="new"
    )

    start_date = Column(
        Date,
        nullable=True
    )

    deadline = Column(
        Date,
        nullable=True
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    created_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )