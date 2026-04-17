from fastapi import FastAPI, UploadFile, File, HTTPException
import fitz

app = FastAPI()

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

    return {
        "message": "Resume uploaded and text extracted successfully",
        "filename": file.filename,
        "text": extracted_text
    }