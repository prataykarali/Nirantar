"""
NIRANTAR Module 1 — Progressive Citizen Journey Engine
======================================================
Intent confirm → Search → Select → Passenger → Review → Mock pay → Confirmation.
DB first; Apify + NVIDIA synthesis only when the catalogue has no route.
"""

from enum import Enum
from typing import Any, Dict, List, Optional

from contracts.citizen import (
    CitizenIntent,
    CitizenJourneyResponse,
    CitizenSession,
    IntentType,
    SafeAutofillPayload,
)
from m0_digital_twin.database import DigitalTwinDatabase, get_db
from m0_digital_twin.mock_services import AvailabilityService, BookingService, PaymentService, SearchService
from m0_digital_twin.models import BookingRequest, Passenger
from backend.app.adapters.llm.orchestrator import SemanticOrchestrationAgent
from backend.app.adapters.search.vector_store import SnowflakeVectorStore
from security.privacy.masking import mask_name


class JourneyStage(str, Enum):
    INTENT = "INTENT"
    CONFIRM = "CONFIRM"
    SEARCH = "SEARCH"
    SELECT = "SELECT"
    PASSENGER = "PASSENGER"
    REVIEW = "REVIEW"
    PAY = "PAY"
    DONE = "DONE"


STATION_LABELS = {
    "HWH": "Howrah / Kolkata",
    "KOAA": "Kolkata",
    "SDAH": "Sealdah",
    "NDLS": "New Delhi",
    "BCT": "Mumbai Central",
    "MAS": "Chennai Central",
    "MDU": "Madurai Junction",
    "CBE": "Coimbatore Junction",
    "TPJ": "Tiruchchirappalli Junction",
    "SBC": "Bengaluru",
    "PNBE": "Patna",
    "NJP": "New Jalpaiguri",
    "MLDT": "Malda Town",
    "JP": "Jaipur",
    "SML": "Shimla",
    "KLK": "Kalka",
    "KGP": "Kharagpur",
    "PURI": "Puri",
    "BBS": "Bhubaneswar",
}

INTENT_LABELS = {
    IntentType.BOOK_TRAIN: {"en": "Book a train", "hi": "ट्रेन बुक करें", "bn": "ট্রেন বুক করুন", "ta": "ரயில் புக் செய்யவும்"},
    IntentType.SEARCH_TRAINS: {"en": "Search trains", "hi": "ट्रेन खोजें", "bn": "ট্রেন খুঁজুন", "ta": "ரயில்களைத் தேடுங்கள்"},
    IntentType.CHECK_AVAILABILITY: {"en": "Check availability", "hi": "सीट जाँचें", "bn": "আসন দেখুন", "ta": "இருக்கை விவரம்"},
    IntentType.TRACK_STATUS: {"en": "Check booking", "hi": "बुकिंग स्थिति", "bn": "বুকিং স্ট্যাটাস", "ta": "பதிவு நிலை"},
    IntentType.GET_QUEUE_STATUS: {"en": "Queue status", "hi": "कतार स्थिति", "bn": "কাতারের অবস্থা", "ta": "வரிசை நிலை"},
    IntentType.CIVIC_APPLICATION: {"en": "Find a government service", "hi": "सरकारी सेवा", "bn": "সরকারি সেবা", "ta": "அரசு சேவை"},
    IntentType.EXPLAIN_FIELD: {"en": "Explain form field", "hi": "फ़ॉर्म फ़ील्ड समझें", "bn": "ফর্মের ক্ষেত্র ব্যাখ্যা", "ta": "படிவ விவரம் விளக்கம்"},
    IntentType.AUTOFILL_SAFE_DATA: {"en": "Safe profile autofill", "hi": "सुरक्षित ऑटोफ़िल", "bn": "নিরাপদ অটোফিল", "ta": "பாதுகாப்பான விவரம் நிரப்புதல்"},
    IntentType.RECOVER_PAYMENT: {"en": "Recover payment", "hi": "भुगतान पुनः प्राप्त करें", "bn": "পেমেন্ট পুনরুদ্ধার", "ta": "பணம் திரும்பப் பெறுதல்"},
    IntentType.UNKNOWN: {"en": "A public-service request", "hi": "एक सेवा अनुरोध", "bn": "একটি সেবার অনুরোধ", "ta": "சேவை கோரிக்கை"},
}


