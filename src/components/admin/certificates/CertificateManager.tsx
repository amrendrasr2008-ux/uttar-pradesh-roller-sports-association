import React, { useState } from 'react';
import { dbStore } from '../../../lib/db';
import { Certificate, CertificateStatus } from '../../../types';
import { downloadElementAsPdf, printElement, exportToCsv, exportToExcel, renderElementToCanvas } from '../../../lib/pdfGenerator';
import { CertificateCardView } from './CertificateCardView';
import { CertificateEditModal } from './CertificateEditModal';
import { CertificateTemplateSettingsModal } from './CertificateTemplateSettingsModal';
import { BulkCertificateGeneratorModal } from './BulkCertificateGeneratorModal';
import { CertificateCSVImportModal } from './CertificateCSVImportModal';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import {
  Award,
  Plus,
  Download,
  Printer,
  ShieldCheck,
  Sparkles,
  Search,
  Filter,
  FileSpreadsheet,
  Sliders,
  Trash2,
  RefreshCw,
  Eye,
  AlertTriangle,
  X,
  FileArchive,
  CheckCircle2,
  ExternalLink,
  Copy,
  Clock,
} from 'lucide-react';

export const CertificateManager: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>(() => dbStore.getCertificates());
  const template = dbStore.getCertificateTemplate();

  // Modals & Active State
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [showCsvImportModal, setShowCsvImportModal] = useState<boolean>(false);
  const [revokeCertTarget, setRevokeCertTarget] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState<string>('Disqualification / Administrative Hold');

  // Multi-select for bulk ZIP / operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<string>('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTournament, setFilterTournament] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const [toastMsg, setToastMsg] = useState<string>('');

  const refreshData = () => {
    setCertificates([...dbStore.getCertificates()]);
  };

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Filter logic
  const filteredCertificates = certificates.filter((cert) => {
    if (filterStatus !== 'all' && cert.status !== filterStatus) return false;
    if (filterType !== 'all' && cert.certificateType !== filterType) return false;
    if (filterDistrict !== 'all' && cert.districtName !== filterDistrict) return false;
    if (filterTournament !== 'all' && cert.tournamentId !== filterTournament) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (cert.skaterName || '').toLowerCase().includes(q);
      const matchNo = (cert.certificateNumber || '').toLowerCase().includes(q);
      const matchReg = cert.registrationNumber?.toLowerCase().includes(q);
      const matchClub = (cert.clubName || '').toLowerCase().includes(q);
      const matchDistrict = (cert.districtName || '').toLowerCase().includes(q);
      return matchName || matchNo || matchReg || matchClub || matchDistrict;
    }

    return true;
  });

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCertificates.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Single PDF Download
  const handleDownloadPdf = async (cert: Certificate) => {
    setPreviewCert(cert);
    setTimeout(async () => {
      const filename = `${cert.certificateNumber}-${cert.skaterName.replace(/\s+/g, '_')}`;
      await downloadElementAsPdf('uprsa-official-certificate-element', filename);
      showNotification(`Downloaded PDF for ${cert.skaterName}!`);
    }, 200);
  };

  // Single Print
  const handlePrint = (cert: Certificate) => {
    setPreviewCert(cert);
    setTimeout(() => {
      printElement('uprsa-official-certificate-element');
    }, 200);
  };

  // Regenerate / Re-issue
  const handleRegenerate = (certId: string) => {
    dbStore.regenerateCertificate(certId);
    refreshData();
    showNotification('Certificate re-issued successfully!');
  };

  // Revoke Handler
  const handleConfirmRevoke = () => {
    if (revokeCertTarget) {
      dbStore.revokeCertificate(revokeCertTarget.id, revokeReason);
      refreshData();
      setRevokeCertTarget(null);
      showNotification(`Certificate ${revokeCertTarget.certificateNumber} has been revoked.`);
    }
  };

  // Delete Handler
  const handleDelete = (id: string) => {
    dbStore.deleteCertificate(id);
    refreshData();
    showNotification('Certificate record deleted.');
  };

  // Bulk ZIP Export
  const handleDownloadZip = async () => {
    const targetCerts = selectedIds.length > 0
      ? certificates.filter((c) => selectedIds.includes(c.id))
      : filteredCertificates;

    if (targetCerts.length === 0) {
      alert('No certificates selected for ZIP download.');
      return;
    }

    setIsZipping(true);
    setZipProgress(`Preparing ${targetCerts.length} certificates...`);

    try {
      const zip = new JSZip();
      const folder = zip.folder('UPRSA_Certificates');

      for (let i = 0; i < targetCerts.length; i++) {
        const cert = targetCerts[i];
        setZipProgress(`Rendering PDF ${i + 1} of ${targetCerts.length}: ${cert.skaterName}`);
        setPreviewCert(cert);

        // await render
        await new Promise((res) => setTimeout(res, 250));

        const elem = document.getElementById('uprsa-official-certificate-element');
        if (elem) {
          const canvas = await renderElementToCanvas(elem, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#0f172a',
          });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height],
          });
          pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
          const pdfArrayBuffer = pdf.output('arraybuffer');

          const cleanFileName = `${cert.certificateNumber}-${cert.skaterName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
          folder?.file(cleanFileName, pdfArrayBuffer);
        }
      }

      setZipProgress('Compressing ZIP file...');
      const content = await zip.generateAsync({ type: 'blob' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `UPRSA_Certificates_Batch_${new Date().toISOString().split('T')[0]}.zip`;
      link.click();

      showNotification(`Successfully exported ${targetCerts.length} certificates into ZIP archive!`);
    } catch (err) {
      console.error('ZIP generation failed:', err);
      alert('ZIP export encountered an error. Please try fewer items or individual downloads.');
    } finally {
      setIsZipping(false);
      setZipProgress('');
    }
  };

  // Export List as Excel
  const handleExportList = () => {
    const exportData = filteredCertificates.map((c) => ({
      Certificate_Number: c.certificateNumber,
      Skater_Name: c.skaterName,
      Registration_Number: c.registrationNumber,
      Parent_Name: c.fatherMotherName,
      District: c.districtName,
      Club: c.clubName,
      Tournament: c.tournamentName,
      Event: c.eventName,
      Discipline: c.discipline,
      Age_Group: c.ageGroup,
      Gender: c.gender,
      Position: c.position,
      Score: c.score || 'N/A',
      Timing: c.timing || 'N/A',
      Status: c.status,
      Issue_Date: c.certificateDate || c.issueDate,
    }));

    exportToExcel('UPRSA_Certificates_Directory', 'Certificates', exportData);
  };

  // Stats
  const totalCount = certificates.length;
  const verifiedCount = certificates.filter((c) => c.status === 'Verified' || c.status === 'Issued').length;
  const meritCount = certificates.filter((c) => c.certificateType === 'Merit').length;
  const revokedCount = certificates.filter((c) => c.status === 'Revoked').length;

  const tournaments = dbStore.getTournaments();
  const districts = dbStore.getDistricts();

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-emerald-950 border border-emerald-600 text-emerald-300 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          {toastMsg}
        </div>
      )}

      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Award className="w-7 h-7 text-amber-400" />
            Certificate Management & Bulk Generator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official UPRSA digital credential management, automated result integration & bulk ZIP export.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <Sliders className="w-4 h-4" /> Template Settings
          </button>

          <button
            onClick={() => setShowCsvImportModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Excel Import
          </button>

          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow"
          >
            <Sparkles className="w-4 h-4" /> Bulk Result Generator
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" /> Issue Certificate
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Certificates</div>
          <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Generated & Managed</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Active / Issued</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{verifiedCount}</div>
          <div className="text-[10px] text-emerald-500/80 mt-1">Issued Credentials</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Merit / Medalists</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{meritCount}</div>
          <div className="text-[10px] text-amber-500/80 mt-1">State Championship Podium</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Revoked / Suspended</div>
          <div className="text-2xl font-black text-red-400 mt-1">{revokedCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Officially Revoked</div>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Name, Cert No, Reg No..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Export & Bulk Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {selectedIds.length > 0 && (
              <span className="text-xs text-amber-400 font-bold px-2">
                {selectedIds.length} Selected
              </span>
            )}

            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            >
              <FileArchive className="w-4 h-4" /> Download ZIP
            </button>

            <button
              onClick={handleExportList}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-emerald-400" /> Export Excel
            </button>
          </div>

        </div>

        {/* Filter Selects Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-slate-800/80">
          <div>
            <select
              value={filterTournament}
              onChange={(e) => setFilterTournament(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300"
            >
              <option value="all">All Tournaments</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300"
            >
              <option value="all">All Districts</option>
              {districts.map((d) => (
                <option key={d.id} value={d.nameEn}>
                  {d.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300"
            >
              <option value="all">All Categories</option>
              <option value="Merit">Merit Certificates</option>
              <option value="Participation">Participation Certificates</option>
              <option value="Official">Official Credentials</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-300 font-bold"
            >
              <option value="all">All Statuses</option>
              <option value="Issued">Issued / Valid</option>
              <option value="Verified">Verified</option>
              <option value="Draft">Draft</option>
              <option value="Revoked">Revoked / Suspended</option>
            </select>
          </div>
        </div>

      </div>

      {/* Zipping Overlay Bar */}
      {isZipping && (
        <div className="p-4 bg-amber-950/80 border border-amber-600 text-amber-200 rounded-2xl flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
            <div>
              <div className="font-bold text-xs">{zipProgress}</div>
              <div className="text-[10px] text-amber-300/80">Rendering high resolution vector PDFs for ZIP archive</div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CERTIFICATES TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      filteredCertificates.length > 0 &&
                      selectedIds.length === filteredCertificates.length
                    }
                    className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                  />
                </th>
                <th className="p-3.5">Certificate Number</th>
                <th className="p-3.5">Skater Details</th>
                <th className="p-3.5">District / Club</th>
                <th className="p-3.5">Event & Discipline</th>
                <th className="p-3.5">Achievement / Position</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                    No certificates found matching your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => {
                  const isSelected = selectedIds.includes(cert.id);
                  const isRev = cert.status === 'Revoked';

                  return (
                    <tr
                      key={cert.id}
                      className={`hover:bg-slate-800/50 transition ${
                        isSelected ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(cert.id)}
                          className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                        />
                      </td>

                      <td className="p-3.5 font-mono font-extrabold text-amber-400">
                        {cert.certificateNumber}
                        <div className="text-[10px] text-slate-500 font-sans font-normal mt-0.5">
                          Date: {cert.certificateDate || cert.issueDate}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-extrabold text-white text-sm">{cert.skaterName}</div>
                        <div className="text-[10px] text-slate-400">
                          Parent: {cert.fatherMotherName} • Reg: <span className="font-mono text-amber-300">{cert.registrationNumber}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-200">{cert.districtName}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{cert.clubName}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-medium text-slate-200">{cert.eventName}</div>
                        <div className="text-[10px] text-slate-400">
                          {cert.discipline} • {cert.ageGroup} ({cert.gender})
                        </div>
                      </td>

                      <td className="p-3.5 font-bold">
                        <span
                          className={
                            cert.position.toLowerCase().includes('gold') || cert.position.toLowerCase().includes('1st')
                              ? 'text-amber-400 font-black'
                              : cert.position.toLowerCase().includes('silver') || cert.position.toLowerCase().includes('2nd')
                              ? 'text-slate-300 font-bold'
                              : cert.position.toLowerCase().includes('bronze') || cert.position.toLowerCase().includes('3rd')
                              ? 'text-amber-600 font-bold'
                              : 'text-emerald-400'
                          }
                        >
                          {cert.position}
                        </span>
                        {cert.timing && (
                          <div className="text-[10px] font-mono text-slate-400">Timing: {cert.timing}</div>
                        )}
                      </td>

                      <td className="p-3.5">
                        {isRev ? (
                          <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Revoked
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3" /> Valid
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* Preview Button */}
                          <button
                            onClick={() => setPreviewCert(cert)}
                            title="Preview Certificate"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Download PDF */}
                          <button
                            onClick={() => handleDownloadPdf(cert)}
                            title="Download PDF"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Print */}
                          <button
                            onClick={() => handlePrint(cert)}
                            title="Print Certificate"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditingCert(cert)}
                            title="Edit Certificate"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          {/* Regenerate Number */}
                          <button
                            onClick={() => handleRegenerate(cert.id)}
                            title="Re-issue Certificate Number"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-orange-400 rounded-lg transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* Revoke */}
                          {!isRev && (
                            <button
                              onClick={() => setRevokeCertTarget(cert)}
                              title="Revoke Certificate"
                              className="p-1.5 bg-slate-800 hover:bg-red-900/60 text-red-400 rounded-lg transition"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(cert.id)}
                            title="Delete Record"
                            className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* PREVIEW CERTIFICATE MODAL */}
      {previewCert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8 text-slate-100">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">
                  Official Certificate Visual Preview: {previewCert.certificateNumber}
                </h2>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(previewCert)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button
                  onClick={() => handlePrint(previewCert)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setPreviewCert(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-x-auto bg-slate-950">
              <CertificateCardView certificate={previewCert} template={template} />
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {(showCreateModal || editingCert) && (
        <CertificateEditModal
          certificate={editingCert}
          onClose={() => {
            setShowCreateModal(false);
            setEditingCert(null);
          }}
          onSaveSuccess={() => {
            refreshData();
            showNotification('Certificate saved successfully!');
          }}
        />
      )}

      {/* TEMPLATE SETTINGS MODAL */}
      {showTemplateModal && (
        <CertificateTemplateSettingsModal
          onClose={() => setShowTemplateModal(false)}
          onSaveSuccess={() => {
            refreshData();
            showNotification('Certificate template updated successfully!');
          }}
        />
      )}

      {/* BULK GENERATOR MODAL */}
      {showBulkModal && (
        <BulkCertificateGeneratorModal
          onClose={() => setShowBulkModal(false)}
          onSuccess={(count) => {
            refreshData();
            showNotification(`Batch generated ${count} certificates!`);
          }}
        />
      )}

      {/* CSV IMPORT MODAL */}
      {showCsvImportModal && (
        <CertificateCSVImportModal
          onClose={() => setShowCsvImportModal(false)}
          onImportSuccess={(count) => {
            refreshData();
            showNotification(`Imported ${count} certificates successfully!`);
          }}
        />
      )}

      {/* REVOKE REASON MODAL */}
      {revokeCertTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-bold text-base">
              <AlertTriangle className="w-5 h-5" /> Revoke Official Certificate
            </div>
            <p className="text-xs text-slate-300">
              You are about to revoke certificate <strong className="text-amber-400">{revokeCertTarget.certificateNumber}</strong> for{' '}
              <strong className="text-white">{revokeCertTarget.skaterName}</strong>. This will permanently mark the certificate status as REVOKED.
            </p>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Reason for Revocation *
              </label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                placeholder="e.g. Disqualification, Invalid DOB, Administrative Hold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRevokeCertTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevoke}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition"
              >
                Revoke Certificate Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
