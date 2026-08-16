import React, { useState } from 'react';
import { dbStore } from '../../lib/db';
import { Tournament } from '../../types';
import { downloadElementAsPdf, exportToCsv, exportToExcel, printElement } from '../../lib/pdfGenerator';
import { Trophy, Download, Printer, FileText, Award, MapPin, Users, Calendar, Building2, Table } from 'lucide-react';

interface TournamentReportProps {
  tournamentId?: string;
}

export const TournamentReport: React.FC<TournamentReportProps> = ({ tournamentId: initialTourId }) => {
  const tournaments = dbStore.getTournaments();
  const [selectedTourId, setSelectedTourId] = useState<string>(initialTourId || tournaments[0]?.id || '');

  const activeTourId = selectedTourId || initialTourId || tournaments[0]?.id || '';
  const selectedTour = tournaments.find(t => t.id === activeTourId) || tournaments[0];

  if (!selectedTour) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
        No tournament selected or found.
      </div>
    );
  }

  // Fetch tournament specific data
  const events = dbStore.getEvents(selectedTour.id);
  const registrations = dbStore.getRegistrations(selectedTour.id);
  const results = dbStore.getResults(selectedTour.id);
  
  const individualRanks = dbStore.getIndividualRankings(selectedTour.id);
  const districtRanks = dbStore.getDistrictRankings(selectedTour.id);
  const clubRanks = dbStore.getClubRankings(selectedTour.id);

  // Compute District Participation Breakdown
  const districtParticipationMap: Record<string, number> = {};
  registrations.forEach(r => {
    districtParticipationMap[r.districtName] = (districtParticipationMap[r.districtName] || 0) + 1;
  });

  // Compute Club Participation Breakdown
  const clubParticipationMap: Record<string, { district: string; count: number }> = {};
  registrations.forEach(r => {
    if (!clubParticipationMap[r.clubName]) {
      clubParticipationMap[r.clubName] = { district: r.districtName, count: 0 };
    }
    clubParticipationMap[r.clubName].count += 1;
  });

  const totalSkatersCount = new Set(registrations.map(r => r.skaterId)).size;
  const totalRacesCount = new Set(results.map(r => r.raceId || r.eventId)).size || events.length;

  const handlePrint = () => {
    printElement('uprsa-championship-report');
  };

  const handleExportPdf = () => {
    downloadElementAsPdf('uprsa-championship-report', `UPRSA_Report_${selectedTour.tournamentNumber.replace(/[\/\\ ]/g, '_')}`);
  };

  const handleExportCsv = () => {
    exportToCsv(`UPRSA_Results_${selectedTour.tournamentNumber.replace(/[\/\\ ]/g, '_')}`, results);
  };

  const handleExportExcel = () => {
    exportToExcel(
      `UPRSA_FullReport_${selectedTour.tournamentNumber.replace(/[\/\\ ]/g, '_')}`,
      'Tournament Report',
      results
    );
  };

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" /> Official Tournament Report
          </h1>
          <p className="text-xs text-slate-400">Comprehensive championship report with rankings, medal tallies, and participation metrics.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!initialTourId && (
            <select
              value={selectedTourId}
              onChange={(e) => setSelectedTourId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {tournaments.map(tr => (
                <option key={tr.id} value={tr.id}>{tr.nameEn}</option>
              ))}
            </select>
          )}

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-sky-400" /> Print Report
          </button>

          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow"
          >
            <Download className="w-4 h-4" /> Save as PDF
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-emerald-400" /> Export CSV
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Table className="w-4 h-4 text-emerald-200" /> Export Excel
          </button>
        </div>
      </div>

      {/* Printable Report Container */}
      <div id="uprsa-championship-report" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl">
        
        {/* Report Official Banner */}
        <div className="text-center space-y-2 border-b border-slate-800 pb-6 relative">
          <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full font-mono text-xs font-bold mb-2">
            OFFICIAL TOURNAMENT REPORT • {selectedTour.tournamentNumber}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">{selectedTour.nameEn}</h2>
          {selectedTour.nameHi && <p className="text-sm font-hindi text-amber-300">{selectedTour.nameHi}</p>}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300 font-medium pt-2">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-400" /> Venue: {selectedTour.venue}</span>
            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-blue-400" /> Host District: {selectedTour.districtName}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-emerald-400" /> Dates: {selectedTour.startDate} to {selectedTour.endDate}</span>
          </div>
          <p className="text-[11px] text-slate-400">Organizer: {selectedTour.organizer}</p>
        </div>

        {/* Executive Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-2xl font-black text-amber-400">{totalSkatersCount}</span>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Skaters</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-2xl font-black text-blue-400">{events.length}</span>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Events</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-2xl font-black text-emerald-400">{totalRacesCount}</span>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Races</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-2xl font-black text-purple-400">{Object.keys(districtParticipationMap).length}</span>
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Districts Represented</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 text-center col-span-2 sm:col-span-1">
            <span className="text-2xl font-black text-amber-300">
              {dbStore.getCertificates().filter(c => c.tournamentId === selectedTour.id).length}
            </span>
            <span className="block text-[10px] text-amber-400 font-bold uppercase tracking-wider">Certificates Issued</span>
          </div>
        </div>

        {/* District & Club Participation Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
          
          {/* District Participation */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" /> District Participation Breakdown
            </h3>
            <div className="overflow-x-auto bg-slate-950 rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">District Unit</th>
                    <th className="p-3 text-right">Skater Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {Object.entries(districtParticipationMap).map(([dist, count]) => (
                    <tr key={dist}>
                      <td className="p-3 font-bold text-white">{dist}</td>
                      <td className="p-3 font-mono text-amber-400 font-bold text-right">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Club Participation */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" /> Club Participation Breakdown
            </h3>
            <div className="overflow-x-auto bg-slate-950 rounded-xl border border-slate-800 max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Club Name</th>
                    <th className="p-3">District</th>
                    <th className="p-3 text-right">Skaters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {Object.entries(clubParticipationMap).map(([club, item]) => (
                    <tr key={club}>
                      <td className="p-3 font-bold text-white">{club}</td>
                      <td className="p-3 text-slate-400 text-[11px]">{item.district}</td>
                      <td className="p-3 font-mono text-emerald-400 font-bold text-right">{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* District Medal Tally & Standings */}
        <div className="space-y-3 pt-6 border-t border-slate-800">
          <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> District Ranking & Medal Tally
          </h3>
          <div className="overflow-x-auto bg-slate-950 rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">District Name</th>
                  <th className="p-3">Gold 🥇</th>
                  <th className="p-3">Silver 🥈</th>
                  <th className="p-3">Bronze 🥉</th>
                  <th className="p-3 text-right">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {districtRanks.map(d => (
                  <tr key={d.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-amber-400">#{d.rank}</td>
                    <td className="p-3 font-extrabold text-white">{d.name}</td>
                    <td className="p-3 font-bold text-amber-400">{d.goldMedals}</td>
                    <td className="p-3 font-bold text-slate-300">{d.silverMedals}</td>
                    <td className="p-3 font-bold text-amber-700">{d.bronzeMedals}</td>
                    <td className="p-3 font-black text-amber-400 text-right">{d.totalPoints} Pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Club Rankings */}
        <div className="space-y-3 pt-6 border-t border-slate-800">
          <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" /> Club Standings & Points Table
          </h3>
          <div className="overflow-x-auto bg-slate-950 rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Club Name</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Gold 🥇</th>
                  <th className="p-3">Silver 🥈</th>
                  <th className="p-3">Bronze 🥉</th>
                  <th className="p-3 text-right">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {clubRanks.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-blue-400">#{c.rank}</td>
                    <td className="p-3 font-extrabold text-white">{c.name}</td>
                    <td className="p-3 text-slate-400">{c.districtName}</td>
                    <td className="p-3 font-bold text-amber-400">{c.goldMedals}</td>
                    <td className="p-3 font-bold text-slate-300">{c.silverMedals}</td>
                    <td className="p-3 font-bold text-amber-700">{c.bronzeMedals}</td>
                    <td className="p-3 font-black text-amber-400 text-right">{c.totalPoints} Pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Individual Skater Standings */}
        <div className="space-y-3 pt-6 border-t border-slate-800">
          <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" /> Individual Skater Rankings & Points Table
          </h3>
          <div className="overflow-x-auto bg-slate-950 rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Skater Name</th>
                  <th className="p-3">Reg Number</th>
                  <th className="p-3">District / Club</th>
                  <th className="p-3">Discipline</th>
                  <th className="p-3">Gold 🥇</th>
                  <th className="p-3">Silver 🥈</th>
                  <th className="p-3">Bronze 🥉</th>
                  <th className="p-3 text-right">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {individualRanks.map(ind => (
                  <tr key={ind.skaterId} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-emerald-400">#{ind.rank}</td>
                    <td className="p-3 font-extrabold text-white">{ind.skaterName}</td>
                    <td className="p-3 font-mono text-slate-400 text-[10px]">{ind.registrationNumber}</td>
                    <td className="p-3">
                      <span className="text-white block">{ind.districtName}</span>
                      <span className="text-slate-400 text-[10px]">{ind.clubName}</span>
                    </td>
                    <td className="p-3 text-amber-300">{ind.discipline}</td>
                    <td className="p-3 font-bold text-amber-400">{ind.goldMedals}</td>
                    <td className="p-3 font-bold text-slate-300">{ind.silverMedals}</td>
                    <td className="p-3 font-bold text-amber-700">{ind.bronzeMedals}</td>
                    <td className="p-3 font-black text-amber-400 text-right">+{ind.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Complete Event Race Results */}
        <div className="space-y-3 pt-6 border-t border-slate-800">
          <h3 className="font-extrabold text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" /> Complete Official Race Results
          </h3>
          <div className="overflow-x-auto bg-slate-950 rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Pos</th>
                  <th className="p-3">Bib #</th>
                  <th className="p-3">Skater Name</th>
                  <th className="p-3">District / Club</th>
                  <th className="p-3">Timing</th>
                  <th className="p-3">Medal</th>
                  <th className="p-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500 italic">No race results published yet for this championship.</td>
                  </tr>
                ) : (
                  results.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold">#{r.position}</td>
                      <td className="p-3 font-mono text-amber-300 font-bold">{r.bibNumber}</td>
                      <td className="p-3 font-extrabold text-white">{r.skaterName}</td>
                      <td className="p-3">
                        <span className="text-white block">{r.districtName}</span>
                        <span className="text-slate-400 text-[10px]">{r.clubName}</span>
                      </td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">{r.timing}</td>
                      <td className="p-3">{r.medal}</td>
                      <td className="p-3 font-black text-amber-400 text-right">+{r.points}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
