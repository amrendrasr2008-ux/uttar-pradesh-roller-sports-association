-- UPRSA Production-Grade Row Level Security (RLS) & Security Hardening Migration
-- File: supabase/migrations/002_rls_security.sql

-- ============================================================================
-- 1. SECURITY HELPER FUNCTIONS (SECURITY DEFINER with fixed search_path)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  u_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'public';
  END IF;
  
  SELECT role INTO u_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(u_role, 'public');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_operator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role() IN ('admin', 'operator');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_district_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role() IN ('admin', 'district');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_district_id()
RETURNS UUID AS $$
DECLARE
  d_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT district_id INTO d_id
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN d_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_skater_id()
RETURNS UUID AS $$
DECLARE
  s_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT skater_id INTO s_id
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN s_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ============================================================================
-- 2. PREVENT PRIVILEGE ESCALATION ON PROFILES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If not an admin, lock administrative fields to existing values
  IF NOT public.is_admin() THEN
    NEW.role := OLD.role;
    NEW.skater_id := OLD.skater_id;
    NEW.district_id := OLD.district_id;
    IF OLD.is_active IS NOT NULL THEN
      NEW.is_active := OLD.is_active;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER tr_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();


-- ============================================================================
-- 3. PROFILES TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin Full Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins full profiles access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin()
  );

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = id OR public.is_admin()
  );

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR public.is_admin()
  );


-- ============================================================================
-- 4. SKATERS TABLE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Public Read Skaters" ON public.skaters;
DROP POLICY IF EXISTS "Admin Full Skaters" ON public.skaters;
DROP POLICY IF EXISTS "Enable All Skaters" ON public.skaters;
DROP POLICY IF EXISTS "skaters_select_policy" ON public.skaters;
DROP POLICY IF EXISTS "skaters_insert_policy" ON public.skaters;
DROP POLICY IF EXISTS "skaters_update_policy" ON public.skaters;
DROP POLICY IF EXISTS "skaters_delete_policy" ON public.skaters;

ALTER TABLE public.skaters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skaters_select_policy" ON public.skaters
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND (id = public.get_user_skater_id() OR (user_id IS NOT NULL AND user_id = auth.uid())))
    OR (public.is_district_user() AND (district_id = public.get_user_district_id() OR district_name = (SELECT name_en FROM public.districts WHERE id = public.get_user_district_id())))
    OR public.is_operator()
    OR public.is_admin()
  );

CREATE POLICY "skaters_insert_policy" ON public.skaters
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL)
    OR public.is_admin()
  );

CREATE POLICY "skaters_update_policy" ON public.skaters
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL AND (id = public.get_user_skater_id() OR (user_id IS NOT NULL AND user_id = auth.uid())))
    OR (public.is_district_user() AND (district_id = public.get_user_district_id() OR district_name = (SELECT name_en FROM public.districts WHERE id = public.get_user_district_id())))
    OR public.is_operator()
    OR public.is_admin()
  );

CREATE POLICY "skaters_delete_policy" ON public.skaters
  FOR DELETE USING (
    public.is_admin()
  );


-- ============================================================================
-- 5. DISTRICTS & CLUBS RLS
-- ============================================================================

DROP POLICY IF EXISTS "Public Read Districts" ON public.districts;
DROP POLICY IF EXISTS "Enable All Districts" ON public.districts;
DROP POLICY IF EXISTS "Admin Full Districts" ON public.districts;
DROP POLICY IF EXISTS "districts_select_policy" ON public.districts;
DROP POLICY IF EXISTS "districts_all_policy" ON public.districts;

ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "districts_select_policy" ON public.districts FOR SELECT USING (true);
CREATE POLICY "districts_all_policy" ON public.districts FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public Read Clubs" ON public.clubs;
DROP POLICY IF EXISTS "Enable All Clubs" ON public.clubs;
DROP POLICY IF EXISTS "Admin Full Clubs" ON public.clubs;
DROP POLICY IF EXISTS "clubs_select_policy" ON public.clubs;
DROP POLICY IF EXISTS "clubs_all_policy" ON public.clubs;

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clubs_select_policy" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "clubs_all_policy" ON public.clubs FOR ALL USING (
  public.is_admin() OR (public.is_district_user() AND district_id = public.get_user_district_id())
);


-- ============================================================================
-- 6. TOURNAMENTS & EVENTS RLS
-- ============================================================================

DROP POLICY IF EXISTS "Public Read Tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Enable All Tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Admin Full Tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_select_policy" ON public.tournaments;
DROP POLICY IF EXISTS "tournaments_write_policy" ON public.tournaments;

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournaments_select_policy" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "tournaments_write_policy" ON public.tournaments FOR ALL USING (public.is_operator() OR public.is_admin());

