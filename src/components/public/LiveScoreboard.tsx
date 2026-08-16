import React, { useState, useEffect, useRef } from 'react';
import { dbStore, formatMsToTiming } from '../../lib/db';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { ScoreboardState, ScoreboardDisplayMode, Race, RaceParticipant, RaceResult, IndividualRank, EntityRank } from '../../types';
import { Radio, Maximize2, Minimize2, Trophy, Award, Clock, MapPin, Building2, Flame, RefreshCw, CheckCircle2, Play, Pause, Repeat, Megaphone, Wifi, WifiOff } from 'lucide-react';

export const LiveScoreboard: React.FC = () => {
  const [scoreboardState, setScoreboardState] = useState<ScoreboardState>(() => dbStore.getScoreboardState());
  const [races, setRaces] = useState<Race[]>(() => dbStore.getRaces());
  const [participants, setParticipants] = useState<RaceParticipant[]>([]);
  const [raceResults, setRaceResults] = useState<RaceResult[]>([]);
  const [individualRanks, setIndividualRanks] = useState<IndividualRank[]>([]);
  const [clubRanks, setClubRanks] = useState<EntityRank[]>([]);
  const [districtRanks, setDistrictRanks] = useState<EntityRank[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'reconnecting' | 'offline'>('connected');

  // Auto Rotation state
  const [isAutoRotatePaused, setIsAutoRotatePaused] = useState(false);
  const [countdown, setCountdown] = useState<number>(10);
  const timerRef = useRef<any>(null);

  // Supabase Realtime Subscription with Graceful Reconnection
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setRealtimeStatus('offline');
      return;
    }

    let channel: any = null;
    try {
      channel = supabase
        .channel('uprsa_scoreboard_live_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'scoreboard_state' },
          (payload: any) => {
            if (payload?.new) {
              setScoreboardState(prev => ({ ...prev, ...payload.new }));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'race_results' },
          () => {
            if (scoreboardState.raceId) {
              setRaceResults(dbStore.getRaceResults(scoreboardState.raceId));
            }
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            setRealtimeStatus('connected');
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setRealtimeStatus('reconnecting');
          }
        });
    } catch (err) {
      setRealtimeStatus('offline');
    }

    return () => {
      if (channel && supabase) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [scoreboardState.raceId]);

  useEffect(() => {
    const unsub = dbStore.subscribe(() => {
      const state = dbStore.getScoreboardState();
      setScoreboardState(state);
      setRaces(dbStore.getRaces());
      setIndividualRanks(dbStore.getIndividualRankings());
      setClubRanks(dbStore.getClubRankings());
      setDistrictRanks(dbStore.getDistrictRankings());

      if (state.raceId) {
        setParticipants(dbStore.getRaceParticipants(state.raceId));
        setRaceResults(dbStore.getRaceResults(state.raceId));
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (scoreboardState.raceId) {
      setParticipants(dbStore.getRaceParticipants(scoreboardState.raceId));
      setRaceResults(dbStore.getRaceResults(scoreboardState.raceId));
    }
  }, [scoreboardState.raceId]);

  // Continuous Auto-Rotation Loop Effect ("हमेशा चलता रहे")
  useEffect(() => {
    if (!scoreboardState.autoRotate || isAutoRotatePaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalSecs = scoreboardState.autoRotateIntervalSeconds || 10;
    setCountdown(intervalSecs);

    const rotationList: ScoreboardDisplayMode[] = (scoreboardState.rotationModes && scoreboardState.rotationModes.length > 0)
      ? scoreboardState.rotationModes
      : [
          'MODE_1_CURRENT_RACE',
          'MODE_2_EVENT_RESULTS',
          'MODE_3_MEDAL_TALLY',
          'MODE_4_CLUB_RANKING',
          'MODE_5_DISTRICT_RANKING',
          'MODE_6_STATE_RANKING',
          'MODE_7_TOURNAMENT_HIGHLIGHTS'
        ];

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Switch to next mode
          setScoreboardState((currState) => {
            const currentIndex = rotationList.indexOf(currState.mode);
            const nextIndex = (currentIndex + 1) % rotationList.length;
            const nextMode = rotationList[nextIndex];
            return {
              ...currState,
              mode: nextMode
            };
          });
          return intervalSecs;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [scoreboardState.autoRotate, scoreboardState.autoRotateIntervalSeconds, scoreboardState.rotationModes, isAutoRotatePaused]);

  const activeRace = races.find(r => r.id === scoreboardState.raceId) || races[0];
  const tournaments = dbStore.getTournaments();
  const activeTournament = tournaments.find(t => t.id === scoreboardState.tournamentId) || tournaments[0];

  const displayTitle = scoreboardState.customTitle || activeTournament?.nameEn || 'UTTAR PRADESH ROLLER SPORTS ASSOCIATION';
  const displaySubtitle = scoreboardState.customSubtitle || 'Official Real-Time Stadium LED Scoreboard';
  const displayTicker = scoreboardState.tickerText || 'WELCOME TO UPRSA STATE CHAMPIONSHIP • LIVE SCORING IN PROGRESS • ALL ATHLETES REPORT TO CALL ROOM';

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.log(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const intervalTotal = scoreboardState.autoRotateIntervalSeconds || 10;
  const progressPercent = Math.max(0, Math.min(100, ((intervalTotal - countdown) / intervalTotal) * 100));

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-amber-500 selection:text-slate-950 flex flex-col justify-between p-3 sm:p-6 space-y-5">
      
      {/* Top Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl backdrop-blur-md relative overflow-hidden">
        
        {/* Continuous Loop Top Progress Bar */}
        {scoreboardState.autoRotate && !isAutoRotatePaused && (
          <div
            className="absolute top-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        )}

        <div className="flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1565992441121-4367c2967103?w=100&auto=format&fit=crop&q=80"
            alt="UPRSA Logo"
            className="w-12 h-12 rounded-xl object-cover border border-amber-500/40"
          />
          <div>
            <div className="flex items-center gap-2 text-red-500 font-black text-[11px] uppercase tracking-widest animate-pulse">
              <Radio className="w-4 h-4 text-red-500" /> UPRSA LIVE STADIUM SCOREBOARD
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {displayTitle}
            </h1>
            <p className="text-xs text-amber-400/90 font-semibold">{displaySubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Continuous Loop Badge (हमेशा चलता रहे) */}
          {scoreboardState.autoRotate && (
            <div className="bg-slate-950 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Repeat className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <div className="text-[10px] font-mono">
                <span className="text-slate-400 block font-bold leading-none">AUTO LOOP</span>
                <span className="text-amber-400 font-black text-xs leading-none">
                  {isAutoRotatePaused ? 'PAUSED' : `NEXT IN ${countdown}s`}
                </span>
              </div>
              <button
                onClick={() => setIsAutoRotatePaused(!isAutoRotatePaused)}
                className="ml-1 p-1 bg-slate-800 hover:bg-slate-700 rounded text-amber-400 transition cursor-pointer"
                title={isAutoRotatePaused ? "Resume Auto-Loop" : "Pause Auto-Loop"}
              >
                {isAutoRotatePaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {realtimeStatus === 'connected' && (
            <span className="bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Wifi className="w-3.5 h-3.5" /> LIVE SYNCED
            </span>
          )}
          {realtimeStatus === 'reconnecting' && (
            <span className="bg-amber-500/10 text-amber-400 font-mono font-bold text-xs px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> RECONNECTING...
            </span>
          )}
          {realtimeStatus === 'offline' && (
            <span className="bg-slate-800 text-slate-300 font-mono font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> LOCAL ACTIVE
            </span>
          )}

          <button
            onClick={toggleFullscreen}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Toggle Fullscreen LED Mode"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Mode Renderer */}
      <div className="flex-1 space-y-6">
        
        {/* MODE 1: LIVE PUBLISHED RESULTS & RANKINGS */}
        {scoreboardState.mode === 'MODE_1_CURRENT_RACE' && (
          <div className="space-y-6">
            {/* Active Tournament Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                  <Trophy className="w-4 h-4" /> UPRSA OFFICIAL TOURNAMENT LIVE RESULTS
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white">{activeTournament?.nameEn || 'UP State Championship 2026'}</h2>
                <p className="text-sm font-bold text-slate-400"><MapPin className="w-3.5 h-3.5 inline mr-1 text-amber-400" />{activeTournament?.venue}, {activeTournament?.districtName || 'Lucknow'} • {activeTournament?.startDate}</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl px-6 py-3 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">LIVE RESULTS PUBLISHED</span>
                <div className="text-xl font-black text-emerald-400 tracking-wider uppercase mt-1 flex items-center gap-2 justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> AUTO RANKING SYNCED
                </div>
              </div>
            </div>

            {/* Live Published Results Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-slate-950 px-8 py-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <span className="font-black text-lg text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-400" /> LATEST PUBLISHED RESULTS ({dbStore.getTournamentResults(activeTournament?.id || '').length} ENTRIES)
                  </span>
                  <p className="text-xs text-slate-400 mt-1">
                    Point Rule: <strong className="text-amber-300">🥇 1st (Gold) = 5 Pts</strong> • <strong className="text-slate-200">🥈 2nd (Silver) = 3 Pts</strong> • <strong className="text-amber-500">🥉 3rd (Bronze) = 1 Pt</strong>
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">DISTRICT • CLUB • SKATER RANKINGS</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-200">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-4 text-center">Position</th>
                      <th className="p-4 text-center">Bib #</th>
                      <th className="p-4">Skater Name</th>
                      <th className="p-4">Reg Number</th>
                      <th className="p-4">District</th>
                      <th className="p-4">Club / Academy</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Age Group</th>
                      <th className="p-4">Gender</th>
                      <th className="p-4 text-center">Medal</th>
                      <th className="p-4 text-right">Official Timing</th>
                      <th className="p-4 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-semibold">
                    {dbStore.getTournamentResults(activeTournament?.id || '').length === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-16 text-center text-slate-500 text-base font-bold">
                          कोई रिजल्ट अभी अपलोड नहीं किया गया है। रिजल्ट अपलोड होते ही यहाँ स्वतः प्रदर्शित होगा।
                        </td>
                      </tr>
                    ) : (
                      dbStore.getTournamentResults(activeTournament?.id || '').map((res) => {
                        const pos = res.position;
                        const isGold = res.medal === 'Gold' || pos === 1;
                        const isSilver = res.medal === 'Silver' || pos === 2;
                        const isBronze = res.medal === 'Bronze' || pos === 3;

                        return (
                          <tr
                            key={res.id}
                            className={`transition ${
                              isGold ? 'bg-amber-500/10 border-l-4 border-amber-500' :
                              isSilver ? 'bg-slate-400/10 border-l-4 border-slate-300' :
                              isBronze ? 'bg-amber-800/10 border-l-4 border-amber-700' :
                              'hover:bg-slate-850'
                            }`}
                          >
                            <td className="p-4 text-center font-black text-base">
                              {pos === 1 ? '🥇 1st' : pos === 2 ? '🥈 2nd' : pos === 3 ? '🥉 3rd' : `#${pos}`}
                            </td>
                            <td className="p-4 text-center font-mono">
                              <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-black text-xs rounded-lg">
                                #{res.bibNumber || '101'}
                              </span>
                            </td>
                            <td className="p-4 font-black text-base text-white">{res.skaterName}</td>
                            <td className="p-4 font-mono text-slate-400 text-xs">{res.registrationNumber}</td>
                            <td className="p-4 font-bold text-amber-400">{res.districtName}</td>
                            <td className="p-4 text-slate-300">{res.clubName}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-amber-300 rounded text-xs font-bold">
                                {res.discipline || 'Speed Inline'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs font-medium">
                                {res.ageGroup || 'Sub-Junior (12-15 Yrs)'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                res.gender === 'Female' 
                                  ? 'bg-pink-500/10 text-pink-300 border border-pink-500/30' 
                                  : 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                              }`}>
                                {res.gender || 'Male'}
                              </span>
                            </td>
                            <td className="p-4 text-center font-bold">
                              {res.medal === 'Gold' ? '🥇 Gold' : res.medal === 'Silver' ? '🥈 Silver' : res.medal === 'Bronze' ? '🥉 Bronze' : '—'}
                            </td>
                            <td className="p-5 text-right font-mono font-black text-xl text-amber-400">
                              {res.finalTiming}
                            </td>
                            <td className="p-5 text-right font-mono font-black text-xl text-emerald-400">
                              {res.points} Pts
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* District & Club Live Leaderboards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* District Rankings Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-400" /> जिला रैंकिंग (District Standings)
                  </h3>
                  <span className="text-xs text-emerald-400 font-mono font-bold">LIVE SYNCED</span>
                </div>

                <div className="space-y-2">
                  {districtRanks.slice(0, 5).map((d) => (
                    <div key={d.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-slate-800 rounded-xl flex items-center justify-center font-black text-amber-400 text-xs">
                          #{d.rank}
                        </span>
                        <div>
                          <strong className="text-white text-sm block">{d.name}</strong>
                          <span className="text-[10px] text-slate-400">🥇 {d.goldMedals} Gold • 🥈 {d.silverMedals} Silver • 🥉 {d.bronzeMedals} Bronze</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-emerald-400 text-sm">{d.totalPoints} Pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Club Rankings Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-400" /> क्लब रैंकिंग (Club Standings)
                  </h3>
                  <span className="text-xs text-emerald-400 font-mono font-bold">LIVE SYNCED</span>
                </div>

                <div className="space-y-2">
                  {clubRanks.slice(0, 5).map((c) => (
                    <div key={c.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-slate-800 rounded-xl flex items-center justify-center font-black text-amber-400 text-xs">
                          #{c.rank}
                        </span>
                        <div>
                          <strong className="text-white text-sm block">{c.name}</strong>
                          <span className="text-[10px] text-slate-400">District: {c.districtName || 'UP'}</span>
                        </div>
                      </div>
                      <span className="font-mono font-black text-emerald-400 text-sm">{c.totalPoints} Pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: EVENT RESULTS & PODIUM WINNERS */}
        {scoreboardState.mode === 'MODE_2_EVENT_RESULTS' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8 shadow-2xl">
            <div className="text-center space-y-2 border-b border-slate-800 pb-6">
              <span className="text-xs font-black uppercase text-amber-400 tracking-widest bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
                OFFICIAL RACE PODIUM WINNERS
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white">{activeRace?.discipline} - {activeRace?.distance}</h2>
              <p className="text-base text-slate-400 font-bold">{activeRace?.ageGroup} • {activeRace?.gender}</p>
            </div>

            {/* Podium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Silver - 2nd */}
              <div className="bg-slate-950 border border-slate-300/30 rounded-3xl p-6 text-center space-y-4 shadow-xl order-2 md:order-1 transform md:translate-y-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-3xl mx-auto border-2 border-slate-300">
                  🥈
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">2ND POSITION • SILVER</span>
                  <h3 className="text-xl font-black text-white mt-1">{raceResults[1]?.skaterName || 'Silver Medalist'}</h3>
                  <p className="text-xs font-bold text-amber-400">{raceResults[1]?.districtName}</p>
                </div>
                <div className="font-mono font-black text-2xl text-slate-200 bg-slate-900 py-2 rounded-2xl border border-slate-800">
                  {raceResults[1]?.finalTiming || '00:00.00'}
                </div>
              </div>

              {/* Gold - 1st */}
              <div className="bg-gradient-to-b from-amber-950/60 to-slate-950 border-2 border-amber-500 rounded-3xl p-8 text-center space-y-4 shadow-2xl order-1 md:order-2 ring-4 ring-amber-500/20">
                <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center text-4xl mx-auto border-4 border-amber-300 shadow-lg shadow-amber-500/30 animate-bounce">
                  🥇
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full">STATE CHAMPION • GOLD</span>
                  <h3 className="text-2xl font-black text-white mt-2">{raceResults[0]?.skaterName || 'Gold Medalist'}</h3>
                  <p className="text-sm font-bold text-amber-400">{raceResults[0]?.districtName}</p>
                </div>
                <div className="font-mono font-black text-3xl text-amber-400 bg-slate-900 py-3 rounded-2xl border border-amber-500/30">
                  {raceResults[0]?.finalTiming || '00:00.00'}
                </div>
              </div>

              {/* Bronze - 3rd */}
              <div className="bg-slate-950 border border-amber-800/40 rounded-3xl p-6 text-center space-y-4 shadow-xl order-3 transform md:translate-y-8">
                <div className="w-16 h-16 bg-amber-950 rounded-full flex items-center justify-center text-3xl mx-auto border-2 border-amber-700">
                  🥉
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-600">3RD POSITION • BRONZE</span>
                  <h3 className="text-xl font-black text-white mt-1">{raceResults[2]?.skaterName || 'Bronze Medalist'}</h3>
                  <p className="text-xs font-bold text-amber-400">{raceResults[2]?.districtName}</p>
                </div>
                <div className="font-mono font-black text-2xl text-amber-600 bg-slate-900 py-2 rounded-2xl border border-slate-800">
                  {raceResults[2]?.finalTiming || '00:00.00'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: STATE MEDAL TALLY */}
        {scoreboardState.mode === 'MODE_3_MEDAL_TALLY' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4">
            <div className="bg-slate-950 px-8 py-6 border-b border-slate-800 flex items-center justify-between">
              <span className="font-black text-xl text-white flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-400" /> STATE CHAMPIONSHIP MEDAL TALLY STANDINGS
              </span>
              <span className="text-xs text-slate-400 font-bold">SORTED BY GOLD MEDALS & POINTS</span>
            </div>

            <div className="overflow-x-auto p-4">
              <table className="w-full text-left text-sm text-slate-200">
                <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4 text-center">Rank</th>
                    <th className="p-4">District / Unit</th>
                    <th className="p-4 text-center">🥇 Gold</th>
                    <th className="p-4 text-center">🥈 Silver</th>
                    <th className="p-4 text-center">🥉 Bronze</th>
                    <th className="p-4 text-right">Total Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-extrabold">
                  {districtRanks.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-850 transition">
                      <td className="p-4 text-center font-black text-amber-400">#{d.rank}</td>
                      <td className="p-4 text-white text-base">{d.name}</td>
                      <td className="p-4 text-center text-amber-400 text-lg font-black">{d.goldMedals}</td>
                      <td className="p-4 text-center text-slate-300 text-lg font-black">{d.silverMedals}</td>
                      <td className="p-4 text-center text-amber-700 text-lg font-black">{d.bronzeMedals}</td>
                      <td className="p-4 text-right text-emerald-400 text-xl font-mono font-black">{d.totalPoints} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODE 4 & 5 & 6: CLUB & DISTRICT RANKINGS */}
        {(scoreboardState.mode === 'MODE_4_CLUB_RANKING' || scoreboardState.mode === 'MODE_5_DISTRICT_RANKING' || scoreboardState.mode === 'MODE_6_STATE_RANKING') && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-slate-950 px-8 py-6 border-b border-slate-800 flex items-center justify-between">
              <span className="font-black text-xl text-white flex items-center gap-3">
                <Award className="w-6 h-6 text-amber-400" />
                {scoreboardState.mode === 'MODE_4_CLUB_RANKING' ? 'AFFILIATED CLUB CHAMPIONSHIP LEADERBOARD' :
                 scoreboardState.mode === 'MODE_5_DISTRICT_RANKING' ? 'DISTRICT STANDINGS & PARTICIPATION TALLY' :
                 'UTTAR PRADESH INDIVIDUAL SKATER STATE RANKINGS'}
              </span>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-200">
                <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4 text-center">Rank</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">District / Unit</th>
                    <th className="p-4 text-center">Medals</th>
                    <th className="p-4 text-right">Total Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-bold">
                  {scoreboardState.mode === 'MODE_6_STATE_RANKING' ? (
                    individualRanks.map((sk) => (
                      <tr key={sk.skaterId} className="hover:bg-slate-850">
                        <td className="p-4 text-center text-amber-400 font-mono font-black text-lg">#{sk.rank}</td>
                        <td className="p-4 text-white text-base font-black">{sk.skaterName}</td>
                        <td className="p-4 text-slate-400">{sk.districtName} ({sk.clubName})</td>
                        <td className="p-4 text-center font-mono">
                          🥇 {sk.goldMedals} • 🥈 {sk.silverMedals} • 🥉 {sk.bronzeMedals}
                        </td>
                        <td className="p-4 text-right font-mono font-black text-emerald-400 text-xl">{sk.totalPoints} PTS</td>
                      </tr>
                    ))
                  ) : (
                    (scoreboardState.mode === 'MODE_4_CLUB_RANKING' ? clubRanks : districtRanks).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-850">
                        <td className="p-4 text-center text-amber-400 font-mono font-black text-lg">#{item.rank}</td>
                        <td className="p-4 text-white text-base font-black">{item.name}</td>
                        <td className="p-4 text-slate-400">{item.districtName || item.name}</td>
                        <td className="p-4 text-center font-mono">
                          🥇 {item.goldMedals} • 🥈 {item.silverMedals} • 🥉 {item.bronzeMedals}
                        </td>
                        <td className="p-4 text-right font-mono font-black text-emerald-400 text-xl">{item.totalPoints} PTS</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODE 7: HIGHLIGHTS & SCHEDULE */}
        {scoreboardState.mode === 'MODE_7_TOURNAMENT_HIGHLIGHTS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 shadow-2xl">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                CHAMPIONSHIP HIGHLIGHT
              </span>
              <h2 className="text-3xl font-black text-white">{displayTitle}</h2>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                Organized under the patronage of Uttar Pradesh Roller Sports Association. Over 500 top skaters from 75 districts competing across Speed Inline, Speed Quad, Artistic, Roller Hockey & Skateboarding.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4 shadow-2xl">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                UPCOMING RACES & HEATS
              </span>
              <div className="space-y-3 pt-2">
                {races.slice(0, 3).map(r => (
                  <div key={r.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-white text-sm">{r.discipline} {r.distance}</div>
                      <div className="text-xs text-slate-400">{r.ageGroup} • {r.gender}</div>
                    </div>
                    <span className="font-mono font-bold text-amber-400 text-xs bg-amber-500/10 px-3 py-1 rounded-xl">
                      {r.scheduledStartTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scrolling Announcement Ticker Footer (हमेशा चलता रहे) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-3 overflow-hidden shadow-2xl">
        <div className="bg-amber-500 text-slate-950 font-black text-xs uppercase px-3 py-1 rounded-xl shrink-0 flex items-center gap-1.5 shadow">
          <Megaphone className="w-3.5 h-3.5" /> LIVE ANNOUNCEMENT
        </div>

        <div className="overflow-hidden whitespace-nowrap flex-1">
          <div className="inline-block animate-marquee font-mono text-xs font-extrabold text-amber-300 tracking-wide">
            {displayTicker} • {displayTicker}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </div>
  );
};
