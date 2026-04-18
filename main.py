from fastapi import FastAPI, UploadFile, File, HTTPException
from openai import OpenAI
from dotenv import load_dotenv
import fitz
import os
import json

load_dotenv()

app = FastAPI()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.get("/")
def home():
    return {"message": "AI Resume Analyzer is running"}

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    pdf_bytes = await file.read()
    pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")

    extracted_text = ""
    for page in pdf_document:
        extracted_text += page.get_text()

    pdf_document.close()

    prompt = f"""
You are a professional resume reviewer.

Analyze the resume below and return valid JSON only.

Use this exact structure:
{{
  "summary": "short professional summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}}

Resume text:
{extracted_text}
"""

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt
    )

    ai_text = response.output_text.strip()

    try:
        analysis_json = json.loads(ai_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI did not return valid JSON")

    return {
        "message": "Resume uploaded and analyzed successfully",
        "filename": file.filename,
        "analysis": analysis_json
    }