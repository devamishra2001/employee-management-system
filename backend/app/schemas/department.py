from typing import Optional

from pydantic import BaseModel, ConfigDict


class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True
    )