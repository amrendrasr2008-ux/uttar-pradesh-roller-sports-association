import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { dbStore } from '../../lib/db';
import { 
  Users, 
  Building2, 
  MapPin, 
  Trophy, 
  Radio, 
  Award, 
  Search, 
  Plus, 
  FileText, 
  Upload, 
  RadioTower, 
  Database,
  BarChart3,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateSub: (sub: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateSub }) => {
  const { t } = useLanguage();
  
  const skaters = dbStore.getSkaters();
  const clubs = dbStore.getClubs();
  const districts = dbStore.getDistricts();
  const tournaments = dbStore.getTournaments();
  const results = dbStore.getResults();
  const certificates = dbStore.getCertificates();

  const [searchQuery, setSearchQuery] = useState('');

  const liveTournaments = tournaments.filter(tr => tr.status === 'Live');
  const upcomingTournaments = tournaments.filter(tr => tr.status === 'Upcoming');
  const completedTournaments = tournaments.filter(tr => tr.status === 'Completed');

  // Cross-system search filter
  const searchSkaters = skaters.filter(s => 
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.registrationNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.districtName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 text-slate-100">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{t('adminDashboardTitle')}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Central management node for Uttar Pradesh Roller Sports Association
          </p>
        </div>

        {/* Action Quick Links */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigateSub('create-tournament')}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" /> {t('createTournament')}
          </button>

          <button
            onClick={() => onNavigateSub('import-csv')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-emerald-400" /> {t('importSkaters')}
          </button>

          <button
            onClick={() => onNavigateSub('operator')}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow animate-pulse"
          >
            <Radio className="w-4 h-4" /> Live Scoring Panel
          </button>

          <button
            onClick={() => onNavigateSub('chat-board')}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
          >
            <MessageSquare className="w-4 h-4 text-slate-950 fill-slate-950" /> 💬 चैट व कम्युनिटी बोर्ड
          </button>

          <button
            onClick={() => onNavigateSub('security')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs border border-amber-500/40 transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" /> आईडी व पासवर्ड बदलें
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div 
          onClick={() => onNavigateSub('skaters')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 cursor-pointer hover:border-amber-500 transition shadow"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Skaters</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{skaters.length}</div>
          <div className="text-[10px] text-emerald-400 font-bold">Active Members</div>
        </div>

        <div 
          onClick={() => onNavigateSub('clubs')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 cursor-pointer hover:border-amber-500 transition shadow"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Clubs</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{clubs.length}</div>
          <div className="text-[10px] text-slate-400 font-medium">Affiliated Academies</div>
        </div>

        <div 
          onClick={() => onNavigateSub('districts')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 cursor-pointer hover:border-amber-500 transition shadow"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Districts</span>
            <MapPin className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{districts.length}</div>
          <div className="text-[10px] text-slate-400 font-medium">UP District Units</div>
        </div>

        <div 
          onClick={() => onNavigateSub('tournaments')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 cursor-pointer hover:border-amber-500 transition shadow"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Live Meets</span>
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-red-400">{liveTournaments.length}</div>
          <div className="text-[10px] text-slate-400 font-medium">Realtime Scoring</div>
        </div>

        <div 
          onClick={() => onNavigateSub('tournaments')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 cursor-pointer hover:border-amber-500 transition shadow"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tournaments</span>
            <Trophy className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{tournaments.length}</div>
          <div className="text-[10px] text-slate-400 font-medium">{completedTournaments.length} Completed</div>
        </div>

        <div 
          onClick={() => onNavigateSub('certificates')}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 cursor-pointer hover:border-amber-500 transition shadow"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Certificates</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{certificates.length}</div>
          <div className="text-[10px] text-emerald-400 font-bold">QR Verified</div>
        </div>

      </div>

      {/* Cross-System Search Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-base">UPRSA Cross-System Quick Search</h3>
          </div>

          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skater name, reg number, district..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {searchQuery && (
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
                <tr>
                  <th className="p-3">Reg No</th>
                  <th className="p-3">Skater Name</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Club</th>
                  <th className="p-3">Discipline</th>
                  <th className="p-3">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {searchSkaters.slice(0, 5).map(sk => (
                  <tr key={sk.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-amber-400">{sk.registrationNumber}</td>
                    <td className="p-3 font-bold text-white">{sk.name}</td>
                    <td className="p-3">{sk.districtName}</td>
                    <td className="p-3">{sk.clubName}</td>
                    <td className="p-3">{sk.discipline}</td>
                    <td className="p-3 font-semibold">{sk.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity & Management Submodules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Module 1: Club & District Management */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Building2 className="w-5 h-5" /> Club & District Administration
          </div>
          <p className="text-xs text-slate-400">Manage 75 UP districts, approve affiliated clubs, and inspect skater statistics.</p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onNavigateSub('clubs')}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition border border-slate-700"
            >
              Clubs Manager ({clubs.length})
            </button>
            <button
              onClick={() => onNavigateSub('districts')}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition border border-slate-700"
            >
              Districts ({districts.length})
            </button>
          </div>
        </div>

        {/* Module 2: Tournament & Entries */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Trophy className="w-5 h-5" /> Tournament & Registrations
          </div>
          <p className="text-xs text-slate-400">Generate events, assign bib numbers, heat assignments, and manage race entries.</p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onNavigateSub('tournament-entries')}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition border border-slate-700"
            >
              Approve Registrations
            </button>
            <button
              onClick={() => onNavigateSub('reports')}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition border border-slate-700"
            >
              Tournament Reports
            </button>
          </div>
        </div>

        {/* Module 3: Certificates & Bulk Import */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
            <Award className="w-5 h-5" /> Certificates & Excel Import
          </div>
          <p className="text-xs text-slate-400">Generate QR certificates in bulk, or import skater lists from CSV/Excel files.</p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onNavigateSub('certificates')}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition border border-slate-700"
            >
              Certificate Generator
            </button>
            <button
              onClick={() => onNavigateSub('import-csv')}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition border border-slate-700"
            >
              Excel / CSV Import
            </button>
          </div>
        </div>

        {/* Module 4: Live Chat & Community Board */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <MessageSquare className="w-5 h-5" /> 💬 लाइव चैट व कम्युनिटी बोर्ड
          </div>
          <p className="text-xs text-slate-400">कम्युनिटी संदेशों को एडिट/पिन/डिलीट करें और AI चैट हेल्पलाइन त्वरित प्रश्नों को कॉन्फ़िगर करें।</p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onNavigateSub('chat-board')}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs transition shadow"
            >
              कम्युनिटी व AI चैट बोर्ड खोलें ⚙️
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
