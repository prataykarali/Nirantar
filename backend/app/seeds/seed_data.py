"""
NIRANTAR — Synthetic Seed Data
================================
Populates the database with deterministic synthetic fixtures.
Every demo run is reproducible. Data matches what was in mockTrains.ts and stationData.ts.

Run: python -m backend.app.seeds.seed_data
"""

import hashlib
from backend.app.models.base import init_db, get_db_session
from backend.app.models.journey_models import (
    StationModel, TrainModel, TrainAvailabilityModel, UserModel
)


from backend.app.api.auth import hash_password


STATIONS = [
    {"code": "NDLS", "name": "New Delhi", "city": "Delhi", "state": "Delhi",
     "aliases": ["NDLS", "NEW DELHI", "DELHI", "DLI", "NZM", "ANVT"]},
    {"code": "HWH", "name": "Howrah Junction", "city": "Kolkata", "state": "West Bengal",
     "aliases": ["HWH", "HOWRAH", "KOLKATA", "CALCUTTA", "SDAH", "SEALDAH"]},
    {"code": "CSMT", "name": "Chhatrapati Shivaji Maharaj Terminus", "city": "Mumbai", "state": "Maharashtra",
     "aliases": ["CSMT", "CSTM", "MUMBAI", "BOMBAY", "BCT", "MMCT"]},
    {"code": "SBC", "name": "KSR Bengaluru City", "city": "Bengaluru", "state": "Karnataka",
     "aliases": ["SBC", "BANGALORE", "BENGALURU", "YPR"]},
    {"code": "MAS", "name": "Chennai Central", "city": "Chennai", "state": "Tamil Nadu",
     "aliases": ["MAS", "CHENNAI", "MADRAS"]},
    {"code": "ADI", "name": "Ahmedabad Junction", "city": "Ahmedabad", "state": "Gujarat",
     "aliases": ["ADI", "AHMEDABAD", "AMDAVAD"]},
    {"code": "PNBE", "name": "Patna Junction", "city": "Patna", "state": "Bihar",
     "aliases": ["PNBE", "PATNA"]},
    {"code": "HYB", "name": "Hyderabad Deccan", "city": "Hyderabad", "state": "Telangana",
     "aliases": ["HYB", "HYDERABAD", "SC", "SECUNDERABAD"]},
    {"code": "PUNE", "name": "Pune Junction", "city": "Pune", "state": "Maharashtra",
     "aliases": ["PUNE", "POONA"]},
    {"code": "BSB", "name": "Varanasi Junction", "city": "Varanasi", "state": "Uttar Pradesh",
     "aliases": ["BSB", "VARANASI", "BANARAS", "KASHI"]},
    {"code": "LKO", "name": "Lucknow Charbagh", "city": "Lucknow", "state": "Uttar Pradesh",
     "aliases": ["LKO", "LUCKNOW"]},
    {"code": "GHY", "name": "Guwahati Junction", "city": "Guwahati", "state": "Assam",
     "aliases": ["GHY", "GUWAHATI"]},
    {"code": "CBE", "name": "Coimbatore Junction", "city": "Coimbatore", "state": "Tamil Nadu",
     "aliases": ["CBE", "COIMBATORE"]},
    {"code": "MDU", "name": "Madurai Junction", "city": "Madurai", "state": "Tamil Nadu",
     "aliases": ["MDU", "MADURAI"]},
]

