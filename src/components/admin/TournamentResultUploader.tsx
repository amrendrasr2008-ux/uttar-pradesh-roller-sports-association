import React, { useState, useEffect } from 'react';
import { dbStore, formatMsToTiming } from '../../lib/db';
import { ALL_OFFICIAL_AGE_GROUPS } from '../../lib/ageGroupRules';
import { Tournament, RaceResult, Medal, ParticipantStatus } from '../../types';
import { 
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Plus, Trash2, Download, 
  Trophy, MapPin, Building2, Users, RefreshCw, Save, Zap, UserCheck, Shield, 
  Layers, Flag, Copy, Filter, ChevronRight
} from 'lucide-react';

interface TournamentResultUploaderProps {
  tournamentId?: string;
  onSuccess?: () => void;
}

interface RaceConfig {
  id: string;
  raceNumber: number;
  title: string;
  distance: string;
}

export const TournamentResultUploader: React.FC<TournamentResultUploaderProps> = ({ tournamentId }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => dbStore.getTournaments());
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(
    tournamentId || tournaments[0]?.id || ''
  );

  const [activeTab, setActiveTab] = useState<'csv' | 'manual' | 'view'>('csv');

  // --- MULTI-RACE MATCH CONFIGURATION STATE ---
  const [totalRacesCount, setTotalRacesCount] = useState<number>(2);
  const [raceConfigs, setRaceConfigs] = useState<RaceConfig[]>([
    { id: 'race-1', raceNumber: 1, title: 'रेस 1 (Race 1)', distance: '500m Rink Race' },
    { id: 'race-2', raceNumber: 2, title: 'रेस 2 (Race 2)', distance: '1000m Road Race' },
  ]);
  const [activeRaceIndex, setActiveRaceIndex] = useState<number>(0);
  const [isRaceConfigured, setIsRaceConfigured] = useState<boolean>(true);

  // CSV Tab State with Multi-Race Examples
  const [csvText, setCsvText] = useState<string>(`Skater Name, Registration Number, Chest/Bib No, District, Club, Discipline/Category, Age Group, Gender, Event, Position, Medal, Timing, Points
Aarav Sharma, UPRSA/2026/01001, 101, Lucknow, Lucknow Roller Skating Academy, Speed Inline, Sub-Junior (12-15 Years), Male, 500m Rink Race, 1, Gold, 00:46.12, 5
Aarav Sharma, UPRSA/2026/01001, 101, Lucknow, Lucknow Roller Skating Academy, Speed Inline, Sub-Junior (12-15 Years), Male, 1000m Road Race, 2, Silver, 01:38.20, 3
Ananya Verma, UPRSA/2026/01002, 102, Gautam Buddha Nagar (Noida), Noida Speed Skaters Club, Speed Quad, Sub-Junior (12-15 Years), Female, 500m Quad Race, 1, Gold, 00:52.00, 5
Kabir Singh, UPRSA/2026/01003, 103, Kanpur Nagar, Kanpur Express Roller Club, Speed Quad, Junior (15-18 Years), Male, 500m Quad Race, 2, Silver, 00:53.45, 3
Myra Gupta, UPRSA/2026/01004, 104, Lucknow, Lucknow Roller Skating Academy, Inline Freestyle, Sub-Junior (12-15 Years), Female, 1000m Inline, 3, Bronze, 00:55.20, 1`);

  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Manual Tab State: Store rows grouped by race index
  const [manualRowsByRace, setManualRowsByRace] = useState<Record<number, any[]>>({
    0: [
      {
        bibNumber: '101',
        skaterName: 'Aarav Sharma',
        registrationNumber: 'UPRSA/2026/01001',
        districtName: 'Lucknow',
        clubName: 'Lucknow Roller Skating Academy',
        discipline: 'Speed Inline',
        ageGroup: 'Sub-Junior (12-15 Years)',
        gender: 'Male',
        distance: '500m Rink Race',
        position: 1,
        medal: 'Gold',
        rawTiming: '00:46.12',
        points: 5
      },
      {
        bibNumber: '102',
        skaterName: 'Ananya Verma',
        registrationNumber: 'UPRSA/2026/01002',
        districtName: 'Gautam Buddha Nagar (Noida)',
        clubName: 'Noida Speed Skaters Club',
        discipline: 'Speed Quad',
        ageGroup: 'Sub-Junior (12-15 Years)',
        gender: 'Female',
        distance: '500m Rink Race',
        position: 2,
        medal: 'Silver',
        rawTiming: '00:52.00',
        points: 3
      }
    ],
    1: [
      {
        bibNumber: '101',
        skaterName: 'Aarav Sharma',
        registrationNumber: 'UPRSA/2026/01001',
        districtName: 'Lucknow',
        clubName: 'Lucknow Roller Skating Academy',
        discipline: 'Speed Inline',
        ageGroup: 'Sub-Junior (12-15 Years)',
        gender: 'Male',
        distance: '1000m Road Race',
        position: 2,
        medal: 'Silver',
        rawTiming: '01:38.20',
        points: 3
      }
    ]
  });

  // Filter View Results by Event / Race
  const [viewEventFilter, setViewEventFilter] = useState<string>('ALL');

  // Existing uploaded results
  const [existingResults, setExistingResults] = useState<RaceResult[]>([]);
  const [deletingResultItem, setDeletingResultItem] = useState<RaceResult | null>(null);

  useEffect(() => {
    const refreshData = () => {
      setTournaments(dbStore.getTournaments());
      if (selectedTournamentId) {
        setExistingResults(dbStore.getTournamentResults(selectedTournamentId));
      }
    };
    refreshData();
    const unsubscribe = dbStore.subscribe(refreshData);
    return unsubscribe;
  }, [selectedTournamentId]);

  // Handle Changing Number of Races in Match
  const handleTotalRacesChange = (count: number) => {
    setTotalRacesCount(count);
    const updatedConfigs: RaceConfig[] = [];
    for (let i = 1; i <= count; i++) {
      const existing = raceConfigs[i - 1];
      updatedConfigs.push({
        id: existing?.id || `race-${i}`,
        raceNumber: i,
        title: existing?.title || `रेस ${i} (Race ${i})`,
        distance: existing?.distance || (i === 1 ? '500m Rink Race' : i === 2 ? '1000m Road Race' : i === 3 ? '100m Sprint' : `${500 * i}m Race`)
      });
    }
    setRaceConfigs(updatedConfigs);
    if (activeRaceIndex >= count) {
      setActiveRaceIndex(0);
    }
  };

  // Update Individual Race Config Field
  const handleUpdateRaceConfig = (index: number, field: keyof RaceConfig, value: any) => {
    const updated = [...raceConfigs];
    updated[index] = { ...updated[index], [field]: value };
    setRaceConfigs(updated);
  };

  // Flexible CSV Parser
  const handleParseCsv = () => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      alert('कृपया वैध सीएसवी फ़ाइल या पंक्तियां (rows) दर्ज करें।');
      return;
    }

    const dataRows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = line.split(',').map(c => c.trim());
      if (cols.length >= 3) {
        let name = cols[0] || 'Unknown Skater';
        let regNo = cols[1] || `UPRSA-${Math.floor(1000 + Math.random() * 9000)}`;
        let bibNo = String(100 + i);
        let dist = 'Lucknow';
        let club = 'District Skating Club';
        let disc = 'Speed Inline';
        let age = 'Sub-Junior (12-15 Years)';
        let gender = 'Male';
        let distEv = '500m Race';
        let pos = i;
        let medalRaw = 'None';
        let timing = '00:54.00';
        let pts = 0;

        if (cols.length >= 12) {
          bibNo = cols[2] || String(100 + i);
          dist = cols[3] || 'Lucknow';
          club = cols[4] || 'District Skating Club';
          disc = cols[5] || 'Speed Inline';
          age = cols[6] || 'Sub-Junior (12-15 Years)';
          gender = cols[7] || 'Male';
          distEv = cols[8] || '500m Race';
          pos = parseInt(cols[9], 10) || i;
          medalRaw = cols[10] || 'None';
          timing = cols[11] || '00:54.00';
          pts = parseInt(cols[12], 10);
        } else if (cols.length >= 11) {
          bibNo = String(100 + i);
          dist = cols[2] || 'Lucknow';
          club = cols[3] || 'District Skating Club';
          disc = cols[4] || 'Speed Inline';
          age = cols[5] || 'Sub-Junior (12-15 Years)';
          gender = 'Male';
          distEv = cols[6] || '500m Race';
          pos = parseInt(cols[7], 10) || i;
          medalRaw = cols[8] || 'None';
          timing = cols[9] || '00:54.00';
          pts = parseInt(cols[10], 10);
        } else {
          pos = parseInt(cols[2], 10) || i;
        }

        let medal: Medal = 'None';
        if (medalRaw.toLowerCase().includes('gold') || pos === 1) medal = 'Gold';
        else if (medalRaw.toLowerCase().includes('silver') || pos === 2) medal = 'Silver';
        else if (medalRaw.toLowerCase().includes('bronze') || pos === 3) medal = 'Bronze';

        if (isNaN(pts)) {
          pts = pos === 1 ? 5 : pos === 2 ? 3 : pos === 3 ? 1 : 0;
        }

        dataRows.push({
          skaterName: name,
          registrationNumber: regNo,
          bibNumber: bibNo,
          districtName: dist,
          clubName: club,
          discipline: disc,
          ageGroup: age,
          gender: gender,
          distance: distEv,
          position: pos,
          medal,
          rawTiming: timing,
          points: pts
        });
      }
    }

    setParsedRows(dataRows);
    setImportSuccessMsg(null);
  };

  // Download CSV Template
  const handleDownloadTemplate = () => {
    const sampleHeader = "Skater Name, Registration Number, Chest/Bib No, District, Club, Discipline/Category, Age Group, Gender, Event, Position, Medal, Timing, Points\n";
    const sampleRows = "Aarav Sharma, UPRSA/2026/01001, 101, Lucknow, Lucknow Roller Skating Academy, Speed Inline, Sub-Junior (12-15 Years), Male, 500m Rink Race, 1, Gold, 00:46.12, 5\nAarav Sharma, UPRSA/2026/01001, 101, Lucknow, Lucknow Roller Skating Academy, Speed Inline, Sub-Junior (12-15 Years), Male, 1000m Road Race, 2, Silver, 01:38.20, 3\nAnanya Verma, UPRSA/2026/01002, 102, Gautam Buddha Nagar (Noida), Noida Speed Skaters Club, Speed Quad, Sub-Junior (12-15 Years), Female, 500m Quad Race, 1, Gold, 00:52.00, 5\nKabir Singh, UPRSA/2026/01003, 103, Kanpur Nagar, Kanpur Express Roller Club, Speed Quad, Junior (15-18 Years), Male, 500m Quad Race, 2, Silver, 00:53.45, 3";
    
    const blob = new Blob([sampleHeader + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'UPRSA_Multi_Race_Tournament_Result_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save CSV Results
  const handleSaveCsvResults = () => {
    if (!selectedTournamentId) {
      alert('कृपया टूर्नामेंट चुनें!');
      return;
    }
    if (parsedRows.length === 0) {
      alert('अपलोड करने के लिए कोई डाटा उपलब्ध नहीं है। पहले "जाँचें व पूर्वावलोकन" बटन दबाएं।');
      return;
    }

    parsedRows.forEach((row, idx) => {
      const skaterId = `skater-${row.registrationNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const raceId = `race-${selectedTournamentId}-${row.distance.toLowerCase().replace(/[^a-z0-9]/g, '') || 'r1'}`;

      dbStore.addOrUpdateRaceResult({
        id: `res-${selectedTournamentId}-${idx}-${Date.now()}`,
        raceId,
        tournamentId: selectedTournamentId,
        eventId: `ev-${selectedTournamentId}`,
        participantId: `part-${skaterId}`,
        skaterId,
        skaterName: row.skaterName,
        registrationNumber: row.registrationNumber,
        districtName: row.districtName,
        clubName: row.clubName,
        bibNumber: row.bibNumber || String(100 + idx),
        discipline: row.discipline || 'Speed Inline',
        ageGroup: row.ageGroup || 'Sub-Junior (12-15 Years)',
        gender: row.gender || 'Male',
        rawTiming: row.rawTiming,
        penaltySeconds: 0,
        finalTiming: row.rawTiming,
        score: row.points,
        position: row.position,
        points: row.points,
        medal: row.medal,
        status: 'VALID',
        approvalStatus: 'Published',
        remarks: row.distance || 'Multi-Race Result Import'
      });
    });

    const updated = dbStore.getTournamentResults(selectedTournamentId);
    setExistingResults(updated);
    setImportSuccessMsg(`✓ ${parsedRows.length} खिलाड़ियों के बहु-रेस (Multi-Race) परिणाम सफलतापूर्वक अपलोड किए गए! सभी मेडल व अंक ऑटो-सिंक हो गए हैं।`);
    setParsedRows([]);
  };

  // --- MANUAL ENTRY FUNCTIONS ---
  const currentRaceRows = manualRowsByRace[activeRaceIndex] || [];

  const handleAddManualRow = () => {
    const currentRows = manualRowsByRace[activeRaceIndex] || [];
    const currentRace = raceConfigs[activeRaceIndex] || raceConfigs[0];
    const newRow = {
      bibNumber: String(100 + currentRows.length + 1),
      skaterName: '',
      registrationNumber: `UPRSA-2026-${Math.floor(100 + Math.random() * 900)}`,
      districtName: 'Lucknow',
      clubName: 'Local Academy',
      discipline: 'Speed Inline',
      ageGroup: 'Sub-Junior (12-15 Years)',
      gender: 'Male',
      distance: currentRace?.distance || '500m Race',
      position: currentRows.length + 1,
      medal: currentRows.length === 0 ? 'Gold' : currentRows.length === 1 ? 'Silver' : currentRows.length === 2 ? 'Bronze' : 'None',
      rawTiming: '00:54.00',
      points: currentRows.length === 0 ? 5 : currentRows.length === 1 ? 3 : currentRows.length === 2 ? 1 : 0
    };

    setManualRowsByRace({
      ...manualRowsByRace,
      [activeRaceIndex]: [...currentRows, newRow]
    });
  };

  const handleRemoveManualRow = (index: number) => {
    const currentRows = manualRowsByRace[activeRaceIndex] || [];
    setManualRowsByRace({
      ...manualRowsByRace,
      [activeRaceIndex]: currentRows.filter((_, idx) => idx !== index)
    });
  };

  const handleUpdateManualField = (index: number, field: string, value: any) => {
    const currentRows = [...(manualRowsByRace[activeRaceIndex] || [])];
    currentRows[index] = { ...currentRows[index], [field]: value };

    if (field === 'position') {
      const pos = parseInt(value, 10) || 1;
      currentRows[index].medal = pos === 1 ? 'Gold' : pos === 2 ? 'Silver' : pos === 3 ? 'Bronze' : 'None';
      currentRows[index].points = pos === 1 ? 5 : pos === 2 ? 3 : pos === 3 ? 1 : 0;
    }

    setManualRowsByRace({
      ...manualRowsByRace,
      [activeRaceIndex]: currentRows
    });
  };

  // Copy Skaters List from Race 1 to Current Race
  const handleCopySkatersFromRace1 = () => {
    const race1Rows = manualRowsByRace[0] || [];
    if (race1Rows.length === 0) {
      alert('रेस 1 में कोई खिलाड़ी डाटा मौजूद नहीं है। पहले रेस 1 के खिलाड़ियों के नाम भरें!');
      return;
    }

    const currentRace = raceConfigs[activeRaceIndex] || raceConfigs[0];
    const copied = race1Rows.map((r, idx) => ({
      ...r,
      distance: currentRace.distance,
      position: idx + 1,
      medal: idx === 0 ? 'Gold' : idx === 1 ? 'Silver' : idx === 2 ? 'Bronze' : 'None',
      points: idx === 0 ? 5 : idx === 1 ? 3 : idx === 2 ? 1 : 0,
      rawTiming: '00:55.00'
    }));

    setManualRowsByRace({
      ...manualRowsByRace,
      [activeRaceIndex]: copied
    });

    alert(`✓ रेस 1 से ${race1Rows.length} खिलाड़ियों की सूची को ${currentRace.distance} के लिए कॉपी कर दिया गया है! अब नए स्थान व समय दर्ज करें।`);
  };

  // Save All Manual Results across All Races
  const handleSaveManualResults = () => {
    if (!selectedTournamentId) {
      alert('कृपया टूर्नामेंट चुनें!');
      return;
    }

    let totalSavedCount = 0;

    // Iterate through all configured races
    raceConfigs.forEach((race, rIdx) => {
      const rowsForRace = manualRowsByRace[rIdx] || [];
      const validRows = rowsForRace.filter(r => r.skaterName && r.skaterName.trim() !== '');

      validRows.forEach((row, idx) => {
        const regNo = row.registrationNumber || `UPRSA-${Math.floor(1000 + Math.random() * 9000)}`;
        const skaterId = `skater-${regNo.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        const raceId = `race-${selectedTournamentId}-r${rIdx + 1}`;

        dbStore.addOrUpdateRaceResult({
          id: `res-${selectedTournamentId}-r${rIdx + 1}-${idx}-${Date.now()}`,
          raceId,
          tournamentId: selectedTournamentId,
          eventId: `ev-${selectedTournamentId}`,
          participantId: `part-${skaterId}`,
          skaterId,
          skaterName: row.skaterName,
          registrationNumber: regNo,
          districtName: row.districtName || 'Lucknow',
          clubName: row.clubName || 'Speed Club',
          bibNumber: row.bibNumber || String(100 + idx),
          discipline: row.discipline || 'Speed Inline',
          ageGroup: row.ageGroup || 'Sub-Junior (12-15 Years)',
          gender: row.gender || 'Male',
          rawTiming: row.rawTiming || '00:54.00',
          penaltySeconds: 0,
          finalTiming: row.rawTiming || '00:54.00',
          score: row.points,
          position: Number(row.position) || idx + 1,
          points: Number(row.points) || 5,
          medal: row.medal as Medal,
          status: 'VALID',
          approvalStatus: 'Published',
          remarks: race.distance || `Race ${rIdx + 1} Result`
        });

        totalSavedCount++;
      });
    });

    if (totalSavedCount === 0) {
      alert('कृपया कम से कम एक रेस में खिलाड़ी का नाम भरें!');
      return;
    }

    const updated = dbStore.getTournamentResults(selectedTournamentId);
    setExistingResults(updated);
    setImportSuccessMsg(`✓ कुल ${totalSavedCount} परिणाम (${totalRacesCount} रेसों से) सफलतापूर्वक सहेजे गए! खिलाड़ियों के कुल अंक व मेडल तालिका ऑटो-अपडेट हो गई है।`);
  };

  // Confirm Delete Result
  const confirmDeleteResult = () => {
    if (!deletingResultItem) return;
    const targetId = deletingResultItem.id;
    const skaterName = deletingResultItem.skaterName;
    const bib = deletingResultItem.bibNumber;

    setExistingResults(prev => prev.filter(r => r.id !== targetId));
    dbStore.deleteRaceResult(targetId);

    const updated = dbStore.getTournamentResults(selectedTournamentId);
    setExistingResults(updated);
    setImportSuccessMsg(`✓ ${skaterName} (Chest #${bib}) का परिणाम सफलतापूर्वक हटा दिया गया है। सभी लीडरबोर्ड व अंक अपडेट हो गए हैं।`);
    setDeletingResultItem(null);
  };

  const selectedTour = tournaments.find(t => t.id === selectedTournamentId);

  // Filtered Results for View Tab
  const filteredExistingResults = existingResults.filter(r => {
    if (viewEventFilter === 'ALL') return true;
    return r.remarks === viewEventFilter || r.discipline === viewEventFilter;
  });

  // Unique Events List for Filter
  const uniqueEventNames = Array.from(new Set(existingResults.map(r => r.remarks || r.discipline).filter(Boolean)));

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Title & Description Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold rounded-full text-[10px] uppercase tracking-wider">
              Multi-Race & Score Sync Engine
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold text-[10px]">
              Multi-Match Compatible
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            परिणाम अपलोड व बहु-रेस (Multi-Race) रैंकिंग पोर्टल
          </h1>
          <p className="text-slate-400 text-xs mt-1 max-w-3xl">
            यदि किसी मैच / टूर्नामेंट में बच्चे <strong>एक से अधिक रेस (e.g. 500m, 1000m, Elimination)</strong> खेलते हैं, तो पहले रेसों की संख्या चुनें, फिर आसानी से परिणाम दर्ज करें।
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shrink-0"
        >
          <Download className="w-4 h-4 text-emerald-400" /> बहु-रेस एक्सेल टेंपलेट डाउनलोड करें
        </button>
      </div>

      {/* STEP 1: Tournament Selection Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <label className="block text-xs font-black uppercase text-amber-400 tracking-wider">
          1. परिणाम अपलोड हेतु प्रतियोगिता / टूर्नामेंट चुनें (SELECT TOURNAMENT):
        </label>
        <select
          value={selectedTournamentId}
          onChange={(e) => setSelectedTournamentId(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-extrabold text-white focus:outline-none focus:border-amber-500 cursor-pointer shadow-inner"
        >
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>
              🏆 {t.nameEn} ({t.city}, {t.startDate})
            </option>
          ))}
        </select>
      </div>

      {/* STEP 2: MULTI-RACE MATCH SETUP CONFIGURATION CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/40 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                2. इस मैच / टूर्नामेंट में कुल कितनी रेस आयोजित हुईं? (RACES COUNT IN MATCH)
              </h3>
              <p className="text-slate-400 text-xs">
                (एक ही प्रतियोगिता में बच्चे जितने रेस/इवेंट खेलते हैं, उसकी संख्या सेट करें):
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleTotalRacesChange(num)}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition cursor-pointer border ${
                  totalRacesCount === num
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {num} {num === 1 ? 'रेस' : 'रेस'}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Race Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {raceConfigs.map((race, idx) => (
            <div key={race.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-amber-400 font-mono flex items-center gap-1">
                  <Flag className="w-3.5 h-3.5 text-amber-400" /> रेस #{idx + 1}
                </span>
                <span className="text-[10px] text-slate-500">Event Name</span>
              </div>
              
              <input
                type="text"
                value={race.distance}
                onChange={(e) => handleUpdateRaceConfig(idx, 'distance', e.target.value)}
                placeholder={`रेस ${idx + 1} का नाम (e.g. 500m Rink Race)`}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Zap className="w-4 h-4" /> कुल {totalRacesCount} रेसों के लिए डेटा प्रविष्टि फॉर्म तैयार है!
          </span>
          <button
            type="button"
            onClick={() => setIsRaceConfigured(true)}
            className="text-amber-400 hover:underline font-extrabold cursor-pointer"
          >
            ✓ रेस सेटिंग्स सुरक्षित करें
          </button>
        </div>
      </div>

      {/* Upload Success Alert */}
      {importSuccessMsg && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-600 rounded-2xl text-emerald-200 text-sm font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <span>{importSuccessMsg}</span>
          </div>
          <button
            onClick={() => setImportSuccessMsg(null)}
            className="text-emerald-400 text-xs hover:underline cursor-pointer"
          >
            बंद करें
          </button>
        </div>
      )}

      {/* Main Mode Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('csv')}
          className={`px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'csv'
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Excel / CSV फ़ाइल से बहु-रेस अपलोड
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Plus className="w-4 h-4" /> मैन्युअल टेबल प्रविष्टि ({totalRacesCount} Races Mode)
        </button>

        <button
          onClick={() => setActiveTab('view')}
          className={`px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'view'
              ? 'bg-amber-500 text-slate-950 shadow-lg'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" /> अपलोड किए गए परिणाम देखें ({existingResults.length})
        </button>
      </div>

      {/* TAB 1: CSV BULK UPLOAD */}
      {activeTab === 'csv' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CSV Input */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" /> एक्सेल/CSV डेटा यहाँ कॉपी-पेस्ट करें
              </h3>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Multi-Race CSV Format</span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              यदि कोई स्केटर 2 रेस खेलता है, तो उसके नाम की 2 लाइने (एक 500m के लिए तथा दूसरी 1000m के लिए) नीचे एक्सेल से चिपकाएँ:
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-medium space-y-1">
              <span className="text-amber-400 font-bold block">शामिल कॉलम्स (13 Columns Order):</span>
              <p className="text-[11px] text-slate-400 font-mono">
                Skater Name, Registration Number, <strong>Chest/Bib No</strong>, District, Club, <strong>Discipline</strong>, <strong>Age Group</strong>, <strong>Gender</strong>, <strong>Event (Race Name)</strong>, Position, Medal, Timing, Points
              </p>
            </div>

            <textarea
              rows={11}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500 shadow-inner leading-relaxed whitespace-pre"
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleParseCsv}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" /> डेटा की जाँच करें व पूर्वावलोकन देखें (Validate CSV)
              </button>
            </div>
          </div>

          {/* Validation & Publish */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-400" /> परिणाम पूर्वावलोकन ({parsedRows.length} Race Results)
                </h3>
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-bold">
                  {selectedTour?.nameEn || 'Selected Tournament'}
                </span>
              </div>

              {parsedRows.length === 0 ? (
                <div className="p-12 text-center text-slate-500 italic space-y-2">
                  <FileSpreadsheet className="w-12 h-12 text-slate-700 mx-auto" />
                  <p className="text-xs">
                    बायीं ओर एक्सेल डेटा डालकर "डाटा की जाँच करें" बटन पर क्लिक करें।
                  </p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2 text-xs pr-1">
                  {parsedRows.map((row, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-black text-amber-400 text-sm">#{row.position}</span>
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-mono font-bold text-[11px]">
                            BIB: #{row.bibNumber}
                          </span>
                          <strong className="text-white text-sm">{row.skaterName}</strong>
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded font-extrabold text-[11px]">
                            🏁 {row.distance}
                          </span>
                          {row.medal !== 'None' && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              {row.medal === 'Gold' ? '🥇 Gold' : row.medal === 'Silver' ? '🥈 Silver' : '🥉 Bronze'}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                          <span className="text-slate-200 font-semibold">{row.districtName}</span>
                          <span>•</span>
                          <span>{row.clubName}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-bold">{row.discipline}</span>
                          <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-300 rounded font-medium">{row.ageGroup}</span>
                          <span className="px-1.5 py-0.5 bg-teal-500/10 text-teal-300 rounded font-bold">{row.gender}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800 pt-1 sm:pt-0">
                        <span className="font-mono text-slate-300 text-xs">{row.rawTiming}</span>
                        <span className="font-mono font-black text-emerald-400 text-sm">{row.points} Pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {parsedRows.length > 0 && (
              <button
                type="button"
                onClick={handleSaveCsvResults}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl transition shadow-xl flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <Save className="w-5 h-5 text-amber-300" /> परिणाम सहेजें और सभी रैंकिंग अपडेट करें (Publish & Sync All Ranks)
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MANUAL DIRECT TABLE ENTRY WITH RACE SELECTOR */}
      {activeTab === 'manual' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
          
          {/* Race Selection Sub-Tabs */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                प्रविष्टि हेतु रेस चुनें (SELECT RACE TO ENTER RESULTS):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {raceConfigs.map((race, rIdx) => (
                  <button
                    key={race.id}
                    type="button"
                    onClick={() => setActiveRaceIndex(rIdx)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer border ${
                      activeRaceIndex === rIdx
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{race.title}: <strong>{race.distance}</strong></span>
                    <span className="ml-1 px-1.5 py-0.2 bg-slate-950/40 text-[10px] rounded font-mono">
                      ({(manualRowsByRace[rIdx] || []).length} Skaters)
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Action: Copy Skaters from Race 1 */}
            {activeRaceIndex > 0 && (
              <button
                type="button"
                onClick={handleCopySkatersFromRace1}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" /> रेस 1 के स्केटर्स की लिस्ट यहाँ लाएँ
              </button>
            )}
          </div>

          {/* Active Race Header & Add Skater Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded text-xs">
                  वर्तमान रेस: {raceConfigs[activeRaceIndex]?.distance}
                </span>
                <span className="text-slate-400 text-xs">
                  (यहाँ चेस्ट नं., स्थान, समय एवं मेडल भरें)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddManualRow}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shadow-md"
            >
              <Plus className="w-4 h-4" /> नई पंक्ति जोड़ें (+ Add Skater for {raceConfigs[activeRaceIndex]?.distance})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-200 border-collapse">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">क्र.सं.</th>
                  <th className="p-3 min-w-20">चेस्ट नं. (BIB)</th>
                  <th className="p-3 min-w-36">खिलाड़ी का नाम</th>
                  <th className="p-3 min-w-32">रजिस्ट्रेशन नं.</th>
                  <th className="p-3 min-w-28">जिला</th>
                  <th className="p-3 min-w-32">क्लब / अकादमी</th>
                  <th className="p-3 min-w-32">कैटेगरी (DISCIPLINE)</th>
                  <th className="p-3 min-w-32">एज ग्रुप (AGE GROUP)</th>
                  <th className="p-3 min-w-24">जेंडर (GENDER)</th>
                  <th className="p-3 min-w-20">स्थान</th>
                  <th className="p-3 min-w-24">मेडल</th>
                  <th className="p-3 min-w-24">समय</th>
                  <th className="p-3 min-w-20 text-center">अंक</th>
                  <th className="p-3 text-center">हटाएं</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {currentRaceRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-slate-400">{idx + 1}</td>

                    {/* Chest / Bib No */}
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder="101"
                        value={row.bibNumber || ''}
                        onChange={(e) => handleUpdateManualField(idx, 'bibNumber', e.target.value)}
                        className="w-20 bg-slate-950 border border-amber-500/40 rounded-lg px-2 py-1.5 text-amber-300 font-mono font-bold text-xs text-center focus:outline-none focus:border-amber-400"
                      />
                    </td>

                    {/* Skater Name */}
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder="खिलाड़ी का नाम"
                        value={row.skaterName}
                        onChange={(e) => handleUpdateManualField(idx, 'skaterName', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold text-xs focus:outline-none focus:border-amber-500"
                      />
                    </td>

                    {/* Reg No */}
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder="UPRSA/2026/..."
                        value={row.registrationNumber}
                        onChange={(e) => handleUpdateManualField(idx, 'registrationNumber', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                      />
                    </td>

                    {/* District */}
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder="District"
                        value={row.districtName}
                        onChange={(e) => handleUpdateManualField(idx, 'districtName', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </td>

                    {/* Club */}
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder="Club Name"
                        value={row.clubName}
                        onChange={(e) => handleUpdateManualField(idx, 'clubName', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </td>

                    {/* Category / Discipline */}
                    <td className="p-3">
                      <select
                        value={row.discipline || 'Speed Inline'}
                        onChange={(e) => handleUpdateManualField(idx, 'discipline', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="Speed Inline">Speed Inline</option>
                        <option value="Speed Quad">Speed Quad</option>
                        <option value="Inline Freestyle">Inline Freestyle</option>
                        <option value="Roller Scooter">Roller Scooter</option>
                        <option value="Alpine">Alpine</option>
                        <option value="Skateboarding">Skateboarding</option>
                        <option value="Roller Hockey">Roller Hockey</option>
                      </select>
                    </td>

                    {/* Age Group */}
                    <td className="p-3">
                      <select
                        value={row.ageGroup || 'Sub-Junior: 12 to 15 years'}
                        onChange={(e) => handleUpdateManualField(idx, 'ageGroup', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                      >
                        {ALL_OFFICIAL_AGE_GROUPS.map(ag => (
                          <option key={ag} value={ag}>{ag}</option>
                        ))}
                      </select>
                    </td>

                    {/* Gender */}
                    <td className="p-3">
                      <select
                        value={row.gender || 'Male'}
                        onChange={(e) => handleUpdateManualField(idx, 'gender', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-teal-300 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="Male">Male (पुरुष)</option>
                        <option value="Female">Female (महिला)</option>
                        <option value="Mixed">Mixed</option>
                      </select>
                    </td>

                    {/* Rank / Position */}
                    <td className="p-3">
                      <input
                        type="number"
                        value={row.position}
                        onChange={(e) => handleUpdateManualField(idx, 'position', e.target.value)}
                        className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-amber-400 font-black text-xs text-center focus:outline-none focus:border-amber-500"
                      />
                    </td>

                    {/* Medal */}
                    <td className="p-3">
                      <select
                        value={row.medal}
                        onChange={(e) => handleUpdateManualField(idx, 'medal', e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="None">None</option>
                        <option value="Gold">🥇 Gold</option>
                        <option value="Silver">🥈 Silver</option>
                        <option value="Bronze">🥉 Bronze</option>
                      </select>
                    </td>

                    {/* Timing */}
                    <td className="p-3">
                      <input
                        type="text"
                        placeholder="00:54.00"
                        value={row.rawTiming}
                        onChange={(e) => handleUpdateManualField(idx, 'rawTiming', e.target.value)}
                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-white text-xs text-center focus:outline-none focus:border-amber-500"
                      />
                    </td>

                    {/* Points */}
                    <td className="p-3 font-bold text-emerald-400 text-center font-mono">
                      {row.points} Pts
                    </td>

                    {/* Delete */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveManualRow(idx)}
                        className="p-1.5 bg-slate-950 hover:bg-red-950 text-red-400 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Bar for Manual Save */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              💡 सभी {totalRacesCount} रेसों के परिणाम एक साथ प्रकाशित किए जाएंगे तथा कुल अंक लीडरबोर्ड में जोड़ दिए जाएंगे।
            </span>

            <button
              type="button"
              onClick={handleSaveManualResults}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-3 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <Save className="w-4 h-4" /> सभी बहु-रेस परिणाम सहेजें और प्रकाशित करें (Save All Races & Publish)
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: EXISTING UPLOADED RESULTS VIEW & MANAGEMENT */}
      {activeTab === 'view' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> {selectedTour?.nameEn} — परिणाम सूची ({existingResults.length})
            </h3>
            
            {/* Filter by Event/Race */}
            {uniqueEventNames.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-400" />
                <select
                  value={viewEventFilter}
                  onChange={(e) => setViewEventFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-300 focus:outline-none"
                >
                  <option value="ALL">सभी रेस/इवेंट्स देखें ({existingResults.length})</option>
                  {uniqueEventNames.map(ev => (
                    <option key={ev} value={ev}>🏁 {ev}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {filteredExistingResults.length === 0 ? (
            <div className="p-12 text-center text-slate-500 italic space-y-2">
              <p className="text-sm">इस फिल्टर या टूर्नामेंट के लिए अभी कोई परिणाम उपलब्ध नहीं हैं।</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">स्थान (POS)</th>
                    <th className="p-3 text-center">चेस्ट नं. (BIB)</th>
                    <th className="p-3">खिलाड़ी का नाम</th>
                    <th className="p-3">रेस / इवेंट (RACE)</th>
                    <th className="p-3">जिला (DISTRICT)</th>
                    <th className="p-3">क्लब / अकादमी</th>
                    <th className="p-3">कैटेगरी (DISCIPLINE)</th>
                    <th className="p-3">एज ग्रुप (AGE GROUP)</th>
                    <th className="p-3">जेंडर (GENDER)</th>
                    <th className="p-3">मेडल</th>
                    <th className="p-3">समय</th>
                    <th className="p-3 text-right">अंक (POINTS)</th>
                    <th className="p-3 text-center">हटाएं</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredExistingResults.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/50 transition">
                      <td className="p-3 font-black text-amber-400">#{r.position}</td>
                      
                      {/* Chest / Bib Number */}
                      <td className="p-3 text-center font-mono">
                        <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-black text-xs rounded-lg shadow-sm">
                          #{r.bibNumber || '101'}
                        </span>
                      </td>

                      <td className="p-3 font-extrabold text-white text-sm">{r.skaterName}</td>
                      
                      {/* Race / Event Tag */}
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-300 font-extrabold text-[11px] rounded">
                          🏁 {r.remarks || r.discipline}
                        </span>
                      </td>

                      <td className="p-3 text-slate-200 font-semibold">{r.districtName}</td>
                      <td className="p-3 text-slate-400">{r.clubName}</td>

                      {/* Category / Discipline */}
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-amber-300 rounded text-[11px] font-extrabold">
                          {r.discipline || 'Speed Inline'}
                        </span>
                      </td>

                      {/* Age Group */}
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 rounded text-[11px] font-medium">
                          {r.ageGroup || 'Sub-Junior (12-15 Years)'}
                        </span>
                      </td>

                      {/* Gender */}
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          r.gender === 'Female' 
                            ? 'bg-pink-500/10 text-pink-300 border border-pink-500/30' 
                            : 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                        }`}>
                          {r.gender || 'Male'}
                        </span>
                      </td>

                      <td className="p-3 font-bold">
                        {r.medal === 'Gold' ? '🥇 Gold' : r.medal === 'Silver' ? '🥈 Silver' : r.medal === 'Bronze' ? '🥉 Bronze' : '—'}
                      </td>
                      <td className="p-3 font-mono text-slate-200 font-bold">{r.finalTiming}</td>
                      <td className="p-3 font-black text-emerald-400 text-right">{r.points} Pts</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => setDeletingResultItem(r)}
                          className="p-2 bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700/80 hover:border-red-500/50 transition flex items-center justify-center mx-auto"
                          title="परिणाम डिलीट करें"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DELETE RESULT CONFIRMATION MODAL */}
      {deletingResultItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-center">
            
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">परिणाम डिलीट करें (Delete Result)?</h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                क्या आप वाकई <strong className="text-amber-400">{deletingResultItem.skaterName}</strong> (Chest #{deletingResultItem.bibNumber} - {deletingResultItem.remarks || deletingResultItem.discipline}) का यह परिणाम डिलीट करना चाहते हैं?
              </p>
              <p className="text-[11px] text-red-400 font-semibold bg-red-950/50 p-2 rounded-lg border border-red-800/50">
                ⚠️ ध्यान दें: यह परिणाम रिकॉर्ड से स्थायी रूप से हट जाएगा तथा सभी मेडल एवं लीडरबोर्ड अंक तुरंत अपडेट हो जाएंगे।
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingResultItem(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                onClick={confirmDeleteResult}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> हाँ, डिलीट करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Footer Box */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>अपलोड किया गया परिणाम स्वतः तीन रैंकिंग बोर्ड पर प्रदर्शित होगा: <strong>जिला रैंकिंग, क्लब रैंकिंग एवं स्केटर रैंकिंग</strong>।</span>
        </div>
        <span className="text-amber-400 font-mono font-bold">UPRSA Official Sync Engine</span>
      </div>

    </div>
  );
};
