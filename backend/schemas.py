from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# User Schemas
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    room_number: Optional[str] = None
    role: Optional[str] = "student"

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    room_number: Optional[str] = None
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Complaint Schemas
class ComplaintCreate(BaseModel):
    student_id: int
    category: str
    title: str
    description: str
    priority: Optional[str] = "Medium"

class ComplaintResponse(BaseModel):
    id: int
    student_id: int
    category: str
    title: str
    description: str
    priority: str
    status: str
    sla_hours: int
    created_at: datetime

    class Config:
        from_attributes = True

# Gate Pass Schemas
class GatePassCreate(BaseModel):
    student_id: int
    reason: str
    out_time: datetime
    in_time: datetime

class GatePassResponse(BaseModel):
    id: int
    student_id: int
    reason: str
    out_time: datetime
    in_time: datetime
    status: str
    parent_approval: str
    mentor_approval: str
    created_at: datetime

    class Config:
        from_attributes = True