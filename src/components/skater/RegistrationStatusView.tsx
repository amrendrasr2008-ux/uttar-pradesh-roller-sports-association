import React, { useState } from 'react';
import { dbStore } from '../../lib/db';
import { Skater } from '../../types';
import { Search, ShieldCheck, CheckCircle2, Clock, AlertCircle, FileText, Download, UserCheck, ArrowRight, XCircle } from 'lucide-react';
import { AnnualRegistrationPDF } from './AnnualRegistrationPDF';

interface RegistrationStatusViewProps {
  initialAppId?: string;
  onBack?: () => void;
}

export const RegistrationStatusView: React.FC<RegistrationStatusViewProps> = ({ initialAppId = '', onBack }) => {
  const [query, setQuery] = useState(initialAppId);
  const [searchedSkater, setSearchedSkater] = useState<Skater | null>(() => {
    if (initialAppId) {
      const skaters = dbStore.getSkaters();
      return skaters.find(s => 
        (s.applicationNumber && s.applicationNumber.toUpperCase() === initialAppId.toUpperCase()) ||
        (s.registrationNumber && s.registrationNumber.toUpperCase() === initialAppId.toUpperCase())
      ) || null;
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!query.trim()) {
      setError('Please enter your Application Number or UPRSA Registration Number.');
      return;
    }

    const clean = query.trim().toUpperCase();
    const skaters = dbStore.getSkaters();
    const found = skaters.find(s => 
      (s.applicationNumber && s.applicationNumber.toUpperCase() === clean) ||
      (s.registrationNumber && s.registrationNumber.toUpperCase() === clean) ||
      (s.email && s.email.toUpperCase() === clean) ||
      (s.mobile && s.mobile.includes(clean))
    );

    if (found) {
      setSearchedSkater(found);
    } else {
      setSearchedSkater(null);
      setError(`No registration record found for '${query}'. Please check the Application Number and try again.`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-amber-500" />
            Track Skater Registration Status
          </h1>
          <p className="text-xs text-slate-400">
            Check live application verification status and download official UPRSA registration forms
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            Back
          </button>
        )}
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <label className="block text-xs font-bold text-slate-300">
          Enter Application Number or Registration ID (आवेदन संख्या या पंजीकरण संख्या दर्ज करें)
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. UPRSA-APP-2026-000001 or UPRSA-LKO-00001"
              className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-400 shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shrink-0 flex items-center gap-1.5"
          >
            <span>Search Status</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <p className="text-xs font-semibold text-red-400 bg-red-950/50 p-2.5 rounded-lg border border-red-800/80 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </p>
        )}
      </form>

      {/* Result Display */}
      {searchedSkater && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-6 shadow-xl">
          {/* Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-slate-950/80 border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                searchedSkater.status === 'approved' || searchedSkater.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : searchedSkater.status === 'rejected'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {searchedSkater.status === 'approved' || searchedSkater.status === 'active' ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : searchedSkater.status === 'rejected' ? (
                  <XCircle className="w-8 h-8" />
                ) : (
                  <Clock className="w-8 h-8 animate-pulse" />
                )}
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Current Registration Status</span>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <span>{searchedSkater.status || 'PENDING VERIFICATION'}</span>
                  {searchedSkater.status === 'approved' && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                      Approved & Active
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  {searchedSkater.status === 'approved' || searchedSkater.status === 'active'
                    ? 'Your application has been verified and approved by UPRSA State Association.'
                    : searchedSkater.status === 'rejected'
                    ? `Application rejected. Reason: ${searchedSkater.rejectionReason || 'Documents mismatch'}`
                    : 'Your registration application is currently under review by UPRSA officials.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPdfModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition shadow flex items-center justify-center gap-2 shrink-0"
            >
              <FileText className="w-4 h-4" />
              <span>View Annual Registration PDF</span>
            </button>
          </div>

          {/* Skater Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-center gap-3">
              <img
                src={searchedSkater.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                alt={searchedSkater.name}
                className="w-16 h-20 object-cover rounded-lg border border-slate-700"
              />
              <div className="space-y-1">
                <span className="text-[10px] text-amber-500 font-bold uppercase">Skater Name</span>
                <h4 className="text-sm font-extrabold text-white">{searchedSkater.name}</h4>
                <p className="text-xs text-slate-400">{searchedSkater.ageGroup}</p>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1 text-xs">
              <p><span className="text-slate-400 font-medium">Application Number:</span> <br /><span className="font-mono font-bold text-amber-400">{searchedSkater.applicationNumber || 'N/A'}</span></p>
              <p><span className="text-slate-400 font-medium">UPRSA Registration ID:</span> <br /><span className="font-mono font-bold text-white">{searchedSkater.registrationNumber}</span></p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1 text-xs">
              <p><span className="text-slate-400 font-medium">District Association:</span> <br /><span className="font-bold text-white">{searchedSkater.districtName}</span></p>
              <p><span className="text-slate-400 font-medium">Club / Discipline:</span> <br /><span className="font-bold text-white">{searchedSkater.clubName} ({searchedSkater.discipline})</span></p>
            </div>
          </div>
        </div>
      )}

      {/* PDF View Modal */}
      {showPdfModal && searchedSkater && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md overflow-y-auto p-4 flex items-center justify-center">
          <div className="max-w-4xl w-full my-8">
            <AnnualRegistrationPDF
              skater={searchedSkater}
              onClose={() => setShowPdfModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
