from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from classifier import classifier

app = FastAPI(title="Smart Hostel AI Triage Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TriageRequest(BaseModel):
    title: str
    description: str

@app.get("/")
def home():
    return {"service": "Smart Hostel AI Microservice", "status": "online"}

@app.post("/predict-category/")
def triage_complaint(request: TriageRequest):
    return classifier.analyze(request.title, request.description)