from fastapi import FastAPI, UploadFile, File, HTTPException, Form
import fitz

from services.resume_analyzer import analyze_resume_against_job

app = FastAPI()

@app.get("/")
def home():
    return {"message": "AI Resume Analyzer is running"}

@app.post("/upload-resume")
async def upload_resume(
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

    return {
        "message": "Resume uploaded and analyzed successfully",
        "filename": file.filename,
        "analysis": analysis_json
    }