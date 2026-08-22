"""
NIRANTAR — Vector Knowledge Store with Snowflake Arctic Embeddings
==================================================================
Stores semantic knowledge (routes, Apify scraped documents, station networks)
using Snowflake Arctic (Snowflake/snowflake-arctic-embed-xs) with SQLite persistence.
"""

import os
import json
import sqlite3
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import numpy as np


class SnowflakeVectorStore:
    """Persistent Vector Database using Snowflake Arctic Embeddings & Cosine Similarity."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args: Any, **kwargs: Any) -> "SnowflakeVectorStore":
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(SnowflakeVectorStore, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self, db_path: str = "m0_digital_twin.db", model_name: str = "Snowflake/snowflake-arctic-embed-xs") -> None:
        if getattr(self, "_initialized", False):
            return

        self.db_path = db_path
        self.model_name = model_name
        self._model = None
        self._model_lock = threading.Lock()

        self._init_db()
        self._initialized = True

    def _get_model(self):
        """Lazy load Snowflake Arctic model on first vectorization call."""
        if self._model is None:
            with self._model_lock:
                if self._model is None:
                    try:
                        from sentence_transformers import SentenceTransformer
                        self._model = SentenceTransformer(self.model_name)
                    except Exception as exc:
                        raise RuntimeError(
                            f"Snowflake embedding model {self.model_name!r} is unavailable; no substitute model will be used."
                        ) from exc
        return self._model

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='vector_knowledge_store'")
        if not cur.fetchone():
            cur.execute("""
                CREATE TABLE IF NOT EXISTS vector_knowledge_store (
                    id TEXT PRIMARY KEY,
                    query TEXT NOT NULL,
                    content TEXT NOT NULL,
                    category TEXT NOT NULL,
                    embedding BLOB NOT NULL,
                    embedding_model TEXT NOT NULL,
                    metadata_json TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
            """)
            # Databases created before model provenance existed remain readable,
            # but their vectors are not comparable until re-embedded.
            columns = {row[1] for row in cur.execute("PRAGMA table_info(vector_knowledge_store)")}
            if "embedding_model" not in columns:
                cur.execute("ALTER TABLE vector_knowledge_store ADD COLUMN embedding_model TEXT NOT NULL DEFAULT 'unknown'")
            conn.commit()
        return conn

    def _init_db(self) -> None:
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("""
                CREATE TABLE IF NOT EXISTS vector_knowledge_store (
                id TEXT PRIMARY KEY,
                query TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT NOT NULL,
                    embedding BLOB NOT NULL,
                    embedding_model TEXT NOT NULL,
                metadata_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        """)
        columns = {row[1] for row in cur.execute("PRAGMA table_info(vector_knowledge_store)")}
        if "embedding_model" not in columns:
            cur.execute("ALTER TABLE vector_knowledge_store ADD COLUMN embedding_model TEXT NOT NULL DEFAULT 'unknown'")
        conn.commit()
        conn.close()

    def encode_text(self, text: str) -> np.ndarray:
        """Encode text to 384-dim normalized vector."""
        model = self._get_model()
        vec = model.encode([text], normalize_embeddings=True)[0]
        return vec.astype(np.float32)

    def add_document(self, doc_id: str, query: str, content: str, category: str = "ROUTE_GUIDE", metadata: Optional[Dict[str, Any]] = None) -> None:
        """Embed and store document in persistent vector store."""
        embedding = self.encode_text(query + " " + content)
        meta_str = json.dumps(metadata or {})
        now_iso = datetime.now(timezone.utc).isoformat()

        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT OR REPLACE INTO vector_knowledge_store (
                id, query, content, category, embedding, embedding_model, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            doc_id,
            query,
            content,
            category,
            embedding.tobytes(),
            self.model_name,
            meta_str,
            now_iso,
        ))
        conn.commit()
        conn.close()

    def search_similarity(self, query: str, top_k: int = 3, min_similarity: float = 0.65) -> List[Dict[str, Any]]:
        """Search vector database using Cosine Similarity on Snowflake embeddings."""
        query_vec = self.encode_text(query)

        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, query, content, category, embedding, metadata_json FROM vector_knowledge_store WHERE embedding_model = ?",
            (self.model_name,),
        )
        rows = cur.fetchall()
        conn.close()

        if not rows:
            return []

        scored_docs = []
        for r in rows:
            doc_vec = np.frombuffer(r["embedding"], dtype=np.float32)
            similarity = float(np.dot(query_vec, doc_vec))
            if similarity >= min_similarity:
                scored_docs.append({
                    "id": r["id"],
                    "query": r["query"],
                    "content": r["content"],
                    "category": r["category"],
                    "similarity": round(similarity, 4),
                    "metadata": json.loads(r["metadata_json"]),
                })

        scored_docs.sort(key=lambda x: x["similarity"], reverse=True)
        return scored_docs[:top_k]