DROP POLICY IF EXISTS "Public Read Events" ON public.tournament_events;
DROP POLICY IF EXISTS "Public Read Tournament Events" ON public.tournament_events;
DROP POLICY IF EXISTS "Admin Full Tournament Events" ON public.tournament_events;
DROP POLICY IF EXISTS "events_select_policy" ON public.tournament_events;
DROP POLICY IF EXISTS "events_write_policy" ON public.tournament_events;

ALTER TABLE public.tournament_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_policy" ON public.tournament_events FOR SELECT USING (true);
CREATE POLICY "events_write_policy" ON public.tournament_events FOR ALL USING (public.is_operator() OR public.is_admin());


-- ============================================================================
-- 7. TOURNAMENT REGISTRATIONS RLS
-- ============================================================================

DROP POLICY IF EXISTS "Enable All Registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Public Read Tournament Registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "Admin Full Tournament Registrations" ON public.tournament_registrations;
DROP POLICY IF EXISTS "registrations_select_policy" ON public.tournament_registrations;
DROP POLICY IF EXISTS "registrations_insert_policy" ON public.tournament_registrations;
DROP POLICY IF EXISTS "registrations_update_policy" ON public.tournament_registrations;
DROP POLICY IF EXISTS "registrations_delete_policy" ON public.tournament_registrations;

ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registrations_select_policy" ON public.tournament_registrations FOR SELECT USING (
  status IN ('approved', 'active')
  OR (auth.uid() IS NOT NULL AND skater_id = public.get_user_skater_id())
  OR (public.is_district_user() AND district_name = (SELECT name_en FROM public.districts WHERE id = public.get_user_district_id()))
  OR public.is_operator()
  OR public.is_admin()
);

CREATE POLICY "registrations_insert_policy" ON public.tournament_registrations FOR INSERT WITH CHECK (
  (auth.uid() IS NOT NULL AND skater_id = public.get_user_skater_id())
  OR public.is_operator()
  OR public.is_admin()
);

CREATE POLICY "registrations_update_policy" ON public.tournament_registrations FOR UPDATE USING (
  (auth.uid() IS NOT NULL AND skater_id = public.get_user_skater_id())
  OR public.is_operator()
  OR public.is_admin()
);

CREATE POLICY "registrations_delete_policy" ON public.tournament_registrations FOR DELETE USING (
  (auth.uid() IS NOT NULL AND skater_id = public.get_user_skater_id())
  OR public.is_admin()
);


-- ============================================================================
-- 8. RACES & RACE PARTICIPANTS RLS
-- ============================================================================

DROP POLICY IF EXISTS "Public Read Races" ON public.races;
DROP POLICY IF EXISTS "Admin Full Races" ON public.races;
DROP POLICY IF EXISTS "races_select_policy" ON public.races;
DROP POLICY IF EXISTS "races_write_policy" ON public.races;

ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
CREATE POLICY "races_select_policy" ON public.races FOR SELECT USING (true);
CREATE POLICY "races_write_policy" ON public.races FOR ALL USING (public.is_operator() OR public.is_admin());

DROP POLICY IF EXISTS "Public Read Race Participants" ON public.race_participants;
DROP POLICY IF EXISTS "Admin Full Race Participants" ON public.race_participants;
DROP POLICY IF EXISTS "race_participants_select_policy" ON public.race_participants;
DROP POLICY IF EXISTS "race_participants_write_policy" ON public.race_participants;

ALTER TABLE public.race_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "race_participants_select_policy" ON public.race_participants FOR SELECT USING (true);
CREATE POLICY "race_participants_write_policy" ON public.race_participants FOR ALL USING (public.is_operator() OR public.is_admin());


-- ============================================================================
-- 9. RACE RESULTS & TOURNAMENT RESULTS RLS (Draft Results are Private)
-- ============================================================================

DROP POLICY IF EXISTS "Public Read Results" ON public.tournament_results;
DROP POLICY IF EXISTS "Enable All Results" ON public.tournament_results;
DROP POLICY IF EXISTS "Public Read Race Results" ON public.race_results;
DROP POLICY IF EXISTS "Admin Full Race Results" ON public.race_results;
DROP POLICY IF EXISTS "Public Read Tournament Results" ON public.tournament_results;
DROP POLICY IF EXISTS "Admin Full Tournament Results" ON public.tournament_results;
DROP POLICY IF EXISTS "race_results_select_policy" ON public.race_results;
DROP POLICY IF EXISTS "race_results_write_policy" ON public.race_results;
DROP POLICY IF EXISTS "tournament_results_select_policy" ON public.tournament_results;
DROP POLICY IF EXISTS "tournament_results_write_policy" ON public.tournament_results;

ALTER TABLE public.race_results ENABLE ROW LEVEL SECURITY;

