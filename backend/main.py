from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from database import engine, Base, get_db
import models
import schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Hostel Management System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "success", "message": "Smart Hostel Backend API is running!"}

# --- USER ENDPOINTS ---
@app.post("/users/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(**user.model_dump())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

# --- COMPLAINT ENDPOINTS ---
@app.post("/complaints/", response_model=schemas.ComplaintResponse, status_code=status.HTTP_201_CREATED)
def file_complaint(complaint: schemas.ComplaintCreate, db: Session = Depends(get_db)):
    student = db.query(models.User).filter(models.User.id == complaint.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    new_complaint = models.Complaint(**complaint.model_dump())
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    return new_complaint

@app.get("/complaints/", response_model=List[schemas.ComplaintResponse])
def get_complaints(db: Session = Depends(get_db)):
    return db.query(models.Complaint).all()

# --- GATE PASS ENDPOINTS ---
@app.post("/gate-passes/", response_model=schemas.GatePassResponse, status_code=status.HTTP_201_CREATED)
def apply_gate_pass(gate_pass: schemas.GatePassCreate, db: Session = Depends(get_db)):
    student = db.query(models.User).filter(models.User.id == gate_pass.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    new_pass = models.GatePass(**gate_pass.model_dump())
    db.add(new_pass)
    db.commit()
    db.refresh(new_pass)
    return new_pass

@app.get("/gate-passes/", response_model=List[schemas.GatePassResponse])
def get_gate_passes(db: Session = Depends(get_db)):
    return db.query(models.GatePass).all()