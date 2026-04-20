from sqlalchemy import Column, Integer, String, Text
from database import engine
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id = Column(Integer, primary_key=True, index=True)
    guest_id = Column(String, index=True)
    filename = Column(String)
    summary = Column(Text)
    matching_skills = Column(Text)
    missing_skills = Column(Text)
    suggestions = Column(Text)

Base.metadata.create_all(bind=engine)