from fastapi import FastAPI, UploadFile, File, HTTPException

app = FastAPI()

@app.get("/")
def home():
    return {"message": "AI Resume Analyzer is running"}

@app.post("/upload-resume")
def upload_resume(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    return {
        "message": "Resume uploaded successfully",
        "filename": file.filename,
        "content_type": file.content_type
    }