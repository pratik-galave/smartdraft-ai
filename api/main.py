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

load_dotenv()

from generator.generate_replies import should_reply, generate_reply
from evaluator.evaluate_replies import evaluate_single_reply
from gmail.gmail_client import get_service, fetch_unread_emails, create_draft_reply, send_reply, get_email_by_id
from api.auth import auth_router, get_current_user
from fastapi import Depends

# ---- LLM provider config (read once at startup) ----
LLM_PROVIDER    = os.getenv("LLM_PROVIDER", "groq").lower()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "llama3")
GROQ_MODEL_NAME = "llama-3.3-70b-versatile"

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

app.include_router(auth_router)

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

# ----------------------------------------------------
# Status / Provider Info
# ----------------------------------------------------

@app.get("/status")
def get_status():
    """
    Returns the active LLM provider and relevant model information.
    The frontend uses this to display a 'Local / Private Mode' badge.
    """
    if LLM_PROVIDER == "ollama":
        return {
            "provider": "ollama",
            "model": OLLAMA_MODEL,
            "base_url": OLLAMA_BASE_URL,
            "private_mode": True,
            "label": "Local / Private Mode (Ollama)",
        }
    return {
        "provider": "groq",
        "model": GROQ_MODEL_NAME,
        "base_url": "https://api.groq.com/openai/v1",
        "private_mode": False,
        "label": "Cloud Mode (Groq)",
    }


@app.get("/emails")
def get_emails(source: Optional[str] = Query(None), current_user: dict = Depends(get_current_user)):
    try:
        if source == "gmail":
            service = get_service()
            emails = fetch_unread_emails(service, max_results=10)
        else:
            emails = load_json("data/emails.json")
            
        # Enrich with local JSON data if available
        replies_data = {r["id"]: r for r in load_json("data/replies.json")}
        scores_data = {s["id"]: s for s in load_json("data/scores.json")}
        
        enriched_emails = []
        for e in emails:
            e_id = e["id"]
            reply_data = replies_data.get(e_id, {})
            e["reply_status"] = reply_data.get("status")
            e["generated_reply"] = reply_data.get("generated_reply")
            
            score = scores_data.get(e_id)
            if score and "overall" in score:
                # Convert 1-5 score to 0-100 percentage
                e["quality_score"] = int(score["overall"] * 20)
            else:
                e["quality_score"] = None
                
            enriched_emails.append(e)
            
        return enriched_emails
    except Exception as e:
        print(f"Error fetching emails: {e}")
        raise HTTPException(status_code=500, detail={"error": "Failed to fetch emails", "message": str(e)})

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
def generate(email_id: str, current_user: dict = Depends(get_current_user)):
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
        print(f"Error generating reply: {e}")
        raise HTTPException(status_code=500, detail={"error": "Generation failed", "message": str(e)})


@app.post("/emails/{email_id}/regenerate")
def regenerate(email_id: str, request: RegenerateRequest, current_user: dict = Depends(get_current_user)):
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
        print(f"Error regenerating reply: {e}")
        raise HTTPException(status_code=500, detail={"error": "Regeneration failed", "message": str(e)})


@app.post("/emails/{email_id}/approve")
def approve(email_id: str, request: ApproveRequest, current_user: dict = Depends(get_current_user)):
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
        print(f"Error approving email: {e}")
        raise HTTPException(status_code=500, detail={"error": "Approval failed", "message": str(e)})


@app.get("/emails/{email_id}/scores")
def get_scores(email_id: str, current_user: dict = Depends(get_current_user)):
    scores = load_json("data/scores.json")
    for s in scores:
        if s["id"] == email_id:
            return s
            
    raise HTTPException(status_code=404, detail="Scores not found for this email")
