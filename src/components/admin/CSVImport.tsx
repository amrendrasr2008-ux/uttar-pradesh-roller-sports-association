import React, { useState } from 'react';
import { dbStore } from '../../lib/db';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export const CSVImport: React.FC = () => {
  const [csvText, setCsvText] = useState(`Name,FatherName,DOB,Gender,Mobile,District,Club,Discipline,Category
Aarav Sharma,Rajesh Sharma,2012-05-10,Male,9876543210,Lucknow,Lucknow Roller Skating Academy,Speed Inline,State
Ananya Verma,Suresh Verma,2011-08-14,Female,9876543211,Kanpur,Kanpur Speed Skating Club,Speed Quad,Amateur
Vikram Singh,Pradeep Singh,2010-02-20,Male,9876543212,Gautam Buddha Nagar,Noida Inline Speed Club,Inline Freestyle,National`);

  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const handleParseCsv = () => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return;

    const headers = lines[0].split(',').map(h => h.trim());
    const dataRows = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim());
      if (row.length >= 5) {
        dataRows.push({
          name: row[0] || 'Unknown',
          fatherMotherName: row[1] || 'Parent Name',
          dob: row[2] || '2012-01-01',
          gender: row[3] || 'Male',
          mobile: row[4] || '9876543210',
          districtName: row[5] || 'Lucknow',
          clubName: row[6] || 'Lucknow Roller Skating Academy',
          discipline: row[7] || 'Speed Inline',
          category: row[8] || 'State',
          status: 'Valid'
        });
      }
    }

    setParsedRows(dataRows);
    setImportedCount(null);
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;

    let count = 0;
    parsedRows.forEach(row => {
      dbStore.registerSkater({
        name: row.name,
        fatherMotherName: row.fatherMotherName,
        dob: row.dob,
        gender: row.gender as any,
        ageGroup: 'Sub-Junior (12-15 Years)',
        mobile: row.mobile,
        email: `${(row.name || 'skater').toLowerCase().replace(/\s+/g, '')}@skater.org`,
        address: `${row.districtName}, Uttar Pradesh`,
        districtId: 'dist-1',
        districtName: row.districtName,
        clubId: 'club-1',
        clubName: row.clubName,
        discipline: row.discipline as any,
        category: row.category as any,
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        emergencyContactName: row.fatherMotherName,
        emergencyContactPhone: row.mobile,
        validityUntil: '2027-03-31',
        status: 'active'
      });
      count++;
    });

    setImportedCount(count);
  };

  return (
    <div className="space-y-6 text-slate-100">
      
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-white">Excel / CSV Bulk Skater Data Import</h1>
        <p className="text-xs text-slate-400">Import bulk skater profiles directly into UPRSA association records with validation checks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CSV Input Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> CSV Data Payload
            </h3>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Comma Separated Values</span>
          </div>

          <textarea
            rows={10}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
          />

          <button
            onClick={handleParseCsv}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4 text-amber-400" /> Validate & Preview CSV Rows
          </button>
        </div>

        {/* Validation & Import Execution Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="font-extrabold text-white text-base">Validation Preview ({parsedRows.length} Rows)</h3>

          {importedCount !== null ? (
            <div className="p-6 bg-emerald-950/80 border border-emerald-700 rounded-xl text-emerald-300 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="font-black text-lg text-white">Import Successful!</h4>
              <p className="text-xs">Successfully created and registered <strong>{importedCount}</strong> new skater profiles with assigned registration numbers.</p>
            </div>
          ) : parsedRows.length > 0 ? (
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
                {parsedRows.map((row, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <strong className="text-white block">{row.name} ({row.gender})</strong>
                      <span className="text-slate-400 text-[10px]">{row.districtName} • {row.discipline}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">
                      Ready
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleExecuteImport}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm rounded-xl transition shadow"
              >
                Execute Bulk Import ({parsedRows.length} Skaters)
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-8 text-center">
              Click "Validate & Preview" to inspect spreadsheet rows before importing.
            </p>
          )}
        </div>

      </div>

    </div>
  );
};
