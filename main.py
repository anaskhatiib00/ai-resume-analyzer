import os

from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import fitz

from services.resume_analyzer import analyze_resume_against_job
from services.analysis_service import (
    save_analysis,
    get_all_analyses,
    get_analysis_by_id,
    delete_analysis_by_id
)

load_dotenv()

app = FastAPI()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "AI Resume Analyzer is running"}

@app.post("/analyze-resume")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    guest_id: str = Header(...)
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    pdf_bytes = await file.read()
    pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")

    extracted_text = ""
    for page in pdf_document:
        extracted_text += page.get_text()

    pdf_document.close()

    try:
        analysis_json = analyze_resume_against_job(extracted_text, job_description)
    except Exception:
        raise HTTPException(status_code=500, detail="AI analysis failed")

    save_analysis(file.filename, analysis_json, guest_id)

    return {
        "message": "Resume analyzed and saved successfully",
        "analysis": analysis_json
    }

@app.get("/analyses")
def get_analyses(guest_id: str = Header(...)):
    return {"analyses": get_all_analyses(guest_id)}

@app.get("/analyses/{analysis_id}")
def get_single_analysis(analysis_id: int, guest_id: str = Header(...)):
    analysis = get_analysis_by_id(analysis_id, guest_id)

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return analysis

@app.delete("/analyses/{analysis_id}")
def delete_analysis(analysis_id: int, guest_id: str = Header(...)):
    deleted = delete_analysis_by_id(analysis_id, guest_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {"message": "Analysis deleted successfully"}