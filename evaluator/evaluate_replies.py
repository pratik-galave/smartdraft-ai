import json
import os
import re
import sys

# Ensure we can import from the root directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from dotenv import load_dotenv
from openai import OpenAI

from common.utils import retry

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
You are an expert evaluator of AI-generated email replies.

Evaluate the reply using ONLY these criteria.

1. relevance
Does the reply directly address the email?

2. tone
Is the reply polite, natural and appropriate?

3. completeness
Does it answer the email and provide an appropriate next step?

4. accuracy
Does it avoid inventing facts or making unsupported claims?

5. conciseness
Is it concise while remaining useful?

Each score must be an integer from 1 to 5.

Return ONLY valid JSON in exactly this format:

{
    "relevance": 5,
    "tone": 4,
    "completeness": 4,
    "accuracy": 5,
    "conciseness": 4,
    "justification": "Short explanation."
}

Return JSON only.
Do not use markdown.
"""

INPUT_FILE = "data/replies.json"
OUTPUT_FILE = "data/scores.json"

# ----------------------------------------------------
# JSON extraction helper (robust for local models)
# ----------------------------------------------------

def extract_json(text: str) -> str:
    """
    Robustly extract a JSON object from raw model output.
    Handles markdown fences, stray prose, and bare JSON.
    """
    # 1) Strip markdown fences (```json ... ``` or ``` ... ```)
    fenced = re.search(r"```(?:json)?\s*([\s\S]+?)```", text, re.IGNORECASE)
    if fenced:
        return fenced.group(1).strip()

    # 2) Find the first { ... } block (greedy, covers nested objects)
    obj_match = re.search(r"\{[\s\S]+\}", text)
    if obj_match:
        return obj_match.group(0).strip()

    # 3) Return as-is and let json.loads raise with a meaningful error
    return text.strip()


# ----------------------------------------------------
# Load replies
# ----------------------------------------------------

def load_replies():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


# ----------------------------------------------------
# LLM backends
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


def call_llm(system_prompt: str, user_prompt: str, temperature: float = 0.0) -> str:
    if LLM_PROVIDER == "ollama":
        return _call_ollama(system_prompt, user_prompt, temperature)
    return _call_groq(system_prompt, user_prompt, temperature)


# ----------------------------------------------------
# Evaluate
# ----------------------------------------------------

def evaluate_single_reply(email, reply):
    if not reply:
        return None

    user_prompt = f"""
Original Email

Subject:
{email['subject']}

Body:
{email['body']}

----------------------------------------

Generated Reply

{reply}
"""

    raw = call_llm(SYSTEM_PROMPT, user_prompt, temperature=0)

    # Robust JSON extraction — important for local models that add prose
    cleaned = extract_json(raw)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        print(f"[evaluate] JSON parse failed. Raw output:\n{raw[:300]}")
        return None


def main():
    print(f"[SmartDraft Evaluator] LLM Provider: {LLM_PROVIDER.upper()}")
    if LLM_PROVIDER == "ollama":
        print(f"[SmartDraft Evaluator] Ollama URL  : {OLLAMA_BASE_URL}")
        print(f"[SmartDraft Evaluator] Ollama Model: {OLLAMA_MODEL}")

    replies = load_replies()
    scores = []
    totals = {
        "relevance": 0,
        "tone": 0,
        "completeness": 0,
        "accuracy": 0,
        "conciseness": 0,
    }

    for item in replies:
        # Skip emails that intentionally received no reply
        if item.get("status") == "SKIPPED":
            print(f"Skipping evaluation: {item.get('subject', item['id'])}")
            continue

        if "original_email" not in item:
            print(f"Skipping malformed entry: {item.get('id')}")
            continue

        email = item["original_email"]
        reply = item["generated_reply"]

        evaluation = evaluate_single_reply(email, reply)
        if not evaluation:
            print(f"Failed to parse evaluation for {item['id']}")
            continue

        overall = (
            evaluation["relevance"]
            + evaluation["tone"]
            + evaluation["completeness"]
            + evaluation["accuracy"]
            + evaluation["conciseness"]
        ) / 5

        scores.append(
            {
                "id": item["id"],
                "overall": round(overall, 2),
                "scores": evaluation,
            }
        )

        for key in totals:
            totals[key] += evaluation[key]

    # ----------------------------------------------------
    # Save Scores
    # ----------------------------------------------------

    os.makedirs("data", exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(
            scores,
            f,
            indent=4,
            ensure_ascii=False,
        )

    # ----------------------------------------------------
    # Summary
    # ----------------------------------------------------

    if len(scores) == 0:
        print("\n========================================")
        print("No replies were evaluated.")
        print("This usually means:")
        print("- All Gmail emails were newsletters/promotions.")
        print("- All emails were skipped intentionally.")
        print("========================================")
        return

    n = len(scores)

    averages = {
        key: round(value / n, 2)
        for key, value in totals.items()
    }

    overall_score = round(
        sum(averages.values()) / len(averages),
        2,
    )

    lowest = min(
        scores,
        key=lambda x: x["overall"],
    )

    print("\n========== Evaluation Summary ==========\n")

    print(f"Overall Score : {overall_score}/5\n")

    for criterion, value in averages.items():
        print(f"{criterion.capitalize():15}: {value}")

    print("\nLowest Scoring Email")
    print("--------------------")
    print(f"ID: {lowest['id']}")
    print(f"Score: {lowest['overall']}/5")
    print(f"Reason: {lowest['scores']['justification']}")

    print(f"\nSaved detailed scores to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()