TRAINS = [
    # Delhi → Kolkata
    {
        "train_number": "12302", "train_name": "Howrah Rajdhani Express", "train_type": "RAJDHANI",
        "from_station_code": "NDLS", "from_station_name": "New Delhi", "from_city": "Delhi",
        "to_station_code": "HWH", "to_station_name": "Howrah Junction", "to_city": "Kolkata",
        "departure_time": "16:55", "arrival_time": "09:55", "duration_hours": "17h 00m",
        "distance_km": 1451, "running_days": ["Mon", "Tue", "Wed", "Fri", "Sat", "Sun"],
        "rating": 4.8, "punctuality_score": 95, "pantry_available": True, "cleanliness_score": 98,
        "is_fastest": True,
        "ai_recommendation_reason": "Fastest overnight journey with all meals included and 95% punctuality.",
        "classes": [
            {"class_code": "3A", "class_name": "AC 3-Tier", "fare": 2050, "status": "AVAILABLE", "available_seats": 48, "confirmation_probability": 100, "catering_included": True},
            {"class_code": "2A", "class_name": "AC 2-Tier", "fare": 2980, "status": "AVAILABLE", "available_seats": 18, "confirmation_probability": 100, "catering_included": True},
            {"class_code": "1A", "class_name": "AC First Class", "fare": 4850, "status": "AVAILABLE", "available_seats": 6, "confirmation_probability": 100, "catering_included": True},
        ],
    },
    {
        "train_number": "12260", "train_name": "Sealdah AC Duronto Express", "train_type": "DURONTO",
        "from_station_code": "NDLS", "from_station_name": "New Delhi", "from_city": "Delhi",
        "to_station_code": "HWH", "to_station_name": "Howrah / Sealdah", "to_city": "Kolkata",
        "departure_time": "20:05", "arrival_time": "12:40", "duration_hours": "16h 35m",
        "distance_km": 1458, "running_days": ["Mon", "Tue", "Thu", "Fri"],
        "rating": 4.7, "punctuality_score": 93, "pantry_available": True, "cleanliness_score": 95,
        "is_best_value": True,
        "ai_recommendation_reason": "Non-stop point-to-point express with high seat availability.",
        "classes": [
            {"class_code": "3A", "class_name": "AC 3-Tier", "fare": 1980, "status": "AVAILABLE", "available_seats": 64, "confirmation_probability": 100, "catering_included": True},
            {"class_code": "2A", "class_name": "AC 2-Tier", "fare": 2890, "status": "AVAILABLE", "available_seats": 12, "confirmation_probability": 100, "catering_included": True},
            {"class_code": "1A", "class_name": "AC First Class", "fare": 4720, "status": "AVAILABLE", "available_seats": 4, "confirmation_probability": 100, "catering_included": True},
        ],
    },
    # Delhi → Mumbai
    {
        "train_number": "22222", "train_name": "CSMT Tejas Rajdhani", "train_type": "RAJDHANI",
        "from_station_code": "NDLS", "from_station_name": "New Delhi", "from_city": "Delhi",
        "to_station_code": "CSMT", "to_station_name": "Mumbai CSMT", "to_city": "Mumbai",
        "departure_time": "16:55", "arrival_time": "08:35", "duration_hours": "15h 40m",
        "distance_km": 1543, "running_days": ["Mon", "Wed", "Fri", "Sat"],
        "rating": 4.9, "punctuality_score": 97, "pantry_available": True, "cleanliness_score": 99,
        "is_fastest": True,
        "ai_recommendation_reason": "Fastest overnight smart train to Mumbai with Wi-Fi and automatic doors.",
        "classes": [
            {"class_code": "3A", "class_name": "AC 3-Tier", "fare": 2150, "status": "AVAILABLE", "available_seats": 52, "confirmation_probability": 100, "catering_included": True},
            {"class_code": "2A", "class_name": "AC 2-Tier", "fare": 3120, "status": "AVAILABLE", "available_seats": 22, "confirmation_probability": 100, "catering_included": True},
            {"class_code": "1A", "class_name": "AC First Class", "fare": 5120, "status": "AVAILABLE", "available_seats": 8, "confirmation_probability": 100, "catering_included": True},
        ],
    },
    {
        "train_number": "12952", "train_name": "Mumbai Rajdhani Express", "train_type": "RAJDHANI",
        "from_station_code": "NDLS", "from_station_name": "New Delhi", "from_city": "Delhi",
        "to_station_code": "CSMT", "to_station_name": "Mumbai Central (MMCT)", "to_city": "Mumbai",
        "departure_time": "16:55", "arrival_time": "08:35", "duration_hours": "15h 40m",
        "distance_km": 1386, "running_days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "rating": 4.8, "punctuality_score": 96, "pantry_available": True, "cleanliness_score": 97,
        "classes": [
            {"class_code": "3A", "class_name": "AC 3-Tier", "fare": 2120, "status": "AVAILABLE", "available_seats": 38, "confirmation_probability": 100, "catering_included": True},
            {"class_code": "2A", "class_name": "AC 2-Tier", "fare": 3080, "status": "AVAILABLE", "available_seats": 16, "confirmation_probability": 100, "catering_included": True},
            {"class_code": "1A", "class_name": "AC First Class", "fare": 5040, "status": "AVAILABLE", "available_seats": 4, "confirmation_probability": 100, "catering_included": True},
        ],
    },
    # Delhi → Varanasi
    {
        "train_number": "22436", "train_name": "Vande Bharat Express", "train_type": "VANDE_BHARAT",
        "from_station_code": "NDLS", "from_station_name": "New Delhi", "from_city": "Delhi",
        "to_station_code": "BSB", "to_station_name": "Varanasi Junction", "to_city": "Varanasi",
        "departure_time": "06:00", "arrival_time": "14:00", "duration_hours": "8h 00m",
        "distance_km": 759, "running_days": ["Tue", "Wed", "Fri", "Sat", "Sun"],
        "rating": 4.9, "punctuality_score": 98, "pantry_available": True, "cleanliness_score": 99,
        "is_fastest": True,
        "ai_recommendation_reason": "Semi-high speed daylight express reaching Varanasi in just 8 hours.",
        "classes": [
            {"class_code": "CC", "class_name": "AC Chair Car", "fare": 1750, "status": "AVAILABLE", "available_seats": 74, "confirmation_probability": 100, "catering_included": True},
            {"class_code": "EC", "class_name": "Executive Chair Car", "fare": 3300, "status": "AVAILABLE", "available_seats": 14, "confirmation_probability": 100, "catering_included": True},
        ],
    },
    # Chennai → Bangalore
    {
        "train_number": "20608", "train_name": "Vande Bharat Express", "train_type": "VANDE_BHARAT",
        "from_station_code": "MAS", "from_station_name": "Chennai Central", "from_city": "Chennai",
        "to_station_code": "SBC", "to_station_name": "KSR Bengaluru City", "to_city": "Bengaluru",
        "departure_time": "05:50", "arrival_time": "10:10", "duration_hours": "4h 20m",
        "distance_km": 359, "running_days": ["Mon", "Tue", "Thu", "Fri", "Sat", "Sun"],
        "rating": 4.9, "punctuality_score": 98, "pantry_available": True, "cleanliness_score": 99,
        "is_fastest": True,
        "ai_recommendation_reason": "Ultra-fast morning executive connection reaching Bengaluru in 4h 20m.",
        "classes": [
            {"class_code": "CC", "class_name": "AC Chair Car", "fare": 995, "status": "AVAILABLE", "available_seats": 88, "confirmation_probability": 100, "catering_included": True},
            {"class_code": "EC", "class_name": "Executive Chair Car", "fare": 1885, "status": "AVAILABLE", "available_seats": 18, "confirmation_probability": 100, "catering_included": True},
        ],
    },
]

