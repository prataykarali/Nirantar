-- ═══════════════════════════════════════════════════════════════════════════════
-- NIRANTAR — Supabase Database Schema & Quickstart Tables
-- ═══════════════════════════════════════════════════════════════════════════════
-- Copy and paste this entire script into your Supabase SQL Editor and click "Run".
-- Enables all tables for User Authentication, Saved Passengers, Tickets,
-- Virtual Wallet, Trains, Journeys, Notes, and Row Level Security (RLS).
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. QUICKSTART NOTES TABLE (from Supabase Quickstart) ──
CREATE TABLE IF NOT EXISTS public.notes (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample quickstart data
INSERT INTO public.notes (title)
VALUES
    ('Today I created a Supabase project.'),
    ('I added some data and queried it from Nirantar.'),
    ('Nirantar connected to Supabase seamlessly!')
ON CONFLICT DO NOTHING;

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can read notes" ON public.notes;
CREATE POLICY "public can read notes"
ON public.notes
FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "public can insert notes" ON public.notes;
CREATE POLICY "public can insert notes"
ON public.notes
FOR INSERT TO anon, authenticated
WITH CHECK (true);


-- ── 2. CITIZEN USERS & AUTHENTICATION TABLE ──
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    display_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    password_hash TEXT DEFAULT '',
    oauth_provider TEXT DEFAULT 'LOCAL',
    oauth_id TEXT,
    avatar_url TEXT,
    wallet_balance NUMERIC(10, 2) DEFAULT 10000.00,
    preferences JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can read users" ON public.users;
CREATE POLICY "public can read users"
ON public.users
FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "public can manage users" ON public.users;
CREATE POLICY "public can manage users"
ON public.users
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);


-- ── 3. SAVED PASSENGERS TABLE (Co-Travelers) ──
CREATE TABLE IF NOT EXISTS public.user_saved_passengers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(1) NOT NULL,
    berth_preference TEXT DEFAULT 'NO_PREFERENCE',
    senior_citizen_concession BOOLEAN DEFAULT FALSE,
    id_proof_type TEXT DEFAULT 'Aadhaar Card',
    nationality TEXT DEFAULT 'Indian',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_passengers_user_id ON public.user_saved_passengers(user_id);
ALTER TABLE public.user_saved_passengers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all on saved passengers" ON public.user_saved_passengers;
CREATE POLICY "allow all on saved passengers"
ON public.user_saved_passengers
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);


-- ── 4. CONFIRMED TICKETS TABLE (PNR Portfolio) ──
CREATE TABLE IF NOT EXISTS public.user_tickets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    pnr_number VARCHAR(30) UNIQUE NOT NULL,
    train_number VARCHAR(10) NOT NULL,
    train_name TEXT NOT NULL,
    from_station_code VARCHAR(10) NOT NULL,
    from_station_name TEXT NOT NULL,
    to_station_code VARCHAR(10) NOT NULL,
    to_station_name TEXT NOT NULL,
    departure_time VARCHAR(10) DEFAULT '16:55',
    arrival_time VARCHAR(10) DEFAULT '08:35',
    travel_date VARCHAR(20) NOT NULL,
    class_code VARCHAR(10) NOT NULL,
    coach VARCHAR(10) DEFAULT 'S5',
    seat_number INTEGER DEFAULT 36,
    fare INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'CONFIRMED',
    passengers JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_tickets_pnr ON public.user_tickets(pnr_number);
CREATE INDEX IF NOT EXISTS idx_user_tickets_user_id ON public.user_tickets(user_id);
ALTER TABLE public.user_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all on user tickets" ON public.user_tickets;
CREATE POLICY "allow all on user tickets"
ON public.user_tickets
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);


-- ── 5. VIRTUAL WALLET TRANSACTIONS TABLE ──
CREATE TABLE IF NOT EXISTS public.user_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'DEBIT' or 'CREDIT'
    description TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    balance_after NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_transactions_user_id ON public.user_transactions(user_id);
ALTER TABLE public.user_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all on user transactions" ON public.user_transactions;
CREATE POLICY "allow all on user transactions"
ON public.user_transactions
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);


-- ── 6. TRAIN STATIONS TABLE ──
CREATE TABLE IF NOT EXISTS public.stations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    code VARCHAR(10) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    aliases JSONB DEFAULT '[]'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_stations_code ON public.stations(code);
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can read stations" ON public.stations;
CREATE POLICY "public can read stations"
ON public.stations
FOR SELECT TO anon, authenticated
USING (true);


-- ── 7. TRAINS & SCHEDULES TABLE ──
CREATE TABLE IF NOT EXISTS public.trains (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    train_number VARCHAR(10) UNIQUE NOT NULL,
    train_name TEXT NOT NULL,
    train_type VARCHAR(30) DEFAULT 'SUPERFAST',
    from_station_code VARCHAR(10) NOT NULL,
    from_station_name TEXT,
    from_city TEXT,
    to_station_code VARCHAR(10) NOT NULL,
    to_station_name TEXT,
    to_city TEXT,
    departure_time VARCHAR(10) NOT NULL,
    arrival_time VARCHAR(10) NOT NULL,
    duration_hours VARCHAR(20),
    duration_minutes INTEGER DEFAULT 0,
    distance_km INTEGER DEFAULT 0,
    total_distance_km INTEGER DEFAULT 0,
    running_days JSONB DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]'::JSONB,
    rating NUMERIC(3, 1) DEFAULT 4.8,
    punctuality_score INTEGER DEFAULT 95,
    pantry_available BOOLEAN DEFAULT TRUE,
    cleanliness_score INTEGER DEFAULT 95,
    is_fastest BOOLEAN DEFAULT FALSE,
    is_best_value BOOLEAN DEFAULT FALSE,
    ai_recommendation_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_trains_number ON public.trains(train_number);
ALTER TABLE public.trains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can read trains" ON public.trains;
CREATE POLICY "public can read trains"
ON public.trains
FOR SELECT TO anon, authenticated
USING (true);


-- ── 8. SEED DEFAULT CITIZEN PROFILE ──
INSERT INTO public.users (
    id, display_name, username, email, phone, wallet_balance, preferences
) VALUES (
    'usr-citizen-ananya',
    'Ananya Sharma',
    'ananya.sharma',
    'ananya.sharma@example.in',
    '+91 98765 43210',
    10000.00,
    '{"theme": "lavender", "easy_mode": false, "language": "en"}'::JSONB
) ON CONFLICT (username) DO UPDATE
SET wallet_balance = EXCLUDED.wallet_balance;