class ProgressiveJourneyEngine:
    """Guided booking state machine. LLM synthesizes; Python owns the journey."""

    PROMPTS: Dict[str, Dict[str, str]] = {
        "en": {
            "ask_origin": "Where are you travelling from?",
            "ask_destination": "Where would you like to go?",
            "select_train": "Here are the top options for your journey.",
            "enter_passengers": "Add passenger name and age to continue.",
            "review": "Please review this booking before mock payment.",
            "confirm_booking": "Please review and confirm your reservation.",
        },
        "hi": {
            "ask_origin": "आप कहाँ से यात्रा शुरू करना चाहते हैं?",
            "ask_destination": "आप कहाँ जाना चाहते हैं?",
            "select_train": "आपकी यात्रा के लिए शीर्ष विकल्प:",
            "enter_passengers": "कृपया यात्री का नाम और आयु दर्ज करें।",
            "review": "भुगतान से पहले विवरण जाँचें।",
            "confirm_booking": "बुकिंग की पुष्टि के लिए विवरण जांचें:",
        },
        "bn": {
            "ask_origin": "আপনি কোথা থেকে যাত্রা শুরু করতে চান?",
            "ask_destination": "আপনি কোথায় যেতে চান?",
            "select_train": "আপনার যাত্রার জন্য সেরা বিকল্প:",
            "enter_passengers": "যাত্রীর নাম ও বয়স দিন।",
            "review": "পেমেন্টের আগে বিবরণ দেখে নিন।",
            "confirm_booking": "বুকিং নিশ্চিত করতে অনুগ্রহ করে পর্যালোচনা করুন:",
        },
        "ta": {
            "ask_origin": "நீங்கள் எங்கிருந்து பயணம் செய்ய விரும்புகிறீர்கள்?",
            "ask_destination": "நீங்கள் எங்கு செல்ல விரும்புகிறீர்கள்?",
            "select_train": "உங்கள் பயணத்திற்கான முக்கிய விருப்பங்கள்:",
            "enter_passengers": "பயணியின் பெயர் மற்றும் வயதை உள்ளிடவும்.",
            "review": "பணம் செலுத்துவதற்கு முன் விவரங்களைச் சரிபார்க்கவும்.",
            "confirm_booking": "பதிவை உறுதிப்படுத்த விவரங்களைச் சரிபார்க்கவும்:",
        },
    }

    def __init__(self, db: Optional[DigitalTwinDatabase] = None) -> None:
        self.db = db or get_db()
        self.search_svc = SearchService(self.db)
        self.avail_svc = AvailabilityService(self.db)
        self.payment_svc = PaymentService(self.db)
        self.booking_svc = BookingService(self.db, self.payment_svc)
        self.orchestrator = SemanticOrchestrationAgent()
        self.vector_store = SnowflakeVectorStore(db_path=self.db.db_path)

    def get_safe_autofill_data(self, user_data: Optional[Dict[str, Any]] = None) -> SafeAutofillPayload:
        """Filter user profile data against strict non-sensitive field allowlists."""
        allowlist_map = {
            "name": "Name",
            "age": "Age",
            "gender": "Gender",
            "berths": "Berths",
            "berth_preference": "Berths",
            "quota": "Quota",
            "origin": "Origin",
            "origin_station": "Origin",
            "source_station": "Origin",
            "destination": "Destination",
            "destination_station": "Destination",
        }

        denylist = {
            "password", "passwords", "otp", "otps", "cvv", "cvvs", "pin", "pins",
            "card_number", "upi_pin", "secret", "token", "auth_token"
        }

        default_safe_data = {
            "Name": "Asha Kumar",
            "Age": 34,
            "Gender": "F",
            "Berths": "Lower",
            "Quota": "GN",
            "Origin": "HWH",
            "Destination": "NDLS",
        }

        if not user_data:
            return SafeAutofillPayload(
                safe_data=default_safe_data,
                filtered_out_fields=[],
            )

        sanitized: Dict[str, Any] = {}
        filtered_out: List[str] = []

        for raw_key, value in user_data.items():
            key_lower = str(raw_key).strip().lower()
            if key_lower in denylist or any(d in key_lower for d in ["password", "otp", "cvv", "pin"]):
                filtered_out.append(str(raw_key))
                continue

            if key_lower in allowlist_map:
                target_key = allowlist_map[key_lower]
                sanitized[target_key] = value
            elif raw_key in ["Name", "Age", "Gender", "Berths", "Quota", "Origin", "Destination"]:
                sanitized[raw_key] = value
            else:
                filtered_out.append(str(raw_key))

        # Fill defaults for missing mandatory safe fields
        for default_key, default_val in default_safe_data.items():
            if default_key not in sanitized:
                sanitized[default_key] = default_val

        return SafeAutofillPayload(
            safe_data=sanitized,
            filtered_out_fields=filtered_out,
        )

    def advance_journey(
        self,
        intent: CitizenIntent,
        session: CitizenSession,
        current_stage: JourneyStage = JourneyStage.INTENT,
        user_selection: Optional[Dict[str, Any]] = None,
    ) -> CitizenJourneyResponse:
        lang = intent.language if intent.language in ["hi", "bn", "ta", "en"] else "en"
        prompts = self.PROMPTS.get(lang, self.PROMPTS["en"])
        selection = dict(user_selection or {})

        # Handle out-of-scope queries
        if intent.intent_type == IntentType.UNKNOWN:
            return self._reply(
                "NIRANTAR is a specialized Indian Civic & Rail Transport Intelligence System. I can only assist with Indian train bookings, Tatkal availability, travel planning, UIDAI Aadhaar, Parivahan transport, and civic scheme services.",
                intent,
                session,
                "OUT_OF_SCOPE",
                {
                    "stage": JourneyStage.INTENT.value,
                    "domain": "INDIAN_CIVIC_AND_RAIL_SERVICES",
                },
            )

        # Handle specialized intents
        if intent.intent_type == IntentType.EXPLAIN_FIELD:
            field_name = intent.entities.get("field") or intent.raw_query or "quota"
            return self._reply(
                f"Field explanation for '{field_name}': Non-sensitive civic parameter used for train allocation.",
                intent,
                session,
                "EXPLAIN_FIELD",
                {
                    "stage": JourneyStage.INTENT.value,
                    "field": field_name,
                    "explanation": f"In Indian Railways, {field_name} specifies your preference or booking entitlement category.",
                },
            )

        if intent.intent_type == IntentType.AUTOFILL_SAFE_DATA:
            safe_payload = self.get_safe_autofill_data(intent.entities.get("user_data"))
            dumped = safe_payload.model_dump() if hasattr(safe_payload, "model_dump") else safe_payload.dict()
            return self._reply(
                "Safe non-sensitive autofill profile generated successfully.",
                intent,
                session,
                "AUTOFILL_PROVIDED",
                {
                    "stage": JourneyStage.PASSENGER.value,
                    "autofill": dumped,
                },
            )

        if intent.intent_type == IntentType.RECOVER_PAYMENT:
            return self._reply(
                "Payment recovery protocol engaged. Your inventory hold remains active.",
                intent,
                session,
                "RECOVER_PAYMENT",
                {
                    "stage": JourneyStage.REVIEW.value,
                    "recovery_status": "HOLD_PRESERVED",
                    "lock_expiry_seconds": 240,
                },
            )

        # Require origin/destination for train routes
        if intent.intent_type in (IntentType.BOOK_TRAIN, IntentType.SEARCH_TRAINS):
            if not intent.source_station:
                return self._reply(prompts["ask_origin"], intent, session, "PROVIDE_ORIGIN", {
                    "stage": JourneyStage.INTENT.value,
                    "missing_field": "source_station",
                })
            if not intent.destination_station:
                return self._reply(prompts["ask_destination"], intent, session, "PROVIDE_DESTINATION", {
                    "stage": JourneyStage.INTENT.value,
                    "missing_field": "destination_station",
                })

        if intent.intent_type not in (IntentType.BOOK_TRAIN, IntentType.SEARCH_TRAINS) and not intent.source_station:
            return self._search(intent, session, prompts)

        if current_stage in (JourneyStage.INTENT, JourneyStage.CONFIRM) and not selection.get("confirmed"):
            return self._confirmation(intent, session, lang)

        if current_stage in (JourneyStage.INTENT, JourneyStage.CONFIRM, JourneyStage.SEARCH):
            return self._search(intent, session, prompts)

        if current_stage == JourneyStage.SELECT:
            train_no = selection.get("train_no")
            if not train_no:
                return self._search(intent, session, prompts)
            return self._reply(prompts["enter_passengers"], intent, session, "PROVIDE_PASSENGERS", {
                "stage": JourneyStage.PASSENGER.value,
                "selected_train": train_no,
                "selected_class": intent.class_preference,
                "passenger_count": intent.passenger_count,
            })

        if current_stage == JourneyStage.PASSENGER:
            passengers = selection.get("passengers") or []
            train_no = selection.get("train_no")
            if not passengers:
                return self._reply(prompts["enter_passengers"], intent, session, "PROVIDE_PASSENGERS", {
                    "stage": JourneyStage.PASSENGER.value,
                    "selected_train": train_no,
                })
            return self._review(intent, session, prompts, selection)

        if current_stage in (JourneyStage.REVIEW, JourneyStage.PAY):
            if selection.get("pay") or current_stage == JourneyStage.PAY:
                return self._pay(intent, session, selection)
            return self._review(intent, session, prompts, selection)

        return self._confirmation(intent, session, lang)

    def _reply(
        self,
        message: str,
        intent: CitizenIntent,
        session: CitizenSession,
        action: str,
        payload: Dict[str, Any],
    ) -> CitizenJourneyResponse:
        return CitizenJourneyResponse(
            message=message,
            intent=intent,
            session=session,
            action_required=action,
            payload=payload,
        )

    def _station_label(self, code: Optional[str]) -> str:
        if not code:
            return "—"
        return STATION_LABELS.get(code.upper(), code)

    def _confirmation(self, intent: CitizenIntent, session: CitizenSession, lang: str) -> CitizenJourneyResponse:
        label_map = INTENT_LABELS.get(intent.intent_type, INTENT_LABELS[IntentType.UNKNOWN])
        label = label_map.get(lang, label_map["en"])
        time_pref = intent.time_preference or intent.entities.get("travel_time_preference") or "—"
        passengers = intent.passenger_count or intent.entities.get("passenger_count") or 1
        origin = self._station_label(intent.source_station)
        dest = self._station_label(intent.destination_station)
        date = intent.travel_date or "—"
        if lang == "hi":
            message = (
                f"मैंने इसे ऐसे समझा:\n{label}\n{origin} → {dest}\n{date}\n{time_pref}\n{passengers} यात्री"
            )
        elif lang == "bn":
            message = (
                f"আমি এভাবে বুঝেছি:\n{label}\n{origin} → {dest}\n{date}\n{time_pref}\n{passengers} যাত্রী"
            )
        elif lang == "ta":
            message = (
                f"நான் இதைப் புரிந்து கொண்டேன்:\n{label}\n{origin} → {dest}\n{date}\n{time_pref}\n{passengers} பயணிகள்"
            )
        else:
            message = (
                f"I understood this as:\n{label}\n{origin} → {dest}\n{date}\n{time_pref}\n{passengers} passenger"
            )
        top_options = []
        web_results = []
        if intent.source_station and intent.destination_station:
            trains = self.search_svc.search_routes(intent.source_station, intent.destination_station)
            top_options = self._rank_top_3_itineraries(trains, intent)
        elif intent.raw_query:
            orch = self.orchestrator.answer(
                query=intent.raw_query,
                language=intent.language,
                source_station=intent.source_station,
                destination_station=intent.destination_station,
            )
            web_results = orch.web_results
            if orch.message and orch.source != "NO_VERIFIED_RESULT":
                message += f"\n\n{orch.message}"

        return self._reply(message, intent, session, "CONFIRM_INTENT", {
            "stage": JourneyStage.CONFIRM.value,
            "confirmation": {
                "intent_label": label,
                "origin": origin,
                "origin_code": intent.source_station,
                "destination": dest,
                "destination_code": intent.destination_station,
                "date": date,
                "time_preference": time_pref,
                "passengers": passengers,
            },
            "top_options": top_options,
            "web_results": web_results,
        })

    def _search(
        self,
        intent: CitizenIntent,
        session: CitizenSession,
        prompts: Dict[str, str],
    ) -> CitizenJourneyResponse:
        trains = self.search_svc.search_routes(intent.source_station or "", intent.destination_station or "")
        top = self._rank_top_3_itineraries(trains, intent)
        if top:
            return self._reply(prompts["select_train"], intent, session, "SELECT_TRAIN", {
                "stage": JourneyStage.SELECT.value,
                "top_options": top,
                "total_found": len(trains),
                "source": "LOCAL_DIGITAL_TWIN",
            })

        orch = self.orchestrator.answer(
            query=intent.raw_query or f"train from {intent.source_station} to {intent.destination_station}",
            language=intent.language,
            source_station=intent.source_station,
            destination_station=intent.destination_station,
        )
        if orch.web_results:
            try:
                self.vector_store.add_document(
                    doc_id=f"route-{(intent.source_station or '').lower()}-{(intent.destination_station or '').lower()}",
                    query=intent.raw_query or "",
                    content=orch.message,
                    category="GROUNDED_ROUTE_GUIDANCE",
                    metadata={"sources": orch.web_results, "source": orch.source},
                )
            except RuntimeError:
                pass
        return self._reply(orch.message, intent, session, "REVIEW_SOURCES" if orch.web_results else "RETRY_SEARCH", {
            "stage": JourneyStage.SEARCH.value,
            "top_options": [],
            "web_results": orch.web_results,
            "source": orch.source,
            "error": orch.error,
        })

    def _review(
        self,
        intent: CitizenIntent,
        session: CitizenSession,
        prompts: Dict[str, str],
        selection: Dict[str, Any],
    ) -> CitizenJourneyResponse:
        passengers = selection.get("passengers") or []
        train_no = selection.get("train_no")
        fare = selection.get("fare_inr")
        return self._reply(prompts["review"], intent, session, "REVIEW_CONFIRM", {
            "stage": JourneyStage.REVIEW.value,
            "selected_train": train_no,
            "selected_class": intent.class_preference,
            "passengers": passengers,
            "fare_inr": fare,
            "origin": intent.source_station,
            "destination": intent.destination_station,
            "date": intent.travel_date,
        })

    def _pay(
        self,
        intent: CitizenIntent,
        session: CitizenSession,
        selection: Dict[str, Any],
    ) -> CitizenJourneyResponse:
        raw_passengers = selection.get("passengers") or [{"name": "P****", "age": 30}]
        passengers = [
            Passenger(
                name_masked=mask_name(str(p.get("name") or "Passenger")),
                age=int(p.get("age") or 30),
                gender=str(p.get("gender") or "M"),
            )
            for p in raw_passengers
        ]
        req = BookingRequest(
            citizen_id=session.citizen_id_masked,
            train_no=str(selection.get("train_no") or "12301"),
            travel_date=str(intent.travel_date or "2026-08-22"),
            class_type=intent.class_preference or "3A",
            quota=intent.quota or "GN",
            source_station=intent.source_station or "HWH",
            destination_station=intent.destination_station or "NDLS",
            passengers=passengers,
            session_id=session.session_id,
        )
        record, txn = self.booking_svc.initiate_booking(req)
        payload = {
            "stage": JourneyStage.DONE.value,
            "pnr": record.pnr,
            "booking_id": record.booking_id,
            "status": record.status.value if hasattr(record.status, "value") else str(record.status),
            "amount_inr": record.total_amount_inr,
            "payment_id": getattr(txn, "transaction_id", None) if txn else None,
            "payment_status": getattr(getattr(txn, "status", None), "value", None) if txn else None,
        }
        if str(payload["status"]).upper() != "CONFIRMED":
            return self._reply(
                "Mock payment did not complete. Your seat hold may still be active — retry from review.",
                intent,
                session,
                "RETRY_PAYMENT",
                {**payload, "stage": JourneyStage.REVIEW.value},
            )
        return self._reply(
            f"Booking confirmed. PNR {record.pnr}. This is a synthetic ticket — no real payment was taken.",
            intent,
            session,
            "BOOKING_CONFIRMED",
            payload,
        )

    def _rank_top_3_itineraries(self, trains: List[Dict[str, Any]], intent: CitizenIntent) -> List[Dict[str, Any]]:
        options = []
        travel_date = intent.travel_date or "2026-08-22"
        class_pref = intent.class_preference or "3A"
        quota = intent.quota or "GN"

        for train in trains:
            train_no = train["train_no"]
            avail = self.avail_svc.check_availability(train_no, travel_date, class_pref, quota)
            schedules = self.db.get_schedule(train_no) if hasattr(self.db, "get_schedule") else []
            dep_time = "Unavailable"
            arr_time = "Unavailable"
            dist_km: Any = "Unavailable"
            duration: Any = "Unavailable"

            if schedules:
                src_code = (intent.source_station or "").upper()
                dst_code = (intent.destination_station or "").upper()
                src_sch = next((s for s in schedules if s.get("station_code") == src_code), schedules[0] if schedules else None)
                dst_sch = next((s for s in schedules if s.get("station_code") == dst_code), schedules[-1] if schedules else None)

                if src_sch and src_sch.get("departure_time") and src_sch.get("departure_time") != "00:00":
                    dep_time = src_sch.get("departure_time")
                elif src_sch and src_sch.get("arrival_time"):
                    dep_time = src_sch.get("arrival_time")

                if dst_sch and dst_sch.get("arrival_time") and dst_sch.get("arrival_time") != "00:00":
                    arr_time = dst_sch.get("arrival_time")
                elif dst_sch and dst_sch.get("departure_time"):
                    arr_time = dst_sch.get("departure_time")

                if src_sch and dst_sch:
                    d1 = src_sch.get("distance_km", 0)
                    d2 = dst_sch.get("distance_km", 0)
                    if d2 >= d1:
                        dist_km = d2 - d1

                if dep_time != "Unavailable" and arr_time != "Unavailable":
                    try:
                        h1, m1 = map(int, dep_time.split(":"))
                        h2, m2 = map(int, arr_time.split(":"))
                        t1 = h1 * 60 + m1
                        t2 = h2 * 60 + m2
                        if t2 < t1:
                            t2 += 24 * 60
                        diff_m = t2 - t1
                        duration = f"{diff_m // 60}h {diff_m % 60}m"
                    except Exception:
                        duration = "Unavailable"

            avail_seats = avail.get("available_seats")
            fare = avail.get("fare_inr")
            is_avail = avail.get("available", False)

            options.append({
                "train_no": train_no,
                "train_name": train["train_name"],
                "source": train.get("source_station", train.get("source", intent.source_station or "Unavailable")),
                "destination": train.get("destination_station", train.get("destination", intent.destination_station or "Unavailable")),
                "class_type": class_pref,
                "quota": quota,
                "available_seats": avail_seats if avail_seats is not None else "Unavailable",
                "is_available": is_avail,
                "fare_inr": fare if fare is not None and fare > 0 else "Unavailable",
                "departure_time": dep_time,
                "arrival_time": arr_time,
                "duration_hours": duration,
                "distance_km": dist_km,
            })

        options.sort(
            key=lambda x: (x["is_available"], x["available_seats"] if isinstance(x["available_seats"], int) else 0),
            reverse=True,
        )

        top_3 = options[:3]
        for idx, item in enumerate(top_3):
            rank_num = idx + 1
            if item["is_available"]:
                seats_text = f"{item['available_seats']} seats available"
                justification = f"Rank #{rank_num}: High availability ({seats_text}) in {item['class_type']} class, duration {item['duration_hours']}."
            else:
                justification = f"Rank #{rank_num}: Popular option with waitlist/RAC status under {item['quota']} quota."
            item["ranking_justification"] = justification

        return top_3
