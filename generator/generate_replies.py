import json
import os
import re
import sys

# Ensure we can import from the root directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
import chromadb
from dotenv import load_dotenv
from openai import OpenAI

from common.utils import retry
from gmail.gmail_client import (
    get_service,
    fetch_unread_emails,
    create_draft_reply,
)

# ----------------------------------------------------
# Configuration
# ----------------------------------------------------

def get_gmail_service():
    return get_service()


USE_GMAIL = True          # True -> Gmail | False -> data/emails.json
YOUR_NAME = os.getenv("YOUR_NAME", "Pratik")

EMAILS_FILE = "data/emails.json"
OUTPUT_FILE = "data/replies.json"

load_dotenv()

# ---- LLM provider selection ----
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

# Groq client (only used when LLM_PROVIDER == "groq")
_groq_client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY") or os.getenv("API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

GROQ_MODEL_NAME = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """
You are drafting an email reply on behalf of {your_name}.

Write the reply in first person, as if {your_name} is personally responding to their own inbox.

Guidelines:
- Write naturally and conversationally.
- Match the sender's tone.
- Be polite and friendly.
- Keep the reply concise.
- Do NOT sound like a customer support representative.
- Do NOT use corporate boilerplate such as:
    "Thank you for reaching out."
    "We appreciate your patience."
    "Customer Support Team"
- Respond as an individual.
- End naturally.

{rag_examples}
"""

# ----------------------------------------------------
# Vector Store / RAG Setup
# ----------------------------------------------------

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "chroma_db")

try:
    _chroma_client = chromadb.PersistentClient(path=DB_DIR)
    _rag_collection = _chroma_client.get_collection(name="past_replies")
except Exception:
    _chroma_client = None
    _rag_collection = None


def get_rag_examples(query_text: str, n_results: int = 3) -> str:
    """
    Queries the local vector store for similar emails and formats them as examples.
    """
    if not _rag_collection:
        return ""

    try:
        results = _rag_collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        
        docs = results.get("documents", [[]])[0]
        if not docs:
            return ""

        rag_section = "<past_examples_of_user_tone>\n"
        rag_section += "Here are some real examples of how the user has replied in the past. MIMIC THEIR TONE, GREETING, AND SIGN-OFF EXACTLY.\n\n"
        
        for i, doc in enumerate(docs, 1):
            rag_section += f"--- Example {i} ---\n{doc.strip()}\n\n"
        
        rag_section += "</past_examples_of_user_tone>\n"
        return rag_section

    except Exception as e:
        print(f"RAG retrieval failed: {e}")
        return ""

# ----------------------------------------------------
# JSON extraction helper (robust for local models)
# ----------------------------------------------------

def extract_json(text: str) -> str:
    """
    Try to isolate a JSON object/array from raw model output.
    Handles:
      - Bare JSON
      - ```json ... ``` fences
      - Stray leading/trailing text
    """
    # 1) Strip markdown fences
    fenced = re.search(r"```(?:json)?\s*([\s\S]+?)```", text, re.IGNORECASE)
    if fenced:
        return fenced.group(1).strip()

    # 2) Find the first { ... } block
    obj_match = re.search(r"\{[\s\S]+\}", text)
    if obj_match:
        return obj_match.group(0).strip()

    # 3) Return as-is and let json.loads raise
    return text.strip()


# ----------------------------------------------------
# Generic LLM Call
# ----------------------------------------------------

def _call_groq(system_prompt: str, user_prompt: str, temperature: float) -> str:
    response = retry(
        lambda: _groq_client.chat.completions.create(
            model=GROQ_MODEL_NAME,
            temperature=temperature,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
        )
    )
    return response.choices[0].message.content.strip()


def _call_ollama(system_prompt: str, user_prompt: str, temperature: float) -> str:
    url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/chat"
    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "options": {"temperature": temperature},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
    }

    def _do_request():
        resp = requests.post(url, json=payload, timeout=120)
        resp.raise_for_status()
        return resp.json()["message"]["content"].strip()

    return retry(_do_request)


def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.4) -> str:
    if LLM_PROVIDER == "ollama":
        return _call_ollama(system_prompt, user_prompt, temperature)
    return _call_groq(system_prompt, user_prompt, temperature)


