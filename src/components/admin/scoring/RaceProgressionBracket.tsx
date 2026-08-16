import React, { useState, useEffect } from 'react';
import { dbStore } from '../../../lib/db';
import { Race, RaceParticipant, RaceResult, TournamentEvent } from '../../../types';
import { ArrowRight, Trophy, Flag, Users, Award, ShieldCheck, Zap } from 'lucide-react';
import { generate1000mFinalAFromHeats, generate500mFinalAFromHeats } from '../../../lib/qualificationEngine';

interface RaceProgressionBracketProps {
  tournamentId: string;
}

export const RaceProgressionBracket: React.FC<RaceProgressionBracketProps> = ({ tournamentId }) => {
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [races, setRaces] = useState<Race[]>([]);
  const [activeStage, setActiveStage] = useState<'heats' | 'qualifiers' | 'semis' | 'final' | 'medals'>('heats');

  useEffect(() => {
    const evs = dbStore.getEvents(tournamentId).filter(e => 
      (e.distance || '').toLowerCase().includes('500') || (e.distance || '').toLowerCase().includes('1000')
    );
    setEvents(evs);
    if (evs.length > 0 && !selectedEventId) {
      setSelectedEventId(evs[0].id);
    }
  }, [tournamentId]);

  useEffect(() => {
    if (selectedEventId) {
      const eventRaces = dbStore.getRaces(tournamentId, selectedEventId);
      setRaces(eventRaces);
    } else {
      setRaces([]);
    }
  }, [selectedEventId, tournamentId]);

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const is1000m = selectedEvent?.distance ? selectedEvent.distance.toLowerCase().includes('1000') : false;

  // Build heat results map
  const heatResultsMap: Record<number, RaceResult[]> = {};
  races.forEach(r => {
    const res = dbStore.getRaceResults(r.id);
    if (res.length > 0) {
      heatResultsMap[r.heatNumber] = res;
    }
  });

  // Calculate qualification preview
  const finalASeeds = is1000m
    ? generate1000mFinalAFromHeats(heatResultsMap, 8)
    : generate500mFinalAFromHeats(heatResultsMap, 8, 1);

  // Final race results
  const finalRace = races.find(r => r.heatNumber === 99 || r.raceNumber.includes('FINAL') || r.heatNumber === Math.max(...races.map(x => x.heatNumber), 1));
  const finalResults = finalRace ? dbStore.getRaceResults(finalRace.id) : [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100">
      {/* Event Selection & Flow Navigation */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Select 500M / 1000M Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500 min-w-80"
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.discipline} - {ev.distance} ({ev.ageGroup} {ev.gender})
              </option>
            ))}
          </select>
        </div>

        {/* Visual Progression Pipeline Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveStage('heats')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeStage === 'heats' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5" /> 1. HEATS
          </button>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

          <button
            onClick={() => setActiveStage('qualifiers')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeStage === 'qualifiers' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> 2. QUALIFIERS
          </button>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

          <button
            onClick={() => setActiveStage('semis')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeStage === 'semis' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> 3. SEMI FINALS
          </button>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

          <button
            onClick={() => setActiveStage('final')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeStage === 'final' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> 4. FINAL A
          </button>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

          <button
            onClick={() => setActiveStage('medals')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeStage === 'medals' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> 5. MEDALS
          </button>
        </div>
      </div>

      {/* Stage Views */}
      {activeStage === 'heats' && (
        <div className="space-y-4">
          <h3 className="text-base font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Flag className="w-4 h-4" /> Preliminary Heats ({races.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {races.map(race => {
              const resList = heatResultsMap[race.heatNumber] || [];
              const parts = dbStore.getRaceParticipants(race.id);

              return (
                <div key={race.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-extrabold text-amber-400 text-sm">Heat #{race.heatNumber}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 rounded border border-slate-800 text-slate-400">{race.status}</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {parts.map(p => {
                      const res = resList.find(r => r.skaterId === p.skaterId);
                      return (
                        <div key={p.id} className="flex items-center justify-between bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="w-5 text-slate-500 font-mono text-[10px]">Box {p.laneNumber}</span>
                            <span className="font-bold text-white text-xs">{p.skaterName}</span>
                          </div>
                          <span className="font-mono font-bold text-amber-300">{res?.finalTiming || '00:00.00'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeStage === 'qualifiers' && (
        <div className="space-y-4">
          <h3 className="text-base font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4" /> Heat Qualification Winners & Time Qualifiers ({finalASeeds.length})
          </h3>

          <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Box #</th>
                  <th className="py-2 px-3">Skater</th>
                  <th className="py-2 px-3">BIB</th>
                  <th className="py-2 px-3">Club / District</th>
                  <th className="py-2 px-3">Qual Source</th>
                  <th className="py-2 px-3">Label</th>
                  <th className="py-2 px-3 text-right">Seed Timing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {finalASeeds.map((seed) => (
                  <tr key={seed.skaterId} className="hover:bg-slate-900/50">
                    <td className="py-2.5 px-3 font-bold text-amber-400">Box {seed.boxNumber}</td>
                    <td className="py-2.5 px-3 font-extrabold text-white">{seed.skaterName}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{seed.bibNumber}</td>
                    <td className="py-2.5 px-3 text-slate-400">{seed.clubName} ({seed.districtName})</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[10px] font-bold">
                        {seed.qualificationSource}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-300">{seed.qualificationLabel}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">{seed.seedTiming}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeStage === 'semis' && (
        <div className="space-y-4">
          <h3 className="text-base font-black text-amber-400 uppercase tracking-wider">Semi-Final Seeding</h3>
          <p className="text-xs text-slate-400">Serpentine allocation distributes the top qualifiers into balanced semi-final heats when required.</p>
        </div>
      )}

      {activeStage === 'final' && (
        <div className="space-y-4">
          <h3 className="text-base font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Final A Lineup (Max 8 Participants)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {finalASeeds.slice(0, 8).map(seed => (
              <div key={seed.skaterId} className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-2 relative shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    {seed.boxNumber}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold">
                    {seed.qualificationLabel}
                  </span>
                </div>
                <h4 className="font-extrabold text-white text-sm pt-1">{seed.skaterName}</h4>
                <div className="text-[11px] text-slate-400 font-mono">BIB #{seed.bibNumber}</div>
                <div className="text-[11px] text-slate-400">{seed.districtName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeStage === 'medals' && (
        <div className="space-y-4">
          <h3 className="text-base font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Medalists & Podium Results
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Gold */}
            <div className="bg-amber-950/40 border-2 border-amber-500 rounded-2xl p-5 text-center space-y-2">
              <Award className="w-10 h-10 text-amber-400 mx-auto" />
              <div className="text-amber-400 font-black text-xs uppercase">GOLD MEDAL - 1ST PLACE</div>
              <div className="text-xl font-black text-white">{finalResults[0]?.skaterName || 'TBD'}</div>
              <div className="font-mono text-amber-300 text-sm">{finalResults[0]?.finalTiming || '00:00.00'}</div>
            </div>

            {/* Silver */}
            <div className="bg-slate-950 border-2 border-slate-400 rounded-2xl p-5 text-center space-y-2">
              <Award className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-slate-300 font-black text-xs uppercase">SILVER MEDAL - 2ND PLACE</div>
              <div className="text-xl font-black text-white">{finalResults[1]?.skaterName || 'TBD'}</div>
              <div className="font-mono text-slate-300 text-sm">{finalResults[1]?.finalTiming || '00:00.00'}</div>
            </div>

            {/* Bronze */}
            <div className="bg-amber-950/20 border-2 border-amber-700 rounded-2xl p-5 text-center space-y-2">
              <Award className="w-10 h-10 text-amber-600 mx-auto" />
              <div className="text-amber-600 font-black text-xs uppercase">BRONZE MEDAL - 3RD PLACE</div>
              <div className="text-xl font-black text-white">{finalResults[2]?.skaterName || 'TBD'}</div>
              <div className="font-mono text-amber-600 text-sm">{finalResults[2]?.finalTiming || '00:00.00'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
