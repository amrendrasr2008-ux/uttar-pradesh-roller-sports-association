import React, { useState } from 'react';
import { dbStore } from '../../../lib/db';
import { CSVImportCertificateRow, Certificate, SkatingDiscipline, AgeGroup, Gender } from '../../../types';
import { exportToCsv } from '../../../lib/pdfGenerator';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ShieldAlert, Download, Edit2, Save } from 'lucide-react';

interface CertificateCSVImportModalProps {
  onClose: () => void;
  onImportSuccess: (count: number) => void;
}

interface ParsedImportRow {
  index: number;
  data: CSVImportCertificateRow;
  isValid: boolean;
  errors: string[];
}

export const CertificateCSVImportModal: React.FC<CertificateCSVImportModalProps> = ({
  onClose,
  onImportSuccess,
}) => {
  const [inputText, setInputText] = useState<string>(
    `Certificate_No,Name,Father_Name,Registration_No,Tournament_Name,Tournament_Number,Event,Discipline,Age_Group,Gender,Position,Score,Timing,Club,District,Certificate_Date
UPRSA-CERT-2026-000101,Rohan Mehta,Vikas Mehta,UPRSA/2026/01005,38th UP State Championship 2026,UPRSA-TR-2026-01,Speed Inline 500m,Speed Inline,Sub-Junior (12-15 Years),Male,1st Position (Gold Medal),Gold Medalist,00:46.12,Lucknow Skating Club,Lucknow,2026-08-10
UPRSA-CERT-2026-000102,Priya Singh,Ramesh Singh,UPRSA/2026/01006,38th UP State Championship 2026,UPRSA-TR-2026-01,Speed Quad 1000m,Speed Quad,Junior (15-18 Years),Female,2nd Position (Silver Medal),Silver Medalist,01:38.45,Kanpur Roller Club,Kanpur,2026-08-10`
  );

  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        setInputText(text);
        parseAndValidateText(text);
      }
    };
    reader.readAsText(file);
  };

  const parseAndValidateText = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return;

    const existingCerts = dbStore.getCertificates();
    const existingCertNums = new Set(existingCerts.map((c) => c.certificateNumber.toUpperCase()));

    const rows: ParsedImportRow[] = [];
    const seenInFileCertNums = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quotes in CSV
      const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, '').trim());

      const dataRow: CSVImportCertificateRow = {
        Certificate_No: cells[0] || '',
        Name: cells[1] || '',
        Father_Name: cells[2] || '',
        Registration_No: cells[3] || '',
        Tournament_Name: cells[4] || '',
        Tournament_Number: cells[5] || '',
        Event: cells[6] || '',
        Discipline: cells[7] || '',
        Age_Group: cells[8] || '',
        Gender: cells[9] || '',
        Position: cells[10] || '',
        Score: cells[11] || '',
        Timing: cells[12] || '',
        Club: cells[13] || '',
        District: cells[14] || '',
        Certificate_Date: cells[15] || new Date().toISOString().split('T')[0],
      };

      const errors: string[] = [];

      if (!dataRow.Name) errors.push('Skater Name missing');
      if (!dataRow.Event) errors.push('Event name missing');
      if (!dataRow.Tournament_Name) errors.push('Tournament Name missing');
      if (!dataRow.District) errors.push('District missing');

      if (dataRow.Certificate_No) {
        const upperNo = dataRow.Certificate_No.toUpperCase();
        if (existingCertNums.has(upperNo)) {
          errors.push(`Duplicate Certificate No in DB (${dataRow.Certificate_No})`);
        }
        if (seenInFileCertNums.has(upperNo)) {
          errors.push(`Duplicate Certificate No in File (${dataRow.Certificate_No})`);
        }
        seenInFileCertNums.add(upperNo);
      }

      rows.push({
        index: i,
        data: dataRow,
        isValid: errors.length === 0,
        errors,
      });
    }

    setParsedRows(rows);
  };

  const handleInlineEditChange = (rowIndex: number, field: keyof CSVImportCertificateRow, value: string) => {
    setParsedRows((prev) =>
      prev.map((row) => {
        if (row.index === rowIndex) {
          const newData = { ...row.data, [field]: value };
          
          // revalidate row
          const errors: string[] = [];
          if (!newData.Name) errors.push('Skater Name missing');
          if (!newData.Event) errors.push('Event name missing');
          if (!newData.Tournament_Name) errors.push('Tournament Name missing');
          if (!newData.District) errors.push('District missing');

          return {
            ...row,
            data: newData,
            isValid: errors.length === 0,
            errors,
          };
        }
        return row;
      })
    );
  };

  const handleImportValidRows = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    const template = dbStore.getCertificateTemplate();
    const prefix = template.numberPrefix || 'UPRSA-CERT-2026-';
    const currentCertCount = dbStore.getCertificates().length;

    const certsToCreate: Partial<Certificate>[] = validRows.map((r, idx) => {
      const d = r.data;
      const certNum = d.Certificate_No || `${prefix}${String(currentCertCount + idx + 1).padStart(6, '0')}`;

      return {
        certificateNumber: certNum,
        skaterName: d.Name,
        registrationNumber: d.Registration_No || `UPRSA/2026/${Math.floor(10000 + Math.random() * 90000)}`,
        fatherMotherName: d.Father_Name || 'Parent Name',
        tournamentName: d.Tournament_Name || '38th UPRSA State Championship 2026',
        tournamentNumber: d.Tournament_Number || 'UPRSA-TR-2026-01',
        eventName: d.Event,
        discipline: (d.Discipline || 'Speed Inline') as SkatingDiscipline,
        ageGroup: (d.Age_Group || 'Sub-Junior (12-15 Years)') as AgeGroup,
        gender: (d.Gender || 'Male') as Gender,
        position: d.Position || 'Participation',
        score: d.Score,
        timing: d.Timing,
        clubName: d.Club || 'Affiliated Club',
        districtName: d.District || 'Lucknow',
        certificateDate: d.Certificate_Date || new Date().toISOString().split('T')[0],
        issueDate: d.Certificate_Date || new Date().toISOString().split('T')[0],
        status: 'Issued' as const,
        verificationCode: certNum,
        certificateType: d.Position?.toLowerCase().includes('position') || d.Position?.toLowerCase().includes('medal') ? 'Merit' : 'Participation',
      };
    });

    dbStore.bulkCreateCertificates(certsToCreate);
    setImportedCount(certsToCreate.length);

    setTimeout(() => {
      onImportSuccess(certsToCreate.length);
      onClose();
    }, 1200);
  };

  const handleDownloadSampleCsv = () => {
    const sampleData = [
      {
        Certificate_No: 'UPRSA-CERT-2026-000501',
        Name: 'Aarav Sharma',
        Father_Name: 'Sanjay Sharma',
        Registration_No: 'UPRSA/2026/01001',
        Tournament_Name: '38th UP State Championship 2026',
        Tournament_Number: 'UPRSA-TR-2026-01',
        Event: 'Speed Inline 500m Rink Race',
        Discipline: 'Speed Inline',
        Age_Group: 'Sub-Junior (12-15 Years)',
        Gender: 'Male',
        Position: '1st Position (Gold Medal)',
        Score: 'Gold Medalist',
        Timing: '00:48.21',
        Club: 'Lucknow Roller Skating Academy',
        District: 'Lucknow',
        Certificate_Date: '2026-08-10',
      },
    ];
    exportToCsv('UPRSA_Certificates_Import_Template', sampleData);
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8 text-slate-100">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              Excel / CSV Certificate Bulk Import Engine
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
        <div className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          
          {importedCount !== null && (
            <div className="p-4 bg-emerald-950/90 border border-emerald-700 text-emerald-300 rounded-xl font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Successfully imported and generated {importedCount} official certificates!
            </div>
          )}

          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Upload CSV/Excel
                <input type="file" accept=".csv, .txt, .xlsx, .xls" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                type="button"
                onClick={() => parseAndValidateText(inputText)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-lg transition"
              >
                Parse & Validate
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" /> Sample CSV Template
            </button>
          </div>

          {/* Paste Input Area */}
          {parsedRows.length === 0 && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Paste Raw CSV / Spreadsheet Data below:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-amber-300 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          )}

          {/* Summary Stats */}
          {parsedRows.length > 0 && (
            <div className="flex items-center justify-between bg-slate-950 p-3 border border-slate-800 rounded-xl">
              <div className="flex gap-4">
                <div>
                  <span className="text-slate-400 font-bold">Total Rows Parsed:</span>{' '}
                  <strong className="text-white text-sm">{parsedRows.length}</strong>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold">Valid Rows:</span>{' '}
                  <strong className="text-emerald-400 text-sm">{validCount}</strong>
                </div>
                {invalidCount > 0 && (
                  <div>
                    <span className="text-red-400 font-bold">Errors / Incomplete:</span>{' '}
                    <strong className="text-red-400 text-sm">{invalidCount}</strong>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setParsedRows([])}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Reset Data
              </button>
            </div>
          )}

          {/* Table Preview & Inline Edit */}
          {parsedRows.length > 0 && (
            <div className="border border-slate-800 rounded-xl overflow-hidden overflow-x-auto shadow-inner bg-slate-950">
              <table className="w-full text-left text-[11px] text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Cert No</th>
                    <th className="p-2.5">Skater Name</th>
                    <th className="p-2.5">Parent</th>
                    <th className="p-2.5">Reg No</th>
                    <th className="p-2.5">Tournament</th>
                    <th className="p-2.5">Event</th>
                    <th className="p-2.5">Position</th>
                    <th className="p-2.5">District</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {parsedRows.map((r) => {
                    const isEditing = editingRowIndex === r.index;
                    return (
                      <tr
                        key={r.index}
                        className={r.isValid ? 'hover:bg-slate-900/60' : 'bg-red-950/20 hover:bg-red-950/30'}
                      >
                        <td className="p-2.5">
                          {r.isValid ? (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-bold uppercase text-[9px] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span
                              title={r.errors.join(', ')}
                              className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded font-bold uppercase text-[9px] inline-flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </td>

                        <td className="p-2.5 font-mono text-amber-400">
                          {isEditing ? (
                            <input
                              type="text"
                              value={r.data.Certificate_No}
                              onChange={(e) => handleInlineEditChange(r.index, 'Certificate_No', e.target.value)}
                              className="w-28 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-amber-400 text-[10px]"
                            />
                          ) : (
                            r.data.Certificate_No || <span className="text-slate-500">Auto-generated</span>
                          )}
                        </td>

                        <td className="p-2.5 font-bold text-white">
                          {isEditing ? (
                            <input
                              type="text"
                              value={r.data.Name}
                              onChange={(e) => handleInlineEditChange(r.index, 'Name', e.target.value)}
                              className="w-28 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white text-[10px]"
                            />
                          ) : (
                            r.data.Name
                          )}
                        </td>

                        <td className="p-2.5">{r.data.Father_Name}</td>
                        <td className="p-2.5 font-mono text-slate-400">{r.data.Registration_No}</td>
                        <td className="p-2.5 truncate max-w-[120px]">{r.data.Tournament_Name}</td>
                        <td className="p-2.5 truncate max-w-[120px]">{r.data.Event}</td>
                        <td className="p-2.5 text-emerald-400 font-bold">{r.data.Position}</td>
                        <td className="p-2.5">{r.data.District}</td>

                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingRowIndex(isEditing ? null : r.index)}
                            className="p-1 hover:bg-slate-800 text-amber-400 rounded transition"
                          >
                            {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleImportValidRows}
              disabled={validCount === 0}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl transition flex items-center gap-1.5 shadow disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> Import & Generate {validCount} Certificates
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
