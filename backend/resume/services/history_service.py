# backend/resume/services/history_service.py

import os
import json
import uuid
from datetime import datetime
from typing import List, Dict, Union
from qdrant_client import QdrantClient
from qdrant_client.http import models as rest
from django.conf import settings
from .embedding_service import get_text_embedding
from dotenv import load_dotenv


load_dotenv()
QDRANT_URL = os.getenv("QDRANT_URL")  
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
EMBED_VECTOR_SIZE = 384


class ChatHistoryManager:
    """
    Manages saving, retrieving, and searching chat history.
    Stores data both locally (JSON) and in Qdrant for semantic search.
    """

    def __init__(self):
        # Initialize Qdrant client
        try:
            self.client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        except Exception as e:
            print(f"❌ WARNING: Failed to initialize Qdrant client for history: {e}")
            self.client = None

        self.embedding_size = EMBED_VECTOR_SIZE
        self.collection_name = "chat_history"
        self.local_file = os.path.join("data", "chat_history.json")

        # Ensure local storage exists
        os.makedirs("data", exist_ok=True)
        if not os.path.exists(self.local_file) or os.path.getsize(self.local_file) == 0:
            with open(self.local_file, "w") as f:
                json.dump([], f)

        # Ensure Qdrant collection
        if self.client:
            self._ensure_collection()
        else:
            print("⚠️ Skipping Qdrant collection setup due to client error.")

    # ------------------------------------------------------------
    # ✅ Create collection if not exists
    # ------------------------------------------------------------
    def _ensure_collection(self):
        if not self.client:
            return
        try:
            collections = [c.name for c in self.client.get_collections().collections]
            if self.collection_name not in collections:
                print(f"📦 Creating Qdrant collection for chat history: {self.collection_name}")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=rest.VectorParams(
                        size=self.embedding_size,
                        distance=rest.Distance.COSINE,
                    ),
                )
        except Exception as e:
            print(f"⚠️ Could not verify or create Qdrant collection: {e}")

    # ------------------------------------------------------------
    # ✅ Get embedding from model
    # ------------------------------------------------------------
    def _get_embedding(self, message: str) -> List[float]:
        try:
            return get_text_embedding(message)
        except Exception as e:
            print(f"ERROR: Failed to generate embedding for history: {e}")
            return [0.0] * self.embedding_size

    # ------------------------------------------------------------
    # ✅ Save chat interaction (general or doc-specific)
    # ------------------------------------------------------------
    def save_interaction(self, user_id: str, query: str, response: str, doc_s3_url: str = None):
        """Save a query-response pair (either general chat or document chat)."""
        timestamp = datetime.utcnow().isoformat()

        if doc_s3_url:
            # Document-based chat
            doc_name = os.path.basename(doc_s3_url)
            entry = {
                "user_id": user_id,
                "role": "assistant",
                "query": query,
                "response": response,
                "timestamp": timestamp,
                "chat_with_doc": {
                    doc_name: {
                        "query": query,
                        "response": response,
                        "timestamp": timestamp,
                        "s3_url": doc_s3_url,
                    }
                },
            }
            text_to_embed = f"Document: {doc_name}. Query: {query}"
        else:
            # General chat
            entry = {
                "user_id": user_id,
                "role": "assistant",
                "query": query,
                "response": response,
                "timestamp": timestamp,
            }
            text_to_embed = query

        # --- Save to local JSON ---
        try:
            with open(self.local_file, "r") as f:
                history = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            history = []

        history.append(entry)
        with open(self.local_file, "w") as f:
            json.dump(history, f, indent=2)

        # --- Save to Qdrant ---
        if not self.client:
            print("⚠️ Qdrant client not initialized, skipping vector save.")
            return

        emb = self._get_embedding(text_to_embed)
        point_id = str(uuid.uuid4())

        try:
            self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    rest.PointStruct(
                        id=point_id,
                        vector=emb,
                        payload=entry,
                    )
                ],
            )
        except Exception as e:
            print(f"❌ Error upserting interaction to Qdrant: {e}")

    # ------------------------------------------------------------
    # ✅ Retrieve conversation
    # ------------------------------------------------------------
    def get_conversation(self, user_id: str, limit: Union[int, None] = 10) -> List[Dict]:
        """Retrieve the latest N interaction pairs for a user from local backup."""
        try:
            with open(self.local_file, "r") as f:
                history = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []

        filtered = [h for h in history if h.get("user_id") == user_id]
        filtered.sort(key=lambda x: x.get("timestamp", "0"), reverse=True)

        return filtered[:limit] if limit else filtered

    # ------------------------------------------------------------
    # ✅ Semantic search
    # ------------------------------------------------------------
    def semantic_search_history(self, query: str, top_k: int = 5) -> List[Dict]:
        """Perform semantic search over chat history in Qdrant."""
        if not self.client:
            return []

        vector = self._get_embedding(query)
        try:
            search_res = self.client.search(
                collection_name=self.collection_name,
                query_vector=vector,
                limit=top_k,
            )
            return [hit.payload for hit in search_res]
        except Exception as e:
            print(f"❌ Error during semantic search: {e}")
            return []
