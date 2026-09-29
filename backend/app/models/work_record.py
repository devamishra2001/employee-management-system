from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    DECIMAL,
    ForeignKey,
    TIMESTAMP
)

from sqlalchemy.sql import func

from app.database import Base


class WorkRecord(Base):

    __tablename__ = "work_records"


    id = Column(
        Integer,
        primary_key=True,
        index=True
    )


    employee_id = Column(
        Integer,
        ForeignKey("employees.id"),
        nullable=False
    )


    task_id = Column(
        Integer,
        ForeignKey("tasks.id"),
        nullable=True
    )


    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=True
    )


    work_date = Column(
        Date,
        nullable=False
    )


    work_type = Column(
        String(100),
        nullable=True
    )


    title = Column(
        String(255),
        nullable=True
    )


    description = Column(
        Text,
        nullable=True
    )


    hours_spent = Column(
        DECIMAL(5, 2),
        nullable=True
    )


    status = Column(
        String(50),
        nullable=True
    )


    progress_percentage = Column(
        Integer,
        nullable=True
    )


    remarks = Column(
        Text,
        nullable=True
    )


    created_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        nullable=True
    )


    updated_at = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=True
    )