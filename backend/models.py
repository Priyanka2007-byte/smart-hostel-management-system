from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from database import Base
import enum

class UserRole(str, enum.Enum):
    STUDENT = "student"
    ADMIN = "admin"
    WARDEN = "warden"
    HOUSEKEEPING = "housekeeping"

class PassStatus(str, enum.Enum):
    PENDING_PARENT = "pending_parent"
    PENDING_MENTOR = "pending_mentor"
    APPROVED = "approved"
    REJECTED = "rejected"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    room_number = Column(String(20), nullable=True)
    role = Column(String(20), default=UserRole.STUDENT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String(50), nullable=False)  # Electrical, Plumbing, Cleaning
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), default="Medium")  # Low, Medium, Urgent
    status = Column(String(20), default="Open")      # Open, In-Progress, Resolved, Escalated
    sla_hours = Column(Integer, default=48)          # 24/48/72 hrs escalation
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class GatePass(Base):
    __tablename__ = "gate_passes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    reason = Column(String(255), nullable=False)
    out_time = Column(DateTime, nullable=False)
    in_time = Column(DateTime, nullable=False)
    parent_approval = Column(String(20), default="pending")
    mentor_approval = Column(String(20), default="pending")
    status = Column(String(30), default=PassStatus.PENDING_PARENT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())