import React, { useState, useEffect } from 'react';
import { dbStore } from '../../../lib/db';
import { Race, RaceParticipant, Skater, TournamentRegistration } from '../../../types';
import { Users, RefreshCw, Plus, Trash2, ArrowUp, ArrowDown, Hash, Shield, Printer, CheckCircle, Search } from 'lucide-react';

interface StartListManagerProps {
  initialRaceId?: string;
  onBackToRaces?: () => void;
}

export const StartListManager: React.FC<StartListManagerProps> = ({ initialRaceId, onBackToRaces }) => {
  const [races, setRaces] = useState<Race[]>(() => dbStore.getRaces());
  const [selectedRaceId, setSelectedRaceId] = useState<string>(initialRaceId || races[0]?.id || '');
  const [participants, setParticipants] = useState<RaceParticipant[]>([]);
  const [allSkaters, setAllSkaters] = useState<Skater[]>(() => dbStore.getSkaters());

  // Manual Add Skater state
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchSkater, setSearchSkater] = useState('');
  const [selectedSkaterId, setSelectedSkaterId] = useState('');
  const [manualBib, setManualBib] = useState('');

  useEffect(() => {
    const unsub = dbStore.subscribe(() => {
      setRaces(dbStore.getRaces());
      setAllSkaters(dbStore.getSkaters());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (selectedRaceId) {
      setParticipants(dbStore.getRaceParticipants(selectedRaceId));
    } else {
      setParticipants([]);
    }
  }, [selectedRaceId, races]);

  const activeRace = races.find(r => r.id === selectedRaceId);

  const handleGenerateFromRegistrations = () => {
    if (!activeRace) return;
    const generated = dbStore.generateStartListFromRegistrations(activeRace.tournamentId, activeRace.eventId, activeRace.id);
    setParticipants(generated);
  };

  const handleLaneChange = (participantId: string, newLane: number) => {
    dbStore.updateRaceParticipant(participantId, { laneNumber: newLane });
    setParticipants(dbStore.getRaceParticipants(selectedRaceId));
  };

  const handleBibChange = (participantId: string, newBib: string) => {
    dbStore.updateRaceParticipant(participantId, { bibNumber: newBib });
    setParticipants(dbStore.getRaceParticipants(selectedRaceId));
  };

  const handleRemove = (participantId: string) => {
    dbStore.removeRaceParticipant(participantId);
    setParticipants(dbStore.getRaceParticipants(selectedRaceId));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const ids = participants.map(p => p.id);
    const temp = ids[index];
    ids[index] = ids[index - 1];
    ids[index - 1] = temp;
    const updated = dbStore.reorderRaceParticipants(selectedRaceId, ids);
    setParticipants(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === participants.length - 1) return;
    const ids = participants.map(p => p.id);
    const temp = ids[index];
    ids[index] = ids[index + 1];
    ids[index + 1] = temp;
    const updated = dbStore.reorderRaceParticipants(selectedRaceId, ids);
    setParticipants(updated);
  };

  const handleAddManualSkater = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkaterId || !activeRace) return;
    const skater = allSkaters.find(s => s.id === selectedSkaterId);
    if (!skater) return;

    dbStore.addRaceParticipant({
      raceId: activeRace.id,
      tournamentId: activeRace.tournamentId,
      eventId: activeRace.eventId,
      skaterId: skater.id,
      skaterName: skater.fullName,
      registrationNumber: skater.registrationNumber,
      bibNumber: manualBib || String(101 + participants.length),
      gender: skater.gender,
      ageGroup: skater.ageGroup || activeRace.ageGroup,
      clubName: skater.clubName,
      districtName: skater.districtName,
      laneNumber: participants.length + 1,
      heatNumber: activeRace.heatNumber,
      status: 'VALID'
    });

    setParticipants(dbStore.getRaceParticipants(selectedRaceId));
    setShowAddModal(false);
    setSelectedSkaterId('');
    setManualBib('');
  };

  const handlePrintStartList = () => {
    window.print();
  };

  const filteredSkatersForAdd = allSkaters.filter(s => 
    ((s as any).fullName || (s as any).name || '').toLowerCase().includes(searchSkater.toLowerCase()) ||
    ((s as any).registrationNumber || '').toLowerCase().includes(searchSkater.toLowerCase()) ||
    ((s as any).districtName || '').toLowerCase().includes(searchSkater.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Race Selector & Control Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {onBackToRaces && (
            <button
              onClick={onBackToRaces}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              ← Back
            </button>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Select Active Race</label>
            <select
              value={selectedRaceId}
              onChange={(e) => setSelectedRaceId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500 min-w-64"
            >
              {races.map(r => (
                <option key={r.id} value={r.id}>
                  Race #{r.raceNumber} (Heat {r.heatNumber}) - {r.discipline} {r.distance} ({r.ageGroup})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeRace && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={handleGenerateFromRegistrations}
              className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Auto-Load Registrations
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Skater Manually
            </button>

            <button
              onClick={handlePrintStartList}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Start List
            </button>
          </div>
        )}
      </div>

      {activeRace && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
              RACE #{activeRace.raceNumber} • HEAT #{activeRace.heatNumber}
            </span>
            <span className="text-white font-extrabold">{activeRace.discipline} {activeRace.distance}</span>
            <span className="text-slate-400 font-medium">({activeRace.ageGroup} • {activeRace.gender})</span>
          </div>
          <div className="text-slate-400 font-medium">
            Max Lanes: <span className="text-white font-bold">{activeRace.maxParticipants}</span> | Assigned: <span className="text-amber-400 font-bold">{participants.length}</span>
          </div>
        </div>
      )}

      {/* Start List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <span className="font-extrabold text-sm text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Official Race Start List & Lane Assignments
          </span>
          <span className="text-xs text-slate-400">Total Skaters: {participants.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 text-center">Lane #</th>
                <th className="p-4 text-center">Bib #</th>
                <th className="p-4">Skater Name</th>
                <th className="p-4">Registration #</th>
                <th className="p-4">District</th>
                <th className="p-4">Club / Academy</th>
                <th className="p-4 text-center">Reorder</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {participants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 space-y-2">
                    <p className="font-semibold">No skaters assigned to this start list.</p>
                    <p className="text-[11px]">Click "Auto-Load Registrations" to pull approved skaters from event registrations, or "Add Skater Manually".</p>
                  </td>
                </tr>
              ) : (
                participants.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-4 text-center">
                      <input
                        type="number"
                        min={1}
                        value={p.laneNumber || (idx + 1)}
                        onChange={(e) => handleLaneChange(p.id, parseInt(e.target.value) || 1)}
                        className="w-12 text-center bg-slate-950 border border-slate-800 rounded-lg py-1 font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input
                        type="text"
                        value={p.bibNumber || ''}
                        onChange={(e) => handleBibChange(p.id, e.target.value)}
                        className="w-16 text-center bg-slate-950 border border-slate-800 rounded-lg py-1 font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                      />
                    </td>
                    <td className="p-4 font-extrabold text-white">{p.skaterName}</td>
                    <td className="p-4 font-mono text-slate-400">{p.registrationNumber}</td>
                    <td className="p-4 font-semibold text-slate-300">{p.districtName}</td>
                    <td className="p-4 text-slate-400">{p.clubName}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMoveUp(idx)}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded hover:bg-slate-800 transition cursor-pointer"
                          title="Move Lane Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === participants.length - 1}
                          onClick={() => handleMoveDown(idx)}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded hover:bg-slate-800 transition cursor-pointer"
                          title="Move Lane Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleRemove(p.id)}
                        className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-950/50 rounded transition cursor-pointer"
                        title="Remove from race"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Skater Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" /> Add Skater to Start List
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleAddManualSkater} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Search Skater</label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name, reg number, or district..."
                    value={searchSkater}
                    onChange={(e) => setSearchSkater(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <select
                  required
                  size={5}
                  value={selectedSkaterId}
                  onChange={(e) => setSelectedSkaterId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-amber-500 text-xs"
                >
                  {filteredSkatersForAdd.map(s => (
                    <option key={s.id} value={s.id} className="p-1.5 hover:bg-slate-800 rounded">
                      {s.fullName} ({s.registrationNumber}) • {s.districtName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Bib Number</label>
                <input
                  type="text"
                  value={manualBib}
                  onChange={(e) => setManualBib(e.target.value)}
                  placeholder={`Default: ${101 + participants.length}`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedSkaterId}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black px-6 py-2 rounded-xl uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  Assign to Race
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
