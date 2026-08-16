-- UPRSA (Uttar Pradesh Roller Sports Association) Database Schema for Supabase
-- Save and run this SQL script in your Supabase SQL Editor.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / USERS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'skater' CHECK (role IN ('public', 'skater', 'operator', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DISTRICTS
CREATE TABLE IF NOT EXISTS public.districts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  zone TEXT,
  president_name TEXT,
  secretary_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLUBS / ACADEMIES
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  district_name TEXT NOT NULL,
  coach_name TEXT,
  contact_phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SKATERS
CREATE TABLE IF NOT EXISTS public.skaters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  registration_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  father_mother_name TEXT NOT NULL,
  dob DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  age_group TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  district_name TEXT NOT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  club_name TEXT NOT NULL,
  discipline TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Amateur',
  photo_url TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  validity_until DATE DEFAULT '2027-03-31',
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TOURNAMENTS
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_number TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  venue TEXT NOT NULL,
  district_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  organizer TEXT NOT NULL,
  status TEXT DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Live', 'Completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TOURNAMENT EVENTS
CREATE TABLE IF NOT EXISTS public.tournament_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  discipline TEXT NOT NULL,
  age_group TEXT NOT NULL,
  gender TEXT NOT NULL,
  distance TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RACES
CREATE TABLE IF NOT EXISTS public.races (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.tournament_events(id) ON DELETE CASCADE,
  race_number TEXT NOT NULL,
  heat_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TOURNAMENT REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.tournament_events(id) ON DELETE CASCADE,
  skater_id UUID REFERENCES public.skaters(id) ON DELETE CASCADE,
  bib_number TEXT,
  heat_number INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TOURNAMENT RESULTS & LIVE SCORING
CREATE TABLE IF NOT EXISTS public.tournament_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.tournament_events(id) ON DELETE CASCADE,
  race_id UUID REFERENCES public.races(id) ON DELETE SET NULL,
  skater_id UUID REFERENCES public.skaters(id) ON DELETE CASCADE,
  bib_number TEXT,
  timing TEXT,
  position INTEGER,
  points INTEGER DEFAULT 0,
  medal TEXT CHECK (medal IN ('Gold', 'Silver', 'Bronze', 'None')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. POINT SYSTEMS
CREATE TABLE IF NOT EXISTS public.point_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  position INTEGER UNIQUE NOT NULL,
  points INTEGER NOT NULL,
  label TEXT
);

-- Insert default point rules
INSERT INTO public.point_systems (position, points, label) VALUES
  (1, 10, '1st Place (Gold)'),
  (2, 7, '2nd Place (Silver)'),
  (3, 5, '3rd Place (Bronze)'),
  (4, 3, '4th Place'),
  (5, 2, '5th Place')
ON CONFLICT (position) DO UPDATE SET points = EXCLUDED.points;

-- 11. CERTIFICATES
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_number TEXT UNIQUE NOT NULL,
  skater_id UUID REFERENCES public.skaters(id) ON DELETE CASCADE,
  skater_name TEXT NOT NULL,
  father_mother_name TEXT,
  tournament_name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  position TEXT NOT NULL,
  club_name TEXT NOT NULL,
  district_name TEXT NOT NULL,
  issue_date DATE NOT NULL,
  verification_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_en TEXT NOT NULL,
  title_hi TEXT NOT NULL,
  content_en TEXT NOT NULL,
  content_hi TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  attachment_url TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. GALLERY
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Tournament',
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skaters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ ACCESS FOR ALL MAIN TABLES
CREATE POLICY "Public Read Districts" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Public Read Clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Public Read Tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Public Read Events" ON public.tournament_events FOR SELECT USING (true);
CREATE POLICY "Public Read Results" ON public.tournament_results FOR SELECT USING (true);
CREATE POLICY "Public Read Certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Public Read Announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Public Read Gallery" ON public.gallery FOR SELECT USING (true);

-- ENABLE ALL ACTIONS FOR AUTHENTICATED USERS / SERVICE ROLE
CREATE POLICY "Enable All for Admins" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Enable All Skaters" ON public.skaters FOR ALL USING (true);
CREATE POLICY "Enable All Registrations" ON public.tournament_registrations FOR ALL USING (true);
CREATE POLICY "Enable All Results" ON public.tournament_results FOR ALL USING (true);
CREATE POLICY "Enable All Certificates" ON public.certificates FOR ALL USING (true);
CREATE POLICY "Enable All Tournaments" ON public.tournaments FOR ALL USING (true);
CREATE POLICY "Enable All Clubs" ON public.clubs FOR ALL USING (true);
CREATE POLICY "Enable All Districts" ON public.districts FOR ALL USING (true);
