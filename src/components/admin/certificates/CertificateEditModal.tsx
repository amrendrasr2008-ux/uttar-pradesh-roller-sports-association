import React, { useState } from 'react';
import { Certificate, SkatingDiscipline, AgeGroup, Gender, CertificateType, CertificateStatus } from '../../../types';
import { dbStore } from '../../../lib/db';
import { X, Save, Award, RefreshCw, AlertCircle } from 'lucide-react';

interface CertificateEditModalProps {
  certificate?: Certificate | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export const CertificateEditModal: React.FC<CertificateEditModalProps> = ({
  certificate,
  onClose,
  onSaveSuccess,
}) => {
  const isEditing = !!certificate;
  const template = dbStore.getCertificateTemplate();

  const [formData, setFormData] = useState<Partial<Certificate>>({
    certificateNumber: certificate?.certificateNumber || `${template.numberPrefix}${String(dbStore.getCertificates().length + 1).padStart(6, '0')}`,
    skaterName: certificate?.skaterName || '',
    registrationNumber: certificate?.registrationNumber || '',
    fatherMotherName: certificate?.fatherMotherName || '',
    tournamentName: certificate?.tournamentName || '38th UPRSA UP State Roller Skating Championship 2026',
    tournamentNumber: certificate?.tournamentNumber || 'UPRSA-TR-2026-01',
    eventName: certificate?.eventName || 'Speed Inline 500m Rink Race',
    discipline: certificate?.discipline || 'Speed Inline',
    ageGroup: certificate?.ageGroup || 'Sub-Junior (12-15 Years)',
    gender: certificate?.gender || 'Male',
    position: certificate?.position || '1st Position (Gold Medal)',
    score: certificate?.score || 'Gold Medalist',
    timing: certificate?.timing || '00:48.21',
    clubName: certificate?.clubName || 'Lucknow Roller Skating Academy',
    districtName: certificate?.districtName || 'Lucknow',
    certificateDate: certificate?.certificateDate || new Date().toISOString().split('T')[0],
    certificateType: certificate?.certificateType || 'Merit',
    status: certificate?.status || 'Issued',
  });

  const [errorMsg, setErrorMsg] = useState('');

  const handleSkaterSelect = (skaterId: string) => {
    const skaters = dbStore.getSkaters();
    const sk = skaters.find((s) => s.id === skaterId);
    if (sk) {
      setFormData((prev) => ({
        ...prev,
        skaterId: sk.id,
        skaterName: sk.name,
        registrationNumber: sk.registrationNumber,
        fatherMotherName: sk.fatherMotherName || sk.fatherName || sk.motherName || 'Parent Name',
        clubName: sk.clubName,
        districtName: sk.districtName,
        ageGroup: sk.ageGroup,
        gender: sk.gender,
      }));
    }
  };

  const handleGenerateNextNum = () => {
    const nextCount = dbStore.getCertificates().length + 1;
    const newNum = `${template.numberPrefix}${String(nextCount).padStart(6, '0')}`;
    setFormData((prev) => ({ ...prev, certificateNumber: newNum }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.skaterName?.trim()) {
      setErrorMsg('Skater Name is required.');
      return;
    }
    if (!formData.certificateNumber?.trim()) {
      setErrorMsg('Certificate Number is required.');
      return;
    }

    if (isEditing && certificate) {
      dbStore.updateCertificate(certificate.id, formData);
    } else {
      dbStore.addCertificate(formData);
    }

    onSaveSuccess();
    onClose();
  };

  const skaters = dbStore.getSkaters();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 text-slate-100">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              {isEditing ? 'Edit UPRSA Certificate' : 'Create New Official Certificate'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-700 text-red-300 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              {errorMsg}
            </div>
          )}

