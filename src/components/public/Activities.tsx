import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { dbStore } from '../../lib/db';
import { DisciplineItem } from '../../types';

export const Activities: React.FC = () => {
  const { language } = useLanguage();
  const [disciplines, setDisciplines] = useState<DisciplineItem[]>([]);

  useEffect(() => {
    const update = () => {
      setDisciplines(dbStore.getDisciplines());
    };
    update();
    return dbStore.subscribe(update);
  }, []);

  return (
    <div className="w-full px-4 sm:px-8 py-10 space-y-10 text-slate-100">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider">
          {language === 'hi' ? 'रोलर स्पोर्ट्स अनुशासन' : 'Roller Sports Disciplines'}
        </span>
        <h1 className="text-3xl font-black text-white">
          {language === 'hi' ? 'यूपीआरएसए आधिकारिक स्केटिंग अनुशासन' : 'UPRSA Official Skating Disciplines'}
        </h1>
        <p className="text-slate-400 text-sm">
          {language === 'hi' 
            ? 'वर्ल्ड स्केट एवं आरएसएफआई के अंतर्राष्ट्रीय मानकों के तहत शासित।' 
            : 'Governed under the international standards of World Skate & RSFI.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {disciplines.map((d) => {
          const title = (language === 'hi' && d.titleHi) ? d.titleHi : d.titleEn;
          const sub = (language === 'hi' && d.subtitleHi) ? d.subtitleHi : d.subtitleEn;
          const desc = (language === 'hi' && d.descriptionHi) ? d.descriptionHi : d.descriptionEn;
          const events = (language === 'hi' && d.eventsHi && d.eventsHi.length > 0) ? d.eventsHi : d.eventsEn;

          return (
            <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between">
              <div className="space-y-4 p-5">
                <div className="h-44 rounded-xl overflow-hidden relative">
                  <img src={d.imageUrl || 'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=800&auto=format&fit=crop&q=80'} alt={title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex items-end p-3">
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded text-[10px] font-black uppercase">
                      {language === 'hi' ? 'आधिकारिक खेल' : 'Official Sport'}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">{title}</h3>
                  {sub && <p className="text-amber-400 text-xs font-semibold">{sub}</p>}
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">{desc}</p>
              </div>

              {events && events.length > 0 && (
                <div className="bg-slate-950 p-4 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'hi' ? 'प्रमुख प्रतियोगिता स्पर्धाएं:' : 'Key Competition Events:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {events.map((ev, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-900 text-slate-300 border border-slate-800 rounded text-[10px]">
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
