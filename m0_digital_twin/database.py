"""
NIRANTAR Module 0 — Synthetic Database Engine
=============================================
Thread-safe in-memory / relational synthetic database for the public-service digital twin.
Pre-populated with realistic Indian railway network data & civic services (Zero Real PII).
"""

import sqlite3
import threading
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from .models import (
    CitizenProfile,
    Station,
    Train,
    Schedule,
    SeatInventory,
    BookingRecord,
    PaymentTransaction,
    ApplicationRecord,
    TelemetryMetric,
    SecurityEvent,
    BookingStatus,
    PaymentStatus,
)


class DigitalTwinDatabase:
    """Thread-safe SQLite/In-memory database for the Synthetic Public Service Digital Twin."""

    _instance = None
    _lock = threading.Lock()

    def __init__(self, db_path: str = ":memory:") -> None:
        self.db_path = db_path
        self._local = threading.local()
        self._init_schema()
        self._seed_default_data()

    def _get_connection(self) -> sqlite3.Connection:
        if not hasattr(self._local, "conn") or self._local.conn is None:
            self._local.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self._local.conn.row_factory = sqlite3.Row
            # Auto-initialize schema and seeds if not present
            cur = self._local.conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='trains'")
            if not cur.fetchone():
                self._init_schema()
                self._seed_default_data()
        return self._local.conn

    def _init_schema(self) -> None:
        conn = self._get_connection()
        cur = conn.cursor()
        cur.executescript("""
        CREATE TABLE IF NOT EXISTS stations (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            zone TEXT NOT NULL,
            state TEXT NOT NULL,
            division TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS trains (
            train_no TEXT PRIMARY KEY,
            train_name TEXT NOT NULL,
            train_type TEXT NOT NULL,
            source_station TEXT NOT NULL,
            destination_station TEXT NOT NULL,
            tatkal_enabled INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            train_no TEXT NOT NULL,
            station_code TEXT NOT NULL,
            arrival_time TEXT NOT NULL,
            departure_time TEXT NOT NULL,
            halt_minutes INTEGER NOT NULL,
            day_offset INTEGER NOT NULL,
            distance_km INTEGER NOT NULL,
            FOREIGN KEY (train_no) REFERENCES trains(train_no),
            FOREIGN KEY (station_code) REFERENCES stations(code)
        );

        CREATE TABLE IF NOT EXISTS seat_inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            train_no TEXT NOT NULL,
            travel_date TEXT NOT NULL,
            class_type TEXT NOT NULL,
            quota TEXT NOT NULL,
            total_capacity INTEGER NOT NULL,
            available_seats INTEGER NOT NULL,
            booked_seats INTEGER NOT NULL DEFAULT 0,
            rac_count INTEGER NOT NULL DEFAULT 0,
            waitlist_count INTEGER NOT NULL DEFAULT 0,
            fare_inr REAL NOT NULL,
            is_locked INTEGER NOT NULL DEFAULT 0,
            UNIQUE(train_no, travel_date, class_type, quota)
        );

        CREATE TABLE IF NOT EXISTS citizens (
            citizen_id TEXT PRIMARY KEY,
            name_masked TEXT NOT NULL,
            preferred_language TEXT NOT NULL,
            phone_masked TEXT NOT NULL,
            auth_token TEXT NOT NULL,
            virtual_id TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS bookings (
            booking_id TEXT PRIMARY KEY,
            pnr TEXT NOT NULL UNIQUE,
            citizen_id TEXT NOT NULL,
            train_no TEXT NOT NULL,
            travel_date TEXT NOT NULL,
            class_type TEXT NOT NULL,
            quota TEXT NOT NULL,
            source_station TEXT NOT NULL,
            destination_station TEXT NOT NULL,
            status TEXT NOT NULL,
            total_amount_inr REAL NOT NULL,
            payment_id TEXT,
            passengers_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS payments (
            transaction_id TEXT PRIMARY KEY,
            booking_id TEXT NOT NULL,
            amount_inr REAL NOT NULL,
            method TEXT NOT NULL,
            status TEXT NOT NULL,
            gateway_ref TEXT NOT NULL,
            latency_ms REAL NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS applications (
            application_id TEXT PRIMARY KEY,
            citizen_id TEXT NOT NULL,
            service_code TEXT NOT NULL,
            service_name TEXT NOT NULL,
            category TEXT NOT NULL,
            status TEXT NOT NULL,
            submitted_data_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service_name TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            requests_per_sec REAL NOT NULL,
            concurrent_users INTEGER NOT NULL,
            cpu_percent REAL NOT NULL,
            ram_percent REAL NOT NULL,
            network_mbps REAL NOT NULL,
            latency_p50_ms REAL NOT NULL,
            latency_p99_ms REAL NOT NULL,
            error_rate REAL NOT NULL,
            queue_length INTEGER NOT NULL,
            throughput_rps REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS security_events (
            event_id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            ip_address TEXT NOT NULL,
            user_agent TEXT NOT NULL,
            event_type TEXT NOT NULL,
            threat_level TEXT NOT NULL,
            threat_score REAL NOT NULL,
            details_json TEXT NOT NULL
        );
        """)
        conn.commit()

    def _seed_default_data(self) -> None:
        conn = self._get_connection()
        cur = conn.cursor()        # 1. Seed Stations
        stations = [
            ("NDLS", "New Delhi", "NR", "Delhi", "Delhi"),
            ("DLI", "Old Delhi Junction", "NR", "Delhi", "Delhi"),
            ("NZM", "Hazrat Nizamuddin", "NR", "Delhi", "Delhi"),
            ("ANVT", "Anand Vihar Terminal", "NR", "Delhi", "Delhi"),
            ("HWH", "Howrah Junction", "ER", "West Bengal", "Howrah"),
            ("SDAH", "Sealdah", "ER", "West Bengal", "Kolkata"),
            ("KOAA", "Kolkata Terminal", "ER", "West Bengal", "Kolkata"),
            ("NJP", "New Jalpaiguri Junction", "NFR", "West Bengal", "Siliguri"),
            ("BCT", "Mumbai Central", "WR", "Maharashtra", "Mumbai"),
            ("CSMT", "Chhatrapati Shivaji Maharaj Terminus", "CR", "Maharashtra", "Mumbai"),
            ("MAS", "Chennai Central", "SR", "Tamil Nadu", "Chennai"),
            ("SBC", "KSR Bengaluru", "SWR", "Karnataka", "Bengaluru"),
            ("PNBE", "Patna Junction", "ECR", "Bihar", "Danapur"),
            ("GHY", "Guwahati", "NFR", "Assam", "Lumding"),
            ("BSB", "Varanasi Junction", "NR", "Uttar Pradesh", "Lucknow"),
            ("LKO", "Lucknow Charbagh", "NR", "Uttar Pradesh", "Lucknow"),
            ("CNB", "Kanpur Central", "NCR", "Uttar Pradesh", "Prayagraj"),
            ("ADI", "Ahmedabad Junction", "WR", "Gujarat", "Ahmedabad"),
            ("PUNE", "Pune Junction", "CR", "Maharashtra", "Pune"),
            ("KGP", "Kharagpur Junction", "SER", "West Bengal", "Kharagpur"),
            ("PURI", "Puri", "ECoR", "Odisha", "Puri"),
            ("BBS", "Bhubaneswar", "ECoR", "Odisha", "Bhubaneswar"),
            ("KLK", "Kalka", "NR", "Haryana", "Kalka"),
            ("SML", "Shimla", "NR", "Himachal Pradesh", "Shimla"),
            ("JP", "Jaipur Junction", "NWR", "Rajasthan", "Jaipur"),
            ("RNC", "Ranchi Junction", "SER", "Jharkhand", "Ranchi"),
            ("ST", "Surat", "WR", "Gujarat", "Surat"),
            ("KNE", "Kishanganj", "NFR", "Bihar", "Kishanganj"),
            ("MLDT", "Malda Town", "ER", "West Bengal", "Malda"),
            ("KNJ", "Krishnanagar City Junction", "ER", "West Bengal", "Krishnanagar"),
            ("MYPR", "Mayapur", "ER", "West Bengal", "Mayapur"),
            ("SHM", "Shalimar", "SER", "West Bengal", "Howrah"),
        ]
        cur.executemany("INSERT OR IGNORE INTO stations VALUES (?, ?, ?, ?, ?)", stations)

        # 2. Seed Trains
        trains = [
            # Delhi <-> NJP
            ("12423", "Dibrugarh Rajdhani Express", "Rajdhani", "NDLS", "NJP", 1),
            ("20503", "New Delhi - Dibrugarh Rajdhani", "Rajdhani", "NDLS", "NJP", 1),
            ("12505", "North East Express", "Superfast", "ANVT", "NJP", 1),
            ("15483", "Mahananda Express", "Express", "DLI", "NJP", 1),
            # Delhi <-> Kolkata / Howrah / Sealdah
            ("12301", "Howrah Rajdhani Express", "Rajdhani", "HWH", "NDLS", 1),
            ("12302", "New Delhi - Howrah Rajdhani", "Rajdhani", "NDLS", "HWH", 1),
            ("12313", "Sealdah Rajdhani Express", "Rajdhani", "SDAH", "NDLS", 1),
            ("12314", "New Delhi - Sealdah Rajdhani", "Rajdhani", "NDLS", "SDAH", 1),
            ("12305", "Kolkata Rajdhani Express", "Rajdhani", "KOAA", "NDLS", 1),
            ("12306", "New Delhi - Kolkata Rajdhani", "Rajdhani", "NDLS", "KOAA", 1),
            # Kolkata / Sealdah <-> NJP
            ("12377", "Padatik Superfast Express", "Superfast", "SDAH", "NJP", 1),
            ("12378", "Padatik Express (Return)", "Superfast", "NJP", "SDAH", 1),
            ("12343", "Darjeeling Mail", "Superfast", "SDAH", "NJP", 1),
            ("12344", "Darjeeling Mail (Return)", "Superfast", "NJP", "SDAH", 1),
            ("22301", "Howrah - NJP Vande Bharat", "Vande Bharat", "HWH", "NJP", 1),
            ("12041", "Howrah - NJP Shatabdi", "Shatabdi", "HWH", "NJP", 1),
            # Howrah / Sealdah / Shalimar <-> Mumbai
            ("12261", "Howrah - Mumbai Duronto Express", "Duronto", "HWH", "BCT", 1),
            ("12102", "Jnaneswari Super Deluxe Express", "Superfast", "HWH", "CSMT", 1),
            ("12321", "Howrah - Mumbai Mail", "Superfast", "HWH", "CSMT", 1),
            ("12262", "Mumbai - Howrah Duronto Express", "Duronto", "BCT", "HWH", 1),
            # Krishnanagar / Mayapur / Shalimar
            ("31811", "Sealdah - Krishnanagar Local", "Local", "SDAH", "KNJ", 1),
            ("31812", "Krishnanagar - Mayapur Local", "Local", "KNJ", "MYPR", 1),
            ("38401", "Howrah - Shalimar Local", "Local", "HWH", "SHM", 1),
            ("38402", "Shalimar - Howrah Local", "Local", "SHM", "HWH", 1),
            # Howrah / Kharagpur <-> Puri / Bhubaneswar
            ("12837", "Howrah - Puri Express", "Superfast", "HWH", "PURI", 1),
            ("12838", "Puri - Howrah Express", "Superfast", "PURI", "HWH", 1),
            ("20897", "Howrah - Puri Vande Bharat", "Vande Bharat", "HWH", "PURI", 1),
            ("12821", "Dhauli Express", "Express", "HWH", "PURI", 1),
            # Kalka / Shimla Corridor
            ("12311", "Netaji Express", "Express", "HWH", "KLK", 1),
            ("52453", "Kalka - Shimla Toy Train Express", "Express", "KLK", "SML", 1),
            # Mumbai <-> Delhi
            ("12951", "Mumbai Rajdhani Express", "Rajdhani", "BCT", "NDLS", 1),
            ("12952", "New Delhi - Mumbai Rajdhani", "Rajdhani", "NDLS", "BCT", 1),
            # Other Corridors
            ("12004", "Lucknow Shatabdi Express", "Shatabdi", "NDLS", "LKO", 1),
            ("22436", "Vande Bharat Express", "Vande Bharat", "NDLS", "BSB", 1),
            ("12626", "Kerala Superfast Express", "Superfast", "NDLS", "MAS", 1),
            ("12394", "Sampoorna Kranti Express", "Superfast", "NDLS", "PNBE", 1),
            ("12985", "Jaipur Double Decker Express", "Superfast", "NDLS", "JP", 1),
        ]
        cur.executemany("INSERT OR IGNORE INTO trains VALUES (?, ?, ?, ?, ?, ?)", trains)

        # 3. Seed Schedules
        schedules = [
            ("12423", "NDLS", "00:00", "16:20", 0, 0, 0),
            ("12423", "CNB", "21:30", "21:35", 5, 0, 440),
            ("12423", "NJP", "10:45", "00:00", 0, 1, 1480),
            ("20503", "NDLS", "00:00", "11:25", 0, 0, 0),
            ("20503", "NJP", "08:15", "00:00", 0, 1, 1480),
            ("12377", "SDAH", "00:00", "23:20", 0, 0, 0),
            ("12377", "MLDT", "04:30", "04:40", 10, 1, 332),
            ("12377", "KNE", "06:50", "06:52", 2, 1, 480),
            ("12377", "NJP", "09:15", "00:00", 0, 1, 573),
            ("12378", "NJP", "00:00", "21:00", 0, 0, 0),
            ("12378", "KNE", "22:15", "22:17", 2, 0, 93),
            ("12378", "MLDT", "00:50", "01:00", 10, 1, 241),
            ("12378", "SDAH", "06:45", "00:00", 0, 1, 573),
            ("12343", "SDAH", "00:00", "22:05", 0, 0, 0),
            ("12343", "MLDT", "03:15", "03:20", 5, 1, 332),
            ("12343", "KNE", "05:40", "05:42", 2, 1, 480),
            ("12343", "NJP", "08:00", "00:00", 0, 1, 573),
            ("12344", "NJP", "00:00", "20:00", 0, 0, 0),
            ("12344", "KNE", "21:15", "21:17", 2, 0, 93),
            ("12344", "MLDT", "23:50", "23:55", 5, 0, 241),
            ("12344", "SDAH", "05:30", "00:00", 0, 1, 573),
            ("22301", "HWH", "00:00", "05:55", 0, 0, 0),
            ("22301", "MLDT", "10:45", "10:47", 2, 0, 332),
            ("22301", "NJP", "13:25", "00:00", 0, 0, 566),
            ("12041", "HWH", "00:00", "14:15", 0, 0, 0),
            ("12041", "MLDT", "19:20", "19:25", 5, 0, 332),
            ("12041", "KNE", "21:15", "21:17", 2, 0, 480),
            ("12041", "NJP", "22:30", "00:00", 0, 0, 566),
            ("12837", "HWH", "00:00", "22:35", 0, 0, 0),
            ("12837", "KGP", "00:20", "00:25", 5, 1, 116),
            ("12837", "BBS", "05:10", "05:15", 5, 1, 437),
            ("12837", "PURI", "07:15", "00:00", 0, 1, 500),
            ("12838", "PURI", "00:00", "20:15", 0, 0, 0),
            ("12838", "KGP", "02:40", "02:45", 5, 1, 384),
            ("12838", "HWH", "04:45", "00:00", 0, 1, 500),
            ("20897", "HWH", "00:00", "06:10", 0, 0, 0),
            ("20897", "KGP", "07:38", "07:40", 2, 0, 116),
            ("20897", "PURI", "12:35", "00:00", 0, 0, 500),
            ("12821", "HWH", "00:00", "09:15", 0, 0, 0),
            ("12821", "KGP", "11:15", "11:20", 5, 0, 116),
            ("12821", "PURI", "18:15", "00:00", 0, 0, 500),
            ("12311", "HWH", "00:00", "21:55", 0, 0, 0),
            ("12311", "KLK", "03:00", "00:00", 0, 2, 1713),
            ("52453", "KLK", "00:00", "06:20", 0, 0, 0),
            ("52453", "SML", "11:35", "00:00", 0, 0, 96),
            ("12985", "NDLS", "00:00", "17:35", 0, 0, 0),
            ("12985", "JP", "22:05", "00:00", 0, 0, 303),
            ("12951", "BCT", "00:00", "17:00", 0, 0, 0),
            ("12951", "ADI", "21:30", "21:35", 5, 0, 492),
            ("12951", "NDLS", "08:32", "00:00", 0, 1, 1386),
            ("12952", "NDLS", "00:00", "16:30", 0, 0, 0),
            ("12952", "BCT", "08:35", "00:00", 0, 1, 1386),
            ("12301", "HWH", "00:00", "16:50", 0, 0, 0),
            ("12301", "PNBE", "22:10", "22:20", 10, 0, 532),
            ("12301", "CNB", "04:40", "04:45", 5, 1, 1010),
            ("12301", "NDLS", "10:05", "00:00", 0, 1, 1450),
            ("12302", "NDLS", "00:00", "16:55", 0, 0, 0),
            ("12302", "HWH", "09:55", "00:00", 0, 1, 1450),
            ("12313", "SDAH", "00:00", "16:50", 0, 0, 0),
            ("12313", "NDLS", "10:50", "00:00", 0, 1, 1450),
            ("12314", "NDLS", "00:00", "16:30", 0, 0, 0),
            ("12314", "SDAH", "10:10", "00:00", 0, 1, 1450),
            ("12305", "KOAA", "00:00", "14:05", 0, 0, 0),
            ("12305", "NDLS", "10:05", "00:00", 0, 1, 1450),
            ("12306", "NDLS", "00:00", "16:50", 0, 0, 0),
            ("12306", "KOAA", "12:15", "00:00", 0, 1, 1450),
            ("12951", "BCT", "00:00", "17:00", 0, 0, 0),
            ("12951", "ADI", "21:30", "21:35", 5, 0, 492),
            ("12951", "NDLS", "08:32", "00:00", 0, 1, 1386),
            ("12952", "NDLS", "00:00", "16:30", 0, 0, 0),
            ("12952", "BCT", "08:35", "00:00", 0, 1, 1386),
        ]
        cur.executemany("""
            INSERT OR IGNORE INTO schedules (train_no, station_code, arrival_time, departure_time, halt_minutes, day_offset, distance_km)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, schedules)

        # 4. Seed Inventory for next 7 days
        today = datetime.now(timezone.utc).date()
        inventory_rows = self._generate_inventory_rows(today, [t[0] for t in trains])

        cur.executemany("""
            INSERT OR IGNORE INTO seat_inventory (
                train_no, travel_date, class_type, quota, total_capacity,
                available_seats, booked_seats, rac_count, waitlist_count, fare_inr, is_locked
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, inventory_rows)

        # 5. Seed Synthetic Citizens
        now_iso = datetime.now(timezone.utc).isoformat()
        citizens = [
            ("CIT-001", "R*** K****", "hi", "+91-9876500001", "tok_cit001", "VID-88392101", now_iso),
            ("CIT-002", "S*** B****", "bn", "+91-9876500002", "tok_cit002", "VID-88392102", now_iso),
            ("CIT-003", "P*** D****", "en", "+91-9876500003", "tok_cit003", "VID-88392103", now_iso),
        ]
        cur.executemany("INSERT OR IGNORE INTO citizens VALUES (?, ?, ?, ?, ?, ?, ?)", citizens)
        conn.commit()

    def _generate_inventory_rows(self, today: Any, train_numbers: List[str]) -> List[Tuple[Any, ...]]:
        """Helper to generate seed inventory rows without nested loop bloat."""
        classes = [("1A", 2800.0, 18), ("2A", 1650.0, 48), ("3A", 1150.0, 120), ("SL", 420.0, 240)]
        quotas = [("GN", 0.7), ("TQ", 0.3)]
        dates = [(today + timedelta(days=d)).isoformat() for d in range(7)]
        combos = [
            (cls, base_fare, cap, quota, ratio)
            for cls, base_fare, cap in classes
            for quota, ratio in quotas
        ]

        rows: List[Tuple[Any, ...]] = []
        for dt in dates:
            for t_no in train_numbers:
                for cls, base_fare, cap, quota, ratio in combos:
                    q_cap = max(5, int(cap * ratio))
                    fare = base_fare * (1.3 if quota == "TQ" else 1.0)
                    avail = max(0, int(q_cap * 0.65))
                    rows.append((t_no, dt, cls, quota, q_cap, avail, q_cap - avail, 0, 0, fare, 0))
        return rows

    # Query Helpers
    def list_stations(self) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM stations ORDER BY name")
        return [dict(r) for r in cur.fetchall()]

    def _resolve_station_codes(self, term: str, cur: Any) -> List[str]:
        term_clean = term.strip().upper()
        codes = [term_clean]
        cur.execute("SELECT code FROM stations WHERE upper(code) = ? OR upper(name) LIKE ?",
                    (term_clean, f"%{term_clean}%"))
        for row in cur.fetchall():
            c = row[0] if isinstance(row, (list, tuple)) else row["code"]
            if c not in codes:
                codes.append(c)
        return codes

    def search_trains(self, source: str, destination: str) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        cur = conn.cursor()

        # Multi-station city clusters
        city_clusters = {
            "NDLS": ["NDLS", "DLI", "NZM", "ANVT"],
            "DLI": ["NDLS", "DLI", "NZM", "ANVT"],
            "NZM": ["NDLS", "DLI", "NZM", "ANVT"],
            "ANVT": ["NDLS", "DLI", "NZM", "ANVT"],
            "HWH": ["HWH", "SDAH", "KOAA", "SHM"],
            "SDAH": ["SDAH", "HWH", "KOAA", "SHM"],
            "KOAA": ["KOAA", "HWH", "SDAH", "SHM"],
            "SHM": ["SHM", "HWH", "SDAH", "KOAA"],
            "BCT": ["BCT", "CSMT", "LTT", "BDTS"],
            "CSMT": ["CSMT", "BCT", "LTT", "BDTS"],
            "MAS": ["MAS", "MS"],
            "SBC": ["SBC", "YPR", "SMVB"],
            "NJP": ["NJP", "SGUJ"],
            "MLDT": ["MLDT"],
            "KNE": ["KNE"],
        }

        src_resolved = self._resolve_station_codes(source, cur)
        dst_resolved = self._resolve_station_codes(destination, cur)

        src_list: List[str] = []
        for s in src_resolved:
            for item in city_clusters.get(s, [s]):
                if item not in src_list:
                    src_list.append(item)

        dst_list: List[str] = []
        for d in dst_resolved:
            for item in city_clusters.get(d, [d]):
                if item not in dst_list:
                    dst_list.append(item)

        src_placeholders = ",".join(["?"] * len(src_list))
        dst_placeholders = ",".join(["?"] * len(dst_list))

        query = f"""
            SELECT DISTINCT t.* FROM trains t
            WHERE (t.source_station IN ({src_placeholders}) AND t.destination_station IN ({dst_placeholders}))
               OR t.train_no IN (
                   SELECT s1.train_no FROM schedules s1
                   JOIN schedules s2 ON s1.train_no = s2.train_no
                   WHERE s1.station_code IN ({src_placeholders}) 
                     AND s2.station_code IN ({dst_placeholders}) 
                     AND s1.distance_km < s2.distance_km
               )
        """
        params = src_list + dst_list + src_list + dst_list
        cur.execute(query, params)
        return [dict(r) for r in cur.fetchall()]

    def get_inventory(self, train_no: str, travel_date: str, class_type: str, quota: str) -> Optional[Dict[str, Any]]:
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT * FROM seat_inventory
            WHERE train_no = ? AND travel_date = ? AND class_type = ? AND quota = ?
        """, (train_no, travel_date, class_type, quota))
        row = cur.fetchone()
        return dict(row) if row else None

    def get_schedule(self, train_no: str) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM schedules WHERE train_no = ? ORDER BY distance_km ASC", (train_no,))
        return [dict(r) for r in cur.fetchall()]

    def reserve_seats(self, train_no: str, travel_date: str, class_type: str, quota: str, seats: int) -> bool:
        """Atomic seat reservation with concurrency protection."""
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE seat_inventory
            SET available_seats = available_seats - ?,
                booked_seats = booked_seats + ?
            WHERE train_no = ? AND travel_date = ? AND class_type = ? AND quota = ?
              AND available_seats >= ?
        """, (seats, seats, train_no, travel_date, class_type, quota, seats))
        conn.commit()
        return cur.rowcount > 0

    def insert_booking(self, record: BookingRecord, passengers_json: str) -> None:
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO bookings (
                booking_id, pnr, citizen_id, train_no, travel_date, class_type,
                quota, source_station, destination_station, status, total_amount_inr,
                payment_id, passengers_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record.booking_id, record.pnr, record.citizen_id, record.train_no,
            record.travel_date, record.class_type, record.quota, record.source_station,
            record.destination_station, record.status.value, record.total_amount_inr,
            record.payment_id, passengers_json, record.created_at
        ))
        conn.commit()

    def insert_payment(self, payment: PaymentTransaction) -> None:
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payment.transaction_id, payment.booking_id, payment.amount_inr,
            payment.method.value, payment.status.value, payment.gateway_ref,
            payment.latency_ms, payment.created_at
        ))
        conn.commit()

    def insert_telemetry(self, metric: TelemetryMetric) -> None:
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO telemetry (
                service_name, timestamp, requests_per_sec, concurrent_users,
                cpu_percent, ram_percent, network_mbps, latency_p50_ms,
                latency_p99_ms, error_rate, queue_length, throughput_rps
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            metric.service_name, metric.timestamp, metric.requests_per_sec,
            metric.concurrent_users, metric.cpu_percent, metric.ram_percent,
            metric.network_mbps, metric.latency_p50_ms, metric.latency_p99_ms,
            metric.error_rate, metric.queue_length, metric.throughput_rps
        ))
        conn.commit()

    def get_latest_telemetry(self, limit: int = 10) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM telemetry ORDER BY id DESC LIMIT ?", (limit,))
        return [dict(r) for r in cur.fetchall()]


_global_db: Optional[DigitalTwinDatabase] = None


def get_db() -> DigitalTwinDatabase:
    """Singleton getter for the digital twin database."""
    global _global_db
    if _global_db is None:
        with DigitalTwinDatabase._lock:
            if _global_db is None:
                _global_db = DigitalTwinDatabase()
    return _global_db
