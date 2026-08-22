"""
NIRANTAR Module 1 — Multilingual Natural Language Intent Extractor
==================================================================
Converts unstructured citizen voice/text queries (English, Hindi, Bengali)
into structured NIRANTAR CitizenIntent contracts.
"""

from datetime import datetime, timedelta, timezone
import re
from typing import Any, Dict, Optional, Tuple
from contracts.citizen import CitizenIntent, IntentType


class MultilingualIntentExtractor:
    """Deterministic, resilient multilingual intent parser with 100% offline support."""

    # Station canonical mappings across English, Hindi, and Bengali scripts
    STATION_ALIASES: Dict[str, str] = {
        # Howrah / Kolkata
        "howrah": "HWH",
        "hwh": "HWH",
        "हावड़ा": "HWH",
        "হাওড়া": "HWH",
        "sealdah": "SDAH",
        "sdah": "SDAH",
        "सियालदह": "SDAH",
        "শিয়ালদহ": "SDAH",
        "kolkata": "KOAA",
        "calcutta": "HWH",
        "কলকাতা": "KOAA",
        # New Delhi / Delhi
        "delhi": "NDLS",
        "new delhi": "NDLS",
        "ndls": "NDLS",
        "नई दिल्ली": "NDLS",
        "दिल्ली": "NDLS",
        "নয়া দিল্লি": "NDLS",
        "দিল্লি": "NDLS",
        # New Jalpaiguri / Siliguri
        "new jalpaiguri": "NJP",
        "njp": "NJP",
        "jalpaiguri": "NJP",
        "न्यू जलपाईगुड़ी": "NJP",
        "নিউ জলপাইগুড়ি": "NJP",
        "শিলিগুড়ি": "NJP",
        # Mumbai / Bombay
        "mumbai": "BCT",
        "mumbai central": "BCT",
        "bct": "BCT",
        "bombay": "BCT",
        "मुंबई": "BCT",
        "মুম্বাই": "BCT",
        # Patna
        "patna": "PNBE",
        "pnbe": "PNBE",
        "पटना": "PNBE",
        "পাটনা": "PNBE",
        # Shimla / Kalka
        "shimla": "SML",
        "simla": "SML",
        "शिमला": "SML",
        "শিমলা": "SML",
        "kalka": "KLK",
        "कालका": "KLK",
        "কালকা": "KLK",
        # Kharagpur
        "kharagpur": "KGP",
        "kgp": "KGP",
        "खड़गपुर": "KGP",
        "খড়গপুর": "KGP",
        # Kishanganj & Malda
        "kishanganj": "KNE",
        "kne": "KNE",
        "किशनगंज": "KNE",
        "কিশানগঞ্জ": "KNE",
        "malda": "MLDT",
        "mldt": "MLDT",
        "malda town": "MLDT",
        "मालदा": "MLDT",
        "মালদা": "MLDT",
        # Krishnanagar & Mayapur
        "krishna nagar": "KNJ",
        "krishnanagar": "KNJ",
        "krishnanagar city": "KNJ",
        "knj": "KNJ",
        "कृष्णनगर": "KNJ",
        "কৃষ্ণনগর": "KNJ",
        "mayapur": "MYPR",
        "mypr": "MYPR",
        "मायापुर": "MYPR",
        "মায়াপুর": "MYPR",
        # Shalimar
        "shalimar": "SHM",
        "shm": "SHM",
        "शालीमार": "SHM",
        "শালিমার": "SHM",
        # Puri
        "puri": "PURI",
        "पुरी": "PURI",
        "পুরী": "PURI",
        # Bhubaneswar
        "bhubaneswar": "BBS",
        "bbs": "BBS",
        "भुवनेश्वर": "BBS",
        "ভুবনেশ্বর": "BBS",
        # Chandigarh
        "chandigarh": "CDG",
        "चंडीगढ़": "CDG",
        "চণ্ডীগড়": "CDG",
        # Jaipur
        "jaipur": "JP",
        "jp": "JP",
        "जयपुर": "JP",
        "জয়পুর": "JP",
        # Ranchi
        "ranchi": "RNC",
        "rnc": "RNC",
        "राँची": "RNC",
        "রাঁচি": "RNC",
        # Goa
        "goa": "MAO",
        "madgaon": "MAO",
        "गोवा": "MAO",
        "গোয়া": "MAO",
        # Darjeeling
        "darjeeling": "DJ",
        "दार्जिलिंग": "DJ",
        "দার্জিলিং": "DJ",
        # Amritsar
        "amritsar": "ASR",
        "अमृतसर": "ASR",
        "অমৃতসর": "ASR",
        # Haridwar
        "haridwar": "HW",
        "हरिद्वार": "HW",
        "হরিদ্বার": "HW",
    }

    # Class mappings
    CLASS_ALIASES: Dict[str, str] = {
        "1a": "1A", "first ac": "1A", "1st ac": "1A", "প্রথম এসি": "1A",
        "2a": "2A", "second ac": "2A", "2nd ac": "2A", "দ্বিতীয় এসি": "2A",
        "3a": "3A", "third ac": "3A", "3rd ac": "3A", "ac 3": "3A", "তৃতীয় এসি": "3A", "थर्ड एसी": "3A",
        "sl": "SL", "sleeper": "SL", "स्लीपर": "SL", "স্লিপার": "SL",
        "cc": "CC", "chair car": "CC", "চেয়ার কার": "CC",
        "2s": "2S", "second sitting": "2S",
    }

    # Quota mappings
    QUOTA_ALIASES: Dict[str, str] = {
        "tatkal": "TQ", "tatkaal": "TQ", "तत्काल": "TQ", "তৎকাল": "TQ", "তাতকাল": "TQ",
        "premium tatkal": "PT", "प्रीमियम तत्काल": "PT", "প্রিমিয়াম তৎকাল": "PT",
        "ladies": "LD", "महिला": "LD", "মহিলা": "LD",
        "senior citizen": "SS", "senior": "SS", "वरिष्ठ": "SS", "প্রবীণ": "SS",
        "general": "GN", "सामान्य": "GN", "সাধারণ": "GN",
    }

    def extract_intent(self, query: str, language: str = "auto") -> CitizenIntent:
        """Extract structured CitizenIntent from natural language text using local semantic parsing and LLM fallback."""
        raw_text = query.strip()
        lower_text = raw_text.lower()
        detected_lang = self._detect_language(raw_text, language)

        # 1. Determine Intent Type & Local Entities
        intent_type = self._classify_intent_type(lower_text)
        src_station, dst_station = self._extract_stations(lower_text)
        travel_date = self._extract_date(lower_text)
        class_pref = self._extract_class(lower_text)
        quota = self._extract_quota(lower_text)
        travel_time = self._extract_time(lower_text)

        entities: Dict[str, Any] = {}
        if travel_time:
            entities["travel_time_preference"] = travel_time
        passenger_count = self._extract_passenger_count(lower_text)
        entities["passenger_count"] = passenger_count
        if "pnr" in lower_text or re.search(r"\b\d{10}\b", lower_text):
            pnr_match = re.search(r"\b\d{10}\b", lower_text)
            if pnr_match:
                entities["pnr"] = pnr_match.group(0)

        # 2. If stations not extracted locally, try LLM provider
        if not src_station or not dst_station:
            try:
                from backend.app.adapters.llm import get_llm_provider
                llm = get_llm_provider()
                llm_intent = llm.extract_intent(query, detected_lang)
                if llm_intent and (llm_intent.source_station or llm_intent.destination_station):
                    src_station = src_station or self._match_alias(llm_intent.source_station.lower() if llm_intent.source_station else "")
                    dst_station = dst_station or self._match_alias(llm_intent.destination_station.lower() if llm_intent.destination_station else "")
            except Exception:
                pass

        confidence = 0.95 if (src_station or dst_station) else 0.40

        return CitizenIntent(
            intent_type=intent_type,
            source_station=src_station,
            destination_station=dst_station,
            travel_date=travel_date,
            class_preference=class_pref or "3A",
            quota=quota or "GN",
            language=detected_lang,
            time_preference=travel_time,
            passenger_count=passenger_count,
            confidence=confidence,
            entities=entities,
            raw_query=raw_text,
        )

    def _detect_language(self, text: str, hint: str) -> str:
        """Detect script-based language (Bengali, Devanagari Hindi, or Latin English)."""
        if hint != "auto" and hint in ["hi", "bn", "en", "ta"]:
            return hint
        if re.search(r"[\u0980-\u09FF]", text):
            return "bn"  # Bengali script
        if re.search(r"[\u0900-\u097F]", text):
            return "hi"  # Devanagari script
        return "en"

    def _classify_intent_type(self, text: str) -> IntentType:
        """Determine primary civic intent."""
        if any(k in text for k in ["book", "booking", "बुक", "বুক", "কাটতে", "টিকিট কাটবো", "reserve"]):
            return IntentType.BOOK_TRAIN
        if any(k in text for k in ["status", "pnr", "track", "स्थिति", "ट्रैक", "খোঁজ", "অবস্থা"]):
            return IntentType.TRACK_STATUS
        if any(k in text for k in ["availab", "seat", "khali", "उपलब्ध", "खाली", "আসন", "জায়গা আছে"]):
            return IntentType.CHECK_AVAILABILITY
        if any(k in text for k in ["queue", "waitlist", "wait list", "कतार", "ওয়েট"]):
            return IntentType.GET_QUEUE_STATUS
        if any(k in text for k in ["certificate", "ration", "pension", "land", "mutation", "सारिफिकेट", "পেনশন"]):
            return IntentType.CIVIC_APPLICATION
        return IntentType.SEARCH_TRAINS

    def _match_alias(self, text_chunk: str) -> Optional[str]:
        """Find matching station code in a text chunk."""
        if not text_chunk:
            return None
        cleaned = text_chunk.strip().lower()
        for alias, code in self.STATION_ALIASES.items():
            if alias == cleaned or alias in cleaned:
                return code
        return text_chunk.strip().upper() if len(text_chunk.strip()) <= 5 else None

    def _extract_stations(self, text: str) -> Tuple[Optional[str], Optional[str]]:
        """Extract origin and destination stations using relational heuristics."""
        # Check recognised station aliases in written order
        found = [(text.find(alias), code) for alias, code in self.STATION_ALIASES.items() if text.find(alias) != -1]
        found.sort(key=lambda x: x[0])
        recognised = []
        for _, code in found:
            if code not in recognised:
                recognised.append(code)

        if len(recognised) >= 2:
            return recognised[0], recognised[1]

        # Dynamic entity extraction fallback for un-aliased station names
        stopwords = {"train", "trains", "from", "to", "for", "in", "the", "need", "go", "i", "want", "please", "me", "se", "tak", "theke", "jete", "jana", "sealdah", "howrah", "puri", "delhi"}
        words = [w.strip(",.!?\"'") for w in text.split()]
        filtered = [w for w in words if w.lower() not in stopwords and len(w) > 1]

        if len(recognised) == 1:
            rec_code = recognised[0]
            rec_aliases = [a for a, c in self.STATION_ALIASES.items() if c == rec_code]
            candidates = [w.upper() for w in filtered if not any(a in w.lower() for a in rec_aliases)]
            if candidates:
                pos_rec = min(text.find(a) for a in rec_aliases if text.find(a) != -1)
                pos_cand = text.find(candidates[0].lower())
                if pos_rec < pos_cand:
                    return rec_code, candidates[0]
                else:
                    return candidates[0], rec_code
            return rec_code, None

        if len(filtered) >= 2:
            return filtered[0].upper(), filtered[1].upper()

        return None, None

    def _extract_date(self, text: str) -> str:
        """Extract travel date (today, tomorrow, or specific date)."""
        today = datetime.now(timezone.utc).date()
        if any(k in text for k in ["tomorrow", "kal", "parso", "কাল", "পরশু", "कल", "अगले दिन"]):
            if any(k in text for k in ["parso", "পরশু", "परसों"]):
                return (today + timedelta(days=2)).isoformat()
            return (today + timedelta(days=1)).isoformat()
        if any(k in text for k in ["today", "aaj", "আজ", "আজকে", "आज"]):
            return today.isoformat()

        # Check for explicit YYYY-MM-DD or DD-MM-YYYY
        iso_match = re.search(r"\b(\d{4})-(\d{2})-(\d{2})\b", text)
        if iso_match:
            return iso_match.group(0)

        # Default to tomorrow for booking convenience
        return (today + timedelta(days=1)).isoformat()

    def _extract_class(self, text: str) -> Optional[str]:
        for alias, code in self.CLASS_ALIASES.items():
            if re.search(rf"\b{re.escape(alias)}\b", text, re.IGNORECASE):
                return code
        return None

    def _extract_quota(self, text: str) -> Optional[str]:
        for alias, code in self.QUOTA_ALIASES.items():
            if alias in text:
                return code
        return None

    def _extract_time(self, text: str) -> Optional[str]:
        if any(k in text for k in ["overnight", "raat bhar", "रात भर", "সারারাত", "রাত্রিকালীন"]):
            return "OVERNIGHT"
        if any(k in text for k in ["morning", "subah", "bhor", "সকাল", "ভোর", "सुबह"]):
            return "MORNING"
        if any(k in text for k in ["afternoon", "dopahar", "dupur", "দুপুর", "दोपहर"]):
            return "AFTERNOON"
        if any(k in text for k in ["evening", "shaam", "sandhya", "সন্ধ্যা", "বিকেল", "शाम"]):
            return "EVENING"
        if any(k in text for k in ["night", "raat", "রাত", "রাত্রি", "रात"]):
            return "NIGHT"
        return None

    def _extract_passenger_count(self, text: str) -> int:
        match = re.search(r"\b(\d+)\s*(passenger|passengers|यात्री|যাত্রী)\b", text)
        if match:
            return max(1, int(match.group(1)))
        if any(k in text for k in ["two passenger", "2 passenger", "दो यात्री", "দুই যাত্রী"]):
            return 2
        return 1
