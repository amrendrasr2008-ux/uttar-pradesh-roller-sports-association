import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { dbStore } from '../../lib/db';
import { 
  Trophy, 
  Globe, 
  UserCheck, 
  ShieldCheck, 
  Radio, 
  Menu, 
  X, 
  Award, 
  Sparkles,
  Database,
  Building2,
  Users,
  Search,
  CheckCircle2,
  FileText,
  Upload,
  Lock
} from 'lucide-react';

interface HeaderProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  currentView?: string;
  onNavigate?: (view: string) => void;
  onOpenSqlModal?: () => void;
  onOpenChatBoard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  currentView, 
  onNavigate, 
  onOpenSqlModal,
  onOpenChatBoard 
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { role, setRole, activeSkater, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [websiteSettings, setWebsiteSettings] = useState(() => dbStore.getWebsiteSettings());

  useEffect(() => {
    const refreshSettings = () => {
      setWebsiteSettings(dbStore.getWebsiteSettings());
    };
    refreshSettings();
    return dbStore.subscribe(refreshSettings);
  }, []);

  const active = activeTab || currentView || 'home';

  const handleNavigate = (tab: string) => {
    let view = tab;
    if (tab === 'registration') view = 'register';
    if (tab === 'news') view = 'news-gallery';
    if (tab === 'chat-board' || tab === 'chat') view = 'chat';
    if (setActiveTab) setActiveTab(view);
    if (onNavigate) onNavigate(view);
  };

  const navItems = [
    { id: 'home', label: t('home') },
    { id: 'about', label: t('about') },
    { id: 'activities', label: t('activities') },
    { id: 'districts', label: t('districts') },
    { id: 'clubs', label: t('clubs') },
    { id: 'tournaments', label: t('tournaments') },
    { id: 'results', label: t('results'), badge: 'LIVE' },
    { id: 'rankings', label: t('rankings') },
    { id: 'chat', label: language === 'hi' ? '💬 चैट बोर्ड' : '💬 Chat Board', highlight: true },
    { id: 'registration', label: t('skaterRegistration') },
    { id: 'portal', label: t('skaterPortal') },
    { id: 'admin', label: language === 'hi' ? 'एडमिन पोर्टल' : 'Admin Portal' },
    { id: 'news', label: t('news') },
    { id: 'contact', label: t('contact') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0f172a] text-white shadow-2xl border-b border-slate-800">
      {/* Top Bar: Role Switcher & Language Switcher */}
      <div className="bg-[#080d1a] text-xs py-1.5 px-4 border-b border-amber-500/20">
        <div className="w-full px-2 sm:px-6 flex flex-wrap items-center justify-between gap-2">
          
          {/* Top Info Bar */}
          <div className="flex items-center gap-1.5 flex-wrap">
          </div>

          {/* Right Top Bar items */}
          <div className="flex items-center gap-2.5 flex-wrap">

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded flex items-center gap-1.5 hover:from-amber-400 hover:to-amber-500 transition shadow-md border border-amber-400/40 text-xs"
            >
              <Globe className="w-3.5 h-3.5 text-slate-950" />
              {language === 'en' ? 'हिन्दी (HI)' : 'English (EN)'}
            </button>

            {role !== 'public' && (
              <button
                onClick={logout}
                className="text-red-400 hover:text-red-300 underline font-semibold text-xs"
              >
                {t('logout')}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Main Branding Header */}
      <div className="w-full px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-center text-center gap-4 bg-[#0e172a] relative">
        <div 
          className="flex flex-col md:flex-row items-center justify-center text-center gap-4 cursor-pointer group"
          onClick={() => handleNavigate('home')}
        >
          {/* UPRSA / UPIC Logo Badge */}
          <div 
            className="rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-blue-600 p-1 shadow-2xl group-hover:scale-105 transition shrink-0 overflow-hidden flex items-center justify-center bg-slate-950 border-2 border-amber-400/80 mx-auto"
            style={{
              width: `${websiteSettings?.logoSize || 96}px`,
              height: `${websiteSettings?.logoSize || 96}px`,
            }}
          >
            {websiteSettings?.logoUrl ? (
              <img 
                src={websiteSettings.logoUrl} 
                alt="UPIC / UPRSA Logo" 
                className="w-full h-full rounded-full object-contain bg-slate-950 p-1"
              />
            ) : (
              <div 
                className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center border border-amber-400/40"
              >
                <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400" />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <h1 
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white group-hover:text-amber-300 transition text-center"
                style={{
                  fontFamily: 'Times New Roman, serif',
                  fontWeight: 'bold',
                  fontStyle: 'italic',
                  textDecorationLine: 'underline',
                  color: '#e16816'
                }}
              >
                {t('associationName')}
              </h1>
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded shadow uppercase tracking-wider border border-amber-300/40 shrink-0">
                UPRSA
              </span>
            </div>
            <p 
              className="text-xs sm:text-sm md:text-base text-slate-300 font-bold text-center mt-1 max-w-4xl leading-relaxed"
              style={{
                color: '#55a332'
              }}
            >
              {t('associationSub')}
            </p>
          </div>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden absolute right-4 top-4 p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Main Navigation Bar (Desktop) */}
      <nav className="hidden lg:block bg-[#080d1a] border-t border-slate-800/80 text-sm font-semibold">
        <div className="w-full px-4 sm:px-6 flex items-center justify-between gap-1 overflow-x-auto py-1.5 scrollbar-none">
          {navItems.map(item => {
            const isItemActive = active === item.id || (item.id === 'registration' && active === 'register') || (item.id === 'news' && active === 'news-gallery');
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`px-3.5 py-2 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                  isItemActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md border border-amber-300/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/90'
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className="px-1.5 py-0.2 text-[10px] bg-red-600 text-white rounded font-black animate-pulse shadow">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {role === 'admin' && (
            <button
              onClick={() => handleNavigate('admin')}
              className={`ml-auto px-3.5 py-2 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                active === 'admin'
                  ? 'bg-purple-600 text-white font-black shadow-md'
                  : 'text-purple-300 bg-purple-950/80 hover:bg-purple-900 border border-purple-600/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              {t('adminPortal')}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#080d1a] border-t border-slate-800 px-4 py-3 space-y-2">
          {navItems.map(item => {
            const isItemActive = active === item.id || (item.id === 'registration' && active === 'register') || (item.id === 'news' && active === 'news-gallery');
            return (
              <button
                key={item.id}
                onClick={() => {
                  handleNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-between ${
                  isItemActive
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] bg-red-500 text-white rounded font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {role === 'admin' && (
            <button
              onClick={() => {
                handleNavigate('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 bg-purple-600 text-white font-bold rounded-lg text-sm transition flex items-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              {t('adminPortal')}
            </button>
          )}
        </div>
      )}
    </header>
  );
};
