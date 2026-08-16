import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { dbStore } from '../../lib/db';
import { sendSkaterEmail } from '../../lib/emailService';
import { Skater, RegistrationStatus, AgeGroupRule, SkatingDiscipline, Gender, BloodGroup } from '../../types';
import { DigitalIDCard } from '../skater/DigitalIDCard';
import { AnnualRegistrationPDF } from '../skater/AnnualRegistrationPDF';
import { downloadElementAsPdf } from '../../lib/pdfGenerator';
import { getAgeGroupForDob, calculateAge, getDetailedAge, ALL_OFFICIAL_AGE_GROUPS } from '../../lib/ageGroupRules';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Eye, 
  Edit3, 
  Trash2, 
  Printer, 
  Download, 
  RefreshCw, 
  Ban, 
  Award, 
  Calendar, 
  MapPin, 
  Building2, 
  Sliders, 
  X,
  FileCheck,
  FileText,
  ExternalLink,
  Image,
  Upload,
  UserCheck,
  Check,
  Clock,
  Key,
  Lock,
  Mail,
  Send,
  Zap,
  KeyRound
} from 'lucide-react';

export const SkaterDirectory: React.FC = () => {
  const { t } = useLanguage();

  // Helper to reliably download document images (Base64 data URL or external URL)
  const handleDownloadDocument = (docUrl: string, fileName: string) => {
    if (!docUrl) return;
    try {
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      if (docUrl.startsWith('data:')) {
        const parts = docUrl.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'image/jpeg';
        const raw = window.atob(parts[1] || '');
        const uInt8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        const ext = contentType.includes('pdf') ? 'pdf' : contentType.includes('png') ? 'png' : 'jpg';
        link.download = `${cleanFileName}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } else {
        fetch(docUrl)
          .then(res => res.blob())
          .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${cleanFileName}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          })
          .catch(() => {
            const link = document.createElement('a');
            link.href = docUrl;
            link.target = '_blank';
            link.download = `${cleanFileName}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          });
      }
    } catch (err) {
      console.error('Download document error:', err);
      window.open(docUrl, '_blank');
    }
  };

  // Helper to reliably open document in a new browser tab/window
  const handleOpenDocumentNewTab = (docUrl: string) => {
    if (!docUrl) return;
    try {
      if (docUrl.startsWith('data:')) {
        const parts = docUrl.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'image/jpeg';
        const raw = window.atob(parts[1] || '');
        const uInt8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);
        const newWin = window.open(blobUrl, '_blank');
        if (!newWin) {
          const win = window.open('', '_blank');
          if (win) {
            win.document.write(`
              <!DOCTYPE html>
              <html>
                <head><title>UPRSA Document Preview</title></head>
                <body style="margin:0;background:#0f172a;display:flex;justify-content:center;align-items:center;min-height:100vh;color:white;font-family:sans-serif;">
                  <div style="text-align:center;padding:20px;">
                    <img src="${docUrl}" style="max-width:90vw;max-height:85vh;object-fit:contain;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);border:1px solid #334155;"/>
                    <p style="margin-top:16px;color:#cbd5e1;font-size:14px;font-weight:bold;">UPRSA Skater Document</p>
                  </div>
                </body>
              </html>
            `);
          }
        }
      } else {
        window.open(docUrl, '_blank');
      }
    } catch (err) {
      console.error('Open new tab error:', err);
      window.open(docUrl, '_blank');
    }
  };

  const [, setTick] = useState(0);
  React.useEffect(() => {
    return dbStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const skaters = dbStore.getSkaters();
  const districts = dbStore.getDistricts();
  const clubs = dbStore.getClubs();
  const ageGroupRules = dbStore.getAgeGroupRules();

  const [activeTab, setActiveTab] = useState<'directory' | 'pending' | 'age-rules'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedDiscipline, setSelectedDiscipline] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Selected Skater for Modal / Drawer / ID Card Preview
  const [viewSkater, setViewSkater] = useState<Skater | null>(null);
  const [editSkater, setEditSkater] = useState<Skater | null>(null);
  const [previewIdCardSkater, setPreviewIdCardSkater] = useState<Skater | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectionModalSkater, setRejectionModalSkater] = useState<Skater | null>(null);

  // Document Lightbox Preview Modal State
  const [previewDocModal, setPreviewDocModal] = useState<{
    title: string;
    docUrl: string;
    docType: string;
    docNumber?: string;
    skaterName: string;
    docId?: string;
    status?: string;
  } | null>(null);

  // Admin Credentials Management Modal State
  const [manageCredentialsSkater, setManageCredentialsSkater] = useState<Skater | null>(null);
  const [credEmail, setCredEmail] = useState('');
  const [credLoginId, setCredLoginId] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [adminSecurityPassword, setAdminSecurityPassword] = useState('');
  const [credStatusMsg, setCredStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingCreds, setIsSavingCreds] = useState(false);

  const handleOpenCredentialsModal = (s: Skater) => {
    setManageCredentialsSkater(s);
    setCredEmail(s.email || '');
    setCredLoginId(s.loginId || s.registrationNumber || s.applicationNumber || '');
    setCredPassword(s.tempPassword || ('UPRSA#' + Math.floor(1000 + Math.random() * 9000)));
    setAdminSecurityPassword('');
    setCredStatusMsg(null);
  };

  const handleGeneratePassword = () => {
    const generated = 'UPRSA#' + Math.floor(1000 + Math.random() * 9000);
    setCredPassword(generated);
  };

  const handleSaveCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageCredentialsSkater) return;

    if (!adminSecurityPassword.trim()) {
      setCredStatusMsg({ 
        type: 'error', 
        text: 'सुरक्षा हेतु एडमिन पासवर्ड दर्ज करना अनिवार्य है! (Admin security password required)' 
      });
      return;
    }

    if (!credEmail.trim()) {
      setCredStatusMsg({ 
        type: 'error', 
        text: 'रजिस्टर्ड ईमेल आईडी दर्ज करना आवश्यक है! (Registered Email ID required)' 
      });
      return;
    }

    if (!credPassword.trim()) {
      setCredStatusMsg({ 
        type: 'error', 
        text: 'पासवर्ड दर्ज करना आवश्यक है! (Password required)' 
      });
      return;
    }

    setIsSavingCreds(true);
    setCredStatusMsg(null);

    try {
      // 1. Update Skater in Database
      const updated = dbStore.updateSkater(manageCredentialsSkater.id, {
        email: credEmail.trim(),
        loginId: credLoginId.trim() || manageCredentialsSkater.registrationNumber || manageCredentialsSkater.applicationNumber,
        tempPassword: credPassword.trim(),
        mustChangePassword: false
      });

      const targetSkater = updated || manageCredentialsSkater;

      // 2. Dispatch Email with credentials & password
      const emailRes = await sendSkaterEmail({
        to: credEmail.trim(),
        templateKey: 'credentials_set',
        skater: targetSkater,
        customVariables: {
          temp_password: credPassword.trim(),
          login_id: credLoginId.trim() || targetSkater.registrationNumber || targetSkater.applicationNumber
        }
      });

      setIsSavingCreds(false);

      if (emailRes.success) {
        setCredStatusMsg({
          type: 'success',
          text: `✅ आईडी और पासवर्ड सफलतापूर्वक अपडेट कर दिया गया है! रजिस्टर्ड ईमेल (${credEmail.trim()}) पर नया पासवर्ड एवं लॉगिन विवरण भेज दिया गया है।`
        });
      } else {
        setCredStatusMsg({
          type: 'success',
          text: `✅ आईडी व पासवर्ड सेट हो गया है! (ईमेल डिलीवरी स्टेटस: ${emailRes.message || 'Logged in system'})`
        });
      }
    } catch (err: any) {
      setIsSavingCreds(false);
      setCredStatusMsg({
        type: 'error',
        text: `त्रुटि: ${err?.message || 'आईडी पासवर्ड सेट करने में विफल'}`
      });
    }
  };

  // Age Group Rules Editing State
  const [rulesState, setRulesState] = useState<AgeGroupRule[]>(ageGroupRules);

  const filteredSkaters = skaters.filter(s => {
    const matchSearch = 
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.registrationNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.districtName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.clubName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.mobile || '').includes(searchQuery) ||
      (s.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchDist = selectedDistrict === 'ALL' || s.districtName === selectedDistrict;
    const matchDisc = selectedDiscipline === 'ALL' || s.discipline === selectedDiscipline;
    const matchStat = selectedStatus === 'ALL' || s.status === selectedStatus;

    const matchTab = activeTab === 'pending' ? (s.status === 'pending' || s.status === 'verified') : true;

    return matchSearch && matchDist && matchDisc && matchStat && matchTab;
  });

  const pendingCount = skaters.filter(s => s.status === 'pending' || s.status === 'verified').length;

  const handleApprove = (skaterId: string) => {
    const approved = dbStore.approveSkater(skaterId, 'UPRSA Admin');
    if (approved) {
      sendSkaterEmail({
        to: approved.email,
        templateKey: 'registration_approved',
        skater: approved
      }).catch(err => console.error('Approval email dispatch error:', err));
    }
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalSkater) return;
    const rejected = dbStore.rejectSkater(rejectionModalSkater.id, rejectionReasonInput, 'UPRSA Admin');
    if (rejected) {
      sendSkaterEmail({
        to: rejected.email,
        templateKey: 'registration_rejected',
        skater: rejected
      }).catch(err => console.error('Rejection email dispatch error:', err));
    }
    setRejectionModalSkater(null);
    setRejectionReasonInput('');
  };

  const handleDeactivateCard = (skaterId: string) => {
    dbStore.deactivateIDCard(skaterId, 'Admin deactivated card');
  };

  const handleRenewCard = (skaterId: string) => {
    dbStore.renewIDCard(skaterId, '2028-03-31');
  };

  const handleDelete = (skaterId: string) => {
    dbStore.deleteSkater(skaterId);
  };

  const handleSaveEditSkater = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSkater) return;
    dbStore.updateSkater(editSkater.id, editSkater);
    setEditSkater(null);
  };

  const handleSaveAgeRules = () => {
    dbStore.updateAgeGroupRules(rulesState);
    alert('Age Group Automation Rules updated successfully!');
  };

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Directory Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white">UPRSA Skater Directory & ID Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Official registry of skaters across 75 Uttar Pradesh districts, approval workflow, and digital ID card engine.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'directory' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> All Skaters ({skaters.length})
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'pending' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" /> Pending Approvals ({pendingCount})
          </button>

          <button
            onClick={() => setActiveTab('age-rules')}
            className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'age-rules' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-400" /> Age Group Rules
          </button>
        </div>
      </div>

      {activeTab === 'age-rules' ? (
        /* AGE GROUP AUTOMATION RULES PANEL */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white">UPRSA Age Group Rule Engine Configurator</h3>
              <p className="text-xs text-slate-400">Configure minimum and maximum age ranges (in years) for automated age category assignment.</p>
            </div>

            <button
              onClick={handleSaveAgeRules}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow transition"
            >
              Save Rule Configuration
            </button>
          </div>

          <div className="space-y-3">
            {rulesState.map((rule, idx) => (
              <div key={rule.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-xs">
                <div className="md:col-span-4 space-y-1">
                  <span className="font-extrabold text-white text-sm block">{rule.name}</span>
                  <span className="text-[10px] text-slate-400">{rule.description}</span>
                </div>

                <div className="md:col-span-3 flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Min Age:</span>
                  <input
                    type="number"
                    value={rule.minAge}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      const next = [...rulesState];
                      next[idx].minAge = val;
                      setRulesState(next);
                    }}
                    className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-400 font-bold">Years</span>
                </div>

                <div className="md:col-span-3 flex items-center gap-2">
                  <span className="text-slate-400 font-bold">Max Age:</span>
                  <input
                    type="number"
                    value={rule.maxAge}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      const next = [...rulesState];
                      next[idx].maxAge = val;
                      setRulesState(next);
                    }}
                    className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-400 font-bold">Years</span>
                </div>

                <div className="md:col-span-2 text-right">
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded font-mono font-bold text-[10px]">
                    {rule.minAge} to {rule.maxAge} Yrs
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* SKATER DIRECTORY LISTING & FILTERS */
        <div className="space-y-6">
          
          {/* Search & Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, reg #, mobile, email..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* District Filter */}
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Districts ({districts.length})</option>
                {districts.map(d => (
                  <option key={d.id} value={d.nameEn}>{d.nameEn}</option>
                ))}
              </select>

              {/* Discipline Filter */}
              <select
                value={selectedDiscipline}
                onChange={(e) => setSelectedDiscipline(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Disciplines</option>
                <option value="Speed Inline">Speed Inline</option>
                <option value="Speed Quad">Speed Quad</option>
                <option value="Speed Adjustable">Speed Adjustable</option>
                <option value="Speed Toy Inline">Speed Toy Inline</option>
                <option value="Artistic">Artistic</option>
                <option value="Freestyle">Freestyle</option>
                <option value="Roller Hockey">Roller Hockey</option>
                <option value="Skateboarding">Skateboarding</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved / Active</option>
                <option value="rejected">Rejected</option>
              </select>

            </div>
          </div>

          {/* Directory Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Skater & Reg #</th>
                    <th className="p-3.5">Age & Group</th>
                    <th className="p-3.5">District & Club</th>
                    <th className="p-3.5">Discipline</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">ID Card</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {filteredSkaters.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                        No skater records matched the search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSkaters.map(s => {
                      const docs = dbStore.getSkaterDocuments(s.id);
                      return (
                        <tr key={s.id} className="hover:bg-slate-800/50 transition">
                          
                          {/* Skater Name & Reg No */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <img 
                                src={s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
                                alt={s.name} 
                                className="w-9 h-11 rounded object-cover border border-amber-400/60 shrink-0"
                              />
                              <div>
                                <span className="font-extrabold text-white text-sm block">{s.name}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono font-bold text-amber-400 text-[11px]">{s.registrationNumber}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 block mt-0.5">{s.mobile}</span>
                              </div>
                            </div>
                          </td>

                          {/* Age & Group */}
                          <td className="p-3.5 space-y-0.5">
                            <div className="font-bold text-white">{s.dob} ({s.age || 0} Yrs)</div>
                            <div className="text-[10px] text-amber-300 font-medium">{s.ageGroup}</div>
                            <div className="text-[10px] text-slate-400">{s.gender} • {s.bloodGroup || 'O+'}</div>
                          </td>

                          {/* District & Club */}
                          <td className="p-3.5 space-y-0.5">
                            <div className="font-bold text-slate-200">{s.districtName}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{s.clubName}</div>
                            {s.coachName && (
                              <div className="text-[10px] text-emerald-400">Coach: {s.coachName}</div>
                            )}
                          </td>

                          {/* Discipline */}
                          <td className="p-3.5">
                            <span className="font-bold text-amber-300">{s.discipline}</span>
                            <div className="text-[10px] text-slate-400">{s.category}</div>
                          </td>

                          {/* Status */}
                          <td className="p-3.5">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${
                              s.status === 'approved' || s.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : s.status === 'rejected'
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                            }`}>
                              {s.status}
                            </span>
                          </td>

                          {/* ID Card Status */}
                          <td className="p-3.5 space-y-1">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold block w-fit ${
                              s.idCardActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-red-950 text-red-300 border border-red-700'
                            }`}>
                              {s.idCardActive ? '✓ Card Active' : '✕ Card Inactive'}
                            </span>
                            <span className="text-[9px] text-slate-400 block">Until {s.validityUntil || '2027-03-31'}</span>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              
                              {/* View Profile */}
                              <button
                                onClick={() => setViewSkater(s)}
                                title="View Skater Profile"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* View Uploaded Documents */}
                              <button
                                onClick={() => setViewSkater(s)}
                                title="दस्तावेज़ देखें (View Uploaded Documents)"
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg transition flex items-center gap-1 text-[10px] font-bold"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-400" />
                                <span className="hidden lg:inline">दस्तावेज़ ({1 + dbStore.getSkaterDocuments(s.id).length})</span>
                              </button>

                              {/* Preview Digital ID */}
                              <button
                                onClick={() => setPreviewIdCardSkater(s)}
                                title="Digital ID Card Preview & Print"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Skater */}
                              <button
                                onClick={() => setEditSkater(s)}
                                title="Edit Skater Details"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Set ID & Password (एडमिन द्वारा पासवर्ड व ईमेल सेट करें) */}
                              <button
                                onClick={() => handleOpenCredentialsModal(s)}
                                title="आईडी व पासवर्ड सेट करें (Set Portal ID & Password)"
                                className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg transition flex items-center gap-1 font-bold text-[10px]"
                              >
                                <Key className="w-3.5 h-3.5 text-amber-400" />
                                <span className="hidden xl:inline">Pass/ID</span>
                              </button>

                              {/* Approve */}
                              {s.status !== 'approved' && (
                                <button
                                  onClick={() => handleApprove(s.id)}
                                  title="Approve Registration"
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Reject */}
                              {s.status !== 'rejected' && (
                                <button
                                  onClick={() => setRejectionModalSkater(s)}
                                  title="Reject Registration"
                                  className="p-1.5 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 rounded-lg transition"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(s.id)}
                                title="Delete Skater Record"
                                className="p-1.5 bg-slate-950 hover:bg-red-900 text-slate-400 hover:text-white rounded-lg transition"
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

        </div>
      )}

      {/* SKATER FULL PROFILE DRAWER / MODAL */}
      {viewSkater && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative">
            
            <button
              onClick={() => setViewSkater(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-950 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
              <img 
                src={viewSkater.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
                alt={viewSkater.name} 
                className="w-16 h-20 rounded-xl object-cover border-2 border-amber-400"
              />
              <div>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-mono font-bold text-xs rounded border border-amber-500/30">
                  {viewSkater.registrationNumber}
                </span>
                <h2 className="text-xl font-black text-white mt-1">{viewSkater.name}</h2>
                <p className="text-xs text-slate-400">{viewSkater.districtName} • {viewSkater.clubName}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-amber-400 font-bold block uppercase text-[10px]">Personal Information</span>
                <p>Father: <strong className="text-white">{viewSkater.fatherName || viewSkater.fatherMotherName}</strong></p>
                <p>Mother: <strong className="text-white">{viewSkater.motherName || 'N/A'}</strong></p>
                <p>DOB: <strong className="text-white">{viewSkater.dob} ({viewSkater.age || 0} Yrs)</strong></p>
                <p>Gender: <strong className="text-white">{viewSkater.gender}</strong></p>
                <p>Blood Group: <strong className="text-amber-300">{viewSkater.bloodGroup || 'O+'}</strong></p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-amber-400 font-bold block uppercase text-[10px]">Association & Discipline</span>
                <p>District: <strong className="text-white">{viewSkater.districtName}</strong></p>
                <p>Club: <strong className="text-white">{viewSkater.clubName}</strong></p>
                <p>Coach: <strong className="text-emerald-400">{viewSkater.coachName || 'N/A'}</strong></p>
                <p>Discipline: <strong className="text-amber-300">{viewSkater.discipline}</strong></p>
                <p>Age Group: <strong className="text-white">{viewSkater.ageGroup}</strong></p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 sm:col-span-2">
                <span className="text-amber-400 font-bold block uppercase text-[10px]">Contact & Emergency</span>
                <p>Mobile: <strong className="text-white font-mono">{viewSkater.mobile}</strong></p>
                <p>Email: <strong className="text-white">{viewSkater.email}</strong></p>
                <p>Address: <strong className="text-white">{viewSkater.address}</strong></p>
                <p>Emergency Contact: <strong className="text-white">{viewSkater.emergencyContactName} ({viewSkater.emergencyContactPhone})</strong></p>
              </div>

              {/* UPLOADED DOCUMENTS SECTION (अपलोड किए गए दस्तावेज़) */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 sm:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-amber-400 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-amber-400" />
                    अपलोड किए गए दस्तावेज़ (Uploaded Documents)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    कुल दस्तावेज़: {1 + dbStore.getSkaterDocuments(viewSkater.id).length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* 1. Passport Photo */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-white text-[11px] flex items-center gap-1">
                        <Image className="w-3.5 h-3.5 text-amber-400" />
                        पासपोर्ट फ़ोटो
                      </span>
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[9px] rounded border border-emerald-500/30 font-bold">
                        OK
                      </span>
                    </div>

                    <div className="relative group rounded-lg overflow-hidden border border-slate-800 h-28 bg-slate-950 flex items-center justify-center">
                      <img 
                        src={viewSkater.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
                        alt="Passport Photo" 
                        className="max-h-full max-w-full object-cover" 
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewDocModal({
                          title: 'Passport Size Photo (पासपोर्ट साइज़ फोटो)',
                          docUrl: viewSkater.photoUrl,
                          docType: 'Passport Photo',
                          skaterName: viewSkater.name
                        })}
                        className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-amber-300 font-bold text-xs gap-1"
                      >
                        <Eye className="w-4 h-4" /> देखिये (View)
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <span className="text-slate-400 font-mono">Auto 12 KB</span>
                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          onClick={() => handleOpenDocumentNewTab(viewSkater.photoUrl)}
                          className="text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer font-medium"
                          title="नई टैब में खोलें"
                        >
                          <ExternalLink className="w-3 h-3" /> खोलें
                        </button>
                        <span className="text-slate-700">•</span>
                        <button 
                          type="button"
                          onClick={() => handleDownloadDocument(viewSkater.photoUrl, `${viewSkater.name}_Passport_Photo`)}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-0.5 font-bold cursor-pointer"
                          title="डाउनलोड करें"
                        >
                          <Download className="w-3 h-3" /> डाउनलोड
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2 & 3. Uploaded Documents (Aadhaar, Birth Cert, etc) */}
                  {dbStore.getSkaterDocuments(viewSkater.id).map((doc) => (
                    <div key={doc.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="font-bold text-white text-[11px] flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                            {doc.documentType}
                          </span>
                          {doc.documentNumber && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {doc.documentNumber}
                            </span>
                          )}
                        </div>
                        <span className={`px-1.5 py-0.5 font-mono text-[9px] rounded border font-bold ${
                          doc.verificationStatus === 'verified'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : doc.verificationStatus === 'rejected'
                            ? 'bg-red-500/20 text-red-300 border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {doc.verificationStatus === 'verified' ? 'Verified ✓' : doc.verificationStatus === 'rejected' ? 'Rejected ✕' : 'Pending ⏳'}
                        </span>
                      </div>

                      <div className="relative group rounded-lg overflow-hidden border border-slate-800 h-28 bg-slate-950 flex items-center justify-center">
                        <img 
                          src={doc.documentUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80'} 
                          alt={doc.documentType} 
                          className="max-h-full max-w-full object-contain p-1" 
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewDocModal({
                            title: `${doc.documentType} - ${doc.documentNumber || viewSkater.registrationNumber}`,
                            docUrl: doc.documentUrl,
                            docType: doc.documentType,
                            docNumber: doc.documentNumber,
                            skaterName: viewSkater.name,
                            docId: doc.id,
                            status: doc.verificationStatus
                          })}
                          className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-amber-300 font-bold text-xs gap-1 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" /> देखिये (View)
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px]">
                        <span className="text-slate-400 font-mono">10 - 15 KB</span>
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => handleOpenDocumentNewTab(doc.documentUrl)}
                            className="text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer font-medium"
                            title="नई टैब में खोलें"
                          >
                            <ExternalLink className="w-3 h-3" /> खोलें
                          </button>
                          <span className="text-slate-700">•</span>
                          <button 
                            type="button"
                            onClick={() => handleDownloadDocument(doc.documentUrl, `${viewSkater.name}_${doc.documentType}`)}
                            className="text-amber-400 hover:text-amber-300 flex items-center gap-0.5 font-bold cursor-pointer"
                            title="डाउनलोड करें"
                          >
                            <Download className="w-3 h-3" /> डाउनलोड
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                </div>
              </div>

            </div>

            <div className="pt-2 border-t border-slate-800 flex flex-wrap justify-between items-center gap-2 text-xs">
              <span className="text-slate-400">Validity: <strong className="text-white">{viewSkater.validityUntil}</strong></span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleRenewCard(viewSkater.id);
                    setViewSkater(null);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg"
                >
                  Renew ID Validity
                </button>
                <button
                  onClick={() => {
                    handleDeactivateCard(viewSkater.id);
                    setViewSkater(null);
                  }}
                  className="px-3 py-1.5 bg-red-950 text-red-300 font-bold rounded-lg border border-red-800"
                >
                  Deactivate ID
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ID CARD PREVIEW MODAL */}
      {previewIdCardSkater && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 relative">
            <button
              onClick={() => setPreviewIdCardSkater(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-950 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <DigitalIDCard skater={previewIdCardSkater} />
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectionModalSkater && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleRejectSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-black text-white">Reject Skater Registration</h3>
            <p className="text-xs text-slate-400">Specify rejection reason for {rejectionModalSkater.name}</p>

            <textarea
              required
              rows={3}
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="e.g. Invalid document uploaded, DOB mismatch..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModalSkater(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT SKATER MODAL */}
      {editSkater && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveEditSkater} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 relative text-xs">
            
            <button
              type="button"
              onClick={() => setEditSkater(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-950 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white">Edit Skater Details ({editSkater.registrationNumber})</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Skater Name</label>
                <input
                  type="text"
                  value={editSkater.name}
                  onChange={(e) => setEditSkater({ ...editSkater, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold flex items-center justify-between">
                  <span>DOB (जन्म तिथि)</span>
                  <span className="text-[10px] text-amber-400 font-normal">आयु व ग्रुप स्वतः अपडेट होगा</span>
                </label>
                <input
                  type="date"
                  value={editSkater.dob}
                  onChange={(e) => {
                    const newDob = e.target.value;
                    const res = getAgeGroupForDob(newDob, ageGroupRules);
                    setEditSkater({ 
                      ...editSkater, 
                      dob: newDob,
                      age: res.age,
                      ageGroup: res.ageGroup
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              {/* Auto Calculated Age & Age Group Preview */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold flex items-center justify-between">
                  <span>Calculated Age & Age Group</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Auto-Calculated</span>
                </label>
                <div className="p-2.5 bg-slate-950 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-black text-amber-400">{editSkater.age} Yrs</span>
                  <span className="text-[11px] text-emerald-300 font-bold truncate max-w-[200px]">{editSkater.ageGroup}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold flex items-center justify-between">
                  <span>Age Group Category (आयु वर्ग)</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Auto-Locked to DOB</span>
                </label>
                <select
                  value={editSkater.ageGroup}
                  onChange={(e) => setEditSkater({ ...editSkater, ageGroup: e.target.value as any })}
                  className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl p-2.5 text-emerald-300 text-xs font-bold"
                >
                  <option value={editSkater.ageGroup}>
                    🏆 {editSkater.ageGroup} (आधिकारिक श्रेणी)
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Mobile</label>
                <input
                  type="text"
                  value={editSkater.mobile}
                  onChange={(e) => setEditSkater({ ...editSkater, mobile: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Discipline</label>
                <select
                  value={editSkater.discipline}
                  onChange={(e) => setEditSkater({ ...editSkater, discipline: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
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
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditSkater(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl"
              >
                Save Changes
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ADMIN CREDENTIALS SETTING MODAL */}
      {manageCredentialsSkater && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-6 relative text-xs shadow-2xl">
            
            <button
              type="button"
              onClick={() => setManageCredentialsSkater(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-950 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400 shrink-0">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  स्केटर पोर्टल आईडी व पासवर्ड सेट करें (Admin Credentials Generator)
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Set login ID & password for skater portal and dispatch to their registered email.
                </p>
              </div>
            </div>

            {/* Skater Info Badge */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
              <img
                src={manageCredentialsSkater.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                alt={manageCredentialsSkater.name}
                className="w-12 h-14 rounded-xl object-cover border border-amber-400/60 shrink-0"
              />
              <div className="space-y-1">
                <div className="font-extrabold text-white text-sm">{manageCredentialsSkater.name}</div>
                <div className="text-amber-400 font-mono font-bold text-xs">
                  {manageCredentialsSkater.registrationNumber || manageCredentialsSkater.applicationNumber}
                </div>
                <div className="text-slate-400 text-[10px]">
                  {manageCredentialsSkater.districtName} • {manageCredentialsSkater.discipline} • {manageCredentialsSkater.mobile}
                </div>
              </div>
            </div>

            {/* Credential Form */}
            <form onSubmit={handleSaveCredentialsSubmit} className="space-y-4">
              
              {/* Registered Email */}
              <div className="space-y-1.5">
                <label className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-amber-400" />
                  रजिस्टर्ड ईमेल आईडी (Registered Email ID) <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={credEmail}
                  onChange={(e) => setCredEmail(e.target.value)}
                  placeholder="skater@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400">
                  इसी ईमेल आईडी पर नया पासवर्ड और पोर्टल लॉगिन विवरण ऑटोमैटिक भेजा जाएगा।
                </p>
              </div>

              {/* Login ID / Reg No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    लॉगिन आईडी (Login ID / Reg No) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={credLoginId}
                    onChange={(e) => setCredLoginId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                  />
                </div>

                {/* Password Input with Generate Button */}
                <div className="space-y-1.5">
                  <label className="text-slate-200 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-400" />
                      नया पासवर्ड (Password) <span className="text-red-400">*</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[10px] text-amber-400 hover:text-amber-300 underline font-bold flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3 text-amber-400" /> ऑटो जनरेट
                    </button>
                  </label>
                  <input
                    type="text"
                    required
                    value={credPassword}
                    onChange={(e) => setCredPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              {/* Admin Security Password Verification Field */}
              <div className="space-y-1.5 bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-2xl">
                <label className="text-amber-300 font-bold flex items-center gap-1.5 text-xs">
                  <Lock className="w-4 h-4 text-amber-400" />
                  एडमिन सुरक्षा पासवर्ड दर्ज करें (Confirm Admin Security Password) <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={adminSecurityPassword}
                  onChange={(e) => setAdminSecurityPassword(e.target.value)}
                  placeholder="सुरक्षा हेतु एडमिन पासवर्ड दर्ज करें..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400 font-mono text-xs"
                />
                <p className="text-[10px] text-amber-200/80 italic">
                  * प्रशासक सुरक्षा पासवर्ड की पुष्टि के बाद ही ईमेल आईडी सेट होगी व स्केटर को पासवर्ड मेल किया जाएगा।
                </p>
              </div>

              {/* Status Alert Banner */}
              {credStatusMsg && (
                <div className={`p-3.5 rounded-xl border text-xs font-semibold ${
                  credStatusMsg.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-950/80 border-red-500/50 text-red-300'
                }`}>
                  {credStatusMsg.text}
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setManageCredentialsSkater(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition text-xs"
                >
                  बंद करें (Close)
                </button>
                <button
                  type="submit"
                  disabled={isSavingCreds}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold rounded-xl transition flex items-center gap-2 text-xs shadow-lg disabled:opacity-50"
                >
                  {isSavingCreds ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      प्रोसेसिंग व ईमेल भेज रहे हैं...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-slate-950" />
                      आईडी-पासवर्ड सेट करें व ईमेल भेजें
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DOCUMENT LIGHTBOX PREVIEW MODAL */}
      {previewDocModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-4 relative shadow-2xl">
            
            <button
              onClick={() => setPreviewDocModal(null)}
              className="absolute top-4 right-4 p-2.5 text-slate-400 hover:text-white bg-slate-950 rounded-xl border border-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">{previewDocModal.title}</h3>
                <p className="text-xs text-slate-400">
                  स्केटर: <span className="text-amber-300 font-bold">{previewDocModal.skaterName}</span>
                  {previewDocModal.docNumber && ` • दस्तावेज़ संख्या: ${previewDocModal.docNumber}`}
                </p>
              </div>
            </div>

            {/* Document Image Lightbox Container */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex items-center justify-center max-h-[60vh] overflow-hidden">
              <img
                src={previewDocModal.docUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80'}
                alt={previewDocModal.title}
                className="max-h-[55vh] w-auto object-contain rounded-xl border border-slate-800 shadow-xl"
              />
            </div>

            {/* Lightbox Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                {previewDocModal.docId && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        dbStore.verifySkaterDocument(previewDocModal.docId!, 'verified');
                        setPreviewDocModal(prev => prev ? { ...prev, status: 'verified' } : null);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-1 text-xs"
                    >
                      <Check className="w-4 h-4" /> दस्तावेज़ सत्यापित करें (Verify)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        dbStore.verifySkaterDocument(previewDocModal.docId!, 'rejected');
                        setPreviewDocModal(prev => prev ? { ...prev, status: 'rejected' } : null);
                      }}
                      className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 font-bold rounded-xl transition flex items-center gap-1 text-xs"
                    >
                      <Ban className="w-4 h-4" /> अमान्य करें (Reject)
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenDocumentNewTab(previewDocModal.docUrl)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition flex items-center gap-1.5 text-xs cursor-pointer border border-slate-700"
                >
                  <ExternalLink className="w-4 h-4" /> नई टैब में खोलें
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDocument(previewDocModal.docUrl, `${previewDocModal.skaterName}_${previewDocModal.docType}`)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition flex items-center gap-1.5 text-xs shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" /> डाउनलोड करें
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDocModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  बंद करें (Close)
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
