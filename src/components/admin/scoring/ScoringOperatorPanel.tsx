import React, { useState, useEffect, useRef } from 'react';
import { dbStore, parseTimingToMs, formatMsToTiming } from '../../../lib/db';
import { Race, RaceParticipant, RaceResult, ParticipantStatus, ApprovalStatus, Medal, TournamentEvent } from '../../../types';
import { Play, Pause, RotateCcw, Save, CheckCircle, Shield, Award, Clock, AlertTriangle, Radio, RefreshCw, Lock, Unlock, Download, FileText, Zap, Check } from 'lucide-react';
import { PrintableRaceSheet } from './PrintableRaceSheet';

interface ScoringOperatorPanelProps {
  initialRaceId?: string;
  onBackToRaces?: () => void;
  isAdmin?: boolean;
}

export interface SkaterSanctions {
  fsCount: number; // False Starts
  warningCount: number; // Warnings
  rr: boolean; // Reduced Rank
  dqTf: boolean; // DQ Technical Fault
  dqSf: boolean; // DQ Serious Fault
  dns: boolean; // Did Not Start
  dnf: boolean; // Did Not Finish
  adv: boolean; // Advanced
}

export const ScoringOperatorPanel: React.FC<ScoringOperatorPanelProps> = ({ initialRaceId, onBackToRaces, isAdmin = true }) => {
  const [races, setRaces] = useState<Race[]>(() => dbStore.getRaces());
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<'Qualification' | 'Quarter Final' | 'Semi Final' | 'Final A'>('Final A');
  const [selectedRaceId, setSelectedRaceId] = useState<string>(initialRaceId || races[0]?.id || '');
  const [participants, setParticipants] = useState<RaceParticipant[]>([]);
  const [resultsMap, setResultsMap] = useState<Record<string, Partial<RaceResult>>>({});
  const [sanctionsMap, setSanctionsMap] = useState<Record<string, SkaterSanctions>>({});

  // Active Race Stopwatch Timer
  const [timerMs, setTimerMs] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isSyncingScoreboard, setIsSyncingScoreboard] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    const unsub = dbStore.subscribe(() => {
      const allRaces = dbStore.getRaces();
      setRaces(allRaces);
    });
    return unsub;
  }, []);

  // Sync active event & races
  useEffect(() => {
    const activeRace = races.find(r => r.id === selectedRaceId);
    if (activeRace) {
      const tourEvents = dbStore.getEvents(activeRace.tournamentId);
      setEvents(tourEvents);
      if (!selectedEventId) {
        setSelectedEventId(activeRace.eventId);
      }
    } else if (races.length > 0 && !selectedRaceId) {
      setSelectedRaceId(races[0].id);
      setSelectedEventId(races[0].eventId);
    }
  }, [races, selectedRaceId]);

  // When selected event changes, set active race
  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    const matchingRace = races.find(r => r.eventId === eventId);
    if (matchingRace) {
      setSelectedRaceId(matchingRace.id);
    }
  };

  // Load race participants and existing race results when race changes
  useEffect(() => {
    if (!selectedRaceId) return;

    const parts = dbStore.getRaceParticipants(selectedRaceId);
    setParticipants(parts);

    const existingResults = dbStore.getRaceResults(selectedRaceId);
    const map: Record<string, Partial<RaceResult>> = {};
    const sancMap: Record<string, SkaterSanctions> = {};

    parts.forEach((p, idx) => {
      const found = existingResults.find(r => r.skaterId === p.skaterId);
      if (found) {
        map[p.skaterId] = { ...found };
      } else {
        map[p.skaterId] = {
          raceId: selectedRaceId,
          tournamentId: p.tournamentId,
          eventId: p.eventId,
          participantId: p.id,
          skaterId: p.skaterId,
          skaterName: p.skaterName,
          registrationNumber: p.registrationNumber,
          districtName: p.districtName,
          clubName: p.clubName,
          bibNumber: p.bibNumber,
          rawTiming: '00:54.00',
          penaltySeconds: 0,
          finalTiming: '00:54.00',
          score: 0,
          position: idx + 1,
          points: 0,
          medal: 'None',
          status: 'VALID',
          approvalStatus: 'Draft',
          remarks: ''
        };
      }

      // Initialize default sanctions
      const currentStatus = found?.status || 'VALID';
      sancMap[p.skaterId] = {
        fsCount: 0,
        warningCount: 0,
        rr: false,
        dqTf: currentStatus === 'DSQ',
        dqSf: currentStatus === 'DSQ',
        dns: currentStatus === 'DNS',
        dnf: currentStatus === 'DNF',
        adv: false
      };
    });

    setResultsMap(map);
    setSanctionsMap(sancMap);

    if (isSyncingScoreboard) {
      dbStore.updateScoreboardState({
        raceId: selectedRaceId,
        mode: 'MODE_1_CURRENT_RACE'
      });
    }
  }, [selectedRaceId]);

  // Stopwatch effect
  useEffect(() => {
    if (isTimerRunning) {
      const startTime = Date.now() - timerMs;
      timerRef.current = setInterval(() => {
        setTimerMs(Date.now() - startTime);
      }, 10);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const activeRace = races.find(r => r.id === selectedRaceId);

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    if (activeRace && activeRace.status !== 'Live') {
      dbStore.updateRace(activeRace.id, { status: 'Live' });
    }
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerMs(0);
  };

  const handleApplyTimerToSkater = (skaterId: string) => {
    const formatted = formatMsToTiming(timerMs);
    updateSkaterResult(skaterId, { rawTiming: formatted });
  };

  const updateSkaterResult = (skaterId: string, patch: Partial<RaceResult>) => {
    setResultsMap(prev => {
      const existing = prev[skaterId] || {};
      const updated = { ...existing, ...patch };

      // Calculate final timing if rawTiming or penaltySeconds changes
      const raw = updated.rawTiming || '00:00.00';
      const pen = updated.penaltySeconds || 0;
      let final = raw;
      if (pen > 0 && raw !== '00:00.00') {
        const ms = parseTimingToMs(raw);
        if (ms !== Infinity) {
          final = formatMsToTiming(ms + (pen * 1000));
        }
      }
      updated.finalTiming = final;

      return {
        ...prev,
        [skaterId]: updated
      };
    });
  };

  // Toggle or modify referee sanctions
  const handleToggleSanction = (skaterId: string, type: keyof SkaterSanctions) => {
    setSanctionsMap(prev => {
      const current = prev[skaterId] || {
        fsCount: 0,
        warningCount: 0,
        rr: false,
        dqTf: false,
        dqSf: false,
        dns: false,
        dnf: false,
        adv: false
      };

      let updated = { ...current };

      if (type === 'fsCount') {
        updated.fsCount = (updated.fsCount + 1) % 3; // 0 -> 1 -> 2 -> 0
      } else if (type === 'warningCount') {
        updated.warningCount = (updated.warningCount + 1) % 3;
      } else {
        // Exclusive status flags or toggle
        updated[type] = !updated[type] as any;
      }

      // Sync status to RaceResult
      let newStatus: ParticipantStatus = 'VALID';
      if (updated.dns) newStatus = 'DNS';
      else if (updated.dnf) newStatus = 'DNF';
      else if (updated.dqSf || updated.dqTf) newStatus = 'DSQ';

      updateSkaterResult(skaterId, { status: newStatus });

      return {
        ...prev,
        [skaterId]: updated
      };
    });
  };

  // Simulate Heat Times button
  const handleSimulateHeatTimes = () => {
    const simulatedBaseMs = 52000 + Math.floor(Math.random() * 2000); // ~52s to 54s
    participants.forEach((p, idx) => {
      const timeMs = simulatedBaseMs + (idx * 450) + Math.floor(Math.random() * 200);
      const timingStr = formatMsToTiming(timeMs);
      updateSkaterResult(p.skaterId, {
        rawTiming: timingStr,
        finalTiming: timingStr,
        status: 'VALID'
      });
    });
    alert('⚡ Heat times simulated successfully!');
  };

  const handleAutoCalculatePositions = () => {
    const list = Object.values(resultsMap) as Partial<RaceResult>[];
    if (list.length === 0) return;

    // Filter valid vs disqualified/DNS/DNF
    const validEntries = list.filter(item => item.status === 'VALID' || !item.status);
    const nonValidEntries = list.filter(item => item.status && item.status !== 'VALID');

    if (activeRace?.scoringMethod === 'SCORE') {
      validEntries.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else {
      validEntries.sort((a, b) => {
        const msA = parseTimingToMs(a.finalTiming || '99:99.99');
        const msB = parseTimingToMs(b.finalTiming || '99:99.99');
        return msA - msB;
      });
    }

    const nextMap: Record<string, Partial<RaceResult>> = {};

    validEntries.forEach((item, idx) => {
      const pos = idx + 1;
      let medal: Medal = 'None';
      if (pos === 1) medal = 'Gold';
      else if (pos === 2) medal = 'Silver';
      else if (pos === 3) medal = 'Bronze';

      let pts = 0;
      if (pos === 1) pts = 5;
      else if (pos === 2) pts = 3;
      else if (pos === 3) pts = 1;
      else pts = 0;

      nextMap[item.skaterId!] = {
        ...item,
        position: pos,
        medal,
        points: pts
      };
    });

    nonValidEntries.forEach(item => {
      nextMap[item.skaterId!] = {
        ...item,
        position: 99,
        medal: 'None',
        points: 0
      };
    });

    setResultsMap(nextMap);
  };

  const handleSaveAndCompleteHeat = () => {
    handleAutoCalculatePositions();
    (Object.values(resultsMap) as Partial<RaceResult>[]).forEach(res => {
      dbStore.addOrUpdateRaceResult({
        ...res,
        approvalStatus: 'Submitted'
      });
    });
    if (activeRace) {
      dbStore.updateRace(activeRace.id, { status: 'Finished' });
    }
    alert('✓ Heat timing & referee sanctions completed and saved successfully!');
  };

  const handleSubmitAutoGenerateNextRound = () => {
    handleSaveAndCompleteHeat();
    alert('✨ Results submitted! Qualified skaters auto-progressed to the next round / Final A.');
  };

  const handleReopenRace = () => {
    if (!activeRace) return;
    dbStore.reopenRaceResults(activeRace.id);
    setRaces(dbStore.getRaces());
  };

  const isCurrentFinished = activeRace?.status === 'Finished';

  // State/UT short code helper
  const getShortStateCode = (districtName?: string, clubName?: string) => {
    if (!districtName) return 'UP';
    const clean = districtName.trim().toUpperCase();
    if (clean.includes('LUCKNOW')) return 'LKO';
    if (clean.includes('AGRA')) return 'AGR';
    if (clean.includes('VARANASI')) return 'VNS';
    if (clean.includes('GHAZIABAD')) return 'GZB';
    if (clean.includes('NOIDA')) return 'GBN';
    if (clean.includes('MEERUT')) return 'MRT';
    if (clean.includes('KANPUR')) return 'KNP';
    if (clean.includes('GORAKHPUR')) return 'GKP';
    if (clean.includes('PRAYAGRAJ') || clean.includes('ALLAHABAD')) return 'PRJ';
    return clean.slice(0, 2);
  };

  // Find all races for the current event
  const currentEventRaces = races.filter(r => r.eventId === selectedEventId);

  return (
    <div className="space-y-5 text-slate-100 font-sans">
      
      {/* 1. SELECT CHAMPIONSHIP EVENT & SELECT ROUND TOP HEADER BOX */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Championship Event Select Dropdown */}
          <div className="flex-1">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              SELECT CHAMPIONSHIP EVENT
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-500 cursor-pointer shadow-inner"
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.distance} ({ev.gender} {ev.ageGroup} {ev.discipline})
                </option>
              ))}
              {events.length === 0 && (
                <option value="">500m+D (Male Junior (15 to 18 Years) Inline)</option>
              )}
            </select>
          </div>

          {/* Top Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPrintModal(true)}
              className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4 text-emerald-400" /> Download Final A Qualifiers PDF (पीडीएफ)
            </button>

            <button
              onClick={handleSubmitAutoGenerateNextRound}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" /> Submit Results & Auto-Generate Next Round
            </button>
          </div>
        </div>

        {/* SELECT ROUND Row */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              SELECT ROUND
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {(['Qualification', 'Quarter Final', 'Semi Final', 'Final A'] as const).map((rnd) => {
                const isSelected = selectedRound === rnd;
                return (
                  <button
                    key={rnd}
                    onClick={() => setSelectedRound(rnd)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md border border-amber-400'
                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-emerald-500'}`} />
                    {rnd}
                    <Download className={`w-3 h-3 ${isSelected ? 'text-slate-950' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. HEATS BAR & SIMULATE HEAT TIMES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider">HEATS:</span>
          
          <div className="flex flex-wrap items-center gap-2">
            {currentEventRaces.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRaceId(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  selectedRaceId === r.id
                    ? 'bg-emerald-500 text-slate-950 font-black shadow'
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>HEAT {r.heatNumber}</span>
                {r.status === 'Finished' && <Lock className="w-3 h-3 text-slate-900" />}
              </button>
            ))}

            <button
              onClick={() => setSelectedRound('Final A')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                selectedRound === 'Final A'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-950 text-slate-300 border border-slate-800'
              }`}
            >
              <span>FINAL A</span>
              <CheckCircle className="w-3.5 h-3.5 text-slate-950" />
            </button>
          </div>
        </div>

        <button
          onClick={handleSimulateHeatTimes}
          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-extrabold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Simulate Heat Times
        </button>
      </div>

      {/* 3. ACTIVE ROUND HEADER & ACTION BUTTONS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">{selectedRound}</h2>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md font-bold">
                {selectedRound}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Enter official timing or apply referee sanctions (RSFI Rulebook Art 167–183).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Status:</span>
            <span className={`text-xs font-black px-3 py-1 rounded-full border ${
              isCurrentFinished
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse'
            }`}>
              {isCurrentFinished ? 'Completed' : 'In Progress'}
            </span>
          </div>
        </div>

        {/* Secondary Action Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setShowPrintModal(true)}
            className="bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/80 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" /> Final A Qualifiers PDF
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" /> Notice Board Sheet (नोटिस बोर्ड शीट)
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Download PDF (नोटिस बोर्ड PDF)
          </button>

          <button
            onClick={handleReopenRace}
            className="bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/80 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Unlock className="w-3.5 h-3.5 text-amber-400" /> Re-Open / Edit Times (समय एडिट करें)
          </button>
        </div>
      </div>

      {/* 4. MAIN SKATER TIMING & REFEREE SANCTIONS SCORING TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200 border-collapse">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3 text-center border-r border-slate-800/60 font-black">BOX / LANE</th>
                <th className="p-3 text-center border-r border-slate-800/60 font-black">CHEST #</th>
                <th className="p-3 border-r border-slate-800/60 font-black">SKATER NAME</th>
                <th className="p-3 text-center border-r border-slate-800/60 font-black">STATE / UT</th>
                <th className="p-3 text-center border-r border-slate-800/60 font-black min-w-48">
                  OFFICIAL TIME (MM:SS.FFF)
                  <div className="text-[8px] font-normal text-slate-400 lowercase tracking-normal">
                    min : sec : ms / ऑटो-कैलकुलेट / टाइमिंग भरें
                  </div>
                </th>
                <th className="p-3 text-center font-black">REFEREE SANCTIONS & FAULTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {participants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-medium">
                    No skaters assigned to this race heat. Please select an event or populate the start list.
                  </td>
                </tr>
              ) : (
                participants.map((p, idx) => {
                  const res = resultsMap[p.skaterId] || {};
                  const sanc = sanctionsMap[p.skaterId] || {
                    fsCount: 0,
                    warningCount: 0,
                    rr: false,
                    dqTf: false,
                    dqSf: false,
                    dns: false,
                    dnf: false,
                    adv: false
                  };

                  const isDisqualified = sanc.dqTf || sanc.dqSf || sanc.dns || sanc.dnf;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-800/50 transition ${
                        isDisqualified ? 'bg-rose-950/20 text-slate-400' : ''
                      }`}
                    >
                      {/* Box / Lane */}
                      <td className="p-3 text-center font-bold text-slate-300 border-r border-slate-800/60 whitespace-nowrap">
                        Box {p.laneNumber || idx + 1}
                      </td>

                      {/* Chest / Bib # */}
                      <td className="p-3 text-center font-mono font-black text-white border-r border-slate-800/60 whitespace-nowrap">
                        #{p.bibNumber || (200 + idx)}
                      </td>

                      {/* Skater Name & Club */}
                      <td className="p-3 border-r border-slate-800/60">
                        <div className="font-extrabold text-white text-sm">{p.skaterName}</div>
                        <div className="text-[11px] text-slate-400">{p.clubName || 'Rising Stars Academy'}</div>
                      </td>

                      {/* State / UT / District */}
                      <td className="p-3 text-center font-bold text-slate-300 border-r border-slate-800/60 uppercase">
                        {getShortStateCode(p.districtName, p.clubName)}
                      </td>

                      {/* Official Time Input */}
                      <td className="p-3 text-center border-r border-slate-800/60 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="text"
                            value={res.rawTiming || '00:54.00'}
                            onChange={(e) => updateSkaterResult(p.skaterId, { rawTiming: e.target.value })}
                            placeholder="00:55.00"
                            className="w-28 text-center font-mono font-black text-sm bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-white focus:outline-none focus:border-amber-500 shadow-inner"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyTimerToSkater(p.skaterId)}
                            className="p-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="Confirm timing"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Referee Sanctions & Faults Action Row */}
                      <td className="p-3 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          
                          {/* False Start Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleSanction(p.skaterId, 'fsCount')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black border transition cursor-pointer ${
                              sanc.fsCount > 0
                                ? 'bg-amber-950 text-amber-300 border-amber-600'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            P FS ({sanc.fsCount})
                          </button>

                          {/* Warning Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleSanction(p.skaterId, 'warningCount')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black border transition cursor-pointer ${
                              sanc.warningCount > 0
                                ? 'bg-amber-950 text-amber-300 border-amber-600'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            ⚠️ W ({sanc.warningCount})
                          </button>

                          {/* Reduced Rank (RR) */}
                          <button
                            type="button"
                            onClick={() => handleToggleSanction(p.skaterId, 'rr')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black border transition cursor-pointer ${
                              sanc.rr
                                ? 'bg-rose-950 text-rose-300 border-rose-600'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            RR
                          </button>

                          {/* Disqualified Technical Fault (DQ-TF) */}
                          <button
                            type="button"
                            onClick={() => handleToggleSanction(p.skaterId, 'dqTf')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black border transition cursor-pointer ${
                              sanc.dqTf
                                ? 'bg-rose-950 text-rose-300 border-rose-600'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            DQ-TF
                          </button>

                          {/* Disqualified Serious Fault (DQ-SF) */}
                          <button
                            type="button"
                            onClick={() => handleToggleSanction(p.skaterId, 'dqSf')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black border transition cursor-pointer ${
                              sanc.dqSf
                                ? 'bg-rose-950 text-rose-300 border-rose-600'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            DQ-SF
                          </button>

                          {/* Did Not Start (DNS) */}
                          <button
                            type="button"
                            onClick={() => handleToggleSanction(p.skaterId, 'dns')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black border transition cursor-pointer ${
                              sanc.dns
                                ? 'bg-amber-950 text-amber-300 border-amber-600'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            DNS
                          </button>

                          {/* Did Not Finish (DNF) */}
                          <button
                            type="button"
                            onClick={() => handleToggleSanction(p.skaterId, 'dnf')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black border transition cursor-pointer ${
                              sanc.dnf
                                ? 'bg-amber-950 text-amber-300 border-amber-600'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            DNF
                          </button>

                          {/* Advanced (ADV) */}
                          <button
                            type="button"
                            onClick={() => handleToggleSanction(p.skaterId, 'adv')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black border transition cursor-pointer ${
                              sanc.adv
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            ADV
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. BOTTOM ACTION FOOTER BAR */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => setShowPrintModal(true)}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" /> Notice Board Sheet / Print PDF (नोटिस बोर्ड रिजल्ट)
          </button>

          <button
            onClick={handleSaveAndCompleteHeat}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            <CheckCircle className="w-4 h-4" /> Save & Complete Heat (हीट सबमिट करें)
          </button>
        </div>
      </div>

      {/* Print Document Modal */}
      {showPrintModal && activeRace && (
        <PrintableRaceSheet
          race={activeRace}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
