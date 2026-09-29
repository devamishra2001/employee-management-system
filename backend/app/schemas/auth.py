from typing import Optional

from pydantic import BaseModel


class LoginRequest(BaseModel):

    username: str
    password: str


class LoginResponse(BaseModel):

    access_token: str
    token_type: str

    user_id: int
    username: str
    role: str

    employee_id: Optional[int] = None


class CurrentUserResponse(BaseModel):

    user_id: int
    username: str
    email: str
    role: str

    employee_id: Optional[int] = None