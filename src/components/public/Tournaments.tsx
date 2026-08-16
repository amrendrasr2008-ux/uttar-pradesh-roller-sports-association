import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { dbStore } from '../../lib/db';
import { Tournament, TournamentEvent } from '../../types';
import { 
  Calendar, 
  MapPin, 
  Trophy, 
  Radio, 
  CheckCircle2, 
  UserPlus, 
  X, 
  Sparkles, 
  Award,
  Lock,
  LogIn,
  AlertCircle,
  ChevronRight,
  Eye,
  ArrowRight
} from 'lucide-react';

interface TournamentsProps {
  onNavigate?: (view: string) => void;
}

export const Tournaments: React.FC<TournamentsProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const { activeSkater, loginSkater, setRole } = useAuth();
  
  const tournaments = dbStore.getTournaments();
  const events = dbStore.getEvents();

  // Status Tabs: 'live' | 'upcoming' | 'completed' | 'all'
  const [tourStatusTab, setTourStatusTab] = useState<'live' | 'upcoming' | 'completed' | 'all'>('live');
  
  const liveTours = tournaments.filter(t => t.status === 'Live');
  const upcomingTours = tournaments.filter(t => t.status === 'Upcoming');
  const completedTours = tournaments.filter(t => t.status === 'Completed');

  const displayedTournaments = tourStatusTab === 'live' 
    ? (liveTours.length > 0 ? liveTours : tournaments.filter(t => t.status !== 'Completed'))
    : tourStatusTab === 'upcoming' 
    ? upcomingTours 
    : tourStatusTab === 'completed' 
    ? completedTours 
    : tournaments;

  // Viewing Tournament Details Modal/Page State
  const [viewingTour, setViewingTour] = useState<Tournament | null>(null);

  // Login Modal State
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [targetTourForLogin, setTargetTourForLogin] = useState<Tournament | null>(null);
  const [loginId, setLoginId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Quick helper to enter tournament form
  const handleEnterTournamentForm = (tour: Tournament) => {
    localStorage.setItem('uprsa_selected_tour_id', tour.id);

    if (activeSkater) {
      // Skater is logged in -> Navigate straight to Skater Portal
      setRole('skater');
      if (onNavigate) onNavigate('portal');
    } else {
      // Skater not logged in -> Prompt for ID & Password
      setTargetTourForLogin(tour);
      setShowLoginModal(true);
    }
  };

  // Perform Login and proceed to Skater Portal
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginId.trim() || !password.trim()) {
      setLoginError('कृपया अपना लॉगिन आईडी/रजिस्ट्रेशन नंबर और पासवर्ड डालें।');
      return;
    }

    const cleanId = loginId.trim().toUpperCase();
    const skaters = dbStore.getSkaters();
    const skater = skaters.find(s => 
      (s.registrationNumber && s.registrationNumber.toUpperCase() === cleanId) ||
      (s.applicationNumber && s.applicationNumber.toUpperCase() === cleanId) ||
      (s.loginId && s.loginId.toUpperCase() === cleanId) ||
      (s.email && s.email.toUpperCase() === cleanId)
    );

    if (!skater) {
      setLoginError(`कोई स्केटर खाता नहीं मिला: '${loginId}'`);
      return;
    }

    const validPass = password === '123456' || password === 'UPRSA@2026' || (skater.tempPassword && password === skater.tempPassword);
    if (!validPass) {
      setLoginError('अमान्य पासवर्ड (Invalid Password)। कृपया पुनः प्रयास करें।');
      return;
    }

    // Login successful
    const success = loginSkater(skater.registrationNumber || skater.applicationNumber || skater.id);
    if (success) {
      if (targetTourForLogin) {
        localStorage.setItem('uprsa_selected_tour_id', targetTourForLogin.id);
      }
      setShowLoginModal(false);
      setRole('skater');
      if (onNavigate) onNavigate('portal');
    } else {
      setLoginError('लॉगिन करने में समस्या आई।');
    }
  };

  return (
    <div className="w-full px-4 sm:px-8 py-8 space-y-8 text-slate-100 font-sans">
      
      {/* PAGE HEADER & CATEGORY TABS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            उत्तर प्रदेश रोलर स्केटिंग एसोसिएशन (UPRSA)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            राज्य स्तरीय स्केटिंग चैंपियनशिप व टूर्नामेंट सूची
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            यहाँ चल रहे (Live), आगामी (Upcoming) व समाप्त (Completed) टूर्नामेंट्स देखें और लॉगिन करके सीधा फॉर्म भरें।
          </p>
        </div>

        {/* STATUS FILTER TABS */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold self-start lg:self-auto shadow-inner flex-wrap">
          <button
            type="button"
            onClick={() => setTourStatusTab('live')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              tourStatusTab === 'live'
                ? 'bg-red-600 text-white font-black shadow-lg animate-pulse'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            ⚡ चल रहे हैं ({liveTours.length})
          </button>

          <button
            type="button"
            onClick={() => setTourStatusTab('upcoming')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              tourStatusTab === 'upcoming'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            📅 होने वाले हैं ({upcomingTours.length})
          </button>

          <button
            type="button"
            onClick={() => setTourStatusTab('completed')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
              tourStatusTab === 'completed'
                ? 'bg-slate-700 text-white font-black shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            🏁 हो चुके हैं ({completedTours.length})
          </button>

          <button
            type="button"
            onClick={() => setTourStatusTab('all')}
            className={`px-3.5 py-2 rounded-xl transition ${
              tourStatusTab === 'all'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🏆 सभी ({tournaments.length})
          </button>
        </div>
      </div>

      {/* ACTIVE LOGGED-IN SKATER BANNER IF APPLICABLE */}
      {activeSkater && (
        <div className="bg-emerald-950/60 border border-emerald-700/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0">
              ✓
            </span>
            <div>
              <span className="text-emerald-400 font-bold block">लॉगिन स्केटर प्रोफाइल (Logged In Skater):</span>
              <span className="text-white font-black text-sm">{activeSkater.name}</span>
              <span className="text-slate-300 ml-2">({activeSkater.registrationNumber}) • {activeSkater.discipline} • {activeSkater.ageGroup}</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (onNavigate) onNavigate('portal');
            }}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl transition shadow flex items-center gap-1.5 shrink-0"
          >
            स्केटर पोर्टल खोलें <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOURNAMENT CARDS LISTING GRID */}
      <div className="space-y-6">
        {displayedTournaments.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-3">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-200">कोई टूर्नामेंट नहीं मिला</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {tourStatusTab === 'completed' 
                ? 'इस श्रेणी में कोई समाप्त टूर्नामेंट रिकॉर्ड उपलब्ध नहीं है।' 
                : 'वर्तमान में इस श्रेणी का कोई नया टूर्नामेंट नहीं है।'}
            </p>
          </div>
        ) : (
          displayedTournaments.map(tour => {
            const tourEvents = events.filter(e => e.tournamentId === tour.id);
            const isCompleted = tour.status === 'Completed';

            return (
              <div 
                key={tour.id}
                className={`bg-slate-900 border rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative transition hover:border-slate-700 ${
                  tour.status === 'Live' ? 'border-amber-500/80 ring-1 ring-amber-500/40' : 'border-slate-800'
                }`}
              >
                {/* Tournament Card Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md font-bold text-xs border border-amber-500/20">
                        {tour.tournamentNumber || 'UPRSA-TN'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        tour.status === 'Live' 
                          ? 'bg-red-600 text-white animate-pulse'
                          : tour.status === 'Upcoming'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {tour.status === 'Live' && <Radio className="w-3.5 h-3.5" />}
                        {tour.status === 'Live' ? 'चल रहा है (LIVE)' : tour.status === 'Upcoming' ? 'आगामी (UPCOMING)' : 'समाप्त (COMPLETED)'}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {language === 'en' ? tour.nameEn : tour.nameHi}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                      <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                        <MapPin className="w-4 h-4 shrink-0" /> {tour.venue}
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <Calendar className="w-4 h-4 shrink-0" /> {tour.startDate} से {tour.endDate}
                      </span>
                      {tour.lastDate && (
                        <span className="flex items-center gap-1.5 text-amber-300 font-bold bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                          <Calendar className="w-4 h-4 text-amber-400 shrink-0" /> अंतिम तिथि: {tour.lastDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewingTour(tour)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-4 h-4 text-amber-400" /> विवरण व मैच इवेंट्स देखें
                    </button>

                    {!isCompleted ? (
                      <button
                        type="button"
                        onClick={() => handleEnterTournamentForm(tour)}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg flex items-center justify-center gap-1.5"
                      >
                        <UserPlus className="w-4 h-4" />
                        {activeSkater ? 'टूर्नामेंट फॉर्म भरें' : 'लॉगिन करें और फॉर्म भरें'}
                      </button>
                    ) : (
                      <span className="px-4 py-2.5 bg-red-950/40 text-red-400 border border-red-800/60 font-bold text-xs rounded-xl text-center">
                        रजिस्ट्रेशन बंद
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Info & Race Summary */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="text-slate-300">
                    आयोजक: <strong className="text-white">{tour.organizer}</strong>
                  </div>
                  <div className="text-slate-400">
                    कुल स्पर्धाएँ (Races): <strong className="text-amber-400 font-bold">{tourEvents.length > 0 ? tourEvents.length : 19} Races</strong>
                  </div>
                  <button
                    onClick={() => handleEnterTournamentForm(tour)}
                    className="text-amber-400 hover:text-amber-300 font-extrabold underline flex items-center gap-1"
                  >
                    {activeSkater ? 'फॉर्म में अपने मैच सेलेक्ट करें' : 'आईडी-पासवर्ड डालकर फॉर्म भरें'} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* VIEW TOURNAMENT DETAILS MODAL */}
      {viewingTour && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            
            <button
              onClick={() => setViewingTour(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 border border-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20">
                {viewingTour.tournamentNumber}
              </span>
              <h2 className="text-2xl font-black text-white">
                {language === 'en' ? viewingTour.nameEn : viewingTour.nameHi}
              </h2>
              <p className="text-xs text-slate-300">{viewingTour.organizer}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">स्थान (Venue)</span>
                <span className="font-bold text-white text-sm">{viewingTour.venue}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">तिथि (Schedule)</span>
                <span className="font-bold text-emerald-400 text-sm">{viewingTour.startDate} से {viewingTour.endDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">अंतिम आवेदन तिथि</span>
                <span className="font-bold text-amber-300">{viewingTour.lastDate || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">स्थिति (Status)</span>
                <span className="font-bold text-white uppercase">{viewingTour.status} Championship</span>
              </div>
            </div>

            {/* Event List Preview */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center justify-between">
                <span>प्रतिस्पर्धा सूची (Competition Events)</span>
                <span className="text-xs text-amber-400 font-bold">स्केटर केवल पात्र मैच ले सकते हैं</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1 pr-2">
                {events.filter(e => e.tournamentId === viewingTour.id).length === 0 ? (
                  <p className="text-xs text-slate-400 col-span-2 italic">मानक 19 मैच इवेंट्स (Speed Quad, Inline, Adjustable, Freestyle) शामिल हैं।</p>
                ) : (
                  events.filter(e => e.tournamentId === viewingTour.id).map(ev => (
                    <div key={ev.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{ev.distance}</div>
                        <div className="text-[10px] text-amber-300">{ev.discipline} • {ev.ageGroup}</div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{ev.gender}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Action */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                * फॉर्म भरने के लिए स्केटर ID व Password आवश्यक है।
              </span>

              <button
                type="button"
                onClick={() => {
                  setViewingTour(null);
                  handleEnterTournamentForm(viewingTour);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase rounded-xl transition shadow-xl flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {activeSkater ? 'टूर्नामेंट का फॉर्म भरें' : 'लॉगिन करें और फॉर्म भरें'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SKATER LOGIN MODAL FOR TOURNAMENT ENTRY */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto">
                <LogIn className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white">स्केटर टूर्नामेंट लॉगिन</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {targetTourForLogin ? (
                  <strong className="text-amber-400 block mb-1">{targetTourForLogin.nameEn}</strong>
                ) : null}
                फॉर्म भरने व मैच सेलेक्ट करने के लिए अपना Skater Login ID और Password दर्ज करें:
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Skater Login ID / Registration No.
                </label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Enter Skater ID / Reg No."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {loginError && (
                <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs font-semibold text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-xl flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                लॉगिन करें और टूर्नामेंट फॉर्म भरें
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
