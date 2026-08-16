import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { dbStore } from '../../lib/db';
import { HeroSlide } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  Trophy, 
  Sparkles, 
  UserCheck, 
  Radio, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  Award,
  Play,
  Volume2,
  VolumeX,
  Edit,
  Save,
  Check,
  X,
  Megaphone,
  Settings,
  Tv
} from 'lucide-react';

interface HeroProps {
  setActiveTab?: (tab: string) => void;
  onNavigate?: (view: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ setActiveTab, onNavigate }) => {
  const { language, t } = useLanguage();
  const { role } = useAuth();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Scoreboard state & ticker editing
  const [scoreboardState, setScoreboardState] = useState(() => dbStore.getScoreboardState());
  const [tickerIndex, setTickerIndex] = useState(0);
  const [isEditTickerModalOpen, setIsEditTickerModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editTickerText, setEditTickerText] = useState('');
  const [editIntervalSecs, setEditIntervalSecs] = useState(4);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Touch swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const loadData = () => {
    const active = dbStore.getHeroSlides().filter(s => s.active);
    setSlides(active);
    setScoreboardState(dbStore.getScoreboardState());
  };

  useEffect(() => {
    loadData();
    return dbStore.subscribe(loadData);
  }, []);

  // Auto-play hero slides (5 seconds)
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides, isPaused]);

  const liveTournaments = dbStore.getTournaments().filter(tr => tr.status === 'Live');
  const liveResults = dbStore.getResults().slice(0, 5);

  // Construct continuous auto-rotating ticker messages array ("बदलता रहे")
  const activeTournament = liveTournaments[0] || dbStore.getTournaments()[0];
  const customTitle = scoreboardState.customTitle || activeTournament?.nameEn || '38th UPRSA UP State Championship 2026';
  const customTickerMsg = scoreboardState.tickerText || 'WELCOME TO UPRSA STATE CHAMPIONSHIP • LIVE SCORING IN PROGRESS';

  const tickerItems: string[] = [
    `🏆 ${customTitle}`,
    `📢 ${customTickerMsg}`,
    ...(liveResults.length > 0 
      ? [`🥇 Latest Gold Result: ${liveResults[0].skaterName} (${liveResults[0].districtName || 'UPRSA'}) - Position #${liveResults[0].position} (${liveResults[0].timing || '00:45.12'})`]
      : ['🔥 High-speed Speed Inline & Quad Battles active at Lucknow Track']
    ),
    ...(liveResults.length > 1
      ? [`🥈 Medal Standing: ${liveResults[1].skaterName} (${liveResults[1].districtName || 'Lucknow'}) - ${liveResults[1].discipline || 'Inline'} (${liveResults[1].timing || '00:46.30'})`]
      : ['📍 Official RSFI Affiliated State Championship • Venue: Lucknow Synthetic Track']
    ),
    `⏱️ Live Scoreboard Mode: ${scoreboardState.autoRotate ? 'Continuous Auto-Loop Active' : 'Realtime Track Feed'}`
  ];

  // Auto-rotate ticker items every 4 seconds
  useEffect(() => {
    if (tickerItems.length <= 1) return;
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % tickerItems.length);
    }, (scoreboardState.autoRotateIntervalSeconds || 4) * 1000);

    return () => clearInterval(interval);
  }, [tickerItems.length, scoreboardState.autoRotateIntervalSeconds]);

  const handleOpenEditModal = () => {
    const sb = dbStore.getScoreboardState();
    setEditTitle(sb.customTitle || '38th UPRSA UP State Roller Skating Championship 2026');
    setEditTickerText(sb.tickerText || 'WELCOME TO UPRSA STATE CHAMPIONSHIP • LIVE SCORING IN PROGRESS');
    setEditIntervalSecs(sb.autoRotateIntervalSeconds || 4);
    setIsEditTickerModalOpen(true);
  };

  const handleSaveTicker = (e: React.FormEvent) => {
    e.preventDefault();
    dbStore.updateScoreboardState({
      customTitle: editTitle.trim(),
      tickerText: editTickerText.trim(),
      autoRotateIntervalSeconds: editIntervalSecs
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditTickerModalOpen(false);
    }, 1200);
  };

  const handleNavigate = (urlOrView: string) => {
    let view = urlOrView.replace(/^\//, '');
    if (view === 'register') view = 'register';
    if (view === 'tournaments') view = 'tournaments';
    if (view === 'results' || view === 'live-scoreboard') view = 'results';
    if (view === 'portal') view = 'portal';
    if (view === 'rankings') view = 'rankings';
    if (view === 'districts') view = 'districts';

    if (setActiveTab) setActiveTab(view);
    if (onNavigate) onNavigate(view);
  };

  const currentSlide = slides[currentSlideIndex] || slides[0];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentSlideIndex(prev => (prev + 1) % slides.length);
    } else if (isRightSwipe) {
      setCurrentSlideIndex(prev => (prev - 1 + slides.length) % slides.length);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const skaters = dbStore.getSkaters();
  const clubs = dbStore.getClubs();
  const districts = dbStore.getDistricts();

  return (
    <div 
      className="relative bg-slate-950 text-white overflow-hidden border-b border-slate-800"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dynamic Auto-Rotating Live Ticker Bar ("हमेशा बदलता रहने वाला लाइव स्कोरबोर्ड टिकर") */}
      <div className="relative z-30 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white py-2 px-3 sm:px-6 shadow-md border-b border-orange-500/30">
        <div className="w-full flex items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className="px-2 py-0.5 bg-slate-950 text-amber-300 rounded-lg uppercase font-black flex items-center gap-1.5 shrink-0 animate-pulse text-[11px] shadow">
              <Radio className="w-3.5 h-3.5 text-red-400" />
              LIVE TICKER 🔄
            </span>
            <p 
              key={tickerIndex}
              className="truncate font-bold text-white tracking-wide transition-all duration-500 animate-fadeIn"
            >
              {tickerItems[tickerIndex % tickerItems.length]}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleNavigate('/results')}
              className="bg-slate-950 hover:bg-slate-900 text-amber-400 hover:text-amber-300 px-3 py-1 rounded-lg transition text-xs font-black flex items-center gap-1 shadow cursor-pointer"
            >
              <span>Watch Scoreboard</span> <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Edit Live Ticker Modal */}
      {isEditTickerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Megaphone className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">लाइव स्कोरबोर्ड टिकर एडिट करें</h3>
                  <p className="text-xs text-slate-400">Edit Live Ticker Text & Championship Name</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditTickerModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTicker} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  मुख्य शीर्षक (Championship Title)
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. 38th UPRSA UP State Roller Skating Championship 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  घोषणा संदेश (Live Announcement Message)
                </label>
                <textarea
                  rows={3}
                  required
                  value={editTickerText}
                  onChange={(e) => setEditTickerText(e.target.value)}
                  placeholder="e.g. Live scores active! All skaters report to Call Room..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  बदलाव की गति (Rotation Interval)
                </label>
                <select
                  value={editIntervalSecs}
                  onChange={(e) => setEditIntervalSecs(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={3}>3 सेकंड (Fast Rotation)</option>
                  <option value={4}>4 सेकंड (Standard)</option>
                  <option value={6}>6 सेकंड (Relaxed)</option>
                  <option value={8}>8 सेकंड (Slow)</option>
                </select>
              </div>

              {saveSuccess && (
                <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>सफलतापूर्वक अपडेट हो गया! Live Scoreboard updated instantly.</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>सेव करें (Save & Broadcast)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditTickerModalOpen(false);
                    handleNavigate('/results');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Tv className="w-4 h-4 text-amber-400" />
                  <span>Full Scoreboard View</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hero Background Slider Media */}
      <div className="absolute inset-0 z-0">
        {currentSlide?.videoUrl ? (
          <div className="w-full h-full relative">
            <video
              src={currentSlide.videoUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute bottom-6 right-6 z-20 p-2 bg-slate-950/80 text-amber-400 hover:text-amber-300 rounded-full border border-amber-500/30 transition text-xs flex items-center gap-1"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <picture className="w-full h-full block">
            {currentSlide?.mobileImage && (
              <source media="(max-width: 640px)" srcSet={currentSlide.mobileImage} />
            )}
            <img
              src={currentSlide?.desktopImage || 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=1920&auto=format&fit=crop&q=90'}
              alt={currentSlide?.titleEn || 'UPRSA Hero Banner'}
              loading="eager"
              // @ts-ignore
              fetchPriority="high"
              className="w-full h-full object-cover transition-all duration-1000 ease-out transform scale-105 filter contrast-[1.06] brightness-[1.02] saturate-[1.05]"
            />
          </picture>
        )}

        {/* Elegant HD Gradient Overlay (Ensures photo remains vibrant while text is ultra-legible) */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/40 pointer-events-none" 
          style={{ opacity: (currentSlide?.overlayStrength !== undefined ? currentSlide.overlayStrength : 50) / 100 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30 pointer-events-none" />
      </div>

      {/* Main Hero Slider Content Layer */}
      <div className="relative z-10 w-full px-4 sm:px-8 py-12 md:py-20 min-h-[580px] flex flex-col justify-between">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main Title & Description */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Trophy className="w-4 h-4 text-amber-400" />
              Official Governing Body for Uttar Pradesh Roller Sports
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white drop-shadow-lg">
                {language === 'hi' ? currentSlide?.titleHi || currentSlide?.titleEn : currentSlide?.titleEn}
              </h1>
              {language === 'hi' && currentSlide?.titleEn && (
                <p className="text-amber-400 font-bold text-sm md:text-base opacity-90">{currentSlide.titleEn}</p>
              )}
            </div>

            <p className="text-slate-200 text-base md:text-lg leading-relaxed max-w-2xl font-normal drop-shadow">
              {language === 'hi' ? currentSlide?.descriptionHi || currentSlide?.descriptionEn : currentSlide?.descriptionEn}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3.5 pt-2">
              {currentSlide?.primaryBtnTextEn && (
                <button
                  onClick={() => handleNavigate(currentSlide.primaryBtnUrl || '/register')}
                  className="px-6 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold rounded-xl shadow-xl shadow-amber-500/20 hover:scale-105 transition transform flex items-center gap-2 text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  {language === 'hi' ? currentSlide.primaryBtnTextHi || currentSlide.primaryBtnTextEn : currentSlide.primaryBtnTextEn}
                </button>
              )}

              {currentSlide?.secondaryBtnTextEn && (
                <button
                  onClick={() => handleNavigate(currentSlide.secondaryBtnUrl || '/tournaments')}
                  className="px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-white font-bold rounded-xl border border-slate-700/80 backdrop-blur-md hover:border-slate-500 transition flex items-center gap-2 text-sm shadow-lg"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  {language === 'hi' ? currentSlide.secondaryBtnTextHi || currentSlide.secondaryBtnTextEn : currentSlide.secondaryBtnTextEn}
                </button>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800/80 max-w-3xl">
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-inner">
                <div className="text-2xl font-black text-amber-400">{skaters.length}</div>
                <div className="text-[11px] text-slate-300 font-semibold">{t('registeredSkaters')}</div>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-inner">
                <div className="text-2xl font-black text-emerald-400">{clubs.length}</div>
                <div className="text-[11px] text-slate-300 font-semibold">{t('affiliatedClubs')}</div>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-inner">
                <div className="text-2xl font-black text-blue-400">{districts.length}</div>
                <div className="text-[11px] text-slate-300 font-semibold">{t('activeDistricts')}</div>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 shadow-inner">
                <div className="text-2xl font-black text-purple-400">38</div>
                <div className="text-[11px] text-slate-300 font-semibold">{t('championshipsHeld')}</div>
              </div>
            </div>

          </div>

          {/* Right Spotlight Card */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span className="font-extrabold text-xs text-amber-300 uppercase tracking-wider">
                    UPRSA Spotlight
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                  Live DB
                </span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleNavigate('/results')}
                  className="w-full p-3 bg-slate-950/80 hover:bg-slate-950 rounded-xl border border-slate-800 hover:border-amber-500/50 transition text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 text-xs">Live Stadium Scoreboard</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Real-time race timings & heat results</p>
                </button>

                <button
                  onClick={() => handleNavigate('/rankings')}
                  className="w-full p-3 bg-slate-950/80 hover:bg-slate-950 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 text-xs">State Rankings 2026</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Top individual skaters & district points</p>
                </button>

                <button
                  onClick={() => handleNavigate('/portal')}
                  className="w-full p-3 bg-slate-950/80 hover:bg-slate-950 rounded-xl border border-slate-800 hover:border-blue-500/50 transition text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-400 text-xs">Digital ID Cards</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Print official UPRSA credentials</p>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Slider Controls & Indicators */}
        {slides.length > 1 && (
          <div className="flex items-center justify-between pt-8 border-t border-slate-800/60 mt-8">
            {/* Slide Index text */}
            <div className="text-xs font-bold text-slate-400 tracking-wider">
              SLIDE <span className="text-amber-400 font-extrabold">{currentSlideIndex + 1}</span> / {slides.length}
            </div>

            {/* Dot Indicators */}
            <div className="flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    idx === currentSlideIndex ? 'w-8 h-2.5 bg-amber-400 shadow-md shadow-amber-400/40' : 'w-2.5 h-2.5 bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Prev/Next Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentSlideIndex(prev => (prev - 1 + slides.length) % slides.length)}
                className="p-2.5 bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl border border-slate-800 transition shadow-md"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentSlideIndex(prev => (prev + 1) % slides.length)}
                className="p-2.5 bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white rounded-xl border border-slate-800 transition shadow-md"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