-- Public can ONLY view 'Published' race results. Skaters can view own.
CREATE POLICY "race_results_select_policy" ON public.race_results FOR SELECT USING (
  approval_status = 'Published'
  OR (auth.uid() IS NOT NULL AND skater_id = public.get_user_skater_id())
  OR public.is_operator()
  OR public.is_admin()
);

CREATE POLICY "race_results_write_policy" ON public.race_results FOR ALL USING (
  public.is_operator() OR public.is_admin()
);

ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;

-- Public can ONLY view 'Published' tournament results. Skaters can view own.
CREATE POLICY "tournament_results_select_policy" ON public.tournament_results FOR SELECT USING (
  approval_status IN ('Published', 'published')
  OR (auth.uid() IS NOT NULL AND skater_id = public.get_user_skater_id())
  OR public.is_operator()
  OR public.is_admin()
);

CREATE POLICY "tournament_results_write_policy" ON public.tournament_results FOR ALL USING (
  public.is_operator() OR public.is_admin()
);


-- ============================================================================
-- 10. RANKING SNAPSHOTS & SCORING RULES RLS
-- ============================================================================

DROP POLICY IF EXISTS "Public Read Ranking Snapshots" ON public.ranking_snapshots;
DROP POLICY IF EXISTS "Admin Full Ranking Snapshots" ON public.ranking_snapshots;
DROP POLICY IF EXISTS "Public Read Scoring Rules" ON public.scoring_rules;
DROP POLICY IF EXISTS "Admin Full Scoring Rules" ON public.scoring_rules;
DROP POLICY IF EXISTS "Public Read Point Systems" ON public.point_systems;
DROP POLICY IF EXISTS "ranking_snapshots_select_policy" ON public.ranking_snapshots;
DROP POLICY IF EXISTS "ranking_snapshots_write_policy" ON public.ranking_snapshots;
DROP POLICY IF EXISTS "scoring_rules_select_policy" ON public.scoring_rules;
DROP POLICY IF EXISTS "scoring_rules_write_policy" ON public.scoring_rules;
DROP POLICY IF EXISTS "point_systems_select_policy" ON public.point_systems;
DROP POLICY IF EXISTS "point_systems_write_policy" ON public.point_systems;

ALTER TABLE public.ranking_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ranking_snapshots_select_policy" ON public.ranking_snapshots FOR SELECT USING (true);
CREATE POLICY "ranking_snapshots_write_policy" ON public.ranking_snapshots FOR ALL USING (public.is_admin());

ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scoring_rules_select_policy" ON public.scoring_rules FOR SELECT USING (true);
CREATE POLICY "scoring_rules_write_policy" ON public.scoring_rules FOR ALL USING (public.is_admin());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='point_systems') THEN
    ALTER TABLE public.point_systems ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "point_systems_select_policy" ON public.point_systems FOR SELECT USING (true);
    CREATE POLICY "point_systems_write_policy" ON public.point_systems FOR ALL USING (public.is_admin());
  END IF;
END $$;


-- ============================================================================
-- 11. CERTIFICATES & CERTIFICATE TEMPLATES RLS
-- ============================================================================

DROP POLICY IF EXISTS "Public Read Certificates" ON public.certificates;
DROP POLICY IF EXISTS "Enable All Certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admin Full Certificates" ON public.certificates;
DROP POLICY IF EXISTS "Public Read Certificate Templates" ON public.certificate_templates;
DROP POLICY IF EXISTS "Admin Full Certificate Templates" ON public.certificate_templates;
DROP POLICY IF EXISTS "certificates_select_policy" ON public.certificates;
DROP POLICY IF EXISTS "certificates_write_policy" ON public.certificates;
DROP POLICY IF EXISTS "certificate_templates_select_policy" ON public.certificate_templates;
DROP POLICY IF EXISTS "certificate_templates_write_policy" ON public.certificate_templates;

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificates_select_policy" ON public.certificates FOR SELECT USING (
  status IN ('Issued', 'Published', 'active')
  OR (auth.uid() IS NOT NULL AND skater_id = public.get_user_skater_id())
  OR public.is_operator()
  OR public.is_admin()
);

CREATE POLICY "certificates_write_policy" ON public.certificates FOR ALL USING (
  public.is_operator() OR public.is_admin()
);

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificate_templates_select_policy" ON public.certificate_templates FOR SELECT USING (
  public.is_operator() OR public.is_admin()
);

CREATE POLICY "certificate_templates_write_policy" ON public.certificate_templates FOR ALL USING (
  public.is_admin()
);


-- ============================================================================
-- 12. SCOREBOARD STATE RLS
-- ============================================================================

