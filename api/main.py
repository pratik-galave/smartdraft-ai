import os
import json
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Ensure we can import from the root directory
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from generator.generate_replies import should_reply, generate_reply
from evaluator.evaluate_replies import evaluate_single_reply
from gmail.gmail_client import get_service, fetch_unread_emails, create_draft_reply, send_reply, get_email_by_id

load_dotenv()

app = FastAPI(title="SmartDraft AI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "*" # Allow all for development flexibility, restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class RegenerateRequest(BaseModel):
    instruction: Optional[str] = None

class ApproveRequest(BaseModel):
    reply_body: str
    action: str = "draft"  # "draft" or "send"

# Helper for loading JSON data
def load_json(filepath):
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/emails")
def get_emails(source: Optional[str] = Query(None)):
    try:
        if source == "gmail":
            service = get_service()
            emails = fetch_unread_emails(service, max_results=10)
            return emails
        else:
            return load_json("data/emails.json")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _get_email(email_id: str):
    # Try finding in JSON first
    emails = load_json("data/emails.json")
    for em in emails:
        if em["id"] == email_id:
            return em
            
    # If not in JSON, try fetching from Gmail API
    try:
        service = get_service()
        return get_email_by_id(service, email_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Email not found")


@app.post("/emails/{email_id}/generate")
def generate(email_id: str):
    email = _get_email(email_id)
    
    try:
        if not should_reply(email):
            return {"status": "SKIPPED", "reply": None, "scores": None}

        reply = generate_reply(email)
        scores = evaluate_single_reply(email, reply)

        return {
            "status": "REPLIED",
            "reply": reply,
            "scores": scores
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/emails/{email_id}/regenerate")
def regenerate(email_id: str, request: RegenerateRequest):
    email = _get_email(email_id)
    
    try:
        if not should_reply(email):
            return {"status": "SKIPPED", "reply": None, "scores": None}

        reply = generate_reply(email, instruction=request.instruction)
        scores = evaluate_single_reply(email, reply)

        return {
            "status": "REPLIED",
            "reply": reply,
            "scores": scores
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/emails/{email_id}/approve")
def approve(email_id: str, request: ApproveRequest):
    email = _get_email(email_id)
    
    try:
        service = get_service()
        if request.action == "draft":
            create_draft_reply(
                service=service,
                to_email=email["from"],
                subject=email["subject"],
                reply_body=request.reply_body,
                thread_id=email.get("threadId")
            )
            return {"status": "success", "message": "Draft created successfully"}
        elif request.action == "send":
            send_reply(
                service=service,
                to_email=email["from"],
                subject=email["subject"],
                reply_body=request.reply_body,
                thread_id=email.get("threadId")
            )
            return {"status": "success", "message": "Email sent successfully"}
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Must be 'draft' or 'send'.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/emails/{email_id}/scores")
def get_scores(email_id: str):
    scores = load_json("data/scores.json")
    for s in scores:
        if s["id"] == email_id:
            return s
            
    raise HTTPException(status_code=404, detail="Scores not found for this email")
