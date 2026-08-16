-- UPRSA Phase 5: QR-Based Tournament Payment System Migration
-- File: supabase/migrations/005_tournament_payments.sql

-- 1. Create Payment Settings Table
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upi_id TEXT NOT NULL DEFAULT 'uprsa@upi',
  upi_display_name TEXT NOT NULL DEFAULT 'Uttar Pradesh Roller Sports Association',
  qr_code_url TEXT DEFAULT '',
  payment_instructions TEXT DEFAULT '1. Scan QR Code using any UPI App (Google Pay, PhonePe, Paytm, BHIM).\n2. Pay the exact tournament registration fee.\n3. Copy the 12-digit UTR / Transaction ID.\n4. Upload clear payment screenshot (max 15 KB).\n5. Submit for manual verification by UPRSA Admin.',
  support_phone TEXT DEFAULT '+91 94150 11223',
  support_email TEXT DEFAULT 'payments@uprsa.org',
  payment_enabled BOOLEAN DEFAULT true,
  default_tournament_fee NUMERIC DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Payment Configuration if empty
INSERT INTO public.payment_settings (upi_id, upi_display_name, payment_instructions, support_phone, support_email, payment_enabled, default_tournament_fee)
SELECT 'uprsa@upi', 'Uttar Pradesh Roller Sports Association', '1. Scan QR Code using any UPI App.\n2. Pay exact registration amount.\n3. Copy UTR / Transaction ID.\n4. Upload payment screenshot.\n5. Submit for manual verification.', '+91 94150 11223', 'payments@uprsa.org', true, 500
WHERE NOT EXISTS (SELECT 1 FROM public.payment_settings);

-- 2. Add payment_status to tournament_registrations if missing
ALTER TABLE public.tournament_registrations 
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'UNPAID',
  ADD COLUMN IF NOT EXISTS fee_amount NUMERIC DEFAULT 500;

-- 3. Create Tournament Payments Table
CREATE TABLE IF NOT EXISTS public.tournament_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.tournament_registrations(id) ON DELETE CASCADE,
  skater_id UUID REFERENCES public.skaters(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 500,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT DEFAULT 'UPI_QR',
  upi_id TEXT DEFAULT 'uprsa@upi',
  utr_number TEXT NOT NULL,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  screenshot_storage_path TEXT,
  status TEXT CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED', 'CANCELLED')) DEFAULT 'PENDING',
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index to prevent duplicate UTR numbers for pending or verified payments
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_payments_utr_active 
  ON public.tournament_payments(LOWER(TRIM(utr_number))) 
  WHERE status IN ('PENDING', 'VERIFIED');

CREATE INDEX IF NOT EXISTS idx_tournament_payments_skater ON public.tournament_payments(skater_id);
CREATE INDEX IF NOT EXISTS idx_tournament_payments_tournament ON public.tournament_payments(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_payments_status ON public.tournament_payments(status);

-- 4. Create Private Storage Bucket for Payment Proofs (Strict 15 KB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-proofs', 'payment-proofs', false, 15360, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 15360,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 5. Row Level Security (RLS)
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_payments ENABLE ROW LEVEL SECURITY;

-- Payment Settings RLS: Public/Skater can SELECT active settings, Admin full access
DROP POLICY IF EXISTS "Public Read Payment Settings" ON public.payment_settings;
CREATE POLICY "Public Read Payment Settings" ON public.payment_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Manage Payment Settings" ON public.payment_settings;
CREATE POLICY "Admin Manage Payment Settings" ON public.payment_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Tournament Payments RLS:
-- Skater: Read own payments
DROP POLICY IF EXISTS "Skater Read Own Payments" ON public.tournament_payments;
CREATE POLICY "Skater Read Own Payments" ON public.tournament_payments
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      skater_id IN (SELECT s.id FROM public.skaters s WHERE s.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
  );

-- Skater: Insert payment record (status must be PENDING)
DROP POLICY IF EXISTS "Skater Submit Payment" ON public.tournament_payments;
CREATE POLICY "Skater Submit Payment" ON public.tournament_payments
  FOR INSERT WITH CHECK (
    status = 'PENDING' AND (
      auth.uid() IS NOT NULL OR true
    )
  );

-- Admin: Full Payment Management
DROP POLICY IF EXISTS "Admin Manage Payments" ON public.tournament_payments;
CREATE POLICY "Admin Manage Payments" ON public.tournament_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Storage RLS for payment-proofs bucket
DROP POLICY IF EXISTS "Payment Proof Owner/Admin Read" ON storage.objects;
CREATE POLICY "Payment Proof Owner/Admin Read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-proofs' AND (
      auth.uid() IS NOT NULL AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
      )
    )
  );

DROP POLICY IF EXISTS "Payment Proof Insert" ON storage.objects;
CREATE POLICY "Payment Proof Insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-proofs'
  );
