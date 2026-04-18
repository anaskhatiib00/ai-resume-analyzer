from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analyze_resume_against_job(extracted_text: str, job_description: str):
    prompt = f"""
You are a professional resume reviewer.

Compare the resume against the job description and return valid JSON only.

Use this exact structure:
{{
  "summary": "short match summary",
  "matching_skills": ["skill 1", "skill 2", "skill 3"],
  "missing_skills": ["missing 1", "missing 2", "missing 3"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}}

Resume text:
{extracted_text}

Job description:
{job_description}
"""

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt
    )

    ai_text = response.output_text.strip()
    return json.loads(ai_text)