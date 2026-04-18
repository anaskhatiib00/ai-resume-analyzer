from fastapi import FastAPI, UploadFile, File, HTTPException, Form
import fitz
import json

from services.resume_analyzer import analyze_resume_against_job
from database import SessionLocal
from models import ResumeAnalysis

app = FastAPI()

@app.get("/")
def home():
    return {"message": "AI Resume Analyzer is running"}

@app.post("/analyze-resume")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...)
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

    db = SessionLocal()

    new_record = ResumeAnalysis(
        filename=file.filename,
        summary=analysis_json.get("summary"),
        matching_skills=json.dumps(analysis_json.get("matching_skills")),
        missing_skills=json.dumps(analysis_json.get("missing_skills")),
        suggestions=json.dumps(analysis_json.get("suggestions"))
    )

    db.add(new_record)
    db.commit()
    db.close()

    return {
        "message": "Resume analyzed and saved successfully",
        "analysis": analysis_json
    }