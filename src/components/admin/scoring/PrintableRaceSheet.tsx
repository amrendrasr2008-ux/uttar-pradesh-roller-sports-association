import React, { useState } from 'react';
import { dbStore } from '../../../lib/db';
import { Race, RaceParticipant, RaceResult } from '../../../types';
import { Printer, X, FileText } from 'lucide-react';

interface PrintableRaceSheetProps {
  race: Race;
  onClose: () => void;
}

export const PrintableRaceSheet: React.FC<PrintableRaceSheetProps> = ({ race, onClose }) => {
  const [docType, setDocType] = useState<'START_LIST' | 'HEAT_SHEET' | 'QUALIFICATION_LIST' | 'FINAL_A_LIST' | 'RESULT_SHEET'>('START_LIST');

  const participants = dbStore.getRaceParticipants(race.id);
  const results = dbStore.getRaceResults(race.id);
  const tournament = dbStore.getTournaments().find(t => t.id === race.tournamentId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl p-6 space-y-6 text-slate-100 max-h-[90vh] flex flex-col">
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-amber-500" />
            <div>
              <h3 className="font-extrabold text-white text-lg">Race Document Generator (A4 Landscape)</h3>
              <p className="text-xs text-slate-400">Race #{race.raceNumber} - {race.distance} ({race.ageGroup} {race.gender})</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Printer className="w-4 h-4" /> Print Document
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Type Selector Tabs */}
        <div className="flex flex-wrap gap-2 print:hidden">
          {(['START_LIST', 'HEAT_SHEET', 'QUALIFICATION_LIST', 'FINAL_A_LIST', 'RESULT_SHEET'] as const).map(type => (
            <button
              key={type}
              onClick={() => setDocType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                docType === type ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Printable Paper Canvas (A4 Sheet Preview) */}
        <div className="bg-white text-slate-950 p-8 rounded-2xl shadow-2xl overflow-y-auto flex-1 font-sans print:p-0 print:shadow-none print:w-full">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
            <h1 className="text-xl font-black uppercase tracking-wider text-slate-900">
              UTTAR PRADESH ROLLER SKATING ASSOCIATION (UPRSA)
            </h1>
            <p className="text-sm font-bold text-slate-700">
              {tournament?.nameEn || '38th UP State Speed Skating Championship 2026'}
            </p>
            <div className="text-xs font-semibold text-slate-600 flex justify-between pt-2 border-t border-slate-300">
              <span>Event: <strong>{race.distance} ({race.discipline})</strong></span>
              <span>Age & Gender: <strong>{race.ageGroup} - {race.gender}</strong></span>
              <span>Heat / Round: <strong>Heat {race.heatNumber}</strong></span>
              <span>Race #: <strong>{race.raceNumber}</strong></span>
            </div>
          </div>

          <div className="py-4 font-bold text-center text-lg uppercase underline tracking-widest text-slate-900">
            {docType.replace(/_/g, ' ')}
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse border border-slate-400 text-xs mt-2">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-extrabold border-b border-slate-400">
                <th className="p-2 border border-slate-400 text-center">BOX / LANE</th>
                <th className="p-2 border border-slate-400 text-center">BIB #</th>
                <th className="p-2 border border-slate-400">SKATER NAME</th>
                <th className="p-2 border border-slate-400">REGISTRATION ID</th>
                <th className="p-2 border border-slate-400">CLUB / DISTRICT</th>
                {docType === 'RESULT_SHEET' && (
                  <>
                    <th className="p-2 border border-slate-400 text-center">RAW TIME</th>
                    <th className="p-2 border border-slate-400 text-center">PENALTY</th>
                    <th className="p-2 border border-slate-400 text-center">FINAL TIME</th>
                    <th className="p-2 border border-slate-400 text-center">POS</th>
                  </>
                )}
                {docType === 'QUALIFICATION_LIST' && (
                  <th className="p-2 border border-slate-400 text-center">QUAL LABEL</th>
                )}
              </tr>
            </thead>
            <tbody>
              {participants.map((p, idx) => {
                const res = results.find(r => r.skaterId === p.skaterId);
                return (
                  <tr key={p.id} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-400 text-center font-bold">{p.laneNumber}</td>
                    <td className="p-2 border border-slate-400 text-center font-mono font-bold">{p.bibNumber}</td>
                    <td className="p-2 border border-slate-400 font-extrabold">{p.skaterName}</td>
                    <td className="p-2 border border-slate-400 font-mono text-[11px]">{p.registrationNumber}</td>
                    <td className="p-2 border border-slate-400">{p.clubName} ({p.districtName})</td>
                    {docType === 'RESULT_SHEET' && (
                      <>
                        <td className="p-2 border border-slate-400 text-center font-mono">{res?.rawTiming || '00:00.00'}</td>
                        <td className="p-2 border border-slate-400 text-center font-mono">{res?.penaltySeconds ? `+${res.penaltySeconds}s` : '0.00s'}</td>
                        <td className="p-2 border border-slate-400 text-center font-mono font-bold">{res?.finalTiming || '00:00.00'}</td>
                        <td className="p-2 border border-slate-400 text-center font-black">{res?.position || idx + 1}</td>
                      </>
                    )}
                    {docType === 'QUALIFICATION_LIST' && (
                      <td className="p-2 border border-slate-400 text-center font-bold">{res?.remarks || 'Q'}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Signatures */}
          <div className="mt-12 flex items-center justify-between text-xs font-bold pt-8 border-t border-slate-400">
            <div>
              <div className="border-t border-slate-900 w-40 text-center pt-1">Chief Referee</div>
            </div>
            <div>
              <div className="border-t border-slate-900 w-40 text-center pt-1">Official Starter</div>
            </div>
            <div>
              <div className="border-t border-slate-900 w-40 text-center pt-1">Chief Timing Judge</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
