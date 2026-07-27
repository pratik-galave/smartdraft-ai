import json
import os

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

USE_GMAIL = True          # True -> Gmail | False -> data/emails.json
YOUR_NAME = os.getenv("YOUR_NAME", "Pratik")

EMAILS_FILE = "data/emails.json"
OUTPUT_FILE = "data/replies.json"

load_dotenv()

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY") or os.getenv("API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

MODEL_NAME = "llama-3.3-70b-versatile"

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
"""

# ----------------------------------------------------
# Generic LLM Call
# ----------------------------------------------------


def call_llm(system_prompt, user_prompt, temperature=0.4):
    response = retry(
        lambda: client.chat.completions.create(
            model=MODEL_NAME,
            temperature=temperature,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
        )
    )

    return response.choices[0].message.content.strip()


# ----------------------------------------------------
# Decide Whether Email Needs Reply
# ----------------------------------------------------


def should_reply(email):
    prompt = f"""
Is this email something that a person would realistically reply to?

Reply ONLY with:

REPLY

or

SKIP

Reply REPLY if it is:
- Personal email
- Work email
- Request
- Invitation
- Question
- Conversation
- Someone expecting a response

Reply SKIP if it is:
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
        "You are an email classifier. Reply with ONLY REPLY or SKIP.",
        prompt,
        temperature=0,
    )

    return result.upper().startswith("REPLY")


# ----------------------------------------------------
# Generate Reply
# ----------------------------------------------------


def generate_reply(email, instruction=None):
    filled_prompt = SYSTEM_PROMPT.format(
        your_name=YOUR_NAME
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
# Load Emails
# ----------------------------------------------------

if USE_GMAIL:

    service = get_service()

    emails = fetch_unread_emails(
        service,
        max_results=5,
    )

    print(f"Fetched {len(emails)} unread emails from Gmail.")

else:

    with open(EMAILS_FILE, "r", encoding="utf-8") as f:
        emails = json.load(f)

    print(f"Loaded {len(emails)} emails from dataset.")

# ----------------------------------------------------
# Main Loop
# ----------------------------------------------------

generated_replies = []

for email in emails:

    print("\n" + "=" * 60)
    print(f"Processing: {email['subject']}")
    print("=" * 60)

    if not should_reply(email):

        print("Skipped (no reply required).")

        generated_replies.append(
            {
                "id": email["id"],
                "status": "SKIPPED",
                "subject": email["subject"],
                "generated_reply": None,
            }
        )

        continue

    print("Generating reply...")

    reply = generate_reply(email)

    if USE_GMAIL:

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
        }
    )

# ----------------------------------------------------
# Save Replies
# ----------------------------------------------------

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