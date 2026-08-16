import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { dbStore } from '../../lib/db';
import { Trophy, Award, Medal, Users, Building2, MapPin } from 'lucide-react';

export const Rankings: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'individual' | 'district' | 'club'>('individual');

  const individualRankings = dbStore.getIndividualRankings();
  const districtRankings = dbStore.getDistrictRankings();
  const clubRankings = dbStore.getClubRankings();

  return (
    <div className="w-full px-4 sm:px-8 py-10 space-y-8 text-slate-100">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">UPRSA Official Leaderboards & Rankings</h1>
        <p className="text-slate-400 text-xs mt-1">Calculated automatically from state championship race points and medal tallies.</p>
        
        {/* Point Rules Badge Banner */}
        <div className="mt-3 inline-flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs">
          <span className="font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> Official Medal Points Rule:
          </span>
          <span className="bg-amber-400/10 border border-amber-400/30 text-amber-300 px-2.5 py-0.5 rounded font-black">🥇 1st (Gold) = 5 Points</span>
          <span className="bg-slate-300/10 border border-slate-300/30 text-slate-200 px-2.5 py-0.5 rounded font-black">🥈 2nd (Silver) = 3 Points</span>
          <span className="bg-amber-700/10 border border-amber-700/30 text-amber-500 px-2.5 py-0.5 rounded font-black">🥉 3rd (Bronze) = 1 Point</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('individual')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 ${
            activeTab === 'individual'
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" />
          {t('individualRank')}
        </button>

        <button
          onClick={() => setActiveTab('district')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 ${
            activeTab === 'district'
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          {t('districtRank')}
        </button>

        <button
          onClick={() => setActiveTab('club')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 ${
            activeTab === 'club'
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          {t('clubRank')}
        </button>
      </div>

      {/* Tab 1: Individual Ranking Table */}
      {activeTab === 'individual' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">State Rank</th>
                  <th className="p-4">Skater Name</th>
                  <th className="p-4">Reg Number</th>
                  <th className="p-4">District</th>
                  <th className="p-4">Club / Academy</th>
                  <th className="p-4">Discipline</th>
                  <th className="p-4">Medals (G/S/B)</th>
                  <th className="p-4 text-right">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {individualRankings.map(s => (
                  <tr key={s.skaterId} className="hover:bg-slate-800/60 transition">
                    <td className="p-4 font-bold">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                        s.rank === 1 ? 'bg-amber-400 text-slate-950 shadow' :
                        s.rank === 2 ? 'bg-slate-200 text-slate-950' :
                        s.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'
                      }`}>
                        #{s.rank}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-white text-sm">{s.skaterName}</td>
                    <td className="p-4 font-mono text-slate-400 text-[11px]">{s.registrationNumber}</td>
                    <td className="p-4 text-slate-300 font-medium">{s.districtName}</td>
                    <td className="p-4 text-slate-400">{s.clubName}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-slate-800 text-amber-300 rounded text-[10px] font-bold">
                        {s.discipline}
                      </span>
                    </td>
                    <td className="p-4 font-bold">
                      <span className="text-amber-400 mr-1.5">🥇 {s.goldMedals}</span>
                      <span className="text-slate-300 mr-1.5">🥈 {s.silverMedals}</span>
                      <span className="text-amber-700">🥉 {s.bronzeMedals}</span>
                    </td>
                    <td className="p-4 font-black text-amber-400 text-right text-base">{s.totalPoints} Pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: District Ranking Table */}
      {activeTab === 'district' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">District Rank</th>
                  <th className="p-4">District Association</th>
                  <th className="p-4">Registered Skaters</th>
                  <th className="p-4">Gold Medals</th>
                  <th className="p-4">Silver Medals</th>
                  <th className="p-4">Bronze Medals</th>
                  <th className="p-4 text-right">Aggregate Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {districtRankings.map(d => (
                  <tr key={d.id} className="hover:bg-slate-800/60 transition">
                    <td className="p-4 font-bold">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                        d.rank === 1 ? 'bg-amber-400 text-slate-950 shadow' :
                        d.rank === 2 ? 'bg-slate-200 text-slate-950' :
                        d.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'
                      }`}>
                        #{d.rank}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-white text-sm">{d.name}</td>
                    <td className="p-4 text-slate-300 font-semibold">{d.skaterCount} Skaters</td>
                    <td className="p-4 font-bold text-amber-400">🥇 {d.goldMedals}</td>
                    <td className="p-4 font-bold text-slate-300">🥈 {d.silverMedals}</td>
                    <td className="p-4 font-bold text-amber-700">🥉 {d.bronzeMedals}</td>
                    <td className="p-4 font-black text-amber-400 text-right text-base">{d.totalPoints} Pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Club Ranking Table */}
      {activeTab === 'club' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Club Rank</th>
                  <th className="p-4">Club / Academy Name</th>
                  <th className="p-4">District</th>
                  <th className="p-4">Active Skaters</th>
                  <th className="p-4">Medals (G/S/B)</th>
                  <th className="p-4 text-right">Total Club Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {clubRankings.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/60 transition">
                    <td className="p-4 font-bold">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                        c.rank === 1 ? 'bg-amber-400 text-slate-950 shadow' :
                        c.rank === 2 ? 'bg-slate-200 text-slate-950' :
                        c.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'
                      }`}>
                        #{c.rank}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-white text-sm">{c.name}</td>
                    <td className="p-4 text-slate-300">{c.districtName}</td>
                    <td className="p-4 text-slate-300 font-semibold">{c.skaterCount} Skaters</td>
                    <td className="p-4 font-bold">
                      <span className="text-amber-400 mr-1.5">🥇 {c.goldMedals}</span>
                      <span className="text-slate-300 mr-1.5">🥈 {c.silverMedals}</span>
                      <span className="text-amber-700">🥉 {c.bronzeMedals}</span>
                    </td>
                    <td className="p-4 font-black text-amber-400 text-right text-base">{c.totalPoints} Pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
