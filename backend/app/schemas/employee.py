from datetime import date, datetime
from typing import Optional, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


EmploymentStatus = Literal[
    "active",
    "inactive",
    "resigned"
]


class EmployeeCreate(BaseModel):
    # User account
    username: str = Field(min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6)

    # Employee information
    employee_code: str = Field(min_length=1, max_length=50)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[int] = Field(default=None, gt=0)
    joining_date: Optional[date] = None

    employment_status: EmploymentStatus = "active"


class EmployeeUpdate(BaseModel):
    username: Optional[str] = Field(
        default=None,
        min_length=3,
        max_length=100
    )

    email: Optional[EmailStr] = None

    employee_code: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None

    department_id: Optional[int] = Field(
        default=None,
        gt=0
    )

    joining_date: Optional[date] = None

    employment_status: Optional[
        EmploymentStatus
    ] = None


class EmployeeStatusUpdate(BaseModel):
    employment_status: EmploymentStatus


class EmployeeResponse(BaseModel):
    id: int
    user_id: Optional[int] = None

    username: Optional[str] = None
    email: Optional[str] = None

    employee_code: str
    first_name: str
    last_name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None

    department_id: Optional[int] = None
    department_name: Optional[str] = None

    joining_date: Optional[date] = None

    employment_status: str

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True
    )