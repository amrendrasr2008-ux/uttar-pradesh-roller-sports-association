import React, { useState, useEffect } from 'react';
import { dbStore } from '../../../lib/db';
import { Race, Tournament, TournamentEvent, RaceStatus, ScoringMethod, SkatingDiscipline, AgeGroup, Gender } from '../../../types';
import { Plus, Edit2, Trash2, Play, Users, Award, Clock, CheckCircle, Flag, Calendar, Hash } from 'lucide-react';

interface RaceManagerProps {
  onSelectScoringRace?: (raceId: string) => void;
  onSelectStartListRace?: (raceId: string) => void;
}

export const RaceManager: React.FC<RaceManagerProps> = ({ onSelectScoringRace, onSelectStartListRace }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => dbStore.getTournaments());
  const [events, setEvents] = useState<TournamentEvent[]>(() => dbStore.getEvents());
  const [races, setRaces] = useState<Race[]>(() => dbStore.getRaces());

  const [selectedTourId, setSelectedTourId] = useState<string>(tournaments[0]?.id || 'tour-1');
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');

  const [showModal, setShowModal] = useState(false);
  const [editingRace, setEditingRace] = useState<Race | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    tournamentId: selectedTourId,
    eventId: '',
    raceNumber: '',
    heatNumber: 1,
    discipline: 'Speed Inline' as SkatingDiscipline,
    ageGroup: 'Sub-Junior (12-15 Years)' as AgeGroup,
    gender: 'Male' as Gender,
    distance: '500m Rink',
    maxParticipants: 8,
    scheduledStartTime: '10:00 AM',
    status: 'Scheduled' as RaceStatus,
    scoringMethod: 'TIMING' as ScoringMethod
  });

  useEffect(() => {
    const unsub = dbStore.subscribe(() => {
      setTournaments(dbStore.getTournaments());
      setEvents(dbStore.getEvents());
      setRaces(dbStore.getRaces());
    });
    return unsub;
  }, []);

  const tourEvents = events.filter(e => e.tournamentId === selectedTourId);
  const filteredRaces = races.filter(r => {
    const matchTour = r.tournamentId === selectedTourId;
    const matchEv = selectedEventId === 'ALL' || r.eventId === selectedEventId;
    return matchTour && matchEv;
  });

  const handleOpenAdd = () => {
    setEditingRace(null);
    const firstEv = tourEvents[0];
    setFormData({
      tournamentId: selectedTourId,
      eventId: firstEv?.id || '',
      raceNumber: `R-${races.length + 101}`,
      heatNumber: 1,
      discipline: firstEv?.discipline || 'Speed Inline',
      ageGroup: firstEv?.ageGroup || 'Sub-Junior (12-15 Years)',
      gender: firstEv?.gender || 'Male',
      distance: firstEv?.distance || '500m Rink',
      maxParticipants: firstEv?.maxParticipants || 8,
      scheduledStartTime: '10:00 AM',
      status: 'Scheduled',
      scoringMethod: 'TIMING'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (race: Race) => {
    setEditingRace(race);
    setFormData({
      tournamentId: race.tournamentId,
      eventId: race.eventId,
      raceNumber: race.raceNumber,
      heatNumber: race.heatNumber,
      discipline: race.discipline,
      ageGroup: race.ageGroup,
      gender: race.gender,
      distance: race.distance,
      maxParticipants: race.maxParticipants,
      scheduledStartTime: race.scheduledStartTime,
      status: race.status,
      scoringMethod: race.scoringMethod
    });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventId) {
      alert('Please select an event for this race');
      return;
    }

    if (editingRace) {
      dbStore.updateRace(editingRace.id, formData);
    } else {
      dbStore.addRace(formData);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    dbStore.deleteRace(id);
  };

  const handleStatusChange = (raceId: string, newStatus: RaceStatus) => {
    dbStore.updateRace(raceId, { status: newStatus });
  };

  const getStatusBadge = (status: RaceStatus) => {
    switch (status) {
      case 'Scheduled':
        return <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-slate-700"><Clock className="w-3 h-3 text-slate-400" /> Scheduled</span>;
      case 'Ready':
        return <span className="bg-amber-950/80 text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-amber-800"><Flag className="w-3 h-3 text-amber-400" /> Ready</span>;
      case 'Live':
        return <span className="bg-red-950/90 text-red-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-red-700 animate-pulse"><Play className="w-3 h-3 text-red-500 fill-current" /> Live Now</span>;
      case 'Finished':
        return <span className="bg-emerald-950/80 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-emerald-800"><CheckCircle className="w-3 h-3 text-emerald-400" /> Finished</span>;
      case 'Cancelled':
        return <span className="bg-rose-950/80 text-rose-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-rose-800">Cancelled</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tournament</label>
            <select
              value={selectedTourId}
              onChange={(e) => {
                setSelectedTourId(e.target.value);
                setSelectedEventId('ALL');
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.nameEn}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Event Filter</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 min-w-48"
            >
              <option value="ALL">All Events ({tourEvents.length})</option>
              {tourEvents.map(e => (
                <option key={e.id} value={e.id}>{e.discipline} - {e.distance} ({e.ageGroup})</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Race / Heat
        </button>
      </div>

      {/* Race Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRaces.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <Flag className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Races Created Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Create races or heats for tournament events to generate start lists, assign bib numbers, and enter official timing scores.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold px-4 py-2 rounded-xl text-xs border border-amber-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add First Race
            </button>
          </div>
        ) : (
          filteredRaces.map((race) => {
            const participants = dbStore.getRaceParticipants(race.id);
            const results = dbStore.getRaceResults(race.id);
            const isPublished = results.some(r => r.approvalStatus === 'Published');

            return (
              <div
                key={race.id}
                className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition flex flex-col justify-between ${
                  race.status === 'Live' ? 'border-red-500/50 shadow-lg shadow-red-500/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Race #{race.raceNumber} • Heat #{race.heatNumber}
                    </span>
                    {getStatusBadge(race.status)}
                  </div>

                  {/* Title & Category */}
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{race.discipline} - {race.distance}</h3>
                    <p className="text-xs text-slate-400 font-medium">{race.ageGroup} • {race.gender}</p>
                  </div>

                  {/* Details Badge list */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>{participants.length} / {race.maxParticipants} Skaters</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{race.scheduledStartTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>{race.scoringMethod === 'TIMING' ? 'Timing (MM:SS.ms)' : 'Points / Score'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className={`w-3.5 h-3.5 ${isPublished ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className={isPublished ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {isPublished ? 'Official Published' : 'Draft / Unofficial'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Switcher & Actions */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">Change Status:</span>
                    <select
                      value={race.status}
                      onChange={(e) => handleStatusChange(race.id, e.target.value as RaceStatus)}
                      className="bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded-lg px-2 py-1 font-bold focus:outline-none focus:border-amber-500"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Ready">Ready</option>
                      <option value="Live">Live</option>
                      <option value="Finished">Finished</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {onSelectStartListRace && (
                      <button
                        onClick={() => onSelectStartListRace(race.id)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-blue-400" /> Start List ({participants.length})
                      </button>
                    )}

                    {onSelectScoringRace && (
                      <button
                        onClick={() => onSelectScoringRace(race.id)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Open Operator
                      </button>
                    )}
                  </div>

                  {/* Edit / Delete Footer */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleOpenEdit(race)}
                      className="text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1 p-1 hover:bg-slate-800 rounded transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(race.id)}
                      className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1 p-1 hover:bg-rose-950/50 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Create/Edit Race */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Flag className="w-5 h-5 text-amber-400" />
                {editingRace ? 'Edit Race / Heat' : 'Create New Race / Heat'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Event</label>
                <select
                  value={formData.eventId}
                  onChange={(e) => {
                    const ev = tourEvents.find(x => x.id === e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      eventId: e.target.value,
                      discipline: ev?.discipline || prev.discipline,
                      ageGroup: ev?.ageGroup || prev.ageGroup,
                      gender: ev?.gender || prev.gender,
                      distance: ev?.distance || prev.distance,
                      maxParticipants: ev?.maxParticipants || prev.maxParticipants
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  {tourEvents.map(e => (
                    <option key={e.id} value={e.id}>{e.discipline} - {e.distance} ({e.ageGroup} {e.gender})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Race Number</label>
                  <input
                    type="text"
                    required
                    value={formData.raceNumber}
                    onChange={(e) => setFormData({ ...formData, raceNumber: e.target.value })}
                    placeholder="e.g. R-101"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Heat Number</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.heatNumber}
                    onChange={(e) => setFormData({ ...formData, heatNumber: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Scoring Method</label>
                  <select
                    value={formData.scoringMethod}
                    onChange={(e) => setFormData({ ...formData, scoringMethod: e.target.value as ScoringMethod })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="TIMING">Timing (MM:SS.ms)</option>
                    <option value="SCORE">Score / Points</option>
                    <option value="MANUAL">Manual Position</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Scheduled Start Time</label>
                  <input
                    type="text"
                    value={formData.scheduledStartTime}
                    onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
                    placeholder="e.g. 10:30 AM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Max Participants / Lanes</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 8 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as RaceStatus })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Ready">Ready</option>
                    <option value="Live">Live</option>
                    <option value="Finished">Finished</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  {editingRace ? 'Update Race' : 'Create Race'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
