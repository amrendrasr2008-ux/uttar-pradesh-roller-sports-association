import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { dbStore } from '../../lib/db';
import { District } from '../../types';
import { 
  MapPin, 
  Search, 
  Phone, 
  Mail, 
  User, 
  Users, 
  ShieldCheck, 
  X, 
  Award,
  Building2,
  PhoneCall,
  Navigation
} from 'lucide-react';

export const Districts: React.FC = () => {
  const { language } = useLanguage();
  const districts = dbStore.getDistricts();
  const [search, setSearch] = useState('');
  const [selectedDistrictCommittee, setSelectedDistrictCommittee] = useState<District | null>(null);

  const filtered = districts.filter(d => 
    (d.nameEn || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (d.nameHi || '').includes(search || '') ||
    (d.code || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (d.zone || '').toLowerCase().includes((search || '').toLowerCase())
  );

  return (
    <div className="w-full px-4 sm:px-8 py-10 space-y-8 text-slate-100 font-sans">
      
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-amber-400" />
            उत्तर प्रदेश रोलर स्केटिंग संघ - संबद्ध जिला संघ निर्देशिका
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            जिला स्केटिंग संघ एवं पदाधिकारी (Districts Directory)
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            उत्तर प्रदेश के सभी 75 सम्बद्ध जिला संघों का नाम, बड़ा लोगो, संघ कार्यालय पता, एवं अध्यक्ष, महासचिव व तिजरार (कोषाध्यक्ष) का विवरण ({districts.length} कुल जिला इकाइयाँ)
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="जिला नाम, जोन या कोड खोजें..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* DISTRICTS CARDS DISPLAY */}
      <div className="space-y-8">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-3">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-200">कोई जिला संघ नहीं मिला</h3>
            <p className="text-xs text-slate-400">कृपया कोई अन्य शब्द खोजकर पुनः प्रयास करें।</p>
          </div>
        ) : (
          filtered.map(dist => {
            const execCount = dist.executiveCommittee?.length || (dist.presidentName || dist.secretaryName || dist.treasurerName ? 3 : 0);

            return (
              <div 
                key={dist.id} 
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl hover:border-slate-700 transition relative"
              >
                {/* 1. TOP HEADER: BIG LOGO & DISTRICT NAME & CODE */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border-b border-slate-800/80 pb-6">
                  
                  <div className="flex items-center gap-5">
                    {/* Big District Logo */}
                    {dist.logoUrl ? (
                      <div className="relative group">
                        <img 
                          src={dist.logoUrl} 
                          alt={dist.nameEn} 
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-contain bg-slate-950 border-2 border-slate-700 p-2 shadow-2xl shrink-0 transition transform group-hover:scale-105" 
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center shrink-0 shadow-xl">
                        <Building2 className="w-12 h-12 text-amber-400" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md font-mono font-black text-xs">
                          {dist.code}
                        </span>
                        <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          {dist.zone} Zone
                        </span>
                        <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-md text-[10px] font-bold">
                          ✓ UPRSA Affiliated
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                        {language === 'en' ? dist.nameEn : dist.nameHi}
                      </h2>
                      <p className="text-xs font-extrabold text-amber-400">
                        {language === 'en' ? dist.nameHi : dist.nameEn}
                      </p>

                      {/* Association Office Address */}
                      <div className="pt-1.5 flex items-start gap-1.5 text-xs text-slate-300">
                        <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="font-medium">{dist.address || 'K.D. Singh Babu Stadium Complex, Uttar Pradesh'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">पंजीकृत स्केटर</span>
                      <span className="text-lg font-black text-white">{dist.skaterCount || 0} Skaters</span>
                    </div>

                    <button
                      onClick={() => setSelectedDistrictCommittee(dist)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-extrabold text-xs rounded-2xl border border-slate-700 transition flex items-center gap-2 shadow"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>कार्यकारिणी समिति ({execCount})</span>
                    </button>
                  </div>

                </div>

                {/* 2. THREE OFFICIALS DISPLAY GRID: PRESIDENT, SECRETARY, TREASURER (तिजरार) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400" />
                    मुख्य जिला पदाधिकारी (Key Office Bearers)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* PRESIDENT (अध्यक्ष) */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-emerald-500/50 transition shadow-xl">
                      <div className="flex flex-col items-center text-center space-y-3">
                        {dist.presidentPhotoUrl ? (
                          <img 
                            src={dist.presidentPhotoUrl} 
                            alt={dist.presidentName} 
                            className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-emerald-500 shrink-0 shadow-2xl transition transform hover:scale-105"
                          />
                        ) : (
                          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-emerald-950 border-2 border-emerald-500/60 flex items-center justify-center text-emerald-400 font-black text-3xl shrink-0 shadow-2xl">
                            P
                          </div>
                        )}
                        <div className="space-y-1.5 w-full">
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-black uppercase tracking-wider inline-block">
                            अध्यक्ष (President)
                          </span>
                          <h4 className="font-extrabold text-white text-base leading-tight pt-1">
                            {dist.presidentName || 'N/A'}
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-mono font-bold text-white">{dist.presidentPhone || dist.contactPhone || 'N/A'}</span>
                        </div>
                        {dist.presidentEmail && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="truncate font-mono">{dist.presidentEmail}</span>
                          </div>
                        )}
                        {dist.presidentAddress && (
                          <div className="flex items-start gap-2 text-slate-400 text-[11px] pt-1">
                            <Navigation className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{dist.presidentAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECRETARY (महासचिव/सेक्रेटरी) */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-blue-500/50 transition shadow-xl">
                      <div className="flex flex-col items-center text-center space-y-3">
                        {dist.secretaryPhotoUrl ? (
                          <img 
                            src={dist.secretaryPhotoUrl} 
                            alt={dist.secretaryName} 
                            className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-blue-500 shrink-0 shadow-2xl transition transform hover:scale-105"
                          />
                        ) : (
                          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-blue-950 border-2 border-blue-500/60 flex items-center justify-center text-blue-400 font-black text-3xl shrink-0 shadow-2xl">
                            S
                          </div>
                        )}
                        <div className="space-y-1.5 w-full">
                          <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-black uppercase tracking-wider inline-block">
                            महासचिव (Secretary)
                          </span>
                          <h4 className="font-extrabold text-white text-base leading-tight pt-1">
                            {dist.secretaryName || 'N/A'}
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-mono font-bold text-white">{dist.secretaryPhone || dist.contactPhone || 'N/A'}</span>
                        </div>
                        {dist.secretaryEmail && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="truncate font-mono">{dist.secretaryEmail}</span>
                          </div>
                        )}
                        {dist.secretaryAddress && (
                          <div className="flex items-start gap-2 text-slate-400 text-[11px] pt-1">
                            <Navigation className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{dist.secretaryAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TREASURER (तिजरार / कोषाध्यक्ष) */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-purple-500/50 transition shadow-xl">
                      <div className="flex flex-col items-center text-center space-y-3">
                        {dist.treasurerPhotoUrl ? (
                          <img 
                            src={dist.treasurerPhotoUrl} 
                            alt={dist.treasurerName || 'Treasurer'} 
                            className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-purple-500 shrink-0 shadow-2xl transition transform hover:scale-105"
                          />
                        ) : (
                          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-purple-950 border-2 border-purple-500/60 flex items-center justify-center text-purple-400 font-black text-3xl shrink-0 shadow-2xl">
                            T
                          </div>
                        )}
                        <div className="space-y-1.5 w-full">
                          <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-black uppercase tracking-wider inline-block">
                            कोषाध्यक्ष (तिजरार / Treasurer)
                          </span>
                          <h4 className="font-extrabold text-white text-base leading-tight pt-1">
                            {dist.treasurerName || 'N/A'}
                          </h4>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300 pt-3 border-t border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-mono font-bold text-white">{dist.treasurerPhone || dist.contactPhone || 'N/A'}</span>
                        </div>
                        {dist.treasurerEmail && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="truncate font-mono">{dist.treasurerEmail}</span>
                          </div>
                        )}
                        {dist.treasurerAddress && (
                          <div className="flex items-start gap-2 text-slate-400 text-[11px] pt-1">
                            <Navigation className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{dist.treasurerAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ==================== DISTRICT EXECUTIVE COMMITTEE MODAL ==================== */}
      {selectedDistrictCommittee && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 text-slate-100 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto my-auto">
            
            <button
              onClick={() => setSelectedDistrictCommittee(null)}
              className="absolute right-4 top-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-4 pr-8">
              {selectedDistrictCommittee.logoUrl ? (
                <img src={selectedDistrictCommittee.logoUrl} alt={selectedDistrictCommittee.nameEn} className="w-20 h-20 rounded-2xl object-contain bg-slate-950 border-2 border-slate-700 p-2 shrink-0 shadow-lg" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center shrink-0 shadow-lg">
                  <Award className="w-9 h-9 text-amber-400" />
                </div>
              )}
              <div>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold uppercase tracking-wider">
                  {selectedDistrictCommittee.code} District Association
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {language === 'en' ? selectedDistrictCommittee.nameEn : selectedDistrictCommittee.nameHi}
                </h2>
                <p className="text-xs text-amber-400 font-semibold mt-0.5">
                  जिला रोलर स्केटिंग संघ संपूर्ण कार्यकारिणी समिति (2026–30)
                </p>
              </div>
            </div>

            {/* Committee Members Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Executive Office Bearers & Committee Members (कार्यकारिणी पदाधिकारी)
              </h3>

              {selectedDistrictCommittee.executiveCommittee && selectedDistrictCommittee.executiveCommittee.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedDistrictCommittee.executiveCommittee.map((member) => (
                    <div key={member.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 hover:border-slate-700 transition">
                      {member.photoUrl ? (
                        <img src={member.photoUrl} alt={member.nameEn} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-700 shrink-0 shadow-md" />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-amber-400 shrink-0 font-bold text-2xl shadow-md">
                          {member.nameEn.charAt(0)}
                        </div>
                      )}
                      <div className="space-y-1 min-w-0 flex-1 text-xs">
                        <span className="inline-block px-2.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md text-[10px] font-bold">
                          {language === 'en' ? member.designationEn : (member.designationHi || member.designationEn)}
                        </span>
                        <h4 className="font-extrabold text-white text-base truncate">
                          {language === 'en' ? member.nameEn : (member.nameHi || member.nameEn)}
                        </h4>
                        {member.contactPhone && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-amber-400 shrink-0" /> {member.contactPhone}
                          </p>
                        )}
                        {member.email && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 text-purple-400 shrink-0" /> {member.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Main 3 Officers fallback */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  
                  {/* President */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col items-center text-center">
                    {selectedDistrictCommittee.presidentPhotoUrl ? (
                      <img src={selectedDistrictCommittee.presidentPhotoUrl} alt="P" className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-emerald-500 shadow-xl" />
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-emerald-950 border-2 border-emerald-500 text-emerald-400 font-bold flex items-center justify-center text-2xl shadow-xl">P</div>
                    )}
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold inline-block">
                      अध्यक्ष (President)
                    </span>
                    <h4 className="font-bold text-white text-sm">{selectedDistrictCommittee.presidentName || 'N/A'}</h4>
                    <p className="text-slate-400 text-[11px] font-mono">{selectedDistrictCommittee.presidentPhone || selectedDistrictCommittee.contactPhone}</p>
                    <p className="text-slate-400 text-[11px] font-mono">{selectedDistrictCommittee.presidentEmail}</p>
                  </div>

                  {/* Secretary */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col items-center text-center">
                    {selectedDistrictCommittee.secretaryPhotoUrl ? (
                      <img src={selectedDistrictCommittee.secretaryPhotoUrl} alt="S" className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-blue-500 shadow-xl" />
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-blue-950 border-2 border-blue-500 text-blue-400 font-bold flex items-center justify-center text-2xl shadow-xl">S</div>
                    )}
                    <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-bold inline-block">
                      महासचिव (Secretary)
                    </span>
                    <h4 className="font-bold text-white text-sm">{selectedDistrictCommittee.secretaryName || 'N/A'}</h4>
                    <p className="text-slate-400 text-[11px] font-mono">{selectedDistrictCommittee.secretaryPhone || selectedDistrictCommittee.contactPhone}</p>
                    <p className="text-slate-400 text-[11px] font-mono">{selectedDistrictCommittee.secretaryEmail}</p>
                  </div>

                  {/* Treasurer */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col items-center text-center">
                    {selectedDistrictCommittee.treasurerPhotoUrl ? (
                      <img src={selectedDistrictCommittee.treasurerPhotoUrl} alt="T" className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-purple-500 shadow-xl" />
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-purple-950 border-2 border-purple-500 text-purple-400 font-bold flex items-center justify-center text-2xl shadow-xl">T</div>
                    )}
                    <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px] font-bold inline-block">
                      कोषाध्यक्ष (तिजरार)
                    </span>
                    <h4 className="font-bold text-white text-sm">{selectedDistrictCommittee.treasurerName || 'N/A'}</h4>
                    <p className="text-slate-400 text-[11px] font-mono">{selectedDistrictCommittee.treasurerPhone || selectedDistrictCommittee.contactPhone}</p>
                    <p className="text-slate-400 text-[11px] font-mono">{selectedDistrictCommittee.treasurerEmail}</p>
                  </div>

                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedDistrictCommittee(null)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition"
              >
                बंद करें (Close)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