USERS = [
    {"display_name": "Ananya Sharma", "username": "ananya", "password": "nirantar2026"},
    {"display_name": "Rahul Sharma", "username": "rahul", "password": "nirantar2026"},
    {"display_name": "Sunita Sharma", "username": "sunita", "password": "nirantar2026"},
]


def _seed_stations(db) -> None:
    """Seed synthetic station master data."""
    if db.query(StationModel).first():
        return
    for s in STATIONS:
        db.add(StationModel(**s))
    db.flush()
    print(f"📍 Seeded {len(STATIONS)} stations")


def _seed_trains(db) -> None:
    """Seed synthetic trains and availability models."""
    if db.query(TrainModel).first():
        return

    for train_data in TRAINS:
        classes = train_data.get("classes", [])
        dur_str = train_data.get("duration_hours", "0h 00m")
        dur_m = 0
        if "h" in dur_str:
            parts = dur_str.split("h")
            dur_m += int(parts[0].strip()) * 60
            if len(parts) > 1 and "m" in parts[1]:
                dur_m += int(parts[1].replace("m", "").strip() or 0)

        train_dict = {
            "train_number": train_data["train_number"],
            "train_name": train_data["train_name"],
            "train_type": train_data.get("train_type", "SUPERFAST"),
            "from_station_code": train_data["from_station_code"],
            "from_station_name": train_data.get("from_station_name"),
            "from_city": train_data.get("from_city"),
            "to_station_code": train_data["to_station_code"],
            "to_station_name": train_data.get("to_station_name"),
            "to_city": train_data.get("to_city"),
            "departure_time": train_data["departure_time"],
            "arrival_time": train_data["arrival_time"],
            "duration_hours": train_data.get("duration_hours"),
            "duration_minutes": dur_m,
            "distance_km": train_data.get("distance_km", 0),
            "total_distance_km": train_data.get("distance_km", 0),
            "running_days": train_data.get("running_days", []),
            "rating": train_data.get("rating", 4.8),
            "punctuality_score": train_data.get("punctuality_score", 95),
            "pantry_available": train_data.get("pantry_available", True),
            "cleanliness_score": train_data.get("cleanliness_score", 95),
            "is_fastest": train_data.get("is_fastest", False),
            "is_best_value": train_data.get("is_best_value", False),
            "ai_recommendation_reason": train_data.get("ai_recommendation_reason"),
        }
        train = TrainModel(**train_dict)
        db.add(train)
        db.flush()

        for cls in classes:
            db.add(TrainAvailabilityModel(
                train_id=train.id,
                travel_date="2026-08-27",
                class_code=cls["class_code"],
                class_name=cls.get("class_name", cls["class_code"]),
                quota="General (GN)",
                fare=cls["fare"],
                available_seats=cls.get("available_seats", 50),
                status=cls.get("status", "AVAILABLE"),
                confirmation_probability=cls.get("confirmation_probability", 100),
                catering_included=cls.get("catering_included", False),
            ))

    print(f"🚆 Seeded {len(TRAINS)} trains with availability")


def _seed_users(db) -> None:
    """Seed synthetic users with isolated wallet balance."""
    if db.query(UserModel).first():
        return
    for u in USERS:
        user_model = UserModel(
            display_name=u["display_name"],
            username=u["username"],
            email=f"{u['username']}@nirantar.gov.in",
            phone="9876543210",
            password_hash=hash_password(u["password"]),
            wallet_balance=10000.00,
            avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={u['username']}",
        )
        db.add(user_model)
    print(f"👤 Seeded {len(USERS)} synthetic users")


def seed_all(force: bool = False):
    """Seed all tables with deterministic synthetic data."""
    init_db(force=force)

    with get_db_session() as db:
        if force:
            db.query(TrainAvailabilityModel).delete()
            db.query(TrainModel).delete()
            db.query(StationModel).delete()
            db.query(UserModel).delete()
            db.commit()

        _seed_stations(db)
        _seed_trains(db)
        _seed_users(db)

    print("✅ Database seeding complete!")


if __name__ == "__main__":
    seed_all()
