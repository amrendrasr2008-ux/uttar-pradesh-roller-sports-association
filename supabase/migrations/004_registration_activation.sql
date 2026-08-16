-- Migration: 004_registration_activation.sql
-- UPRSA Phase 4: Skater Registration, Account Activation, & Email Log System

-- 1. Ensure columns exist on public.skaters
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skaters' AND column_name='account_status') THEN
    ALTER TABLE public.skaters ADD COLUMN account_status TEXT DEFAULT 'pending' CHECK (account_status IN ('pending', 'invited', 'active', 'disabled'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skaters' AND column_name='approved_at') THEN
    ALTER TABLE public.skaters ADD COLUMN approved_at TIMESTAMPTZ NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skaters' AND column_name='approved_by') THEN
    ALTER TABLE public.skaters ADD COLUMN approved_by TEXT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skaters' AND column_name='rejected_at') THEN
    ALTER TABLE public.skaters ADD COLUMN rejected_at TIMESTAMPTZ NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skaters' AND column_name='rejected_by') THEN
    ALTER TABLE public.skaters ADD COLUMN rejected_by TEXT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skaters' AND column_name='rejection_reason') THEN
    ALTER TABLE public.skaters ADD COLUMN rejection_reason TEXT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skaters' AND column_name='email_status') THEN
    ALTER TABLE public.skaters ADD COLUMN email_status TEXT DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skaters' AND column_name='email_sent_at') THEN
    ALTER TABLE public.skaters ADD COLUMN email_sent_at TIMESTAMPTZ NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skaters' AND column_name='user_id') THEN
    ALTER TABLE public.skaters ADD COLUMN user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Email Logs Table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  template TEXT NOT NULL,
  reference_type TEXT NULL,
  reference_id TEXT NULL,
  status TEXT NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'FAILED', 'PENDING')),
  error_message TEXT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for public.email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to email_logs" ON public.email_logs;
CREATE POLICY "Admins full access to email_logs" ON public.email_logs
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Users view email logs sent to them" ON public.email_logs;
CREATE POLICY "Users view email logs sent to them" ON public.email_logs
  FOR SELECT USING (auth.jwt()->>'email' = recipient);

-- 3. Function to link skater to auth profile on admin approval
CREATE OR REPLACE FUNCTION public.link_skater_to_profile(
  p_skater_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.skaters
  SET user_id = p_user_id,
      account_status = 'invited',
      updated_at = NOW()
  WHERE id = p_skater_id;

  UPDATE public.profiles
  SET skater_id = p_skater_id,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
