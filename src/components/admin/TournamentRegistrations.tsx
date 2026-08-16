import React, { useState, useMemo } from 'react';
import { dbStore } from '../../lib/db';
import { TournamentRegistration, Tournament, Skater } from '../../types';
import { exportToCsv } from '../../lib/pdfGenerator';
import { matchAgeGroup } from '../../lib/ageGroupRules';
import { 
  Trophy, 
  Search, 
  Filter, 
  Download, 
  UserCheck, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Printer, 
  Award, 
  Sparkles, 
  FileText,
  CreditCard,
  Building2,
  ChevronRight,
  RefreshCw,
  Phone,
  User
} from 'lucide-react';

export const TournamentRegistrations: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => dbStore.getTournaments());
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>(() => dbStore.getRegistrations());
  const [skaters, setSkaters] = useState<Skater[]>(() => dbStore.getSkaters());

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [editBibModal, setEditBibModal] = useState<TournamentRegistration | null>(null);
  const [bibInput, setBibInput] = useState('');
  const [heatInput, setHeatInput] = useState(1);
  const [laneInput, setLaneInput] = useState<number>(1);
  const [detailModalSkater, setDetailModalSkater] = useState<{ reg: TournamentRegistration; skater?: Skater } | null>(null);

  const districts = useMemo(() => {
    return Array.from(new Set(registrations.map(r => r.districtName).filter(Boolean))).sort();
  }, [registrations]);

  const disciplines = useMemo(() => {
    return Array.from(new Set(registrations.map(r => r.discipline).filter(Boolean))).sort();
  }, [registrations]);

  const ageGroups = useMemo(() => {
    return Array.from(new Set(registrations.map(r => r.ageGroup).filter(Boolean))).sort();
  }, [registrations]);

  // Filter registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter(reg => {
      // Tournament Filter
      if (selectedTournamentId !== 'all' && reg.tournamentId !== selectedTournamentId) {
        return false;
      }
      // District Filter
      if (selectedDistrict !== 'all' && reg.districtName !== selectedDistrict) {
        return false;
      }
      // Discipline Filter
      if (selectedDiscipline !== 'all' && reg.discipline !== selectedDiscipline) {
        return false;
      }
      // Age Group Filter
      if (selectedAgeGroup !== 'all' && !matchAgeGroup(reg.ageGroup, selectedAgeGroup)) {
        return false;
      }
      // Status Filter
      if (selectedStatus !== 'all' && reg.status !== selectedStatus) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchedName = reg.skaterName?.toLowerCase().includes(q);
        const matchedReg = reg.registrationNumber?.toLowerCase().includes(q);
        const matchedDistrict = reg.districtName?.toLowerCase().includes(q);
        const matchedClub = reg.clubName?.toLowerCase().includes(q);
        const matchedDiscipline = reg.discipline?.toLowerCase().includes(q);
        const matchedDistance = reg.distance?.toLowerCase().includes(q);
        const matchedBib = reg.bibNumber?.toLowerCase().includes(q);
        if (!matchedName && !matchedReg && !matchedDistrict && !matchedClub && !matchedDiscipline && !matchedDistance && !matchedBib) {
          return false;
        }
      }
      return true;
    });
  }, [registrations, selectedTournamentId, selectedDistrict, selectedDiscipline, selectedAgeGroup, selectedStatus, searchQuery]);

  // Unique Skaters count
  const uniqueSkatersCount = useMemo(() => {
    const ids = new Set(filteredRegistrations.map(r => r.skaterId || r.registrationNumber));
    return ids.size;
  }, [filteredRegistrations]);

  const currentTournament = useMemo(() => {
    return tournaments.find(t => t.id === selectedTournamentId);
  }, [tournaments, selectedTournamentId]);

  const handleApprove = (reg: TournamentRegistration) => {
    dbStore.updateRegistrationStatus(
      reg.id, 
      'approved', 
      reg.bibNumber || String(Math.floor(100 + Math.random() * 800)), 
      reg.heatNumber || 1
    );
    setRegistrations([...dbStore.getRegistrations()]);
  };

  const handleReject = (reg: TournamentRegistration) => {
    dbStore.updateRegistrationStatus(reg.id, 'rejected');
    setRegistrations([...dbStore.getRegistrations()]);
  };

  const handleOpenAssignBib = (reg: TournamentRegistration) => {
    setEditBibModal(reg);
    setBibInput(reg.bibNumber || '');
    setHeatInput(reg.heatNumber || 1);
    setLaneInput(reg.laneNumber || 1);
  };

  const handleSaveBib = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBibModal) return;

    dbStore.updateRegistrationStatus(editBibModal.id, 'approved', bibInput.trim(), heatInput);
    setRegistrations([...dbStore.getRegistrations()]);
    setEditBibModal(null);
  };

  const handleExportCsv = () => {
    const tourName = currentTournament ? currentTournament.nameEn.replace(/\s+/g, '_') : 'All_Tournaments';
    exportToCsv(`UPRSA_${tourName}_Participants_${new Date().toISOString().slice(0,10)}`, filteredRegistrations);
  };

  const handleOpenDetailModal = (reg: TournamentRegistration) => {
    const skater = skaters.find(s => s.id === reg.skaterId || s.registrationNumber === reg.registrationNumber);
    setDetailModalSkater({ reg, skater });
  };

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shrink-0">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap">
              <span>टूर्नामेंट पंजीकरण व प्रतिभागी सत्यापन डेस्क</span>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono rounded-lg">
                Participant Register
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              जांचें कि किस टूर्नामेंट में किस बच्चे ने कौन-से इवेंट में पंजीकरण किया है, चेस्ट/Bib नंबर जारी करें एवं सूची डाउनलोड करें।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setRegistrations([...dbStore.getRegistrations()]);
              setTournaments([...dbStore.getTournaments()]);
              setSkaters([...dbStore.getSkaters()]);
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
            title="रिफ्रेश करें"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>रिफ्रेश</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-white" />
            <span>प्रतिभागी सूची CSV डाउनलोड ({filteredRegistrations.length})</span>
          </button>
        </div>
      </div>

      {/* ===================== TOURNAMENT SELECTOR ===================== */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/30 rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <label className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>1. टूर्नामेंट चुनें (Select Tournament to View Registered Skaters):</span>
          </label>
          {currentTournament && (
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
              currentTournament.status === 'Live' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse' :
              currentTournament.status === 'Upcoming' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
              'bg-slate-800 text-slate-400'
            }`}>
              Status: {currentTournament.status}
            </span>
          )}
        </div>

        <select
          value={selectedTournamentId}
          onChange={(e) => setSelectedTournamentId(e.target.value)}
          className="w-full bg-slate-950 border-2 border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none transition shadow-inner"
        >
          <option value="all" className="bg-slate-900 text-amber-300 font-bold">
            🏆 सभी टूर्नामेंट (All Tournaments - All Registered Skaters)
          </option>
          {tournaments.map(t => (
            <option key={t.id} value={t.id} className="bg-slate-900 text-white font-semibold">
              🏆 {t.nameHi || t.nameEn} ({t.tournamentNumber || 'UPRSA-TRN'}) — {t.districtName} | {t.startDate} से {t.endDate}
            </option>
          ))}
        </select>

        {currentTournament && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-800">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>स्थान / वेन्यू: <strong>{currentTournament.venue}, {currentTournament.districtName}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>तिथि: <strong>{currentTournament.startDate} - {currentTournament.endDate}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>आयोजक: <strong>{currentTournament.organizer}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* ===================== SUMMARY STATS CARDS ===================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
            <FileText className="w-3 h-3 text-amber-400" />
            कुल इवेंट प्रविष्टियां (Total Entries)
          </span>
          <p className="text-xl font-black text-amber-400 mt-1 font-mono">{filteredRegistrations.length}</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
            <Users className="w-3 h-3 text-emerald-400" />
            कुल पंजीकृत बच्चे (Unique Skaters)
          </span>
          <p className="text-xl font-black text-emerald-400 mt-1 font-mono">{uniqueSkatersCount}</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-blue-400" />
            स्वीकृत (Approved Entries)
          </span>
          <p className="text-xl font-black text-blue-400 mt-1 font-mono">
            {filteredRegistrations.filter(r => r.status === 'approved').length}
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-rose-400" />
            लंबित सत्यापन (Pending)
          </span>
          <p className="text-xl font-black text-rose-400 mt-1 font-mono">
            {filteredRegistrations.filter(r => r.status === 'pending').length}
          </p>
        </div>
      </div>

      {/* ===================== SEARCH & MULTI-FILTER BAR ===================== */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Live Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="स्केटर नाम, Reg No, जिला, क्लब या Bib # खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* District Filter */}
          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">सभी ज़िले (All Districts)</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Discipline Filter */}
          <div>
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">सभी खेल (All Disciplines)</option>
              {disciplines.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Age Group Filter */}
          <div>
            <select
              value={selectedAgeGroup}
              onChange={(e) => setSelectedAgeGroup(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">सभी आयु वर्ग (All Age Groups)</option>
              {ageGroups.map(ag => (
                <option key={ag} value={ag}>{ag}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Active Filters Clear Indicator */}
        {(selectedTournamentId !== 'all' || selectedDistrict !== 'all' || selectedDiscipline !== 'all' || selectedAgeGroup !== 'all' || searchQuery || selectedStatus !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>
              कुल <strong>{filteredRegistrations.length}</strong> प्रविष्टियां मिलीं
            </span>
            <button
              onClick={() => {
                setSelectedTournamentId('all');
                setSelectedDistrict('all');
                setSelectedDiscipline('all');
                setSelectedAgeGroup('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="text-amber-400 hover:underline font-bold"
            >
              सभी फ़िल्टर साफ़ करें (Reset Filters)
            </button>
          </div>
        )}
      </div>

      {/* ===================== PARTICIPANTS TABLE ===================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>पंजीकृत बच्चों की सूची (Registered Skaters Roster)</span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs font-mono font-bold">
              {filteredRegistrations.length}
            </span>
          </h3>
        </div>

        {filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-300">कोई पंजीकरण नहीं मिला (No Registrations Found)</p>
            <p className="text-xs text-slate-500">चयनित टूर्नामेंट या खोज मापदंड के अनुसार कोई बच्चा पंजीकृत नहीं है।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">स्केटर विवरण (Skater Info)</th>
                  <th className="p-3.5">टूर्नामेंट (Tournament)</th>
                  <th className="p-3.5">ज़िला व क्लब (District / Club)</th>
                  <th className="p-3.5">इवेंट व दूरी (Discipline / Distance)</th>
                  <th className="p-3.5 text-center">आयु वर्ग (Age Group)</th>
                  <th className="p-3.5 text-center">Bib / Chest #</th>
                  <th className="p-3.5 text-center">हीट / लेन</th>
                  <th className="p-3.5 text-center">स्थिति (Status)</th>
                  <th className="p-3.5 text-right">कार्रवाई (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredRegistrations.map((reg) => {
                  const tour = tournaments.find(t => t.id === reg.tournamentId);
                  const skater = skaters.find(s => s.id === reg.skaterId || s.registrationNumber === reg.registrationNumber);

                  return (
                    <tr key={reg.id} className="hover:bg-slate-800/60 transition">
                      
                      {/* Skater Info */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                            {skater?.photoUrl ? (
                              <img src={skater.photoUrl} alt={reg.skaterName} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <button
                              onClick={() => handleOpenDetailModal(reg)}
                              className="font-extrabold text-white hover:text-amber-400 text-sm transition text-left flex items-center gap-1"
                            >
                              <span>{reg.skaterName}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                            <p className="text-[11px] font-mono text-amber-400 font-bold">
                              {reg.registrationNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tournament Name */}
                      <td className="p-3.5">
                        <span className="font-bold text-slate-200 block text-xs">
                          {tour?.nameHi || tour?.nameEn || 'UPRSA Tournament'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {tour?.districtName}
                        </span>
                      </td>

                      {/* District & Club */}
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-200 block">{reg.districtName}</span>
                        <span className="text-[10px] text-slate-400">{reg.clubName || 'District Skater'}</span>
                      </td>

                      {/* Discipline & Distance */}
                      <td className="p-3.5">
                        <span className="font-extrabold text-amber-300 block">{reg.discipline}</span>
                        <span className="px-2 py-0.5 bg-slate-800 text-amber-400 rounded text-[10px] font-mono font-bold inline-block mt-0.5">
                          {reg.distance}
                        </span>
                      </td>

                      {/* Age Group & Gender */}
                      <td className="p-3.5 text-center">
                        <span className="text-xs text-slate-200 font-medium block">{reg.ageGroup}</span>
                        <span className="text-[10px] text-slate-400">{reg.gender}</span>
                      </td>

                      {/* Bib # */}
                      <td className="p-3.5 text-center">
                        {reg.bibNumber ? (
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg font-mono font-black text-xs">
                            #{reg.bibNumber}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Heat / Lane */}
                      <td className="p-3.5 text-center font-mono text-xs">
                        H:{reg.heatNumber || 1} / L:{reg.laneNumber || 1}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          reg.status === 'approved' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : reg.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {reg.status === 'approved' ? 'स्वीकृत (Approved)' : reg.status === 'rejected' ? 'अस्वीकृत' : 'लंबित (Pending)'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDetailModal(reg)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
                          title="पूरा विवरण देखें"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                          विवरण
                        </button>

                        <button
                          onClick={() => handleOpenAssignBib(reg)}
                          className="px-2.5 py-1 bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg font-bold text-xs transition"
                          title="Bib / Chest # जारी करें"
                        >
                          Bib / Heat #
                        </button>

                        {reg.status !== 'approved' && (
                          <button
                            onClick={() => handleApprove(reg)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition"
                            title="स्वीकृत करें"
                          >
                            Approve
                          </button>
                        )}

                        {reg.status === 'approved' && (
                          <button
                            onClick={() => handleReject(reg)}
                            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg font-bold text-xs transition border border-rose-500/30"
                            title="अस्वीकृत करें"
                          >
                            Reject
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================== SKATER FULL REGISTRATION DETAIL MODAL ===================== */}
      {detailModalSkater && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-amber-400 overflow-hidden shrink-0">
                  {detailModalSkater.skater?.photoUrl ? (
                    <img src={detailModalSkater.skater.photoUrl} alt={detailModalSkater.reg.skaterName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-slate-400 m-auto mt-2.5" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">{detailModalSkater.reg.skaterName}</h3>
                  <p className="text-xs font-mono text-amber-400 font-bold">{detailModalSkater.reg.registrationNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalSkater(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">ज़िला (District)</span>
                <span className="font-bold text-white text-sm">{detailModalSkater.reg.districtName}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">क्लब (Club)</span>
                <span className="font-bold text-white text-sm">{detailModalSkater.reg.clubName || 'Independent'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">खेल विधा (Discipline)</span>
                <span className="font-extrabold text-amber-400 text-sm">{detailModalSkater.reg.discipline}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">दौड़ दूरी (Race Distance)</span>
                <span className="font-black text-emerald-400 text-sm">{detailModalSkater.reg.distance}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">आयु वर्ग (Age Group)</span>
                <span className="font-bold text-white text-xs">{detailModalSkater.reg.ageGroup}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Bib / Chest No</span>
                <span className="font-mono font-black text-amber-300 text-sm">
                  {detailModalSkater.reg.bibNumber ? `#${detailModalSkater.reg.bibNumber}` : 'अनावंटित (Not Assigned)'}
                </span>
              </div>
            </div>

            {detailModalSkater.skater && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">पिता / अभिभावक नाम:</span>
                  <span className="font-bold text-white">{detailModalSkater.skater.fatherMotherName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">जन्म तिथि (DOB):</span>
                  <span className="font-mono font-bold text-amber-400">{detailModalSkater.skater.dob} ({detailModalSkater.skater.age || '—'} वर्ष)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">मोबाइल नंबर:</span>
                  <span className="font-mono font-bold text-emerald-400">{detailModalSkater.skater.mobile}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDetailModalSkater(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
              >
                बंद करें (Close)
              </button>
              <button
                type="button"
                onClick={() => {
                  const reg = detailModalSkater.reg;
                  setDetailModalSkater(null);
                  handleOpenAssignBib(reg);
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg transition"
              >
                Bib # व Heat संपादित करें
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================== ASSIGN BIB & HEAT MODAL ===================== */}
      {editBibModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-black text-white text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Bib (Chest No) व Heat Number जारी करें</span>
            </h3>
            <p className="text-xs text-slate-400">
              स्केटर: <strong className="text-white">{editBibModal.skaterName}</strong> ({editBibModal.registrationNumber}) — {editBibModal.discipline} {editBibModal.distance}
            </p>

            <form onSubmit={handleSaveBib} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Race Bib / Chest Number (चेस्ट नंबर) *
                </label>
                <input
                  required
                  type="text"
                  placeholder="उदा. 101, 204"
                  value={bibInput}
                  onChange={(e) => setBibInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm font-bold focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Heat Number (हीट सं.)
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={heatInput}
                    onChange={(e) => setHeatInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Lane Number (लेन सं.)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={laneInput}
                    onChange={(e) => setLaneInput(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditBibModal(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg transition"
                >
                  सहेजें व स्वीकृत करें (Save & Approve)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

