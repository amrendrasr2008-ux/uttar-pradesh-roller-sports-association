import React, { useState, useEffect } from 'react';
import { dbStore } from '../../../lib/db';
import { ALL_OFFICIAL_AGE_GROUPS } from '../../../lib/ageGroupRules';
import { Race, Tournament, TournamentEvent, RaceStatus, AgeGroup, Gender } from '../../../types';
import { Play, Flag, CheckCircle, Clock, Award, Shield, Filter, RefreshCw, Eye, ArrowRight, Lock, Unlock, FileText, CheckSquare, RotateCcw, Activity } from 'lucide-react';
import { RaceProgressionBracket } from './RaceProgressionBracket';
import { PrintableRaceSheet } from './PrintableRaceSheet';
import { QualificationTestRunnerModal } from './QualificationTestRunnerModal';

interface RaceControlDashboardProps {
  onSelectScoringRace: (raceId: string) => void;
  onSelectStartListRace: (raceId: string) => void;
}

export const RaceControlDashboard: React.FC<RaceControlDashboardProps> = ({
  onSelectScoringRace,
  onSelectStartListRace
}) => {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => dbStore.getTournaments());
  const [events, setEvents] = useState<TournamentEvent[]>(() => dbStore.getEvents());
  const [races, setRaces] = useState<Race[]>(() => dbStore.getRaces());

  const [selectedTourId, setSelectedTourId] = useState<string>(tournaments[0]?.id || 'tour-1');
  const [distanceFilter, setDistanceFilter] = useState<string>('ALL'); // 'ALL' | '500M' | '1000M'
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>('ALL');
  const [genderFilter, setGenderFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [activeSubTab, setActiveSubTab] = useState<'races' | 'bracket' | 'tests'>('races');
  const [printRace, setPrintRace] = useState<Race | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  useEffect(() => {
    const unsub = dbStore.subscribe(() => {
      setTournaments(dbStore.getTournaments());
      setEvents(dbStore.getEvents());
      setRaces(dbStore.getRaces());
    });
    return unsub;
  }, []);

  const tourEvents = events.filter(e => e.tournamentId === selectedTourId);

  // Filter logic
  const filteredRaces = races.filter(r => {
    if (r.tournamentId !== selectedTourId) return false;

    if (distanceFilter === '500M' && !(r.distance || '').toLowerCase().includes('500')) return false;
    if (distanceFilter === '1000M' && !(r.distance || '').toLowerCase().includes('1000')) return false;

    if (ageGroupFilter !== 'ALL' && r.ageGroup !== ageGroupFilter) return false;
    if (genderFilter !== 'ALL' && r.gender !== genderFilter) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

    return true;
  });

  const handleStatusChange = (raceId: string, newStatus: RaceStatus) => {
    dbStore.updateRace(raceId, { status: newStatus });
  };

  const handlePublish = (raceId: string) => {
    dbStore.publishRaceResults(raceId);
  };

  const handleReopen = (raceId: string) => {
    dbStore.reopenRaceResults(raceId);
  };

  const getStatusBadge = (status: RaceStatus) => {
    switch (status) {
      case 'NOT_STARTED':
      case 'Scheduled':
        return <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-slate-700"><Clock className="w-3 h-3 text-slate-400" /> NOT STARTED</span>;
      case 'READY':
      case 'Ready':
        return <span className="bg-amber-950/90 text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-amber-700"><Flag className="w-3 h-3 text-amber-400" /> READY</span>;
      case 'LIVE':
      case 'Live':
        return <span className="bg-red-950/90 text-red-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-red-700 animate-pulse"><Play className="w-3 h-3 text-red-500 fill-current" /> LIVE</span>;
      case 'FINISHED':
      case 'Finished':
        return <span className="bg-blue-950/80 text-blue-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-blue-800"><CheckCircle className="w-3 h-3 text-blue-400" /> FINISHED</span>;
      case 'RESULT_SUBMITTED':
        return <span className="bg-purple-950/80 text-purple-300 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-purple-800"><FileText className="w-3 h-3 text-purple-400" /> SUBMITTED</span>;
      case 'APPROVED':
        return <span className="bg-teal-950/80 text-teal-300 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-teal-800"><CheckSquare className="w-3 h-3 text-teal-400" /> APPROVED</span>;
      case 'PUBLISHED':
        return <span className="bg-emerald-950/90 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-emerald-700"><Award className="w-3 h-3 text-emerald-400" /> PUBLISHED</span>;
      case 'CANCELLED':
      case 'Cancelled':
        return <span className="bg-rose-950/80 text-rose-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-rose-800">CANCELLED</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controller Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
            <Activity className="w-4 h-4 text-amber-400" /> Central Race Control & Live Operations
          </div>
          <h2 className="text-2xl font-extrabold text-white">500M / 1000M Tournament Race Control</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('races')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'races' ? 'bg-amber-500 text-slate-950 font-black shadow-lg' : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            Today's Races
          </button>

          <button
            onClick={() => setActiveSubTab('bracket')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'bracket' ? 'bg-amber-500 text-slate-950 font-black shadow-lg' : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            Progression Flow Bracket
          </button>

          <button
            onClick={() => setShowTestModal(true)}
            className="px-4 py-2 bg-emerald-950/80 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" /> Qualification System Self-Test
          </button>
        </div>
      </div>

      {activeSubTab === 'bracket' ? (
        <RaceProgressionBracket tournamentId={selectedTourId} />
      ) : (
        <>
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tournament</label>
              <select
                value={selectedTourId}
                onChange={(e) => setSelectedTourId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.nameEn}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Distance Filter</label>
              <select
                value={distanceFilter}
                onChange={(e) => setDistanceFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Distances</option>
                <option value="500M">500M Only</option>
                <option value="1000M">1000M Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Age Group</label>
              <select
                value={ageGroupFilter}
                onChange={(e) => setAgeGroupFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Age Groups</option>
                {ALL_OFFICIAL_AGE_GROUPS.map(ag => (
                  <option key={ag} value={ag}>{ag}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Gender</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="NOT_STARTED">NOT STARTED</option>
                <option value="READY">READY</option>
                <option value="LIVE">LIVE</option>
                <option value="FINISHED">FINISHED</option>
                <option value="PUBLISHED">PUBLISHED</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setDistanceFilter('ALL');
                  setAgeGroupFilter('ALL');
                  setGenderFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Today's Races Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Flag className="w-5 h-5 text-amber-500" /> Today's Race Schedule ({filteredRaces.length})
              </h3>
            </div>

            {filteredRaces.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No races found matching selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Race #</th>
                      <th className="py-3 px-3">Discipline & Distance</th>
                      <th className="py-3 px-3">Age & Gender</th>
                      <th className="py-3 px-3">Heat #</th>
                      <th className="py-3 px-3">Participants</th>
                      <th className="py-3 px-3">Start Time</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Race Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredRaces.map((race) => {
                      const participants = dbStore.getRaceParticipants(race.id);
                      const isPublished = race.status === 'PUBLISHED' || race.status === 'Finished';

                      return (
                        <tr key={race.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-3 font-mono font-bold text-amber-400 text-sm">
                            {race.raceNumber}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-extrabold text-white block">{race.distance}</span>
                            <span className="text-[11px] text-slate-400">{race.discipline}</span>
                          </td>
                          <td className="py-3.5 px-3 font-medium">
                            <div>{race.ageGroup}</div>
                            <div className="text-slate-400 text-[11px]">{race.gender}</div>
                          </td>
                          <td className="py-3.5 px-3 font-bold text-white">
                            Heat {race.heatNumber}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-amber-300 font-mono font-bold">
                              {participants.length} Skaters
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-300">
                            {race.scheduledStartTime || '10:00 AM'}
                          </td>
                          <td className="py-3.5 px-3">
                            {getStatusBadge(race.status)}
                          </td>
                          <td className="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => onSelectStartListRace(race.id)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                              title="Start List / Heat Draw"
                            >
                              Start List
                            </button>

                            <button
                              onClick={() => onSelectScoringRace(race.id)}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition inline-flex items-center gap-1 cursor-pointer shadow-sm"
                              title="Live Operator Scoring"
                            >
                              <Play className="w-3 h-3 fill-current" /> Scoring
                            </button>

                            {!isPublished ? (
                              <button
                                onClick={() => handlePublish(race.id)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer shadow-sm"
                              >
                                <Award className="w-3 h-3" /> Publish
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReopen(race.id)}
                                className="px-2.5 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" /> Reopen
                              </button>
                            )}

                            <button
                              onClick={() => setPrintRace(race)}
                              className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs transition inline-flex items-center gap-1 cursor-pointer"
                              title="Print Start / Result Sheet"
                            >
                              <FileText className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Printable Sheet Modal */}
      {printRace && (
        <PrintableRaceSheet
          race={printRace}
          onClose={() => setPrintRace(null)}
        />
      )}

      {/* Qualification System Test Runner Modal */}
      {showTestModal && (
        <QualificationTestRunnerModal
          onClose={() => setShowTestModal(false)}
        />
      )}
    </div>
  );
};
