-- UPRSA Certificate Management Module Database Schema Migration
-- Migration Name: 20260810_certificates.sql

-- 1. CERTIFICATE TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS certificate_templates (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'template-default-uprsa',
    title TEXT NOT NULL DEFAULT 'CERTIFICATE OF MERIT & ACHIEVEMENT',
    logo_url TEXT,
    background_url TEXT,
    header_text TEXT NOT NULL DEFAULT 'UTTAR PRADESH ROLLER SPORTS ASSOCIATION',
    sub_header_text TEXT DEFAULT 'Affiliated to Roller Skating Federation of India (RSFI) • Recognized by UP Olympic Association',
    president_name TEXT DEFAULT 'Sri D. S. Mishra',
    president_title TEXT DEFAULT 'President, UPRSA',
    president_signature_url TEXT,
    secretary_name TEXT DEFAULT 'Sri Pankaj Sharma',
    secretary_title TEXT DEFAULT 'General Secretary, UPRSA',
    secretary_signature_url TEXT,
    official_seal_url TEXT,
    number_prefix VARCHAR(32) DEFAULT 'UPRSA-CERT-2026-',
    footer_text TEXT DEFAULT 'Official UPRSA Digital Credential • Scannable QR Code for Authentication',
    primary_color VARCHAR(16) DEFAULT '#d97706',
    secondary_color VARCHAR(16) DEFAULT '#0f172a',
    is_default BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS certificates (
    id VARCHAR(64) PRIMARY KEY,
    certificate_number VARCHAR(64) UNIQUE NOT NULL,
    skater_id VARCHAR(64) REFERENCES skaters(id) ON DELETE SET NULL,
    skater_name TEXT NOT NULL,
    registration_number VARCHAR(64) NOT NULL,
    father_mother_name TEXT,
    tournament_id VARCHAR(64) REFERENCES tournaments(id) ON DELETE CASCADE,
    tournament_name TEXT NOT NULL,
    tournament_number VARCHAR(64),
    event_id VARCHAR(64) REFERENCES events(id) ON DELETE SET NULL,
    event_name TEXT NOT NULL,
    discipline VARCHAR(64) NOT NULL,
    age_group VARCHAR(64) NOT NULL,
    gender VARCHAR(16) NOT NULL,
    position TEXT NOT NULL,
    score TEXT,
    timing VARCHAR(32),
    club_name TEXT,
    district_name TEXT NOT NULL,
    certificate_date DATE DEFAULT CURRENT_DATE,
    issue_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'Issued', -- 'Draft', 'Generated', 'Issued', 'Verified', 'Revoked'
    verification_code VARCHAR(64) UNIQUE NOT NULL,
    verification_token VARCHAR(128) NOT NULL,
    certificate_type VARCHAR(32) DEFAULT 'Merit', -- 'Merit', 'Participation', 'Official'
    pdf_url TEXT,
    revoked_reason TEXT,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CERTIFICATE VERIFICATION LOGS TABLE
CREATE TABLE IF NOT EXISTS certificate_verification_logs (
    id VARCHAR(64) PRIMARY KEY,
    certificate_id VARCHAR(64) REFERENCES certificates(id) ON DELETE SET NULL,
    certificate_number VARCHAR(64) NOT NULL,
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(32) NOT NULL, -- 'VALID', 'REVOKED', 'INVALID'
    ip_address VARCHAR(64)
);

-- INDEXES FOR FAST QUERYING & VERIFICATION
CREATE INDEX IF NOT EXISTS idx_certificates_cert_no ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_skater_id ON certificates(skater_id);
CREATE INDEX IF NOT EXISTS idx_certificates_tournament_id ON certificates(tournament_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_token ON certificates(verification_token);
CREATE INDEX IF NOT EXISTS idx_verification_logs_cert_no ON certificate_verification_logs(certificate_number);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_verification_logs ENABLE ROW LEVEL SECURITY;

-- PUBLIC CAN VERIFY CERTIFICATES (READ ONLY)
CREATE POLICY "Public Read Certificates for Verification"
    ON certificates FOR SELECT
    USING (true);

CREATE POLICY "Public Read Active Certificate Templates"
    ON certificate_templates FOR SELECT
    USING (true);

-- PUBLIC CAN INSERT VERIFICATION LOGS
CREATE POLICY "Public Insert Verification Logs"
    ON certificate_verification_logs FOR INSERT
    WITH CHECK (true);

-- ADMIN FULL ACCESS POLICIES
CREATE POLICY "Admin Full Access Certificate Templates"
    ON certificate_templates FOR ALL
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin Full Access Certificates"
    ON certificates FOR ALL
    USING (auth.role() = 'authenticated');

-- DEFAULT SEED DATA
INSERT INTO certificate_templates (
    id, title, header_text, sub_header_text, president_name, secretary_name, number_prefix, is_default
) VALUES (
    'template-default-uprsa',
    'CERTIFICATE OF MERIT & ACHIEVEMENT',
    'UTTAR PRADESH ROLLER SPORTS ASSOCIATION',
    'Affiliated to Roller Skating Federation of India (RSFI) • Recognized by UP Olympic Association',
    'Sri D. S. Mishra',
    'Sri Pankaj Sharma',
    'UPRSA-CERT-2026-',
    true
) ON CONFLICT (id) DO NOTHING;
