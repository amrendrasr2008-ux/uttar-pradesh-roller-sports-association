import React, { useState } from 'react';
import { RaceManager } from './scoring/RaceManager';
import { StartListManager } from './scoring/StartListManager';
import { ScoringOperatorPanel } from './scoring/ScoringOperatorPanel';
import { ScoreboardController } from './scoring/ScoreboardController';
import { RaceControlDashboard } from './scoring/RaceControlDashboard';
import { Flag, Users, Play, Tv, Radio, Activity } from 'lucide-react';

export const LiveScoreOperator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'control' | 'races' | 'startlist' | 'operator' | 'scoreboard'>('control');
  const [targetRaceId, setTargetRaceId] = useState<string | undefined>(undefined);

  const handleSelectScoringRace = (raceId: string) => {
    setTargetRaceId(raceId);
    setActiveTab('operator');
  };

  const handleSelectStartListRace = (raceId: string) => {
    setTargetRaceId(raceId);
    setActiveTab('startlist');
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Title & Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase animate-pulse">
            <Radio className="w-4 h-4 text-red-500" /> UPRSA Professional Scoring Suite
          </div>
          <h1 className="text-2xl font-black text-white">Advanced Tournament Scoring & Live Scoreboard</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('control')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'control' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-950" /> Race Control
          </button>

          <button
            onClick={() => setActiveTab('races')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'races' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flag className="w-4 h-4" /> Races & Heats
          </button>

          <button
            onClick={() => setActiveTab('startlist')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'startlist' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Start Lists
          </button>

          <button
            onClick={() => setActiveTab('operator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'operator' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-4 h-4 fill-current" /> Scoring Operator
          </button>

          <button
            onClick={() => setActiveTab('scoreboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'scoreboard' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" /> LED Scoreboard Control
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'control' && (
        <RaceControlDashboard
          onSelectScoringRace={handleSelectScoringRace}
          onSelectStartListRace={handleSelectStartListRace}
        />
      )}

      {activeTab === 'races' && (
        <RaceManager
          onSelectScoringRace={handleSelectScoringRace}
          onSelectStartListRace={handleSelectStartListRace}
        />
      )}

      {activeTab === 'startlist' && (
        <StartListManager
          initialRaceId={targetRaceId}
          onBackToRaces={() => setActiveTab('races')}
        />
      )}

      {activeTab === 'operator' && (
        <ScoringOperatorPanel
          initialRaceId={targetRaceId}
          onBackToRaces={() => setActiveTab('races')}
        />
      )}

      {activeTab === 'scoreboard' && (
        <ScoreboardController />
      )}
    </div>
  );
};
