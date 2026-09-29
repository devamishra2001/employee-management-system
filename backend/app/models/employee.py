from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    Enum,
    ForeignKey,
    TIMESTAMP
)

from sqlalchemy.sql import func

from app.database import Base


class Employee(Base):

    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        unique=True
    )

    employee_code = Column(
        String(50),
        unique=True,
        nullable=False
    )

    first_name = Column(
        String(100),
        nullable=False
    )

    last_name = Column(
        String(100),
        nullable=True
    )

    phone = Column(
        String(20),
        nullable=True
    )

    designation = Column(
        String(100),
        nullable=True
    )

    department_id = Column(
        Integer,
        ForeignKey("departments.id"),
        nullable=True
    )

    joining_date = Column(
        Date,
        nullable=True
    )

    employment_status = Column(
        Enum(
            "active",
            "inactive",
            "resigned"
        ),
        default="active"
    )

    profile_photo = Column(
        String(500),
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