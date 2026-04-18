from fastapi import FastAPI, UploadFile, File, HTTPException
from openai import OpenAI
from dotenv import load_dotenv
import fitz
import os

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

    Analyze this resume and return:
    1. A short summary
    2. Main strengths
    3. Main weaknesses
    4. Suggestions for improvement

    Resume text:
    {extracted_text}
    """

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt
    )

    return {
        "message": "Resume uploaded and analyzed successfully",
        "filename": file.filename,
        "analysis": response.output_text
    }