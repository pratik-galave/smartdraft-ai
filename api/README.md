# SmartDraft AI API

This is the FastAPI backend wrapping the core email generation and evaluation logic.

## Setup & Running Locally

1. Create a virtual environment (optional but recommended) and install dependencies:
```bash
pip install -r requirements-api.txt
```

2. Run the server using `uvicorn`:
```bash
uvicorn api.main:app --reload
```

3. The API will be accessible at `http://127.0.0.1:8000`. You can visit `http://127.0.0.1:8000/docs` to see the interactive Swagger UI and test the endpoints.

## Endpoints

- `GET /emails`: Get list of emails (use `?source=gmail` to fetch from Gmail, otherwise reads `data/emails.json`)
- `POST /emails/{email_id}/generate`: Generates and evaluates a reply
- `POST /emails/{email_id}/regenerate`: Regenerates a reply given an optional `instruction` body parameter
- `POST /emails/{email_id}/approve`: Approves a reply and performs the specified `action` ("draft" or "send")
- `GET /emails/{email_id}/scores`: Retrieves previously saved scores for an email