DROP POLICY IF EXISTS "Public Read Scoreboard State" ON public.scoreboard_state;
DROP POLICY IF EXISTS "Admin Full Scoreboard State" ON public.scoreboard_state;
DROP POLICY IF EXISTS "scoreboard_state_select_policy" ON public.scoreboard_state;
DROP POLICY IF EXISTS "scoreboard_state_write_policy" ON public.scoreboard_state;

ALTER TABLE public.scoreboard_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scoreboard_state_select_policy" ON public.scoreboard_state FOR SELECT USING (true);
CREATE POLICY "scoreboard_state_write_policy" ON public.scoreboard_state FOR ALL USING (
  public.is_operator() OR public.is_admin()
);


-- ============================================================================
-- 13. WEBSITE CMS & ANNOUNCEMENTS RLS
-- ============================================================================

DROP POLICY IF EXISTS "Public Read Hero Slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Admin Full Hero Slides" ON public.hero_slides;
DROP POLICY IF EXISTS "hero_slides_select_policy" ON public.hero_slides;
DROP POLICY IF EXISTS "hero_slides_write_policy" ON public.hero_slides;

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hero_slides_select_policy" ON public.hero_slides FOR SELECT USING (
  active = true OR public.is_admin()
);
CREATE POLICY "hero_slides_write_policy" ON public.hero_slides FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public Read Home Sections" ON public.home_sections;
DROP POLICY IF EXISTS "Admin Full Home Sections" ON public.home_sections;
DROP POLICY IF EXISTS "home_sections_select_policy" ON public.home_sections;
DROP POLICY IF EXISTS "home_sections_write_policy" ON public.home_sections;

ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "home_sections_select_policy" ON public.home_sections FOR SELECT USING (
  enabled = true OR public.is_admin()
);
CREATE POLICY "home_sections_write_policy" ON public.home_sections FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public Read Website Content" ON public.website_content;
DROP POLICY IF EXISTS "Admin Full Website Content" ON public.website_content;
DROP POLICY IF EXISTS "website_content_select_policy" ON public.website_content;
DROP POLICY IF EXISTS "website_content_write_policy" ON public.website_content;

ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "website_content_select_policy" ON public.website_content FOR SELECT USING (true);
CREATE POLICY "website_content_write_policy" ON public.website_content FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public Read Media Library" ON public.media_library;
DROP POLICY IF EXISTS "Admin Full Media Library" ON public.media_library;
DROP POLICY IF EXISTS "media_library_select_policy" ON public.media_library;
DROP POLICY IF EXISTS "media_library_write_policy" ON public.media_library;

ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_library_select_policy" ON public.media_library FOR SELECT USING (true);
CREATE POLICY "media_library_write_policy" ON public.media_library FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public Read Announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admin Full Announcements" ON public.announcements;
DROP POLICY IF EXISTS "announcements_select_policy" ON public.announcements;
DROP POLICY IF EXISTS "announcements_write_policy" ON public.announcements;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements_select_policy" ON public.announcements FOR SELECT USING (
  is_published = true OR public.is_admin()
);
CREATE POLICY "announcements_write_policy" ON public.announcements FOR ALL USING (public.is_admin());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gallery_items') THEN
    ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Read Gallery Items" ON public.gallery_items;
    DROP POLICY IF EXISTS "Admin Full Gallery Items" ON public.gallery_items;
    DROP POLICY IF EXISTS "gallery_items_select_policy" ON public.gallery_items;
    DROP POLICY IF EXISTS "gallery_items_write_policy" ON public.gallery_items;
    CREATE POLICY "gallery_items_select_policy" ON public.gallery_items FOR SELECT USING (is_published = true OR public.is_admin());
    CREATE POLICY "gallery_items_write_policy" ON public.gallery_items FOR ALL USING (public.is_admin());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gallery') THEN
    ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public Read Gallery" ON public.gallery;
    DROP POLICY IF EXISTS "gallery_select_policy" ON public.gallery;
    DROP POLICY IF EXISTS "gallery_write_policy" ON public.gallery;
    CREATE POLICY "gallery_select_policy" ON public.gallery FOR SELECT USING (true);
    CREATE POLICY "gallery_write_policy" ON public.gallery FOR ALL USING (public.is_admin());
  END IF;
END $$;


-- ============================================================================
-- 14. STORAGE OBJECTS SECURITY POLICIES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public Read Storage Assets" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Upload Storage Assets" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Manage Storage Assets" ON storage.objects;

    CREATE POLICY "Public Read Storage Assets" ON storage.objects
      FOR SELECT USING (
        bucket_id IN ('skater-photos', 'certificates', 'media', 'public-assets')
        OR public.is_admin()
      );

    CREATE POLICY "Authenticated Upload Storage Assets" ON storage.objects
      FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
      );

    CREATE POLICY "Admin Manage Storage Assets" ON storage.objects
      FOR ALL USING (
        public.is_admin()
      );
  END IF;
END $$;
