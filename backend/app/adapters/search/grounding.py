"""
NIRANTAR — Grounded Fact Verification Core
=========================================
Cross-references LLM outputs against local DB train inventory (Digital Twin)
and Scrapling live web scraper facts to detect and prevent hallucinated train numbers,
seat availability levels, or fares.
"""

import re
import logging
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from m0_digital_twin.database import get_db, DigitalTwinDatabase
from backend.app.adapters.search.scrapling_adapter import ScraplingWebScraper

logger = logging.getLogger(__name__)


class GroundingVerificationResult(BaseModel):
    is_grounded: bool = Field(..., description="True if LLM output passes grounding criteria without hallucinations.")
    verification_score: float = Field(..., ge=0.0, le=1.0, description="Verification confidence score between 0.0 and 1.0.")
    ungrounded_claims: List[str] = Field(default_factory=list, description="List of unverified or hallucinated claims detected in LLM output.")
    verified_facts: List[str] = Field(default_factory=list, description="List of facts successfully verified against DB inventory or web sources.")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata summary of evaluated entities and claim counts.")


class GroundedFactVerifier:
    """Verifies LLM outputs against local Digital Twin database inventory and Scrapling scraped facts."""

    def __init__(self, db: Optional[DigitalTwinDatabase] = None) -> None:
        self.db = db or get_db()
        self.scraper = ScraplingWebScraper()

    def extract_claims(self, text: str) -> Dict[str, Any]:
        """Extract structured claims from LLM text output (train numbers, fares, seat availability)."""
        # Extract 5-digit train numbers
        raw_trains = list(set(re.findall(r'\b\d{5}\b', text)))

        # Extract fares (e.g. ₹3,150, INR 3150, Rs. 750, 1200 INR)
        raw_fares = re.findall(r'(?:₹|INR|Rs\.?)\s*(\d+(?:,\d+)*(?:\.\d+)?)|\b(\d+)\s*(?:INR|rupees|rs)\b', text, re.IGNORECASE)
        fares = []
        for match in raw_fares:
            val_str = match[0] or match[1]
            if val_str:
                clean_val = val_str.replace(',', '')
                try:
                    val_float = float(clean_val)
                    if 50 <= val_float <= 30000:  # Realistic railway fare range
                        fares.append(val_float)
                except ValueError:
                    pass

        # Extract seat availability patterns (AVAILABLE-45, WL-12, RAC-5, AVAILABLE, 45 seats available)
        availability_matches = re.findall(r'(?:AVAILABLE|WL|RAC)[-\s:]*(\d+)|(\d+)\s*(?:seats available|available seats)', text, re.IGNORECASE)
        availabilities = []
        for m in availability_matches:
            val = m[0] or m[1]
            if val:
                try:
                    availabilities.append(int(val))
                except ValueError:
                    pass

        return {
            "train_numbers": raw_trains,
            "fares": list(set(fares)),
            "availabilities": list(set(availabilities)),
        }

    def _verify_fares(
        self,
        fares: List[float],
        db_fares: List[float],
        train_no: str,
        additional_facts: Optional[List[Dict[str, Any]]],
        verified_facts: List[str],
        ungrounded_claims: List[str],
    ) -> None:
        """Verify train fare claims against DB and external facts."""
        if not fares or not db_fares:
            return

        for fare in fares:
            if any(abs(fare - db_f) < 5.0 for db_f in db_fares):
                verified_facts.append(f"Fare ₹{fare} for Train {train_no} verified against local DB seat inventory.")
            elif additional_facts and any(str(int(fare)) in str(af) for af in additional_facts):
                verified_facts.append(f"Fare ₹{fare} for Train {train_no} verified against external web facts.")
            else:
                ungrounded_claims.append(
                    f"Hallucinated fare ₹{fare} for Train {train_no}. DB recorded valid fares: {db_fares}"
                )

    def _verify_availabilities(
        self,
        availabilities: List[int],
        db_avail: List[int],
        train_no: str,
        additional_facts: Optional[List[Dict[str, Any]]],
        verified_facts: List[str],
        ungrounded_claims: List[str],
    ) -> None:
        """Verify seat availability claims against DB and external facts."""
        if not availabilities or not db_avail:
            return

        for avail in availabilities:
            if avail in db_avail or any(abs(avail - a) <= 5 for a in db_avail):
                verified_facts.append(f"Seat availability count {avail} for Train {train_no} verified in DB seat inventory.")
            elif additional_facts and any(str(avail) in str(af) for af in additional_facts):
                verified_facts.append(f"Seat availability count {avail} for Train {train_no} verified in web facts.")
            else:
                ungrounded_claims.append(
                    f"Unverified seat availability count {avail} for Train {train_no}. DB seat inventory levels: {db_avail}"
                )

    def _verify_single_train(
        self,
        cur: Any,
        train_no: str,
        fares: List[float],
        availabilities: List[int],
        additional_facts: Optional[List[Dict[str, Any]]],
        verified_facts: List[str],
        ungrounded_claims: List[str],
    ) -> None:
        """Verify a single train number, its fares, and seat availability."""
        cur.execute("SELECT train_no, train_name, source_station, destination_station FROM trains WHERE train_no = ?", (train_no,))
        row = cur.fetchone()

        if not row:
            is_in_facts = bool(additional_facts and any(train_no in str(fact) for fact in additional_facts))
            if is_in_facts:
                verified_facts.append(f"Train {train_no} verified in external web search context.")
            else:
                ungrounded_claims.append(
                    f"Hallucinated train number {train_no} not found in local DB train inventory or web search facts."
                )
            return

        t_dict = dict(row)
        verified_facts.append(
            f"Train {train_no} ({t_dict['train_name']} [{t_dict['source_station']} -> {t_dict['destination_station']}]) verified in local DB inventory."
        )

        cur.execute("SELECT fare_inr, available_seats FROM seat_inventory WHERE train_no = ?", (train_no,))
        inv_rows = [dict(r) for r in cur.fetchall()]
        db_fares = [r["fare_inr"] for r in inv_rows]
        db_avail = [r["available_seats"] for r in inv_rows]

        self._verify_fares(fares, db_fares, train_no, additional_facts, verified_facts, ungrounded_claims)
        self._verify_availabilities(availabilities, db_avail, train_no, additional_facts, verified_facts, ungrounded_claims)

    def _verify_statutory_context(self, query: str, verified_facts: List[str]) -> None:
        """Verify statutory or civic service query facts via Scrapling."""
        q_lower = query.lower()
        statutory_keywords = ["tatkal", "aadhaar", "parivahan", "license", "dl", "scheme", "passport", "pnr"]
        if not any(kw in q_lower for kw in statutory_keywords):
            return

        scrap_res = self.scraper.scrape_government_info(query, max_results=2)
        for item in scrap_res.get("results", []):
            snippet = item.get("snippet", "")
            if snippet:
                verified_facts.append(f"Statutory context from {item.get('source', 'gov.in')}: '{item.get('title')}'")

    def verify_llm_output(
        self,
        llm_output: str,
        query: Optional[str] = None,
        additional_facts: Optional[List[Dict[str, Any]]] = None,
    ) -> GroundingVerificationResult:
        """Cross-reference LLM output against local DB train inventory & Scrapling scraped facts."""
        verified_facts: List[str] = []
        ungrounded_claims: List[str] = []

        claims = self.extract_claims(llm_output)
        train_numbers = claims["train_numbers"]
        fares = claims["fares"]
        availabilities = claims["availabilities"]

        conn = self.db._get_connection()
        cur = conn.cursor()

        # 1. Verify Train Numbers & DB Inventory Facts
        for train_no in train_numbers:
            self._verify_single_train(cur, train_no, fares, availabilities, additional_facts, verified_facts, ungrounded_claims)

        # 2. Verify Statutory / Civic Claims if query relates to public services
        if query:
            self._verify_statutory_context(query, verified_facts)

        # 3. Compute Grounding Verification Score & Status
        total_claims = len(verified_facts) + len(ungrounded_claims)

        if total_claims == 0:
            is_grounded = True
            verification_score = 1.0
            verified_facts.append("No specific train numbers, fares, or seat count claims detected requiring DB verification.")
        else:
            verification_score = round(len(verified_facts) / total_claims, 2)
            is_grounded = (verification_score >= 0.70) and (len(ungrounded_claims) == 0)

        return GroundingVerificationResult(
            is_grounded=is_grounded,
            verification_score=verification_score,
            ungrounded_claims=ungrounded_claims,
            verified_facts=verified_facts,
            metadata={
                "extracted_claims": claims,
                "total_claims_count": total_claims,
                "trains_evaluated": len(train_numbers),
            },
        )

