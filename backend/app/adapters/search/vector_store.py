"""
NIRANTAR — Vector Knowledge Store with Snowflake Arctic Embeddings
==================================================================
Stores semantic knowledge (routes, Apify scraped documents, station networks)
using Snowflake Arctic (Snowflake/snowflake-arctic-embed-xs) with SQLite persistence.
Combines local DB train facts, vector similarity embeddings, and Scrapling live web scraper context.
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
        if self._model is not None:
            return self._model

        with self._model_lock:
            if self._model is not None:
                return self._model
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

    def get_unified_grounded_context(
        self,
        query: str,
        source: Optional[str] = None,
        destination: Optional[str] = None,
        top_k: int = 3,
        use_scrapling: bool = True,
    ) -> Dict[str, Any]:
        """Combine local DB train facts, vector similarity embeddings, and Scrapling live web scraper context into a unified grounded context payload."""
        from m0_digital_twin.database import get_db
        from backend.app.adapters.search.scrapling_adapter import ScraplingWebScraper

        db = get_db()
        local_db_train_facts: List[Dict[str, Any]] = []

        # 1. Fetch direct train inventory facts from local DB if source/destination provided
        if source and destination:
            trains = db.search_trains(source, destination)
            conn = db._get_connection()
            cur = conn.cursor()
            for t in trains:
                train_no = t.get("train_no")
                inv_records = []
                if train_no:
                    cur.execute(
                        "SELECT travel_date, class_type, quota, available_seats, fare_inr FROM seat_inventory WHERE train_no = ?",
                        (train_no,),
                    )
                    inv_records = [dict(r) for r in cur.fetchall()]

                local_db_train_facts.append({
                    "train_no": t.get("train_no"),
                    "train_name": t.get("train_name"),
                    "train_type": t.get("train_type"),
                    "source_station": t.get("source_station"),
                    "destination_station": t.get("destination_station"),
                    "tatkal_enabled": bool(t.get("tatkal_enabled", 1)),
                    "inventory_records": inv_records,
                })

        # 2. Query Vector Store Similarity
        vector_docs: List[Dict[str, Any]] = []
        try:
            vector_docs = self.search_similarity(query, top_k=top_k, min_similarity=0.30)
        except Exception:
            pass

        # 3. Query Scrapling Live Web Scraper
        scrapling_facts: List[Dict[str, Any]] = []
        if use_scrapling:
            try:
                scraper = ScraplingWebScraper()
                scrap_res = scraper.scrape_government_info(query, max_results=top_k)
                scrapling_facts = scrap_res.get("results", [])
            except Exception:
                pass

        # 4. Construct Unified Grounded Context String
        context_parts = []
        if local_db_train_facts:
            context_parts.append("=== LOCAL DB TRAIN INVENTORY FACTS ===")
            for tf in local_db_train_facts:
                inv_summary = ", ".join([f"{r['class_type']}({r['quota']}): ₹{r['fare_inr']} ({r['available_seats']} seats)" for r in tf["inventory_records"][:3]])
                context_parts.append(
                    f"Train {tf['train_no']} - {tf['train_name']} ({tf['source_station']} -> {tf['destination_station']}) | Seats/Fares: [{inv_summary}]"
                )

        if vector_docs:
            context_parts.append("\n=== SEMANTIC VECTOR STORE CONTEXT ===")
            for vdoc in vector_docs:
                context_parts.append(f"[{vdoc.get('category', 'KNOWLEDGE')}] {vdoc.get('content')} (Similarity: {vdoc.get('similarity')})")

        if scrapling_facts:
            context_parts.append("\n=== SCRAPLING LIVE WEB / STATUTORY FACTS ===")
            for sf in scrapling_facts:
                context_parts.append(f"[{sf.get('source')}] {sf.get('title')}: {sf.get('snippet')}")

        grounded_context_str = "\n".join(context_parts) if context_parts else f"No grounded context found for query: {query}"

        return {
            "status": 200,
            "query": query,
            "source_station": source,
            "destination_station": destination,
            "local_db_train_facts": local_db_train_facts,
            "vector_similarity_context": vector_docs,
            "scrapling_live_web_context": scrapling_facts,
            "grounded_context_str": grounded_context_str,
            "metadata": {
                "train_facts_count": len(local_db_train_facts),
                "vector_docs_count": len(vector_docs),
                "scrapling_facts_count": len(scrapling_facts),
            },
        }
