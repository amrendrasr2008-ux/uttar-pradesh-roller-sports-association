-- =========================================================
-- UPRSA COMPLETE DATABASE SCHEMA & SCORING MIGRATION SCRIPT
-- SQL Migration Script for Supabase PostgreSQL
-- =========================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'skater',
  district_id UUID,
  club_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Districts Table
CREATE TABLE IF NOT EXISTS public.districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_hi TEXT,
  zone TEXT,
  president_name TEXT,
  secretary_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  skater_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Clubs Table
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_hi TEXT,
  district_id UUID REFERENCES public.districts(id) ON DELETE CASCADE,
  district_name TEXT,
  coach_name TEXT,
  contact_phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT DEFAULT 'approved',
  skater_count INT DEFAULT 0,
  total_points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Skaters Table
CREATE TABLE IF NOT EXISTS public.skaters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  registration_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  father_mother_name TEXT,
  dob DATE,
  gender TEXT,
  age_group TEXT,
  mobile TEXT,
  email TEXT,
  address TEXT,
  district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  district_name TEXT,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  club_name TEXT,
  discipline TEXT,
  category TEXT,
  photo_url TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  validity_until DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tournaments Table
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_number TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_hi TEXT,
  venue TEXT,
  district_name TEXT,
  start_date DATE,
  end_date DATE,
  organizer TEXT,
  status TEXT DEFAULT 'Upcoming',
  description_en TEXT,
  description_hi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tournament Events Table
CREATE TABLE IF NOT EXISTS public.tournament_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  discipline TEXT NOT NULL,
  age_group TEXT NOT NULL,
  gender TEXT NOT NULL,
  distance TEXT NOT NULL,
  race_number TEXT,
  heat_count INT DEFAULT 1,
  max_participants INT DEFAULT 16,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tournament Registrations Table
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.tournament_events(id) ON DELETE CASCADE,
  skater_id UUID REFERENCES public.skaters(id) ON DELETE CASCADE,
  skater_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  district_name TEXT,
  club_name TEXT,
  discipline TEXT,
  age_group TEXT,
  gender TEXT,
  distance TEXT,
  bib_number TEXT,
  heat_number INT DEFAULT 1,
  lane_number INT DEFAULT 1,
  status TEXT DEFAULT 'approved',
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Races & Heats Table
CREATE TABLE IF NOT EXISTS public.races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.tournament_events(id) ON DELETE CASCADE,
  race_number TEXT NOT NULL,
  heat_number INT NOT NULL DEFAULT 1,
  discipline TEXT NOT NULL,
  age_group TEXT NOT NULL,
  gender TEXT NOT NULL,
  distance TEXT NOT NULL,
  max_participants INT DEFAULT 8,
  scheduled_start_time TEXT,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  scoring_method TEXT NOT NULL DEFAULT 'TIMING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Race Participants Table
CREATE TABLE IF NOT EXISTS public.race_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.tournament_events(id) ON DELETE CASCADE,
  skater_id UUID REFERENCES public.skaters(id) ON DELETE CASCADE,
  skater_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  bib_number TEXT NOT NULL,
  gender TEXT NOT NULL,
  age_group TEXT NOT NULL,
  club_name TEXT NOT NULL,
  district_name TEXT NOT NULL,
  lane_number INT NOT NULL DEFAULT 1,
  heat_number INT NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'VALID',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Race Results & Timing Table
CREATE TABLE IF NOT EXISTS public.race_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.tournament_events(id) ON DELETE CASCADE,
  race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES public.race_participants(id) ON DELETE SET NULL,
  skater_id UUID NOT NULL REFERENCES public.skaters(id) ON DELETE CASCADE,
  skater_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  district_name TEXT NOT NULL,
  club_name TEXT NOT NULL,
  bib_number TEXT NOT NULL,
  raw_timing TEXT DEFAULT '00:00.00',
  penalty_seconds NUMERIC DEFAULT 0,
  final_timing TEXT DEFAULT '00:00.00',
  score NUMERIC DEFAULT 0,
  position INT NOT NULL DEFAULT 1,
  points INT NOT NULL DEFAULT 0,
  medal TEXT DEFAULT 'None',
  status TEXT NOT NULL DEFAULT 'VALID',
  approval_status TEXT NOT NULL DEFAULT 'Draft',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Global Tournament Results Table
CREATE TABLE IF NOT EXISTS public.tournament_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.tournament_events(id) ON DELETE CASCADE,
  race_id UUID REFERENCES public.races(id) ON DELETE SET NULL,
  skater_id UUID REFERENCES public.skaters(id) ON DELETE CASCADE,
  skater_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  district_name TEXT,
  club_name TEXT,
  bib_number TEXT NOT NULL,
  timing TEXT DEFAULT '00:00.00',
  raw_timing TEXT DEFAULT '00:00.00',
  penalty_seconds NUMERIC DEFAULT 0,
  score NUMERIC DEFAULT 0,
  position INT NOT NULL DEFAULT 1,
  points INT NOT NULL DEFAULT 0,
  medal TEXT DEFAULT 'None',
  status TEXT DEFAULT 'VALID',
  approval_status TEXT DEFAULT 'Published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Ranking Snapshots Table
