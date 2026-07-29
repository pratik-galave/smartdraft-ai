import os
import sys

# Ensure we can import from the root directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import chromadb
from dotenv import load_dotenv

from gmail.gmail_client import get_service, fetch_sent_emails

load_dotenv()

DB_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")

def main():
    print("="*60)
    print("Building RAG Vector Store for Tone Mimicry")
    print("="*60)

    # 1. Fetch Sent Emails
    print("Fetching sent emails from Gmail... (this may take a minute)")
    service = get_service()
    sent_emails = fetch_sent_emails(service, max_results=200) # Fetching up to 200 for now to be reasonably fast
    
    if not sent_emails:
        print("No sent emails found. Make sure your Gmail account has sent emails.")
        return

    print(f"Fetched {len(sent_emails)} sent emails.")

    # 2. Initialize ChromaDB
    print(f"Initializing local ChromaDB at {DB_DIR}...")
    client = chromadb.PersistentClient(path=DB_DIR)

    # 3. Create or get collection
    collection = client.get_or_create_collection(
        name="past_replies",
        metadata={"hnsw:space": "cosine"} # Use cosine similarity for text
    )

    # 4. Ingest into Chroma
    print("Embedding and indexing emails...")
    documents = []
    metadatas = []
    ids = []

    for email in sent_emails:
        # For retrieval, we primarily want to match on the content we replied to,
        # but the sent email itself represents our "reply".
        # We will embed the whole body. We could also just embed it directly.
        body_text = email["body"].strip()
        
        # Simple cleanup: skip extremely short or long emails
        if len(body_text) < 10 or len(body_text) > 4000:
            continue

        documents.append(body_text)
        metadatas.append({"subject": email["subject"], "to": email["to"], "id": email["id"]})
        ids.append(email["id"])

    if documents:
        # Upsert allows re-running this script to update existing records
        collection.upsert(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        print(f"Successfully indexed {len(documents)} emails in ChromaDB.")
    else:
        print("No valid emails found for indexing after filtering.")

if __name__ == "__main__":
    main()
