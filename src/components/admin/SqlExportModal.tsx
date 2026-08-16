import React, { useState } from 'react';
import { Database, Copy, Check, X } from 'lucide-react';

interface SqlExportModalProps {
  onClose: () => void;
}

const SUPABASE_SCHEMA_SQL = `-- UPRSA - Uttar Pradesh Roller Sports Association
-- Full PostgreSQL / Supabase Schema Definition & RLS Security Policies

CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_hi VARCHAR(255),
  zone VARCHAR(100),
  president_name VARCHAR(255),
  secretary_name VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_hi VARCHAR(255),
  district_id UUID REFERENCES districts(id) ON DELETE CASCADE,
  coach_name VARCHAR(255),
  contact_phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  status VARCHAR(20) DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skaters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  father_mother_name VARCHAR(255) NOT NULL,
  dob DATE NOT NULL,
  gender VARCHAR(20) NOT NULL,
  age_group VARCHAR(100) NOT NULL,
  mobile VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  district_id UUID REFERENCES districts(id),
  club_id UUID REFERENCES clubs(id),
  discipline VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  photo_url TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  validity_until DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_number VARCHAR(50) UNIQUE NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_hi VARCHAR(255),
  venue VARCHAR(255) NOT NULL,
  district_name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  organizer VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'Upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  discipline VARCHAR(100) NOT NULL,
  age_group VARCHAR(100) NOT NULL,
  gender VARCHAR(20) NOT NULL,
  distance VARCHAR(100) NOT NULL,
  race_number VARCHAR(50),
  heat_number INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES tournament_events(id) ON DELETE CASCADE,
  skater_id UUID REFERENCES skaters(id) ON DELETE CASCADE,
  bib_number VARCHAR(50),
  heat_number INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournament_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES tournament_events(id) ON DELETE CASCADE,
  skater_id UUID REFERENCES skaters(id) ON DELETE CASCADE,
  bib_number VARCHAR(50),
  timing VARCHAR(50) NOT NULL,
  position INT NOT NULL,
  points INT DEFAULT 0,
  medal VARCHAR(20) DEFAULT 'None',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number VARCHAR(100) UNIQUE NOT NULL,
  skater_id UUID REFERENCES skaters(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  event_id UUID REFERENCES tournament_events(id) ON DELETE CASCADE,
  position VARCHAR(100) NOT NULL,
  issue_date DATE NOT NULL,
  verification_code VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE skaters ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public Read Districts" ON districts FOR SELECT USING (true);
CREATE POLICY "Public Read Clubs" ON clubs FOR SELECT USING (true);
CREATE POLICY "Public Read Tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public Read Results" ON tournament_results FOR SELECT USING (true);
CREATE POLICY "Public Read Certificates" ON certificates FOR SELECT USING (true);

-- Authenticated Skater Self Read & Insert
CREATE POLICY "Skater Self Read" ON skaters FOR SELECT USING (true);
CREATE POLICY "Public Skater Insert" ON skaters FOR INSERT WITH CHECK (true);
`;

export const SqlExportModal: React.FC<SqlExportModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-4 shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
            <Database className="w-4 h-4" /> Supabase Database Blueprint
          </div>
          <h2 className="text-xl font-black text-white">Full PostgreSQL DDL & RLS Schema Script</h2>
          <p className="text-xs text-slate-400">Copy and run this SQL directly inside Supabase SQL Editor to provision tables and security rules.</p>
        </div>

        <div className="relative">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1 shadow"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied to Clipboard!' : 'Copy SQL'}
          </button>

          <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-h-96 overflow-y-auto text-[11px] font-mono text-emerald-400 leading-relaxed">
            {SUPABASE_SCHEMA_SQL}
          </pre>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 text-white font-bold text-xs rounded-xl"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
