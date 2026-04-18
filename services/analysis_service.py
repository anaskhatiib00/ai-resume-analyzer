import json

from database import SessionLocal
from models import ResumeAnalysis

def save_analysis(filename: str, analysis_json: dict):
    db = SessionLocal()

    new_record = ResumeAnalysis(
        filename=filename,
        summary=analysis_json.get("summary"),
        matching_skills=json.dumps(analysis_json.get("matching_skills")),
        missing_skills=json.dumps(analysis_json.get("missing_skills")),
        suggestions=json.dumps(analysis_json.get("suggestions"))
    )

    db.add(new_record)
    db.commit()
    db.close()

def get_all_analyses():
    db = SessionLocal()
    analyses = db.query(ResumeAnalysis).all()
    db.close()

    results = []

    for analysis in analyses:
        results.append({
            "id": analysis.id,
            "filename": analysis.filename,
            "summary": analysis.summary,
            "matching_skills": json.loads(analysis.matching_skills),
            "missing_skills": json.loads(analysis.missing_skills),
            "suggestions": json.loads(analysis.suggestions)
        })

    return results

def get_analysis_by_id(analysis_id: int):
    db = SessionLocal()
    analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.id == analysis_id).first()
    db.close()

    if not analysis:
        return None

    return {
        "id": analysis.id,
        "filename": analysis.filename,
        "summary": analysis.summary,
        "matching_skills": json.loads(analysis.matching_skills),
        "missing_skills": json.loads(analysis.missing_skills),
        "suggestions": json.loads(analysis.suggestions)
    }

def delete_analysis_by_id(analysis_id: int):
    db = SessionLocal()
    analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.id == analysis_id).first()

    if not analysis:
        db.close()
        return False

    db.delete(analysis)
    db.commit()
    db.close()
    return True