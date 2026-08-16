import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { dbStore } from '../../lib/db';
import { Radio, Tv, Play, ExternalLink, X, Flame } from 'lucide-react';

export const FloatingLiveMatchButton: React.FC = () => {
  const { language } = useLanguage();
  const [websiteSettings, setWebsiteSettings] = useState(() => dbStore.getWebsiteSettings());
  const [showTooltip, setShowTooltip] = useState<boolean>(true);

  useEffect(() => {
    const refresh = () => setWebsiteSettings(dbStore.getWebsiteSettings());
    refresh();
    return dbStore.subscribe(refresh);
  }, []);

  // Hide tooltip automatically after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // If explicitly disabled in admin settings, do not render
  if (websiteSettings?.isLiveMatchActive === false) {
    return null;
  }

  // Determine target live match URL
  const targetLiveUrl = 
    websiteSettings?.liveMatchUrl?.trim() || 
    websiteSettings?.socialLinks?.youtube?.trim() || 
    'https://youtube.com/@uprsa_official/live';

  const titleEn = websiteSettings?.liveMatchTitleEn?.trim() || 'Live Match';
  const titleHi = websiteSettings?.liveMatchTitleHi?.trim() || 'लाइव मैच';

  const handleOpenLiveMatch = () => {
    try {
      window.open(targetLiveUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      window.location.href = targetLiveUrl;
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-2 group">
      
      {/* Interactive Helper Tooltip Callout */}
      {showTooltip && (
        <div 
          onClick={handleOpenLiveMatch}
          className="cursor-pointer bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border border-red-500/60 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce max-w-[270px] sm:max-w-xs"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
          <div className="flex-1">
            <p className="text-[11px] font-black text-red-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              {language === 'hi' ? '🔴 लाइव मैच प्रसारण' : '🔴 Live Match Stream'}
            </p>
            <p className="text-[10px] text-slate-300 font-normal leading-tight mt-0.5">
              {language === 'hi' 
                ? 'क्लिक करें और सीधे लाइव मैच देखें (दूसरे टैब में)!' 
                : 'Click to watch live championship matches in a new tab!'}
            </p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }} 
            className="text-slate-400 hover:text-white p-1"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Floating Launcher Button */}
      <a
        href={targetLiveUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.preventDefault();
          handleOpenLiveMatch();
        }}
        className="relative px-4 py-3 sm:px-5 sm:py-3.5 rounded-full flex items-center gap-2.5 shadow-2xl transition-all duration-300 font-black text-xs sm:text-sm border bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white border-red-300/60 hover:scale-105 shadow-red-600/40 cursor-pointer"
        aria-label="UPRSA Live Match Stream"
      >
        {/* Pulsing Live Beacon */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-90"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-slate-900"></span>
        </span>

        {/* Live Icon Badge */}
        <div className="w-6 h-6 rounded-full bg-slate-950/80 flex items-center justify-center text-red-400 shadow shrink-0">
          <Tv className="w-3.5 h-3.5 animate-pulse" />
        </div>

        {/* Main Text */}
        <span className="font-extrabold tracking-wide uppercase flex items-center gap-1.5">
          {language === 'hi' ? titleHi : titleEn}
        </span>

        {/* Live / Stream Pill */}
        <span className="px-1.5 py-0.5 bg-slate-950/90 text-red-400 text-[10px] rounded-md font-black uppercase tracking-wider flex items-center gap-1 border border-red-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
          <span>LIVE</span>
          <ExternalLink className="w-2.5 h-2.5 text-slate-300 ml-0.5" />
        </span>
      </a>

    </div>
  );
};
