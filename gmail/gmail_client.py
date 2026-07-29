import base64
import os
import pickle

from email.mime.text import MIMEText
from email.utils import parseaddr
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CREDENTIALS_PATH = os.path.join(BASE_DIR, "credentials.json")
TOKEN_PATH = os.path.join(BASE_DIR, "token.pickle")

_cached_service = None

def get_service():
    global _cached_service
    if _cached_service is not None:
        return _cached_service

    creds = None

    if os.path.exists(TOKEN_PATH):
        with open(TOKEN_PATH, "rb") as f:
            creds = pickle.load(f)

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())

    elif not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file(
            CREDENTIALS_PATH,
            SCOPES
        )

        creds = flow.run_local_server(port=0)

        with open(TOKEN_PATH, "wb") as f:
            pickle.dump(creds, f)

    _cached_service = build("gmail", "v1", credentials=creds)
    return _cached_service


def extract_body(payload):
    """
    Recursively extracts the plain text body.
    """

    if payload.get("mimeType") == "text/plain":
        data = payload.get("body", {}).get("data")

        if data:
            return base64.urlsafe_b64decode(data).decode(
                "utf-8",
                errors="ignore"
            )

    for part in payload.get("parts", []):
        text = extract_body(part)
        if text:
            return text

    return ""


def fetch_unread_emails(service, max_results=5):

    response = (
        service.users()
        .messages()
        .list(
            userId="me",
            labelIds=["INBOX", "UNREAD"],
            maxResults=max_results,
        )
        .execute()
    )

    messages = response.get("messages", [])

    emails = []

    for message in messages:

        full = (
            service.users()
            .messages()
            .get(
                userId="me",
                id=message["id"],
                format="full"
            )
            .execute()
        )

        headers = full["payload"]["headers"]

        subject = ""

        sender = ""

        for h in headers:

            if h["name"] == "Subject":
                subject = h["value"]

            elif h["name"] == "From":
                sender = h["value"]

        emails.append(
            {
                "id": message["id"],
                "threadId": full["threadId"],
                "subject": subject,
                "from": sender,
                "body": extract_body(full["payload"]),
            }
        )

    return emails

def fetch_sent_emails(service, max_results=500):
    """
    Fetches the user's previously sent emails for the RAG vector store.
    """
    response = (
        service.users()
        .messages()
        .list(
            userId="me",
            labelIds=["SENT"],
            maxResults=max_results,
        )
        .execute()
    )

    messages = response.get("messages", [])
    emails = []

    for message in messages:
        try:
            full = (
                service.users()
                .messages()
                .get(
                    userId="me",
                    id=message["id"],
                    format="full"
                )
                .execute()
            )

            headers = full["payload"]["headers"]
            subject = ""
            recipient = ""

            for h in headers:
                if h["name"] == "Subject":
                    subject = h["value"]
                elif h["name"] == "To":
                    recipient = h["value"]

            body = extract_body(full["payload"])
            if body and body.strip():
                emails.append(
                    {
                        "id": message["id"],
                        "threadId": full["threadId"],
                        "subject": subject,
                        "to": recipient,
                        "body": body.strip(),
                    }
                )
        except Exception as e:
            print(f"Failed to fetch or parse sent email {message['id']}: {e}")

    return emails

def create_draft_reply(service, to_email, subject, reply_body, thread_id):
    """
    Creates a Gmail draft reply in the same conversation thread.
    """

    # Extract just the email address if "Name <email@example.com>" is provided
    _, email_address = parseaddr(to_email)

    message = MIMEText(reply_body)

    message["to"] = email_address
    message["subject"] = f"Re: {subject}"

    raw = base64.urlsafe_b64encode(
        message.as_bytes()
    ).decode()

    draft = (
        service.users()
        .drafts()
        .create(
            userId="me",
            body={
                "message": {
                    "raw": raw,
                    "threadId": thread_id
                }
            }
        )
        .execute()
    )

    return draft


def send_reply(service, to_email, subject, reply_body, thread_id):
    """
    Sends a Gmail reply in the same conversation thread.
    """

    _, email_address = parseaddr(to_email)

    message = MIMEText(reply_body)

    message["to"] = email_address
    message["subject"] = f"Re: {subject}"

    raw = base64.urlsafe_b64encode(
        message.as_bytes()
    ).decode()

    sent_message = (
        service.users()
        .messages()
        .send(
            userId="me",
            body={
                "raw": raw,
                "threadId": thread_id
            }
        )
        .execute()
    )

    return sent_message


def get_email_by_id(service, message_id):
    full = (
        service.users()
        .messages()
        .get(
            userId="me",
            id=message_id,
            format="full"
        )
        .execute()
    )

    headers = full["payload"]["headers"]

    subject = ""
    sender = ""

    for h in headers:
        if h["name"] == "Subject":
            subject = h["value"]
        elif h["name"] == "From":
            sender = h["value"]

    return {
        "id": message_id,
        "threadId": full["threadId"],
        "subject": subject,
        "from": sender,
        "body": extract_body(full["payload"]),
    }