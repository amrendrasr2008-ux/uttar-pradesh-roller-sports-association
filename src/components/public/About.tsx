import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Trophy, ShieldCheck, Target, Award, Users, MapPin, Building2 } from 'lucide-react';
import { dbStore } from '../../lib/db';
import { CouncilMember } from '../../types';

export const About: React.FC = () => {
  const { t, language } = useLanguage();
  const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>(dbStore.getActiveCouncilMembers());

  useEffect(() => {
    const unsubscribe = dbStore.subscribe(() => {
      setCouncilMembers(dbStore.getActiveCouncilMembers());
    });
    return unsubscribe;
  }, []);

  return (
    <div className="w-full px-4 sm:px-8 py-10 space-y-10 text-slate-100">
      
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold uppercase tracking-wider">
          Official Governing Body
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          About Uttar Pradesh Roller Sports Association (UPRSA)
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Affiliated with Roller Skating Federation of India (RSFI) & Recognized by Uttar Pradesh Olympic Association (UPOA).
        </p>
      </div>

      {/* Mission & Vision Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Our Mission</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            To promote, govern, and develop all roller skating sports disciplines across all 75 districts of Uttar Pradesh. We aim to provide world-class synthetic track infrastructure, scientific coaching, unbiased officiating, and transparent athlete management to nurture national and international champions.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Our Vision</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            To position Uttar Pradesh as the premier roller sports powerhouse in India, producing Asian Games and World Championship medalists while fostering sportsmanship, youth empowerment, and healthy athletic lifestyle across the state.
          </p>
        </div>
      </div>

      {/* Executive Committee */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
        <h3 className="text-xl font-black text-white text-center">UPRSA State Executive Council (2026–30)</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {councilMembers.map((member, idx) => (
            <div key={member.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-3 flex flex-col items-center">
              <div className={`w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] lg:w-[240px] lg:h-[240px] aspect-square mx-auto rounded-xl bg-slate-800 border-2 ${idx === 0 ? 'border-amber-500' : idx === 1 ? 'border-emerald-500' : 'border-blue-500'} overflow-hidden shadow-lg flex-shrink-0`}>
                <img src={member.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} alt={member.nameEn} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-white text-base sm:text-lg">
                  {language === 'hi' && member.nameHi ? member.nameHi : member.nameEn}
                </h4>
                <p className={`${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-emerald-400' : 'text-blue-400'} text-xs font-bold uppercase tracking-wider`}>
                  {language === 'hi' && member.designationHi ? member.designationHi : member.designationEn}
                </p>
                <p className="text-slate-400 text-xs">
                  {language === 'hi' && member.bioHi ? member.bioHi : member.bioEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