# ----------------------------------------------------
# Decide Whether Email Needs Reply
# ----------------------------------------------------


def should_reply(email):
    prompt = f"""
Is this email something that a person would realistically reply to?

Reply with a valid JSON object strictly adhering to this format:
{{
    "needs_reply": true or false,
    "triage_reason": "A short reason why"
}}

Set needs_reply to true if it is:
- Personal email
- Work email
- Request
- Invitation
- Question
- Conversation
- Someone expecting a response

Set needs_reply to false if it is:
- Newsletter
- Marketing email
- Promotional offer
- Advertisement
- OTP
- Receipt
- Order confirmation
- Shipping notification
- Automated notification
- Spam

Subject:
{email["subject"]}

Body:
{email["body"][:1500]}
"""

    result = call_llm(
        "You are an email classifier. Output ONLY valid JSON.",
        prompt,
        temperature=0,
    )

    try:
        data = json.loads(extract_json(result))
        return {
            "needs_reply": bool(data.get("needs_reply", False)),
            "triage_reason": data.get("triage_reason", "No reason provided")
        }
    except Exception as e:
        print(f"Error parsing should_reply JSON: {e}")
        return {"needs_reply": False, "triage_reason": "Classification parsing failed"}


# ----------------------------------------------------
# Generate Reply
# ----------------------------------------------------


def generate_reply(email, instruction=None):
    
    # 1. Fetch RAG examples
    rag_examples = get_rag_examples(email['body'], n_results=3)
    
    if rag_examples:
        print(f"  [RAG] Found and injected past reply examples.")

    filled_prompt = SYSTEM_PROMPT.format(
        your_name=YOUR_NAME,
        rag_examples=rag_examples
    )

    user_prompt = f"""
Subject:
{email['subject']}

Email:
{email['body']}
"""

    if instruction:
        user_prompt += f"\nAdditional Instruction:\n{instruction}\n"

    return call_llm(
        filled_prompt,
        user_prompt,
        temperature=0.4,
    )


# ----------------------------------------------------
# Main Execution
# ----------------------------------------------------

def main():
    print(f"[SmartDraft] LLM Provider: {LLM_PROVIDER.upper()}")
    if LLM_PROVIDER == "ollama":
        print(f"[SmartDraft] Ollama URL  : {OLLAMA_BASE_URL}")
        print(f"[SmartDraft] Ollama Model: {OLLAMA_MODEL}")

    if USE_GMAIL:
        service = get_gmail_service()
        emails = fetch_unread_emails(
            service,
            max_results=5,
        )
        print(f"Fetched {len(emails)} unread emails from Gmail.")
    else:
        with open(EMAILS_FILE, "r", encoding="utf-8") as f:
            emails = json.load(f)
        print(f"Loaded {len(emails)} emails from dataset.")

    generated_replies = []

    for email in emails:
        print("\n" + "=" * 60)
        print(f"Processing: {email['subject']}")
        print("=" * 60)

        triage = should_reply(email)
        if not triage["needs_reply"]:
            print(f"Skipped: {triage['triage_reason']}")
            generated_replies.append(
                {
                    "id": email["id"],
                    "status": "SKIPPED",
                    "subject": email["subject"],
                    "generated_reply": None,
                    "triage_reason": triage["triage_reason"]
                }
            )
            continue

        print("Generating reply...")
        reply = generate_reply(email)

        if USE_GMAIL:
            service = get_gmail_service()
            create_draft_reply(
                service=service,
                to_email=email["from"],
                subject=email["subject"],
                reply_body=reply,
                thread_id=email["threadId"],
            )
            print("✓ Gmail draft created.")

        generated_replies.append(
            {
                "id": email["id"],
                "original_email": {
                    "subject": email["subject"],
                    "body": email["body"],
                },
                "generated_reply": reply,
                "status": "REPLIED",
                "triage_reason": triage["triage_reason"],
            }
        )

    os.makedirs("data", exist_ok=True)
    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            generated_replies,
            f,
            indent=4,
            ensure_ascii=False,
        )

    print("\n" + "=" * 60)
    print(f"Processed : {len(emails)} emails")
    print(f"Saved     : {OUTPUT_FILE}")
    print("=" * 60)

if __name__ == "__main__":
    main()