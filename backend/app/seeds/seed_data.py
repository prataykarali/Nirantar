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


def hash_password(password: str) -> str:
    """Simple hash for synthetic demo passwords. NOT production-grade."""
    return hashlib.sha256(password.encode()).hexdigest()


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


def seed_all():
    """Seed all tables with deterministic synthetic data."""
    init_db()

    with get_db_session() as db:
        # Check if already seeded
        existing = db.query(StationModel).first()
        if existing:
            print("✅ Database already seeded. Skipping.")
            return

        # 1. Seed Stations
        for s in STATIONS:
            db.add(StationModel(**s))
        print(f"📍 Seeded {len(STATIONS)} stations")

        # 2. Seed Trains + Availability
        for t in TRAINS:
            classes = t.pop("classes")
            train = TrainModel(**t)
            db.add(train)
            db.flush()  # Get the train.id

            for cls in classes:
                db.add(TrainAvailabilityModel(train_id=train.id, **cls))

        print(f"🚆 Seeded {len(TRAINS)} trains with availability")

        # 3. Seed Users with isolated wallet balance
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

    print("✅ Database seeding complete!")


if __name__ == "__main__":
    seed_all()
