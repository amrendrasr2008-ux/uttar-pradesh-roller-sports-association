import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { dbStore } from '../../lib/db';
import { Building2, Search, MapPin, User, Phone, CheckCircle2, Award } from 'lucide-react';

export const Clubs: React.FC = () => {
  const { language } = useLanguage();
  const clubs = dbStore.getClubs();
  const districts = dbStore.getDistricts();
  
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');

  const filtered = clubs.filter(c => {
    const matchesSearch = (c.nameEn || '').toLowerCase().includes(search.toLowerCase()) ||
                          (c.nameHi || '').includes(search) ||
                          (c.coachName || '').toLowerCase().includes(search.toLowerCase());
    const matchesDist = selectedDistrict === 'ALL' || c.districtName === selectedDistrict;
    return matchesSearch && matchesDist;
  });

  return (
    <div className="w-full px-4 sm:px-8 py-10 space-y-8 text-slate-100">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Affiliated Clubs & Academies</h1>
          <p className="text-slate-400 text-xs mt-1">Directory of UPRSA certified skating academies in Uttar Pradesh ({clubs.length} Total)</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Districts</option>
            {districts.map(d => (
              <option key={d.id} value={d.nameEn}>{d.nameEn}</option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search club or coach..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(club => (
          <div key={club.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition shadow-lg flex flex-col justify-between">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  {club.logoUrl ? (
                    <img src={club.logoUrl} alt={club.nameEn} className="w-22 h-22 rounded-2xl object-contain bg-slate-950 border-2 border-slate-700 p-2 shrink-0 shadow-lg" />
                  ) : (
                    <div className="w-22 h-22 rounded-2xl bg-amber-500/10 text-amber-400 border-2 border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0 shadow-lg">
                      <Building2 className="w-9 h-9" />
                    </div>
                  )}
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Affiliated
                  </span>
                </div>
                <span className="font-mono text-slate-400 text-xs font-bold">{club.code}</span>
              </div>

              <div>
                <h3 className="font-extrabold text-white text-base leading-snug">
                  {language === 'en' ? club.nameEn : (club.nameHi || club.nameEn)}
                </h3>
                <p className="text-amber-400 text-xs font-medium flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {club.districtName} District
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Coach: <strong>{club.coachName}</strong></span>
                </div>
                {club.presidentName && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>President: <strong>{club.presidentName}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{club.contactPhone}{club.alternatePhone ? ` / ${club.alternatePhone}` : ''}</span>
                </div>
                {club.address && (
                  <p className="text-slate-400 text-[11px] italic mt-1 line-clamp-2">{club.address}</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Skaters: <strong className="text-white">{club.skaterCount || 0}</strong></span>
              <span className="px-2 py-1 bg-amber-500/10 text-amber-300 font-bold rounded flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> {club.totalPoints || 0} Pts
              </span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
