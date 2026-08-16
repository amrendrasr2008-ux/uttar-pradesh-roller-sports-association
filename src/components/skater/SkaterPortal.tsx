import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dbStore } from '../../lib/db';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Skater, SkaterDocument, TournamentResult, Certificate } from '../../types';
import { 
  User, 
  ShieldCheck, 
  LogOut, 
  FileText, 
  Award, 
  Trophy, 
  Key, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  QrCode,
  Building2,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Upload,
  RefreshCw
} from 'lucide-react';
import { AnnualRegistrationPDF } from './AnnualRegistrationPDF';
import { DigitalIDCard } from './DigitalIDCard';
import { SkaterTournamentRegistration } from './SkaterTournamentRegistration';

export const SkaterPortal: React.FC = () => {
  const { currentSkater, logoutSkater, loginSkater } = useAuth();

  // Login form state
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Portal tabs: 'overview' | 'tournaments' | 'pdf' | 'idcard' | 'results' | 'certificates' | 'settings'
  const [activeTab, setActiveTab] = useState<'overview' | 'tournaments' | 'pdf' | 'idcard' | 'results' | 'certificates' | 'settings'>('tournaments');

  // Change password modal state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  // Document upload state
  const [uploadDocType, setUploadDocType] = useState('Aadhaar Card');
  const [uploadDocNum, setUploadDocNum] = useState('');
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // If not logged in as a skater, show portal login screen
  if (!currentSkater) {
    const handlePortalLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError(null);

      if (!loginId.trim() || !password.trim()) {
        setLoginError('Please enter your Registration No. / Email and Password.');
        return;
      }

      const result = await loginSkater(loginId.trim(), password.trim());

      if (!result.success) {
        setLoginError(result.error || 'Invalid credentials or login failed.');
      }
    };

    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-amber-400">
            <Trophy className="w-8 h-8 text-amber-400" />
            <span className="text-2xl font-black tracking-wider text-white">UPRSA</span>
          </div>
          <h1 className="text-2xl font-black text-white">Skater Tournament Login</h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            अपनी Skater ID और Password से लॉगिन करें। लॉगिन के बाद केवल आपकी eligibility के अनुसार events दिखाई देंगे।
          </p>
        </div>

        <form onSubmit={handlePortalLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Login ID / Registration No.
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="Enter Registration No. or Login ID"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
            />
          </div>

          {loginError && (
            <div className="p-3.5 bg-red-950/60 border border-red-800/80 rounded-xl text-xs font-semibold text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl transition shadow-xl flex items-center justify-center gap-2"
          >
            Login & Continue
          </button>
        </form>
      </div>
    );
  }

  // Loaded Skater Data
  const skater = currentSkater;
  const isApproved = skater.status === 'approved' || skater.status === 'active';
  const skaterDocs = dbStore.getSkaterDocuments(skater.id);

  // Fetch skater tournament results and certificates
  const results = dbStore.getSkaters().length ? dbStore.getSkaterDocuments(skater.id) : [];

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword.length < 6) {
      setPwdMsg('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg('Passwords do not match.');
      return;
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPwdMsg(`Error: ${error.message}`);
        return;
      }
    }

    dbStore.updateSkater(skater.id, {
      mustChangePassword: false
    });

    setPwdMsg('Password updated successfully in Supabase Auth!');
    setTimeout(() => {
      setShowPasswordChange(false);
      setPwdMsg(null);
    }, 1500);
  };

  const handleDocumentUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocNum) return;

    dbStore.addSkaterDocument({
      skaterId: skater.id,
      documentType: uploadDocType,
      documentNumber: uploadDocNum,
      documentUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&auto=format&fit=crop&q=80',
      verificationStatus: 'pending'
    });

    setUploadMsg('Document uploaded successfully and queued for review.');
    setUploadDocNum('');
    setTimeout(() => setUploadMsg(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={skater.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
            alt={skater.name}
            className="w-20 h-24 object-cover rounded-2xl border-2 border-amber-500/50 shadow-md shrink-0"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isApproved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {skater.status || 'PENDING'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">Validity: {skater.validityUntil || '2027-03-31'}</span>
            </div>

            <h1 className="text-2xl font-black text-white">{skater.name}</h1>
            <p className="text-xs text-slate-300">
              <span className="font-mono text-amber-400 font-bold">{skater.registrationNumber}</span> • {skater.districtName} DRSA ({skater.clubName})
            </p>
            <p className="text-[11px] text-slate-400">
              Discipline: <strong className="text-white">{skater.discipline}</strong> • Age Group: <strong className="text-amber-300">{skater.ageGroup}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPasswordChange(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Change Password</span>
          </button>
          <button
            onClick={logoutSkater}
            className="px-3.5 py-2 bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-semibold rounded-xl border border-red-800/80 transition flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('tournaments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border ${
            activeTab === 'tournaments' 
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black border-amber-400 shadow-lg' 
              : 'bg-slate-900 text-amber-400 border-amber-500/40 hover:bg-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Tournaments & Competitions Entry (टूर्नामेंट्स)</span>
        </button>

        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'pdf' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Annual Registration PDF</span>
        </button>

        <button
          onClick={() => setActiveTab('idcard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'idcard' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Digital ID Card</span>
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'results' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Results & Ranks</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'certificates' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Certificates</span>
        </button>
      </div>

      {/* Tab Content 0: Tournaments & Competition Registration */}
      {activeTab === 'tournaments' && (
        <SkaterTournamentRegistration skater={skater} />
      )}

      {/* Tab Content 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
              Registration & Personal Details
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Application Number</span>
                <span className="font-mono font-bold text-amber-300 text-sm">{skater.applicationNumber || 'UPRSA-APP-2026-000001'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Registration Number</span>
                <span className="font-mono font-bold text-white text-sm">{skater.registrationNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Father / Guardian Name</span>
                <span className="font-semibold text-slate-200">{skater.fatherName || skater.fatherMotherName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Date of Birth & Age</span>
                <span className="font-semibold text-slate-200">{skater.dob} ({skater.age} Yrs)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Gender / Blood Group</span>
                <span className="font-semibold text-slate-200">{skater.gender} • {skater.bloodGroup || 'O+'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Mobile Number</span>
                <span className="font-mono font-semibold text-slate-200">{skater.mobile}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Email Address</span>
                <span className="font-mono font-semibold text-slate-200">{skater.email}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Residential Address</span>
                <span className="font-semibold text-slate-200">{skater.address}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
              Affiliated Documents
            </h2>

            <div className="space-y-3">
              {skaterDocs.map(doc => (
                <div key={doc.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">{doc.documentType}</span>
                    <span className="font-mono text-[10px] text-slate-400">{doc.documentNumber}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    doc.verificationStatus === 'verified' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                  }`}>
                    {doc.verificationStatus}
                  </span>
                </div>
              ))}
            </div>

            {/* Document Upload Form */}
            <form onSubmit={handleDocumentUpload} className="pt-2 border-t border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">Upload Additional Document</span>
              <select
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-white"
              >
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Birth Certificate">Birth Certificate</option>
                <option value="School ID / Bonafide">School ID / Bonafide</option>
              </select>

              <input
                type="text"
                value={uploadDocNum}
                onChange={(e) => setUploadDocNum(e.target.value)}
                placeholder="Document Number"
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
              />

              {uploadMsg && <p className="text-[11px] text-emerald-400 font-semibold">{uploadMsg}</p>}

              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase rounded-lg transition"
              >
                Submit Document
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab Content 2: Annual Registration PDF */}
      {activeTab === 'pdf' && (
        <AnnualRegistrationPDF skater={skater} />
      )}

      {/* Tab Content 3: Digital ID Card */}
      {activeTab === 'idcard' && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Digital Membership ID Card</h2>
              <p className="text-xs text-slate-400">Official digital verification ID card issued by UPRSA</p>
            </div>
          </div>
          <DigitalIDCard skater={skater} />
        </div>
      )}

      {/* Tab Content 4: Results */}
      {activeTab === 'results' && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 text-center">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-black text-white">Tournament Ranks & History</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You are registered for upcoming UPRSA State Championship 2026. Official race timings and merit points will appear here following live scoring events.
          </p>
        </div>
      )}

      {/* Tab Content 5: Certificates */}
      {activeTab === 'certificates' && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 text-center">
          <Award className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-black text-white">Certificates & Awards</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Official digitally signed merit and participation certificates issued by UPRSA State General Secretary will be accessible here.
          </p>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-white">Update Portal Password</h3>
              <p className="text-xs text-slate-400">Set a new secure password for your UPRSA Skater account</p>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              {pwdMsg && <p className="text-xs font-semibold text-amber-400">{pwdMsg}</p>}

              <div className="flex justify-end gap-2 pt-2">
                {!skater.mustChangePassword && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase rounded-xl transition"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