CREATE TABLE IF NOT EXISTS public.ranking_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  category TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Scoring Rules Table
CREATE TABLE IF NOT EXISTS public.scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position INT NOT NULL UNIQUE,
  points INT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number TEXT UNIQUE NOT NULL,
  skater_id UUID REFERENCES public.skaters(id) ON DELETE CASCADE,
  skater_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  father_mother_name TEXT,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  tournament_name TEXT NOT NULL,
  tournament_number TEXT,
  event_id UUID REFERENCES public.tournament_events(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  discipline TEXT NOT NULL,
  age_group TEXT NOT NULL,
  gender TEXT NOT NULL,
  position TEXT NOT NULL,
  score TEXT,
  timing TEXT,
  club_name TEXT,
  district_name TEXT,
  certificate_date DATE,
  issue_date DATE,
  status TEXT DEFAULT 'Issued',
  certificate_type TEXT DEFAULT 'Merit',
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Certificate Templates Table
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  background_url TEXT,
  layout_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Live Scoreboard State Table
CREATE TABLE IF NOT EXISTS public.scoreboard_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.tournament_events(id) ON DELETE SET NULL,
  race_id UUID REFERENCES public.races(id) ON DELETE SET NULL,
  mode TEXT NOT NULL DEFAULT 'MODE_1_CURRENT_RACE',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Hero Slides Table
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  desktop_image TEXT NOT NULL,
  mobile_image TEXT,
  video_url TEXT,
  title_en TEXT NOT NULL,
  title_hi TEXT,
  description_en TEXT,
  description_hi TEXT,
  primary_btn_text_en TEXT,
  primary_btn_text_hi TEXT,
  primary_btn_url TEXT,
  secondary_btn_text_en TEXT,
  secondary_btn_text_hi TEXT,
  secondary_btn_url TEXT,
  overlay_strength INT DEFAULT 60,
  active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Home Sections Table
CREATE TABLE IF NOT EXISTS public.home_sections (
  id TEXT PRIMARY KEY,
  title_en TEXT,
  title_hi TEXT,
  subtitle_en TEXT,
  subtitle_hi TEXT,
  enabled BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Website Content Table
CREATE TABLE IF NOT EXISTS public.website_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  section TEXT NOT NULL,
  title_en TEXT,
  title_hi TEXT,
  content_en TEXT,
  content_hi TEXT,
  image_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Media Library Table
CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT,
  file_type TEXT,
  category TEXT DEFAULT 'general',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_hi TEXT,
  content_en TEXT,
  content_hi TEXT,
  category TEXT DEFAULT 'General',
  date DATE DEFAULT CURRENT_DATE,
  attachment_url TEXT,
  image_url TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Gallery Items Table
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_en TEXT,
  title_hi TEXT,
  category TEXT DEFAULT 'General',
  image_url TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Scoring Rules
INSERT INTO public.scoring_rules (position, points, label)
VALUES 
  (1, 10, '1st Place (Gold Medal)'),
  (2, 7, '2nd Place (Silver Medal)'),
  (3, 5, '3rd Place (Bronze Medal)'),
  (4, 3, '4th Place'),
  (5, 2, '5th Place')
ON CONFLICT (position) DO UPDATE SET points = EXCLUDED.points;

-- Enable Supabase Realtime for Scoreboard & Results Synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE public.races;
ALTER PUBLICATION supabase_realtime ADD TABLE public.race_results;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scoreboard_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_results;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skaters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoreboard_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Public Read Access Policies
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Read Districts" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Public Read Clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Public Read Skaters" ON public.skaters FOR SELECT USING (true);
CREATE POLICY "Public Read Tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Public Read Tournament Events" ON public.tournament_events FOR SELECT USING (true);
CREATE POLICY "Public Read Tournament Registrations" ON public.tournament_registrations FOR SELECT USING (true);
CREATE POLICY "Public Read Races" ON public.races FOR SELECT USING (true);
CREATE POLICY "Public Read Race Participants" ON public.race_participants FOR SELECT USING (true);
CREATE POLICY "Public Read Race Results" ON public.race_results FOR SELECT USING (true);
CREATE POLICY "Public Read Tournament Results" ON public.tournament_results FOR SELECT USING (true);
CREATE POLICY "Public Read Ranking Snapshots" ON public.ranking_snapshots FOR SELECT USING (true);
CREATE POLICY "Public Read Scoring Rules" ON public.scoring_rules FOR SELECT USING (true);
CREATE POLICY "Public Read Certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Public Read Certificate Templates" ON public.certificate_templates FOR SELECT USING (true);
CREATE POLICY "Public Read Scoreboard State" ON public.scoreboard_state FOR SELECT USING (true);
CREATE POLICY "Public Read Hero Slides" ON public.hero_slides FOR SELECT USING (true);
CREATE POLICY "Public Read Home Sections" ON public.home_sections FOR SELECT USING (true);
CREATE POLICY "Public Read Website Content" ON public.website_content FOR SELECT USING (true);
CREATE POLICY "Public Read Media Library" ON public.media_library FOR SELECT USING (true);
CREATE POLICY "Public Read Announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Public Read Gallery Items" ON public.gallery_items FOR SELECT USING (true);

-- Authenticated Admin / Operator Write Access Policies
CREATE POLICY "Admin Full Profiles" ON public.profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Districts" ON public.districts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Clubs" ON public.clubs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Skaters" ON public.skaters FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Tournaments" ON public.tournaments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Tournament Events" ON public.tournament_events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Tournament Registrations" ON public.tournament_registrations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Races" ON public.races FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Race Participants" ON public.race_participants FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Race Results" ON public.race_results FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Tournament Results" ON public.tournament_results FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Ranking Snapshots" ON public.ranking_snapshots FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Scoring Rules" ON public.scoring_rules FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Certificates" ON public.certificates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Certificate Templates" ON public.certificate_templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Scoreboard State" ON public.scoreboard_state FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Hero Slides" ON public.hero_slides FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Home Sections" ON public.home_sections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Website Content" ON public.website_content FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Media Library" ON public.media_library FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Announcements" ON public.announcements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin Full Gallery Items" ON public.gallery_items FOR ALL USING (auth.role() = 'authenticated');