          {/* Quick Select Skater */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
            <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              Auto-Fill from Registered Skater Database (Optional):
            </label>
            <select
              onChange={(e) => handleSkaterSelect(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="">-- Choose registered skater to populate fields --</option>
              {skaters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.registrationNumber}) - {s.districtName} [{s.ageGroup}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Certificate Number */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Certificate Number *
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={formData.certificateNumber || ''}
                  onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-amber-400 font-bold text-xs"
                  required
                />
                <button
                  type="button"
                  onClick={handleGenerateNextNum}
                  title="Generate next sequential number"
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Certificate Type */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Certificate Category
              </label>
              <select
                value={formData.certificateType || 'Merit'}
                onChange={(e) => setFormData({ ...formData, certificateType: e.target.value as CertificateType })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              >
                <option value="Merit">Merit / Medal Winner Certificate</option>
                <option value="Participation">Participation Certificate</option>
                <option value="Official">Official / Referee Credential</option>
                <option value="Custom">Custom State Achievement</option>
              </select>
            </div>

            {/* Skater Name */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Skater Full Name *
              </label>
              <input
                type="text"
                value={formData.skaterName || ''}
                onChange={(e) => setFormData({ ...formData, skaterName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-xs"
                placeholder="e.g. Aarav Sharma"
                required
              />
            </div>

            {/* Reg Number */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                UPRSA Reg. Number
              </label>
              <input
                type="text"
                value={formData.registrationNumber || ''}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-mono text-xs"
                placeholder="e.g. UPRSA/2026/01001"
              />
            </div>

            {/* Parent Name */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Father / Mother Name
              </label>
              <input
                type="text"
                value={formData.fatherMotherName || ''}
                onChange={(e) => setFormData({ ...formData, fatherMotherName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                placeholder="e.g. Sanjay Sharma"
              />
            </div>

            {/* Tournament Name */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Tournament Name
              </label>
              <input
                type="text"
                value={formData.tournamentName || ''}
                onChange={(e) => setFormData({ ...formData, tournamentName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>

            {/* Event Name */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Event / Race Name
              </label>
              <input
                type="text"
                value={formData.eventName || ''}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                placeholder="e.g. Speed Inline 500m Rink Race"
              />
            </div>

            {/* Discipline */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Discipline
              </label>
              <select
                value={formData.discipline || 'Speed Inline'}
                onChange={(e) => setFormData({ ...formData, discipline: e.target.value as SkatingDiscipline })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              >
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

            {/* Age Group */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Age Category
              </label>
              <input
                type="text"
                value={formData.ageGroup || ''}
                onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value as AgeGroup })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                placeholder="e.g. Sub-Junior (12-15 Years)"
              />
            </div>

            {/* Position / Achievement */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Position / Achievement
              </label>
              <input
                type="text"
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-bold text-xs"
                placeholder="e.g. 1st Position (Gold Medal)"
              />
            </div>

            {/* Score / Timing */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Timing / Score
              </label>
              <input
                type="text"
                value={formData.timing || ''}
                onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                placeholder="e.g. 00:48.21"
              />
            </div>

            {/* District */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                District Name
              </label>
              <input
                type="text"
                value={formData.districtName || ''}
                onChange={(e) => setFormData({ ...formData, districtName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                placeholder="e.g. Lucknow"
              />
            </div>

            {/* Club */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Club / Academy
              </label>
              <input
                type="text"
                value={formData.clubName || ''}
                onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                placeholder="e.g. Lucknow Roller Skating Academy"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Certificate Issue Date
              </label>
              <input
                type="date"
                value={formData.certificateDate || ''}
                onChange={(e) => setFormData({ ...formData, certificateDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Certificate Status
              </label>
              <select
                value={formData.status || 'Issued'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CertificateStatus })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-bold"
              >
                <option value="Draft">Draft (Not Verified)</option>
                <option value="Generated">Generated</option>
                <option value="Issued">Issued / Valid</option>
                <option value="Verified">Verified</option>
                <option value="Revoked">Revoked / Invalid</option>
              </select>
            </div>

          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4" /> {isEditing ? 'Update Certificate' : 'Create & Issue Certificate'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
