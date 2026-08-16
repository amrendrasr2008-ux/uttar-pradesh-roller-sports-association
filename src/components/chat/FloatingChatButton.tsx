import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { MessageSquare, Bot, Sparkles, X, ChevronUp, ChevronDown } from 'lucide-react';
import { dbStore } from '../../lib/db';

interface FloatingChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ onClick, isOpen }) => {
  const { language } = useLanguage();
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    return dbStore.getCommunityPosts().length;
  });
  const [showTooltip, setShowTooltip] = useState<boolean>(true);

  useEffect(() => {
    const updateCount = () => {
      setUnreadCount(dbStore.getCommunityPosts().length);
    };
    return dbStore.subscribe(updateCount);
  }, []);

  // Hide tooltip after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 group">
      
      {/* Interactive Helper Tooltip Callout */}
      {showTooltip && !isOpen && (
        <div 
          onClick={onClick}
          className="cursor-pointer bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/80 border border-amber-500/50 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce max-w-[260px] sm:max-w-xs"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <div className="flex-1">
            <p className="text-[11px] font-black text-amber-400">
              {language === 'hi' ? 'UPRSA लाइव चैट डेस्क ⛸️' : 'UPRSA Live Skating Desk ⛸️'}
            </p>
            <p className="text-[10px] text-slate-300 font-normal leading-tight mt-0.5">
              {language === 'hi' ? 'रजिस्ट्रेशन, Age ग्रुप या नियमों पर चैट करें!' : 'Ask AI or join community discussions!'}
            </p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }} 
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Floating Launcher Button */}
      <button
        onClick={onClick}
        className={`relative px-4 py-3 sm:px-5 sm:py-3.5 rounded-full flex items-center gap-2.5 shadow-2xl transition-all duration-300 font-black text-xs sm:text-sm border ${
          isOpen
            ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 scale-95 shadow-red-600/30'
            : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 border-amber-300/80 hover:scale-105 shadow-amber-500/30'
        }`}
        aria-label="UPRSA Live Chat Board"
      >
        {/* Pulsing indicator */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
          </span>
        )}

        {isOpen ? (
          <>
            <X className="w-5 h-5" />
            <span className="hidden sm:inline font-black">चैट बंद करें</span>
          </>
        ) : (
          <>
            <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center text-amber-400 shadow">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold tracking-wide">
              {language === 'hi' ? 'लाइव चैट बोर्ड' : 'Live Chat Board'}
            </span>
            <span className="hidden md:inline px-1.5 py-0.5 bg-slate-950 text-amber-400 text-[10px] rounded-md font-bold uppercase tracking-wider">
              AI + Community
            </span>
          </>
        )}
      </button>

    </div>
  );
};
