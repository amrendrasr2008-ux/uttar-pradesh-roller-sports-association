import React, { useState, useEffect } from 'react';
import { dbStore } from '../../lib/db';
import { Skater, Tournament, TournamentEvent, TournamentRegistration, TournamentPayment } from '../../types';
import { matchAgeGroup } from '../../lib/ageGroupRules';
import { UPIPaymentModal } from '../payment/UPIPaymentModal';
import { SkaterPaymentReceiptModal } from './SkaterPaymentReceiptModal';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Zap, 
  Check, 
  Sparkles, 
  AlertCircle, 
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  QrCode,
  Clock,
  XCircle,
  Receipt,
  CreditCard
} from 'lucide-react';

interface SkaterTournamentRegistrationProps {
  skater: Skater;
}

export const SkaterTournamentRegistration: React.FC<SkaterTournamentRegistrationProps> = ({ skater }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => dbStore.getTournaments());
  const [statusFilter, setStatusFilter] = useState<'open' | 'completed' | 'all'>('open');

  const openTournaments = tournaments.filter(t => t.status !== 'Completed');
  const completedTournaments = tournaments.filter(t => t.status === 'Completed');

  const displayedTournaments = statusFilter === 'open' 
    ? openTournaments 
    : statusFilter === 'completed' 
    ? completedTournaments 
    : tournaments;

  const [selectedTourId, setSelectedTourId] = useState<string>(() => {
    const savedTourId = localStorage.getItem('uprsa_selected_tour_id');
    const list = dbStore.getTournaments();
    if (savedTourId && list.some(t => t.id === savedTourId)) {
      return savedTourId;
    }
    const liveOrUpcoming = list.find(t => t.status === 'Live' || t.status === 'Upcoming');
    return liveOrUpcoming ? liveOrUpcoming.id : (list[0]?.id || '');
  });

  // Selected event IDs
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Phase 5 Payment Modal & Receipt State
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState<TournamentPayment | null>(null);
  const [paymentVersion, setPaymentVersion] = useState(0);

  // Active Tournament
  const activeTour = tournaments.find(t => t.id === selectedTourId);
  const isCompletedTour = activeTour?.status === 'Completed';

  const todayStr = new Date().toISOString().split('T')[0];
  const isPastLastDate = Boolean(activeTour?.lastDate && todayStr > activeTour.lastDate);
  const isRegistrationClosed = isCompletedTour || isPastLastDate;

  // Current Events for selected tournament (Auto-seed standard events if empty)
  const currentEvents = selectedTourId ? dbStore.seedStandardEventsForTournament(selectedTourId) : [];

  // Sync tournaments list on mount
  useEffect(() => {
    const list = dbStore.getTournaments();
    setTournaments(list);
    const savedTourId = localStorage.getItem('uprsa_selected_tour_id');
    if (savedTourId && list.some(t => t.id === savedTourId)) {
      setSelectedTourId(savedTourId);
    } else if ((!selectedTourId || !list.some(t => t.id === selectedTourId)) && list.length > 0) {
      const liveOrUpcoming = list.find(t => t.status === 'Live' || t.status === 'Upcoming');
      setSelectedTourId(liveOrUpcoming ? liveOrUpcoming.id : list[0].id);
    }
  }, []);

  // Initialize selected event IDs from existing skater registrations
  useEffect(() => {
    if (selectedTourId && skater) {
      const regs = dbStore.getRegistrations(selectedTourId).filter(r => r.skaterId === skater.id);
      setSelectedEventIds(regs.map(r => r.eventId));
      setShowToast(false);
    }
  }, [selectedTourId, skater.id]);

  // Helper to check if event matches skater ageGroup, discipline, and gender
  const isEventEligible = (ev: TournamentEvent) => {
    const evDisp = ev.discipline.toLowerCase();
    const skDisp = (skater.discipline || '').toLowerCase();

    // Discipline match
    let matchDisp = false;
    if (skDisp.includes('inline') && evDisp.includes('inline')) matchDisp = true;
    else if (skDisp.includes('quad') && evDisp.includes('quad')) matchDisp = true;
    else if (skDisp.includes('adjustable') && evDisp.includes('adjustable')) matchDisp = true;
    else if (skDisp.includes('freestyle') && evDisp.includes('freestyle')) matchDisp = true;
    else matchDisp = evDisp === skDisp;

    // Age Group match
    const evAge = (ev.ageGroup || '').toLowerCase();
    const skAge = (skater.ageGroup || '').toLowerCase();
    const matchAge = 
      matchAgeGroup(ev.ageGroup, skater.ageGroup || '') ||
      evAge.includes('all') || 
      evAge.includes('open') || 
      skAge.includes('all') ||
      evAge.includes(skAge) || 
      skAge.includes(evAge);

    // Gender match
    const evGender = (ev.gender || '').trim().toLowerCase();
    const skGender = (skater.gender || '').trim().toLowerCase();
    const matchGender = (evGender === skGender) || evGender === 'other' || skGender === 'other' || evGender === 'all' || !ev.gender;

    return matchDisp && matchAge && matchGender;
  };

  // Eligible Events for the skater
  const eligibleEvents = currentEvents.filter(ev => isEventEligible(ev));

  // If eligibleEvents is empty, fallback to showing discipline & gender-matched events so user always sees eligible events
  const displayedEvents = eligibleEvents.length > 0 
    ? eligibleEvents 
    : currentEvents.filter(ev => {
        const evGender = (ev.gender || '').trim().toLowerCase();
        const skGender = (skater.gender || '').trim().toLowerCase();
        const matchGender = (evGender === skGender) || evGender === 'other' || skGender === 'other' || !ev.gender;
        const matchDisp = ev.discipline.toLowerCase().includes((skater.discipline || '').toLowerCase().replace('speed ', '')) || ev.discipline === skater.discipline;
        return matchDisp && matchGender;
      });

  // Calculate dynamic allowed events limit for this specific skater based on Age Group, Discipline, and Tournament Rules
  const getSkaterMaxEventsLimit = (): { limit: number; ruleReason: string } => {
    if (!activeTour) return { limit: 2, ruleReason: 'सामान्य नियम: अधिकतम 2 मैच' };

    let limit = activeTour.maxEventsPerSkater || 2;
    let reasons: string[] = [];

    // 1. First Priority: Specific Discipline + Age Group Matrix rule (e.g. Quad + Under 6 = 2, Quad + Senior = 5)
    if (
      skater.discipline && 
      skater.ageGroup && 
      activeTour.disciplineAgeGroupEventLimits?.[skater.discipline]?.[skater.ageGroup] !== undefined
    ) {
      limit = activeTour.disciplineAgeGroupEventLimits[skater.discipline][skater.ageGroup];
      reasons.push(`${skater.discipline} (${skater.ageGroup}): max ${limit} मैच नियम`);
      return { limit, ruleReason: reasons.join(' • ') };
    }

    // 2. Second Priority: Age Group specific rule
    if (skater.ageGroup && activeTour.ageGroupEventLimits?.[skater.ageGroup] !== undefined) {
      limit = activeTour.ageGroupEventLimits[skater.ageGroup];
      reasons.push(`आयु वर्ग (${skater.ageGroup}): max ${limit} मैच`);
    }

    // 3. Third Priority: Discipline specific rule
    if (skater.discipline && activeTour.disciplineEventLimits?.[skater.discipline] !== undefined) {
      const discLimit = activeTour.disciplineEventLimits[skater.discipline];
      if (discLimit < limit) {
        limit = discLimit;
        reasons.push(`स्केट्स वर्ग (${skater.discipline}): max ${limit} मैच`);
      }
    }

    const ruleReason = reasons.length > 0 ? reasons.join(' • ') : `टूर्नामेंट सामान्य नियम: अधिकतम ${limit} मैच`;
    return { limit, ruleReason };
  };

  const { limit: maxEventsAllowed, ruleReason: eventLimitReason } = getSkaterMaxEventsLimit();

  // Dropdown selection change handler
  const handleDropdownChange = (eventId: string, value: string) => {
    setShowToast(false);
    if (value === 'participate') {
      if (!selectedEventIds.includes(eventId)) {
        if (selectedEventIds.length >= maxEventsAllowed) {
          alert(`⚠️ मैच सीमा नियम लागू (Max Limit Reached):\n\n${eventLimitReason}\n\nआप उपलब्ध 5 या अधिक मैचों में से अधिकतम ${maxEventsAllowed} ही मैच सेलेक्ट कर सकते हैं। कोई दूसरा मैच चुनने के लिए पहले चयनित मैच को अन-सेलेक्ट (Deselect) करें।`);
          return;
        }
        setSelectedEventIds([...selectedEventIds, eventId]);
      }
    } else {
      setSelectedEventIds(selectedEventIds.filter(id => id !== eventId));
    }
  };

  // Submit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTourId) return;

    if (isRegistrationClosed) {
      alert("रजिस्ट्रेशन की अंतिम तिथि समाप्त हो चुकी है या टूर्नामेंट बंद है। आप फॉर्म सबमिट नहीं कर सकते।");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      dbStore.setSkaterTournamentRegistrations(skater, selectedTourId, selectedEventIds);
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }, 300);
  };

  const skaterInitial = (skater.name || 'Aarav').charAt(0).toUpperCase();

  return (
    <div className="space-y-6 text-slate-100 font-sans relative">
      
      {/* TOP SKATER PROFILE HEADER BAR */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Avatar Circle with Initial 'A' */}
          <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shrink-0 shadow-md">
            {skaterInitial}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-white">{skater.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Eligible Profile
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span className="font-mono text-amber-400 font-bold">{skater.registrationNumber || skater.applicationNumber || 'UPRSA-REG'}</span>
              <span>• {skater.gender} • {skater.ageGroup || '10-12 Years'} • {skater.discipline || 'Speed Inline'} • {skater.districtName || 'Varanasi'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* TOURNAMENT SELECTOR SECTION */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Select Championship / Tournament
          </h3>

          {/* STATUS FILTER TABS */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('open');
                if (openTournaments.length > 0) setSelectedTourId(openTournaments[0].id);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'open'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ open for registration ({openTournaments.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('completed');
                if (completedTournaments.length > 0) setSelectedTourId(completedTournaments[0].id);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'completed'
                  ? 'bg-slate-700 text-white font-extrabold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏁 completed ({completedTournaments.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({tournaments.length})
            </button>
          </div>
        </div>

        {displayedTournaments.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <p className="text-xs font-semibold text-slate-400">
              {statusFilter === 'completed' 
                ? 'कोई समाप्त टूर्नामेंट नहीं मिला।' 
                : 'रजिस्ट्रेशन के लिए वर्तमान में कोई एक्टिव टूर्नामेंट उपलब्ध नहीं है।'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedTournaments.map(t => {
              const isSelected = t.id === selectedTourId;
              const regCount = dbStore.getRegistrations(t.id).filter(r => r.skaterId === skater.id).length;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTourId(t.id)}
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between space-y-3 relative cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg ring-2 ring-amber-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-extrabold text-amber-400 uppercase bg-amber-400/10 px-2 py-0.5 rounded">
                      {t.tournamentNumber || 'UPRSA-TN'}
                    </span>
                    <div className="flex items-center gap-1">
                      {regCount > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {regCount} Registered
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        t.status === 'Live' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        t.status === 'Upcoming' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-white line-clamp-2">{t.nameEn}</h4>
                    {t.venue && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {t.venue}
                      </p>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 flex flex-col gap-1 pt-2 border-t border-slate-800/80 font-medium">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" /> {t.startDate} - {t.endDate}
                      </span>
                      <span className="text-amber-400 font-bold text-[10px]">
                        {isSelected ? '✓ Active Selection' : 'Click to View →'}
                      </span>
                    </div>
                    {t.lastDate && (
                      <span className="text-[10px] text-amber-300 font-bold">
                        लास्ट डेट: {t.lastDate} {todayStr > t.lastDate ? '(समाप्त)' : ''}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* LAST DATE PASSED ALERT BANNER */}
      {isPastLastDate && !isCompletedTour && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="leading-relaxed">
            <strong>🚫 रजिस्ट्रेशन की अंतिम तिथि समाप्त ({activeTour?.lastDate}):</strong> इस टूर्नामेंट के लिए फॉर्म सबमिट करने की अंतिम तिथि ({activeTour?.lastDate}) समाप्त हो चुकी है। अब फॉर्म जमा नहीं किया जा सकता।
          </span>
        </div>
      )}

      {/* COMPLETED TOURNAMENT ALERT BANNER IF APPLICABLE */}
      {isCompletedTour && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="leading-relaxed">
            <strong>🚫 टूर्नामेंट समाप्त (Completed):</strong> यह टूर्नामेंट समाप्त हो चुका है। इस टूर्नामेंट के लिए नए रजिस्ट्रेशन या बदलाव स्वीकार नहीं किए जा रहे हैं।
          </span>
        </div>
      )}

      {/* SMART ELIGIBILITY & EVENT LIMIT BANNERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-3 shadow-md">
          <Zap className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="leading-relaxed">
            <strong>⚡ Smart Eligibility:</strong> आपकी DOB, Age Group और Discipline के आधार पर केवल eligible races दिखाई दे रही हैं।
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-orange-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <strong className="block text-white text-xs">मैच/इवेंट चयन सीमा (Max Event Rule):</strong>
              <span className="text-[11px] text-slate-300">आप कुल उपलब्ध में से केवल <strong>{maxEventsAllowed} ही इवेंट्स</strong> ले सकते हैं। <span className="text-amber-400 font-normal">({eventLimitReason})</span></span>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-xl font-mono font-black text-xs shrink-0 shadow ${
            selectedEventIds.length >= maxEventsAllowed 
              ? 'bg-amber-500 text-slate-950 border border-amber-400' 
              : 'bg-slate-950 text-amber-300 border border-amber-500/40'
          }`}>
            {selectedEventIds.length} / {maxEventsAllowed} Max
          </div>
        </div>
      </div>

      {/* ACTIVE CHAMPIONSHIP TITLE */}
      {activeTour && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-1">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase">{activeTour.tournamentNumber}</span>
            <h3 className="text-xl font-black text-white">{activeTour.nameEn}</h3>
            <p className="text-xs text-slate-400">
              Venue: <strong className="text-slate-200">{activeTour.venue}</strong>
            </p>
          </div>

          {/* ELIGIBLE EVENT CARDS GRID */}
          <div>
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Eligible Competition Races:</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedEvents.map(event => {
                const isSelected = selectedEventIds.includes(event.id);

                return (
                  <div 
                    key={event.id}
                    className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-md space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ELIGIBLE
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">{event.raceNumber || 'RACE-01'}</span>
                      </div>

                      <h5 className="text-lg font-black text-white">{event.distance}</h5>

                      <ul className="space-y-1 text-xs text-slate-300 font-medium">
                        <li className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold w-20">Age Group:</span>
                          <span className="text-white font-semibold">{event.ageGroup}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold w-20">Discipline:</span>
                          <span className="text-amber-300 font-semibold">{event.discipline}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold w-20">Gender:</span>
                          <span className="text-white font-semibold">{event.gender}</span>
                        </li>
                      </ul>
                    </div>

                    {/* SELECT DROPDOWN */}
                    <div>
                      <select
                        disabled={isRegistrationClosed}
                        value={isSelected ? 'participate' : ''}
                        onChange={(e) => handleDropdownChange(event.id, e.target.value)}
                        className={`w-full p-3 rounded-xl text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer ${
                          isRegistrationClosed
                            ? 'bg-slate-950/50 text-slate-500 border-slate-800 cursor-not-allowed'
                            : isSelected 
                            ? 'bg-amber-500 text-slate-950 font-black border border-amber-400' 
                            : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <option value="">{isRegistrationClosed ? 'Registration Closed' : 'Select Event ▼'}</option>
                        <option value="participate">I want to participate</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SELECTED EVENTS TABLE SECTION */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h4 className="text-base font-extrabold text-white border-b border-slate-800 pb-2">
              Selected Events
            </h4>

            {selectedEventIds.length === 0 ? (
              <p className="text-xs text-slate-500 italic">कोई event selected नहीं है।</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold">
                      <th className="pb-2">Event</th>
                      <th className="pb-2">Discipline</th>
                      <th className="pb-2">Age Group</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                    {selectedEventIds.map(eventId => {
                      const ev = currentEvents.find(e => e.id === eventId);
                      if (!ev) return null;

                      return (
                        <tr key={ev.id}>
                          <td className="py-3 font-extrabold text-white">{ev.distance}</td>
                          <td className="py-3 text-amber-300">{ev.discipline}</td>
                          <td className="py-3 text-slate-300">{ev.ageGroup}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Selected
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              {isRegistrationClosed ? (
                <div className="px-6 py-3 bg-red-950/60 border border-red-800 text-red-300 font-bold text-xs rounded-xl inline-flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  {isCompletedTour 
                    ? 'Registration Closed (Completed Tournament)' 
                    : `Registration Closed (Last Date Passed: ${activeTour?.lastDate})`}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitForm}
                  disabled={isSaving}
                  className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSaving ? 'Submitting...' : 'Submit Tournament Form'}
                </button>
              )}
            </div>
          </div>

          {/* PHASE 5: TOURNAMENT FEE PAYMENT STATUS & UPI QR ACTION */}
          {selectedTourId && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-base font-extrabold text-white">
                    टूर्नामेंट शुल्क भुगतान स्थिति (Tournament Payment Status)
                  </h4>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  शुल्क राशि: <strong className="text-emerald-400 text-sm">₹{dbStore.getPaymentSettings().defaultTournamentFee || 500}</strong>
                </span>
              </div>

              {(() => {
                const tourPayments = dbStore.getPayments(selectedTourId, skater.id);
                const currentPay = tourPayments[0]; // Latest payment

                if (!currentPay) {
                  return (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-200">
                          टूर्नामेंट शुल्क भुगतान बकाया है (Payment Pending)
                        </p>
                        <p className="text-[11px] text-slate-400">
                          इवेंट चुनने के पश्चात UPRSA UPI QR स्कैन करके ₹{dbStore.getPaymentSettings().defaultTournamentFee || 500} का भुगतान जमा करें।
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPayModal(true)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-2 shrink-0"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>UPI QR से शुल्क जमा करें (Pay ₹{dbStore.getPaymentSettings().defaultTournamentFee || 500})</span>
                      </button>
                    </div>
                  );
                }

                if (currentPay.status === 'VERIFIED') {
                  return (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="font-bold text-sm text-emerald-300">भुगतान सत्यापित हो चुका है (PAYMENT_VERIFIED)</span>
                        </div>
                        <p className="text-xs text-slate-300">
                          UTR ID: <span className="font-mono font-bold text-amber-400">{currentPay.utrNumber}</span> • सत्यापित तिथि: {new Date(currentPay.verifiedAt || currentPay.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowReceiptModal(currentPay)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5 shrink-0"
                      >
                        <Receipt className="w-4 h-4" />
                        <span>डिजिटल रसीद देखें (View Receipt)</span>
                      </button>
                    </div>
                  );
                }

                if (currentPay.status === 'PENDING') {
                  return (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                      <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                        <Clock className="w-5 h-5 animate-pulse" />
                        <span>भुगतान प्राप्त हुआ (PAYMENT PENDING VERIFICATION)</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        आपका UTR <span className="font-mono font-bold text-amber-300">{currentPay.utrNumber}</span> UPRSA एडमिन सत्यापन हेतु लंबित है।
                      </p>
                      <p className="text-[11px] text-amber-200/80 italic">
                        "Payment will be verified manually by UPRSA after checking the UTR/Transaction ID and payment proof."
                      </p>
                    </div>
                  );
                }

                if (currentPay.status === 'REJECTED') {
                  return (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                          <XCircle className="w-5 h-5" />
                          <span>भुगतान अस्वीकृत (PAYMENT_REJECTED)</span>
                        </div>
                        <p className="text-xs text-rose-200">
                          कारण: {currentPay.rejectionReason || 'UTR / स्क्रीनशॉट मिलान नहीं हुआ।'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPayModal(true)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-1.5 shrink-0"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>पुनः भुगतान जमा करें (Re-submit Payment)</span>
                      </button>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          )}

        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && selectedTourId && (
        <UPIPaymentModal
          skaterId={skater.id}
          skaterName={skater.name}
          tournamentId={selectedTourId}
          tournamentName={activeTour?.nameEn || 'Tournament'}
          feeAmount={dbStore.getPaymentSettings().defaultTournamentFee || 500}
          onClose={() => setShowPayModal(false)}
          onSuccess={() => {
            setPaymentVersion(v => v + 1);
          }}
        />
      )}

      {/* Receipt Modal */}
      {showReceiptModal && (
        <SkaterPaymentReceiptModal
          payment={showReceiptModal}
          onClose={() => setShowReceiptModal(null)}
        />
      )}

      {/* FLOATING GREEN TOAST NOTIFICATION ON BOTTOM RIGHT */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2.5 animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>✔ Tournament form submitted successfully.</span>
        </div>
      )}

    </div>
  );
};
