import React, { useState } from 'react';
import { dbStore } from '../../../lib/db';
import { SkatingDiscipline, AgeGroup, Gender } from '../../../types';
import { X, Sparkles, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface BulkCertificateGeneratorModalProps {
  onClose: () => void;
  onSuccess: (generatedCount: number) => void;
}

export const BulkCertificateGeneratorModal: React.FC<BulkCertificateGeneratorModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const tournaments = dbStore.getTournaments();
  const events = dbStore.getEvents();
  const results = dbStore.getResults();
  const skaters = dbStore.getSkaters();
  const existingCertificates = dbStore.getCertificates();

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournaments[0]?.id || '');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [certType, setCertType] = useState<'Merit' | 'Participation'>('Merit');

  const [isGenerating, setIsGenerating] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter eligible items from results
  const matchingResults = results.filter((res) => {
    if (selectedTournamentId && res.tournamentId !== selectedTournamentId) return false;
    if (selectedEventId !== 'all' && res.eventId !== selectedEventId) return false;

    // find event details
    const ev = events.find((e) => e.id === res.eventId);
    if (ev) {
      if (selectedDiscipline !== 'all' && ev.discipline !== selectedDiscipline) return false;
      if (selectedAgeGroup !== 'all' && ev.ageGroup !== selectedAgeGroup) return false;
      if (selectedGender !== 'all' && ev.gender !== selectedGender) return false;
    }

    if (certType === 'Merit' && res.medal === 'None' && !res.position?.toString().includes('1') && !res.position?.toString().includes('2') && !res.position?.toString().includes('3')) {
      return false;
    }

    return true;
  });

  // Calculate ungenerated count
  const ungeneratedRecords = matchingResults.filter((res) => {
    const existing = existingCertificates.find(
      (c) => c.skaterId === res.skaterId && c.eventId === res.eventId && c.tournamentId === res.tournamentId
    );
    return !existing;
  });

  const handleGenerateAll = () => {
    if (ungeneratedRecords.length === 0) {
      setResultMsg({
        type: 'error',
        text: 'All matching records in this selection already have official certificates generated!',
      });
      return;
    }

    setIsGenerating(true);
    let count = 0;

    const tournament = tournaments.find((t) => t.id === selectedTournamentId);
    const template = dbStore.getCertificateTemplate();
    const prefix = template.numberPrefix || 'UPRSA-CERT-2026-';

    const newCertList = ungeneratedRecords.map((res, index) => {
      count++;
      const certNum = `${prefix}${String(existingCertificates.length + count).padStart(6, '0')}`;
      const ev = events.find((e) => e.id === res.eventId);
      const sk = skaters.find((s) => s.id === res.skaterId);

      const posLabel =
        res.medal !== 'None'
          ? `${res.medal} Medalist (${res.position})`
          : `${res.position} Position`;

      return {
        certificateNumber: certNum,
        skaterId: res.skaterId,
        skaterName: res.skaterName,
        registrationNumber: sk?.registrationNumber || `UPRSA/2026/${Math.floor(10000 + Math.random() * 90000)}`,
        fatherMotherName: sk?.fatherMotherName || sk?.fatherName || sk?.motherName || 'Parent Name',
        tournamentId: res.tournamentId,
        tournamentName: tournament?.nameEn || '38th UPRSA UP State Roller Skating Championship 2026',
        tournamentNumber: tournament?.tournamentNumber || 'UPRSA-TR-2026-01',
        eventId: res.eventId,
        eventName: ev ? `${ev.discipline} ${ev.distance}` : 'Speed Skating Event',
        discipline: (ev?.discipline || 'Speed Inline') as SkatingDiscipline,
        ageGroup: (ev?.ageGroup || sk?.ageGroup || 'Sub-Junior (12-15 Years)') as AgeGroup,
        gender: (ev?.gender || sk?.gender || 'Male') as Gender,
        position: posLabel,
        score: res.medal !== 'None' ? `${res.medal} Winner` : 'Completed',
        timing: res.timing,
        clubName: res.clubName || sk?.clubName || 'Affiliated Club',
        districtName: res.districtName || sk?.districtName || 'Lucknow',
        certificateDate: new Date().toISOString().split('T')[0],
        issueDate: new Date().toISOString().split('T')[0],
        status: 'Issued' as const,
        verificationCode: certNum,
        certificateType: certType,
        createdAt: new Date().toISOString(),
      };
    });

    dbStore.bulkCreateCertificates(newCertList);

    setIsGenerating(false);
    setResultMsg({
      type: 'success',
      text: `Successfully generated ${count} official UPRSA certificates with sequential numbers!`,
    });

    setTimeout(() => {
      onSuccess(count);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 text-slate-100">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              Bulk Certificate Generator Wizard
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          
          {resultMsg && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-2.5 font-bold ${
                resultMsg.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                  : 'bg-red-950/80 border-red-700 text-red-300'
              }`}
            >
              {resultMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              {resultMsg.text}
            </div>
          )}

          {/* Filter Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/50 p-4 border border-slate-800 rounded-xl">
            
            {/* Tournament */}
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Select Tournament / Meet *
              </label>
              <select
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-xs"
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameEn} ({t.startDate})
                  </option>
                ))}
              </select>
            </div>

            {/* Event Filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Event Filter
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs"
              >
                <option value="all">All Events in Tournament</option>
                {events
                  .filter((e) => !selectedTournamentId || e.tournamentId === selectedTournamentId)
                  .map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.discipline} - {ev.distance} ({ev.ageGroup})
                    </option>
                  ))}
              </select>
            </div>

            {/* Certificate Type */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Certificate Category to Generate
              </label>
              <select
                value={certType}
                onChange={(e) => setCertType(e.target.value as 'Merit' | 'Participation')}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-400 font-bold text-xs"
              >
                <option value="Merit">Merit / Podium Certificate (Medalists)</option>
                <option value="Participation">Participation Certificate (All Participants)</option>
              </select>
            </div>

            {/* Discipline */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Discipline
              </label>
              <select
                value={selectedDiscipline}
                onChange={(e) => setSelectedDiscipline(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs"
              >
                <option value="all">All Disciplines</option>
                <option value="Speed Inline">Speed Inline</option>
                <option value="Speed Quad">Speed Quad</option>
                <option value="Speed Adjustable">Speed Adjustable</option>
                <option value="Speed Toy Inline">Speed Toy Inline</option>
                <option value="Artistic">Artistic</option>
                <option value="Freestyle">Freestyle</option>
                <option value="Roller Hockey">Roller Hockey</option>
                <option value="Skateboarding">Skateboarding</option>
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Gender Filter
              </label>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs"
              >
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

          </div>

          {/* Validation Summary Card */}
          <div className="bg-slate-950 p-4 border border-amber-500/30 rounded-xl space-y-2">
            <h3 className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Pre-Generation Validation Summary
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center pt-1">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Matching Race Results</div>
                <div className="text-lg font-black text-white">{matchingResults.length}</div>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Already Generated</div>
                <div className="text-lg font-black text-slate-400">
                  {matchingResults.length - ungeneratedRecords.length}
                </div>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-emerald-800/60 bg-emerald-950/30">
                <div className="text-[10px] text-emerald-400 uppercase font-bold">Ready to Generate</div>
                <div className="text-lg font-black text-emerald-400">{ungeneratedRecords.length}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateAll}
              disabled={isGenerating || ungeneratedRecords.length === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl transition flex items-center gap-2 shadow disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'Generating Certificates...' : `GENERATE ALL ${ungeneratedRecords.length} CERTIFICATES`}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
