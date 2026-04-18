from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analyze_resume_text(extracted_text: str):
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
    return json.loads(ai_text)