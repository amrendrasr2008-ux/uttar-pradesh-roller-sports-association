import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { dbStore } from '../../lib/db';
import { TournamentResult, IndividualRank } from '../../types';
import { Trophy, Radio, Search, RefreshCw, Award, ListFilter, Users, Medal } from 'lucide-react';

export const Results: React.FC = () => {
  const { t } = useLanguage();
  const [results, setResults] = useState<TournamentResult[]>(() => dbStore.getResults());
  const [individualRanks, setIndividualRanks] = useState<IndividualRank[]>(() => dbStore.getIndividualRankings('ALL'));
  const tournaments = dbStore.getTournaments();

  const [selectedTourId, setSelectedTourId] = useState<string>('ALL');
  const [filterDiscipline, setFilterDiscipline] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  // Subscribe to realtime changes in dbStore
  useEffect(() => {
    const unsubscribe = dbStore.subscribe(() => {
      setResults(dbStore.getResults());
      setIndividualRanks(dbStore.getIndividualRankings(selectedTourId));
    });
    return unsubscribe;
  }, [selectedTourId]);

  // Update individual ranks whenever selectedTourId changes
  useEffect(() => {
    setIndividualRanks(dbStore.getIndividualRankings(selectedTourId));
  }, [selectedTourId]);

  // Filter individual race results
  const filteredResults = results.filter(r => {
    const matchesTour = selectedTourId === 'ALL' || r.tournamentId === selectedTourId;
    const matchesDisc = filterDiscipline === 'ALL' || (r.discipline && r.discipline.toLowerCase().includes(filterDiscipline.toLowerCase())) || (r.clubName && r.clubName.toLowerCase().includes(filterDiscipline.toLowerCase()));
    const matchesSearch = (r.skaterName || '').toLowerCase().includes(search.toLowerCase()) ||
                          (r.registrationNumber || '').toLowerCase().includes(search.toLowerCase()) ||
                          (r.districtName || '').toLowerCase().includes(search.toLowerCase()) ||
                          (r.clubName || '').toLowerCase().includes(search.toLowerCase());
    return matchesTour && matchesDisc && matchesSearch;
  });

  // Filter aggregated skater rank summary
  const filteredRanks = individualRanks.filter(r => {
    const matchesDisc = filterDiscipline === 'ALL' || (r.discipline && r.discipline.toLowerCase().includes(filterDiscipline.toLowerCase()));
    const matchesSearch = (r.skaterName || '').toLowerCase().includes(search.toLowerCase()) ||
                          (r.registrationNumber || '').toLowerCase().includes(search.toLowerCase()) ||
                          (r.districtName || '').toLowerCase().includes(search.toLowerCase()) ||
                          (r.clubName || '').toLowerCase().includes(search.toLowerCase());
    return matchesDisc && matchesSearch;
  });

  const selectedTourName = selectedTourId === 'ALL' 
    ? 'All Tournaments (ऑल टूर्नामेंट)' 
    : (tournaments.find(t => t.id === selectedTourId)?.nameEn || 'Selected Tournament');

  return (
    <div className="w-full px-4 sm:px-8 py-10 space-y-8 text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider animate-pulse">
            <Radio className="w-4 h-4" /> Live Realtime Scoreboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Championship Race Results & Timings</h1>
          <div className="mt-2 inline-flex flex-wrap items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="font-extrabold text-amber-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Points Rule:
            </span>
            <span className="text-amber-300 font-bold">🥇 1st = 5 Pts</span>
            <span className="text-slate-300 font-bold">• 🥈 2nd = 3 Pts</span>
            <span className="text-amber-500 font-bold">• 🥉 3rd = 1 Pt</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tournament Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 uppercase font-black">Tournament Filter:</label>
            <select
              value={selectedTourId}
              onChange={(e) => {
                setSelectedTourId(e.target.value);
              }}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
            >
              <option value="ALL">All Tournaments (ऑल टूर्नामेंट)</option>
              {tournaments.map(tr => (
                <option key={tr.id} value={tr.id}>{tr.nameEn}</option>
              ))}
            </select>
          </div>

          {/* Discipline Category Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 uppercase font-black">Category Filter:</label>
            <select
              value={filterDiscipline}
              onChange={(e) => setFilterDiscipline(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
            >
              <option value="ALL">All Categories / Art / Speed</option>
              <option value="Art">Artistic (आर्ट टूर्नामेंट)</option>
              <option value="Speed Inline">Speed Inline</option>
              <option value="Speed Quad">Speed Quad</option>
              <option value="Roller Hockey">Roller Hockey</option>
              <option value="Skateboarding">Skateboarding</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 uppercase font-black">Search Skater:</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search skater or district..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-48 sm:w-60 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('summary')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              viewMode === 'summary'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Medal className="w-4 h-4" />
            Skater Medal Tally & Points (खिलाड़ी मेडल व अंक जोड़कर - एक जगह)
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              viewMode === 'detailed'
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            Individual Race Records (प्रत्येक रेस का अलग-अलग विवरण)
          </button>
        </div>

        <div className="text-xs text-amber-400 font-extrabold px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          Viewing: {selectedTourName}
        </div>
      </div>

      {/* VIEW MODE 1: SKATER AGGREGATED MEDALS & POINTS SUMMARY */}
      {viewMode === 'summary' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4">
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <span className="font-extrabold text-sm text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Skater Medal Counts & Points Summary ({filteredRanks.length} Skaters)
            </span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Live Sync Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Skater Name</th>
                  <th className="p-4">Reg Number</th>
                  <th className="p-4">District</th>
                  <th className="p-4">Club / Academy</th>
                  <th className="p-4">Discipline</th>
                  <th className="p-4 text-center">🥇 Gold</th>
                  <th className="p-4 text-center">🥈 Silver</th>
                  <th className="p-4 text-center">🥉 Bronze</th>
                  <th className="p-4 text-center">Total Medals</th>
                  <th className="p-4 text-right">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredRanks.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-500 italic">
                      No skaters or medal records found for selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredRanks.map(rank => {
                    const totalMedals = rank.goldMedals + rank.silverMedals + rank.bronzeMedals;
                    return (
                      <tr key={rank.skaterId} className="hover:bg-slate-800/60 transition">
                        <td className="p-4 font-bold">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                            rank.rank === 1 ? 'bg-amber-400 text-slate-950 shadow' :
                            rank.rank === 2 ? 'bg-slate-200 text-slate-950' :
                            rank.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'
                          }`}>
                            #{rank.rank}
                          </span>
                        </td>
                        <td className="p-4 font-black text-white text-sm">{rank.skaterName}</td>
                        <td className="p-4 font-mono text-slate-400 text-[11px]">{rank.registrationNumber}</td>
                        <td className="p-4 text-slate-200 font-semibold">{rank.districtName}</td>
                        <td className="p-4 text-slate-400">{rank.clubName}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-amber-300 rounded text-[11px] font-bold">
                            {rank.discipline || 'Speed Inline'}
                          </span>
                        </td>
                        <td className="p-4 text-center font-black text-amber-400 text-base">{rank.goldMedals}</td>
                        <td className="p-4 text-center font-black text-slate-200 text-base">{rank.silverMedals}</td>
                        <td className="p-4 text-center font-black text-amber-600 text-base">{rank.bronzeMedals}</td>
                        <td className="p-4 text-center font-black text-white text-base">
                          <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg">
                            {totalMedals}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-black text-emerald-400 text-right text-base">
                          {rank.totalPoints} Pts
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: DETAILED RACE RESULTS & TIMINGS */}
      {viewMode === 'detailed' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4">
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <span className="font-extrabold text-sm text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Official Individual Race Entries ({filteredResults.length} Entries)
            </span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Live Sync Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Position</th>
                  <th className="p-4">Bib #</th>
                  <th className="p-4">Skater Name</th>
                  <th className="p-4">Reg Number</th>
                  <th className="p-4">District</th>
                  <th className="p-4">Club / Academy</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Age Group</th>
                  <th className="p-4">Gender</th>
                  <th className="p-4">Timing</th>
                  <th className="p-4">Medal</th>
                  <th className="p-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-500 italic">
                      No race results found for selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map(res => (
                    <tr key={res.id} className="hover:bg-slate-800/60 transition">
                      <td className="p-4 font-bold">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                          res.position === 1 ? 'bg-amber-400 text-slate-950 shadow' :
                          res.position === 2 ? 'bg-slate-200 text-slate-950' :
                          res.position === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {res.position}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-amber-300">
                        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-xs">
                          #{res.bibNumber || '101'}
                        </span>
                      </td>
                      <td className="p-4 font-extrabold text-white text-sm">{res.skaterName}</td>
                      <td className="p-4 font-mono text-slate-400 text-[11px]">{res.registrationNumber}</td>
                      <td className="p-4 text-slate-300 font-semibold">{res.districtName}</td>
                      <td className="p-4 text-slate-400">{res.clubName}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-amber-300 rounded text-[11px] font-bold">
                          {res.discipline || 'Speed Inline'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 rounded text-[11px] font-medium">
                          {res.ageGroup || 'Sub-Junior'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          res.gender === 'Female' 
                            ? 'bg-pink-500/10 text-pink-300 border border-pink-500/30' 
                            : 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                        }`}>
                          {res.gender || 'Male'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-emerald-400 font-bold text-sm">{res.timing || res.finalTiming || '00:00.00'}</td>
                      <td className="p-4">
                        {res.medal === 'Gold' && <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black rounded text-[10px]">🥇 GOLD</span>}
                        {res.medal === 'Silver' && <span className="px-2 py-0.5 bg-slate-200 text-slate-950 font-black rounded text-[10px]">🥈 SILVER</span>}
                        {res.medal === 'Bronze' && <span className="px-2 py-0.5 bg-amber-700 text-white font-black rounded text-[10px]">🥉 BRONZE</span>}
                        {(!res.medal || res.medal === 'None') && <span className="text-slate-500">—</span>}
                      </td>
                      <td className="p-4 font-black text-amber-400 text-right text-sm">+{res.points}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

