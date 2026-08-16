import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { dbStore } from '../../lib/db';
import { Trophy, Mail, Phone, MapPin, Award, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  setActiveTab?: (tab: string) => void;
  onNavigate?: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, onNavigate }) => {
  const { language, t } = useLanguage();
  const [websiteSettings, setWebsiteSettings] = useState(() => dbStore.getWebsiteSettings());

  useEffect(() => {
    const refresh = () => setWebsiteSettings(dbStore.getWebsiteSettings());
    refresh();
    return dbStore.subscribe(refresh);
  }, []);

  const handleNavigate = (tab: string) => {
    let view = tab;
    if (tab === 'registration') view = 'register';
    if (tab === 'news') view = 'news-gallery';
    if (setActiveTab) setActiveTab(view);
    if (onNavigate) onNavigate(view);
  };

  const disciplines = websiteSettings?.skatingDisciplines && websiteSettings.skatingDisciplines.length > 0
    ? websiteSettings.skatingDisciplines
    : [
        'Speed Inline Skating (100m - 10,000m)',
        'Speed Quad Skating',
        'Roller Hockey & Inline Hockey',
        'Inline Freestyle Slalom',
        'Artistic Roller Skating',
        'Skateboarding & Downhill'
      ];

  const assocDesc = language === 'hi'
    ? (websiteSettings?.associationDescHi || 'उत्तर प्रदेश में रोलर स्पोर्ट्स में गति, सटीकता, अनुशासन और खेल भावना को बढ़ावा देने के लिए समर्पित।')
    : (websiteSettings?.associationDescEn || 'Dedicated to promoting speed, accuracy, discipline, and sportsmanship in roller sports across Uttar Pradesh.');

  const secretariatTitle = language === 'hi'
    ? (websiteSettings?.secretariatTitleHi || 'केंद्रीय सचिवालय')
    : (websiteSettings?.secretariatTitleEn || 'Central Secretariat');

  const copyrightText = language === 'hi'
    ? (websiteSettings?.copyrightTextHi || '© 2026 उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन (UPRSA)। सर्वाधिकार सुरक्षित।')
    : (websiteSettings?.copyrightTextEn || '© 2026 Uttar Pradesh Roller Sports Association (UPRSA). All rights reserved.');

  const footerTagline = language === 'hi'
    ? (websiteSettings?.footerTaglineHi || 'उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन हेतु द्विभाषी खेल पोर्टल')
    : (websiteSettings?.footerTaglineEn || 'Bilingual Sports Portal for Uttar Pradesh Roller Sports Association');

  const badge1 = websiteSettings?.badge1Text || 'RSFI Affiliated';
  const badge2 = websiteSettings?.badge2Text || 'UPOA Recognized';

  const address = language === 'hi'
    ? (websiteSettings?.addressHi || t('addressLine1'))
    : (websiteSettings?.addressEn || `${t('addressLine1')}, ${t('addressLine2')}`);

  return (
    <footer className="bg-[#080d1a] text-slate-300 border-t-2 border-amber-500/80 pt-12 pb-8 shadow-2xl">
      <div className="w-full px-4 sm:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        
        {/* Col 1: Association Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-slate-950 flex items-center justify-center font-bold overflow-hidden p-0.5 shrink-0 shadow-lg border border-amber-300/40">
              {websiteSettings?.logoUrl ? (
                <img src={websiteSettings.logoUrl} alt="UPIC Logo" className="w-full h-full rounded-full object-contain bg-slate-950 p-0.5" />
              ) : (
                <Trophy className="w-6 h-6 text-slate-950" />
              )}
            </div>
            <div>
              <h3 className="font-black text-white text-base tracking-wide">
                {language === 'hi' ? (websiteSettings?.websiteNameHi || 'UPRSA') : (websiteSettings?.websiteNameEn || 'UPRSA')}
              </h3>
              <p className="text-xs text-amber-400 font-bold">{t('associationName')}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {assocDesc}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {badge1 && (
              <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded-md border border-amber-500/30 font-bold shadow-sm">
                {badge1}
              </span>
            )}
            {badge2 && (
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 rounded-md border border-emerald-500/30 font-bold shadow-sm">
                {badge2}
              </span>
            )}
          </div>

        </div>

        {/* Col 2: Quick Links */}
        <div>
          <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            Quick Portals
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => handleNavigate('registration')} className="hover:text-amber-400 transition font-medium">
                • {t('skaterRegistration')}
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigate('portal')} className="hover:text-amber-400 transition font-medium">
                • {t('skaterPortal')} & Digital ID Card
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigate('results')} className="hover:text-amber-400 transition font-medium">
                • Live Tournament Scoreboard
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigate('rankings')} className="hover:text-amber-400 transition font-medium">
                • State & District Rankings
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigate('admin')} className="hover:text-amber-300 transition text-purple-400 font-bold">
                • {t('adminPortal')}
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Disciplines */}
        <div>
          <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            Skating Disciplines
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            {disciplines.map((discipline, idx) => (
              <li key={idx} className="hover:text-slate-200 transition">• {discipline}</li>
            ))}
          </ul>
        </div>

        {/* Col 4: Contact Secretariat */}
        <div>
          <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            {secretariatTitle}
          </h4>
          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{address}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-semibold">{websiteSettings?.primaryPhone || t('phoneVal')}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>{websiteSettings?.primaryEmail || t('emailVal')}</span>
            </li>
          </ul>
        </div>

      </div>

      <div className="w-full px-4 sm:px-8 border-t border-slate-800/80 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <p className="font-medium">{copyrightText}</p>
        <p className="flex items-center gap-1 text-slate-400 font-medium">
          {footerTagline}
        </p>
      </div>
    </footer>
  );
};
