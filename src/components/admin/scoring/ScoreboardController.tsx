import React, { useState, useEffect } from 'react';
import { dbStore } from '../../../lib/db';
import { ScoreboardDisplayMode, ScoreboardState, Tournament, Race, RaceResult } from '../../../types';
import { Tv, Radio, ExternalLink, Play, Award, Trophy, MapPin, Building2, Star, RefreshCw, Edit3, Save, CheckCircle2, Repeat, Clock, Megaphone, Sliders, Layers } from 'lucide-react';

export const ScoreboardController: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => dbStore.getTournaments());
  const [races, setRaces] = useState<Race[]>(() => dbStore.getRaces());
  const [scoreboardState, setScoreboardState] = useState<ScoreboardState>(() => dbStore.getScoreboardState());

  // Edit fields
  const [customTitle, setCustomTitle] = useState(scoreboardState.customTitle || '38th UPRSA UP State Roller Skating Championship 2026');
  const [customSubtitle, setCustomSubtitle] = useState(scoreboardState.customSubtitle || 'Official Real-Time Stadium LED Scoreboard & Live Results Sync');
  const [tickerText, setTickerText] = useState(scoreboardState.tickerText || 'WELCOME TO UPRSA STATE CHAMPIONSHIP • LIVE SCORING IN PROGRESS • ALL ATHLETES REPORT TO CALL ROOM');
  const [autoRotate, setAutoRotate] = useState(scoreboardState.autoRotate ?? true);
  const [intervalSecs, setIntervalSecs] = useState(scoreboardState.autoRotateIntervalSeconds || 10);
  const [selectedModes, setSelectedModes] = useState<ScoreboardDisplayMode[]>(
    scoreboardState.rotationModes || [
      'MODE_1_CURRENT_RACE',
      'MODE_2_EVENT_RESULTS',
      'MODE_3_MEDAL_TALLY',
      'MODE_4_CLUB_RANKING',
      'MODE_5_DISTRICT_RANKING',
      'MODE_6_STATE_RANKING',
      'MODE_7_TOURNAMENT_HIGHLIGHTS'
    ]
  );

  const [activeTab, setActiveTab] = useState<'modes' | 'editor' | 'results'>('modes');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Quick edit results for active race
  const [activeRaceResults, setActiveRaceResults] = useState<RaceResult[]>([]);

  useEffect(() => {
    const unsub = dbStore.subscribe(() => {
      setTournaments(dbStore.getTournaments());
      setRaces(dbStore.getRaces());
      const state = dbStore.getScoreboardState();
      setScoreboardState(state);

      if (state.raceId) {
        setActiveRaceResults(dbStore.getRaceResults(state.raceId));
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (scoreboardState.raceId) {
      setActiveRaceResults(dbStore.getRaceResults(scoreboardState.raceId));
    }
  }, [scoreboardState.raceId]);

  const handleModeChange = (mode: ScoreboardDisplayMode) => {
    dbStore.updateScoreboardState({ mode });
  };

  const handleTournamentChange = (tournamentId: string) => {
    dbStore.updateScoreboardState({ tournamentId });
  };

  const handleRaceChange = (raceId: string) => {
    const r = races.find(x => x.id === raceId);
    dbStore.updateScoreboardState({
      raceId,
      eventId: r?.eventId,
      tournamentId: r?.tournamentId || scoreboardState.tournamentId
    });
  };

  const handleSaveScoreboardEdits = (e: React.FormEvent) => {
    e.preventDefault();
    dbStore.updateScoreboardState({
      customTitle,
      customSubtitle,
      tickerText,
      autoRotate,
      autoRotateIntervalSeconds: intervalSecs,
      rotationModes: selectedModes,
      isLiveBroadcasting: true
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const toggleModeInRotation = (mode: ScoreboardDisplayMode) => {
    if (selectedModes.includes(mode)) {
      if (selectedModes.length > 1) {
        setSelectedModes(selectedModes.filter(m => m !== mode));
      }
    } else {
      setSelectedModes([...selectedModes, mode]);
    }
  };

  const handleTimingResultChange = (resId: string, field: keyof RaceResult, value: any) => {
    const updated = activeRaceResults.map(r => r.id === resId ? { ...r, [field]: value } : r);
    setActiveRaceResults(updated);
  };

  const handleSaveResults = (resId: string) => {
    const item = activeRaceResults.find(r => r.id === resId);
    if (item) {
      dbStore.addOrUpdateRaceResult(item);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleOpenScoreboardWindow = () => {
    window.open('/live-scoreboard', '_blank', 'width=1920,height=1080');
  };

  const modes: { id: ScoreboardDisplayMode; title: string; desc: string; icon: any }[] = [
    {
      id: 'MODE_1_CURRENT_RACE',
      title: 'Mode 1: Current Race Live Board',
      desc: 'Shows active race start list, live stopwatch timer, lane assignments, and real-time timings.',
      icon: Play
    },
    {
      id: 'MODE_2_EVENT_RESULTS',
      title: 'Mode 2: Event Results & Winners',
      desc: 'Displays completed event final positions, timings, and Gold / Silver / Bronze podium winners.',
      icon: Award
    },
    {
      id: 'MODE_3_MEDAL_TALLY',
      title: 'Mode 3: State Medal Tally',
      desc: 'Displays district & club overall medal tallies (Gold, Silver, Bronze counts & points).',
      icon: Trophy
    },
    {
      id: 'MODE_4_CLUB_RANKING',
      title: 'Mode 4: Club Standings',
      desc: 'Displays overall club leaderboard sorted by total medals and points.',
      icon: Building2
    },
    {
      id: 'MODE_5_DISTRICT_RANKING',
      title: 'Mode 5: District Standings',
      desc: 'Displays all 75 Uttar Pradesh district rankings and participant tallies.',
      icon: MapPin
    },
    {
      id: 'MODE_6_STATE_RANKING',
      title: 'Mode 6: State Individual Rankings',
      desc: 'Displays overall top skaters across Uttar Pradesh state championships.',
      icon: Star
    },
    {
      id: 'MODE_7_TOURNAMENT_HIGHLIGHTS',
      title: 'Mode 7: Highlights & Next Schedule',
      desc: 'Rotating view featuring championship records, top performers, and upcoming race schedule.',
      icon: Tv
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Screen Launch */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider bg-red-950/80 px-3 py-1 rounded-full border border-red-800 animate-pulse">
              <Radio className="w-4 h-4 text-red-500" /> Stadium LED Screen Controller
            </span>
            {scoreboardState.autoRotate && (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-extrabold text-xs bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                <Repeat className="w-3.5 h-3.5 animate-spin text-emerald-400" /> Auto-Loop Continuous (हमेशा चालू)
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-white">Live Scoreboard Control & Live Editor</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Edit live titles, announcement ticker text, result timings, and configure continuous non-stop display loops for stadium screens.
          </p>
        </div>

        <button
          onClick={handleOpenScoreboardWindow}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2.5 transition shadow-xl shadow-amber-500/20 cursor-pointer shrink-0"
        >
          <ExternalLink className="w-4 h-4" /> Open Full Screen LED Scoreboard
        </button>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-200 text-xs p-4 rounded-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-bold">✅ लाइव स्कोरबोर्ड विवरण सफलतापूर्वक सहेज लिया गया एवं अपडेट कर दिया गया! (Live Scoreboard Updated)</span>
        </div>
      )}

      {/* Controller Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-2xl gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('modes')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'modes' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" /> Display Modes
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'editor' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4" /> Edit Content & Loop Settings (हमेशा चलता रहे)
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'results' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" /> Live Results & Timing Quick Editor
          </button>
        </div>

        <div className="flex items-center gap-3 px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-400">
          <span>Target Race: <strong className="text-amber-400">{races.find(r => r.id === scoreboardState.raceId)?.discipline || 'Inline'}</strong></span>
        </div>
      </div>

      {/* Target Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Target Tournament</label>
          <select
            value={scoreboardState.tournamentId}
            onChange={(e) => handleTournamentChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
          >
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.nameEn}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Target Active Race (Mode 1 & Quick Edit)</label>
          <select
            value={scoreboardState.raceId || ''}
            onChange={(e) => handleRaceChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500 font-mono"
          >
            {races.map(r => (
              <option key={r.id} value={r.id}>
                Race #{r.raceNumber} (Heat {r.heatNumber}) - {r.discipline} {r.distance} ({r.ageGroup})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: DISPLAY MODES */}
      {activeTab === 'modes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-amber-400" /> Select Scoreboard Display Mode (Manual Switch or Override)
            </h3>
            <span className="text-xs text-slate-400">
              Active Mode: <strong className="text-amber-400 font-mono">{scoreboardState.mode}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modes.map((m) => {
              const Icon = m.icon;
              const isActive = scoreboardState.mode === m.id;

              return (
                <div
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500/60 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {isActive && (
                        <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider animate-pulse">
                          ON SCREEN NOW
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-sm text-white">{m.title}</h4>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{m.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className={isActive ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                      {isActive ? 'Currently Active' : 'Click to Broadcast'}
                    </span>
                    <span className="text-slate-500">Mode {m.id.split('_')[1]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE CONTENT & CONTINUOUS AUTO-LOOP EDITOR */}
      {activeTab === 'editor' && (
        <form onSubmit={handleSaveScoreboardEdits} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" /> लाइव स्कोरबोर्ड कंटेंट एवं ऑटो-लूप सेटिंग्स (Edit Scoreboard & Auto-Loop)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                यहाँ से लाइव स्कोरबोर्ड का शीर्षक, संदेश एवं ऑटो-रोटेशन (हमेशा चलता रहे) सेट करें।
              </p>
            </div>

            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <Save className="w-4 h-4" /> Save & Broadcast Edits
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title & Subtitle */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-amber-500" />
                  मुख्य शीर्षक (Custom Scoreboard Title)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. 38th UPRSA UP State Championship 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-500" />
                  उप-शीर्षक / स्थान (Custom Subtitle / Venue Info)
                </label>
                <input
                  type="text"
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  placeholder="e.g. Official Real-Time Stadium LED Scoreboard"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-amber-500" />
                  लाइव घोषणा पट्टी (Live Announcement Ticker Message)
                </label>
                <textarea
                  rows={3}
                  value={tickerText}
                  onChange={(e) => setTickerText(e.target.value)}
                  placeholder="e.g. Welcome to UP State Championship • Live Results Updated"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Continuous Loop Settings (हमेशा चलता रहे) */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-sm font-extrabold text-white">कंटीन्यूअस ऑटो-रोटेशन (Non-Stop Loop)</h4>
                    <p className="text-[10px] text-slate-400">स्कोरबोर्ड हमेशा स्वतः बदलता और घूमता रहेगा (Continuous Running)</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRotate}
                    onChange={(e) => setAutoRotate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-300 mb-1">
                  समय अंतराल (Switch Interval Duration)
                </label>
                <select
                  value={intervalSecs}
                  onChange={(e) => setIntervalSecs(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                >
                  <option value={5}>5 Seconds (Fast Rotation)</option>
                  <option value={8}>8 Seconds</option>
                  <option value={10}>10 Seconds (Standard Recommended)</option>
                  <option value={15}>15 Seconds</option>
                  <option value={20}>20 Seconds</option>
                  <option value={30}>30 Seconds</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-300 mb-2">
                  लूप में शामिल व्यू मोड (Select Modes in Loop)
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {modes.map((m) => {
                    const isSelected = selectedModes.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleModeInRotation(m.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition flex items-center justify-between ${
                          isSelected ? 'bg-amber-500/10 border-amber-500/40 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <span>{m.title}</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: LIVE RESULTS & TIMING QUICK EDITOR */}
      {activeTab === 'results' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" /> सक्रिय रेस के परिणाम त्वरित संपादन (Live Timing & Position Quick Editor)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                टारगेट रेस: <strong className="text-amber-400">{races.find(r => r.id === scoreboardState.raceId)?.discipline || 'Inline'} ({races.find(r => r.id === scoreboardState.raceId)?.distance})</strong>
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Position</th>
                  <th className="p-3">Bib #</th>
                  <th className="p-3">Skater Name</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Final Timing</th>
                  <th className="p-3">Medal</th>
                  <th className="p-3">Points</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {activeRaceResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-bold">
                      इस रेस के लिए अभी कोई परिणाम दर्ज नहीं है। आप स्कोरिंग ऑपरेटर से नए परिणाम दर्ज कर सकते हैं।
                    </td>
                  </tr>
                ) : (
                  activeRaceResults.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-850">
                      <td className="p-3 w-20">
                        <input
                          type="number"
                          value={r.position}
                          onChange={(e) => handleTimingResultChange(r.id, 'position', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center font-bold text-amber-400"
                        />
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-300">#{r.bibNumber}</td>
                      <td className="p-3 font-black text-white">{r.skaterName}</td>
                      <td className="p-3 font-bold text-slate-300">{r.districtName}</td>
                      <td className="p-3 w-36">
                        <input
                          type="text"
                          value={r.finalTiming}
                          onChange={(e) => handleTimingResultChange(r.id, 'finalTiming', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 font-mono font-bold text-amber-400"
                        />
                      </td>
                      <td className="p-3 w-28">
                        <select
                          value={r.medal || 'None'}
                          onChange={(e) => handleTimingResultChange(r.id, 'medal', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 font-bold text-xs"
                        >
                          <option value="Gold">🥇 Gold</option>
                          <option value="Silver">🥈 Silver</option>
                          <option value="Bronze">🥉 Bronze</option>
                          <option value="None">None</option>
                        </select>
                      </td>
                      <td className="p-3 w-20">
                        <input
                          type="number"
                          value={r.points}
                          onChange={(e) => handleTimingResultChange(r.id, 'points', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center font-bold text-emerald-400"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleSaveResults(r.id)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3 py-1 rounded text-xs transition cursor-pointer"
                        >
                          Save
                        </button>
                      </td>
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
