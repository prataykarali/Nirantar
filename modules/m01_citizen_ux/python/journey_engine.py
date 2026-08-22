"""
NIRANTAR Module 1 — Progressive Citizen Journey Engine
======================================================
Intent confirm → Search → Select → Passenger → Review → Mock pay → Confirmation.
DB first; Apify + NVIDIA synthesis only when the catalogue has no route.
"""

from enum import Enum
from typing import Any, Dict, List, Optional

from contracts.citizen import CitizenIntent, CitizenJourneyResponse, CitizenSession, IntentType
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
    "MAS": "Chennai",
    "SBC": "Bengaluru",
    "PNBE": "Patna",
    "NJP": "New Jalpaiguri",
}

INTENT_LABELS = {
    IntentType.BOOK_TRAIN: {"en": "Book a train", "hi": "ट्रेन बुक करें", "bn": "ট্রেন বুক করুন"},
    IntentType.SEARCH_TRAINS: {"en": "Search trains", "hi": "ट्रेन खोजें", "bn": "ট্রেন খুঁজুন"},
    IntentType.CHECK_AVAILABILITY: {"en": "Check availability", "hi": "सीट जाँचें", "bn": "আসন দেখুন"},
    IntentType.TRACK_STATUS: {"en": "Check booking", "hi": "बुकिंग स्थिति", "bn": "বুকিং স্ট্যাটাস"},
    IntentType.GET_QUEUE_STATUS: {"en": "Queue status", "hi": "कतार स्थिति", "bn": "কাতারের অবস্থা"},
    IntentType.CIVIC_APPLICATION: {"en": "Find a government service", "hi": "सरकारी सेवा", "bn": "সরকারি সেবা"},
    IntentType.UNKNOWN: {"en": "A public-service request", "hi": "एक सेवा अनुरोध", "bn": "একটি সেবার অনুরোধ"},
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
    }

    def __init__(self, db: Optional[DigitalTwinDatabase] = None) -> None:
        self.db = db or get_db()
        self.search_svc = SearchService(self.db)
        self.avail_svc = AvailabilityService(self.db)
        self.payment_svc = PaymentService(self.db)
        self.booking_svc = BookingService(self.db, self.payment_svc)
        self.orchestrator = SemanticOrchestrationAgent()
        self.vector_store = SnowflakeVectorStore(db_path=self.db.db_path)

    def advance_journey(
        self,
        intent: CitizenIntent,
        session: CitizenSession,
        current_stage: JourneyStage = JourneyStage.INTENT,
        user_selection: Optional[Dict[str, Any]] = None,
    ) -> CitizenJourneyResponse:
        lang = intent.language if intent.language in ["hi", "bn", "en"] else "en"
        prompts = self.PROMPTS.get(lang, self.PROMPTS["en"])
        selection = dict(user_selection or {})

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
        else:
            message = (
                f"I understood this as:\n{label}\n{origin} → {dest}\n{date}\n{time_pref}\n{passengers} passenger"
            )
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
            options.append({
                "train_no": train_no,
                "train_name": train["train_name"],
                "source": train.get("source_station", train.get("source", intent.source_station or "Unavailable")),
                "destination": train.get("destination_station", train.get("destination", intent.destination_station or "Unavailable")),
                "class_type": class_pref,
                "quota": quota,
                "available_seats": avail_seats if avail_seats is not None else "Unavailable",
                "is_available": avail.get("available", False),
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
        return options[:3]
