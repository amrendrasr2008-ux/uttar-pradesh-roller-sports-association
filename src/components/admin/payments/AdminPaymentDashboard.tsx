import React, { useState, useEffect } from 'react';
import { dbStore } from '../../../lib/db';
import { sendPaymentConfirmationEmail, sendPaymentRejectionEmail } from '../../../lib/emailService';
import { TournamentPayment, PaymentStatus, Tournament } from '../../../types';
import { 
  CreditCard, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Copy, 
  RefreshCw, 
  AlertTriangle, 
  Send, 
  ShieldCheck, 
  DollarSign,
  Download,
  FileText,
  X,
  ExternalLink
} from 'lucide-react';

export const AdminPaymentDashboard: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>(() => dbStore.getTournaments());
  const [payments, setPayments] = useState<TournamentPayment[]>(() => dbStore.getPayments());

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | PaymentStatus>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [reviewPayment, setReviewPayment] = useState<TournamentPayment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showImageZoomModal, setShowImageZoomModal] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');
  const [copiedUTR, setCopiedUTR] = useState(false);

  const refreshData = () => {
    setTournaments(dbStore.getTournaments());
    setPayments(dbStore.getPayments());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = dbStore.subscribe(refreshData);
    return () => {
      unsubscribe();
    };
  }, []);

  // Filtered Payments
  const filteredPayments = payments.filter(p => {
    if (selectedTournamentId !== 'ALL' && p.tournamentId !== selectedTournamentId) return false;
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const matchName = (p.skaterName || '').toLowerCase().includes(q);
      const matchReg = (p.registrationNumber || '').toLowerCase().includes(q);
      const matchUTR = (p.utrNumber || '').toLowerCase().includes(q);
      const matchDistrict = (p.districtName || '').toLowerCase().includes(q);
      return matchName || matchReg || matchUTR || matchDistrict;
    }
    return true;
  });

  // Calculate Statistics
  const totalSubmissions = payments.length;
  const pendingCount = payments.filter(p => p.status === 'PENDING').length;
  const verifiedCount = payments.filter(p => p.status === 'VERIFIED').length;
  const rejectedCount = payments.filter(p => p.status === 'REJECTED').length;
  const totalVerifiedRevenue = payments
    .filter(p => p.status === 'VERIFIED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleCopyUTR = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUTR(true);
    setTimeout(() => setCopiedUTR(false), 2000);
  };

  const handleVerify = async (payment: TournamentPayment) => {
    setIsProcessing(true);
    setActionSuccessMsg('');
    setActionErrorMsg('');

    try {
      const currentAdmin = dbStore.getAdminCredentials();
      const res = dbStore.verifyTournamentPayment(payment.id, currentAdmin.username);

      if (!res.success || !res.payment) {
        setActionErrorMsg(res.error || 'भुगतान सत्यापित करने में विफल।');
        setIsProcessing(false);
        return;
      }

      // Find skater email
      const skater = dbStore.getSkaterById(payment.skaterId);
      const skaterEmail = skater?.email || `${payment.registrationNumber}@uprsa.org`;

      // Trigger Email
      const emailRes = await sendPaymentConfirmationEmail({
        to: skaterEmail,
        skaterName: payment.skaterName || skater?.name || 'Skater',
        registrationNumber: payment.registrationNumber || skater?.registrationNumber || 'PENDING',
        tournamentName: payment.tournamentName || 'Tournament',
        amount: payment.amount,
        utrNumber: payment.utrNumber,
        verifiedAt: res.payment.verifiedAt || new Date().toISOString()
      });

      if (!emailRes.success) {
        setActionSuccessMsg(`भुगतान सत्यापित हो गया! (नोट: ईमेल प्रेषण विफल रहा: ${emailRes.message || 'Network error'})`);
      } else {
        setActionSuccessMsg('भुगतान सफलतापूर्वक सत्यापित (VERIFIED) हो गया तथा पुष्टिकरण ईमेल भेजा गया!');
      }

      setReviewPayment(res.payment);
      refreshData();
    } catch (err: any) {
      setActionErrorMsg(err?.message || 'त्रुटि हुई।');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewPayment) return;

    if (!rejectionReason.trim()) {
      setActionErrorMsg('अस्वीकृति का कारण (Rejection Reason) दर्ज करना अनिवार्य है।');
      return;
    }

    setIsProcessing(true);
    setActionSuccessMsg('');
    setActionErrorMsg('');

    try {
      const currentAdmin = dbStore.getAdminCredentials();
      const res = dbStore.rejectTournamentPayment(reviewPayment.id, rejectionReason.trim(), currentAdmin.username);

      if (!res.success || !res.payment) {
        setActionErrorMsg(res.error || 'भुगतान अस्वीकृत करने में विफल।');
        setIsProcessing(false);
        return;
      }

      const skater = dbStore.getSkaterById(reviewPayment.skaterId);
      const skaterEmail = skater?.email || `${reviewPayment.registrationNumber}@uprsa.org`;

      // Trigger Rejection Email
      await sendPaymentRejectionEmail({
        to: skaterEmail,
        skaterName: reviewPayment.skaterName || skater?.name || 'Skater',
        registrationNumber: reviewPayment.registrationNumber || skater?.registrationNumber || 'PENDING',
        tournamentName: reviewPayment.tournamentName || 'Tournament',
        amount: reviewPayment.amount,
        utrNumber: reviewPayment.utrNumber,
        rejectionReason: rejectionReason.trim()
      });

      setActionSuccessMsg('भुगतान अस्वीकृत (REJECTED) किया गया एवं स्केटर को सूचना भेजी गई।');
      setShowRejectModal(false);
      setRejectionReason('');
      setReviewPayment(res.payment);
      refreshData();
    } catch (err: any) {
      setActionErrorMsg(err?.message || 'त्रुटि हुई।');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendEmail = async (payment: TournamentPayment) => {
    setIsProcessing(true);
    setActionSuccessMsg('');
    setActionErrorMsg('');

    try {
      const skater = dbStore.getSkaterById(payment.skaterId);
      const skaterEmail = skater?.email || `${payment.registrationNumber}@uprsa.org`;

      if (payment.status === 'VERIFIED') {
        const emailRes = await sendPaymentConfirmationEmail({
          to: skaterEmail,
          skaterName: payment.skaterName || skater?.name || 'Skater',
          registrationNumber: payment.registrationNumber || skater?.registrationNumber || 'PENDING',
          tournamentName: payment.tournamentName || 'Tournament',
          amount: payment.amount,
          utrNumber: payment.utrNumber,
          verifiedAt: payment.verifiedAt || new Date().toISOString()
        });
        if (emailRes.success) {
          setActionSuccessMsg('पुष्टिकरण ईमेल पुनः सफलतापूर्वक भेजा गया!');
        } else {
          setActionErrorMsg(`ईमेल प्रेषण विफल: ${emailRes.message}`);
        }
      }
    } catch (err: any) {
      setActionErrorMsg(err?.message || 'ईमेल भेजने में विफल।');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">QR भुगतान सत्यापन डैशबोर्ड (Manual UPI Verification)</h2>
            <p className="text-xs text-slate-400">Review, verify UTR / Transaction IDs, and confirm tournament registrations</p>
          </div>
        </div>
        <button
          onClick={refreshData}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700 transition flex items-center space-x-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>रिफ्रेश डाटा</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">कुल आवेदन</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalSubmissions}</p>
          <p className="text-[10px] text-slate-500 mt-1">Total Submissions</p>
        </div>

        <div className="p-4 bg-slate-900 border border-amber-500/30 bg-amber-500/5 rounded-2xl">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold">सत्यापन लंबित</span>
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
          <p className="text-[10px] text-amber-300/70 mt-1">Pending Verification</p>
        </div>

        <div className="p-4 bg-slate-900 border border-emerald-500/30 bg-emerald-500/5 rounded-2xl">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold">सत्यापित भुगतान</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{verifiedCount}</p>
          <p className="text-[10px] text-emerald-300/70 mt-1">Verified Payments</p>
        </div>

        <div className="p-4 bg-slate-900 border border-rose-500/30 bg-rose-500/5 rounded-2xl">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-bold">अस्वीकृत</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400">{rejectedCount}</p>
          <p className="text-[10px] text-rose-300/70 mt-1">Rejected Payments</p>
        </div>

        <div className="p-4 bg-slate-900 border border-blue-500/30 bg-blue-500/5 rounded-2xl col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-blue-400 mb-2">
            <span className="text-xs font-bold">कुल सत्यापित राशि</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400">₹{totalVerifiedRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-blue-300/70 mt-1">Verified Revenue</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedStatus === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              सभी ({totalSubmissions})
            </button>
            <button
              onClick={() => setSelectedStatus('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                selectedStatus === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>लंबित</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedStatus('VERIFIED')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              सत्यापित ({verifiedCount})
            </button>
            <button
              onClick={() => setSelectedStatus('REJECTED')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedStatus === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              अस्वीकृत ({rejectedCount})
            </button>
          </div>

          {/* Tournament & Search Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">सभी टूर्नामेंट (All Tournaments)</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.nameEn}</option>
              ))}
            </select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="खोजें (Name, Reg #, UTR...)"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">दिनांक / समय</th>
                <th className="px-4 py-3.5">स्केटर विवरण</th>
                <th className="px-4 py-3.5">टूर्नामेंट</th>
                <th className="px-4 py-3.5">12-अंक UTR ID</th>
                <th className="px-4 py-3.5">शुल्क राशि</th>
                <th className="px-4 py-3.5">स्थिति</th>
                <th className="px-4 py-3.5 text-right">कार्रवाई</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">कोई रिकॉर्ड नहीं मिला (No payment records match filters)</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                      {new Date(payment.submittedAt).toLocaleDateString()}<br/>
                      <span className="text-[10px] text-slate-500">{new Date(payment.submittedAt).toLocaleTimeString()}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-white text-sm">{payment.skaterName}</p>
                      <p className="text-[10px] font-mono text-emerald-400">{payment.registrationNumber}</p>
                      <p className="text-[10px] text-slate-400">{payment.districtName} • {payment.clubName}</p>
                    </td>
                    <td className="px-4 py-3.5 max-w-[180px]">
                      <p className="truncate font-medium text-slate-300">{payment.tournamentName}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-amber-400 font-bold whitespace-nowrap">
                      {payment.utrNumber}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-400 text-sm whitespace-nowrap">
                      ₹{payment.amount}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {payment.status === 'PENDING' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3 h-3 mr-1 animate-pulse" />
                          PENDING
                        </span>
                      )}
                      {payment.status === 'VERIFIED' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          VERIFIED
                        </span>
                      )}
                      {payment.status === 'REJECTED' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <XCircle className="w-3 h-3 mr-1" />
                          REJECTED
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setReviewPayment(payment)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition inline-flex items-center space-x-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>समीक्षा करें (Review)</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Verification Modal */}
      {reviewPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-100">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">भुगतान सत्यापन समीक्षा (Payment Proof Review)</h3>
                  <p className="text-xs text-slate-400">Review UTR, screenshot, and update payment status</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setReviewPayment(null);
                  setActionSuccessMsg('');
                  setActionErrorMsg('');
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Feedback messages */}
              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{actionSuccessMsg}</span>
                </div>
              )}
              {actionErrorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{actionErrorMsg}</span>
                </div>
              )}

              {/* Grid Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">स्केटर विवरण (Skater Details)</h4>
                  <p className="text-sm font-bold text-white">{reviewPayment.skaterName}</p>
                  <p className="font-mono text-emerald-400 font-bold">{reviewPayment.registrationNumber}</p>
                  <p className="text-slate-400">{reviewPayment.districtName} • {reviewPayment.clubName}</p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">टूर्नामेंट व शुल्क (Tournament & Fee)</h4>
                  <p className="font-semibold text-slate-200">{reviewPayment.tournamentName}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400">जमा राशि:</span>
                    <span className="text-base font-black text-emerald-400">₹{reviewPayment.amount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">जमा करने की तिथि:</span>
                    <span className="text-slate-300">{new Date(reviewPayment.submittedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* UTR Number Banner */}
              <div className="p-4 bg-slate-950 border border-amber-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">12-Digit UTR / Transaction ID</p>
                  <p className="text-xl font-mono font-black text-amber-300 tracking-wider mt-0.5">{reviewPayment.utrNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyUTR(reviewPayment.utrNumber)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>{copiedUTR ? 'Copied!' : 'Copy UTR'}</span>
                </button>
              </div>

              {/* Payment Screenshot Preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">भुगतान प्रमाण पत्र (Payment Proof Screenshot)</h4>
                {reviewPayment.screenshotUrl || reviewPayment.screenshotStoragePath ? (
                  <div className="relative group bg-slate-950 border border-slate-800 rounded-xl p-2 flex justify-center items-center">
                    <img 
                      src={reviewPayment.screenshotUrl || `https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80`}
                      alt="Payment Screenshot"
                      className="max-h-64 object-contain rounded-lg border border-slate-800 shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setShowImageZoomModal(reviewPayment.screenshotUrl || '')}
                      className="absolute bottom-4 right-4 px-3 py-1.5 bg-slate-900/90 text-white text-xs font-bold rounded-lg border border-slate-700 shadow flex items-center space-x-1.5 hover:bg-slate-800 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>ज़ूम करें (Zoom)</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-center text-slate-500 text-xs">
                    कोई स्क्रीनशॉट उपलब्ध नहीं है (No screenshot uploaded)
                  </div>
                )}
              </div>

              {/* Rejection reason display if rejected */}
              {reviewPayment.status === 'REJECTED' && reviewPayment.rejectionReason && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                  <strong>अस्वीकृति का कारण:</strong> {reviewPayment.rejectionReason}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                
                {reviewPayment.status === 'VERIFIED' ? (
                  <div className="flex items-center space-x-3 w-full justify-between">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>भुगतान पहले ही सत्यापित हो चुका है</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResendEmail(reviewPayment)}
                      disabled={isProcessing}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      <span>पुष्टिकरण ईमेल पुनः भेजें</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(true)}
                      disabled={isProcessing}
                      className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 transition flex items-center space-x-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>भुगतान अस्वीकृत करें (Reject Payment)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVerify(reviewPayment)}
                      disabled={isProcessing}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-2"
                    >
                      {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>सत्यापित करें (VERIFY PAYMENT)</span>
                    </button>
                  </>
                )}

              </div>

            </div>

          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 text-slate-100 shadow-2xl">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              <span>भुगतान अस्वीकृति का कारण (Rejection Reason)</span>
            </h4>
            <p className="text-xs text-slate-400">
              कृपया स्केटर को सूचित करने के लिए स्पष्ट कारण दर्ज करें (यह कारण ईमेल में भेजा जाएगा)।
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="उदा. UTR नंबर मिलान नहीं हुआ, अमान्य स्क्रीनशॉट, या अधूरा भुगतान..."
                className="w-full h-24 p-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-600 focus:outline-none focus:border-rose-500"
                required
              />

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow transition"
                >
                  अस्वीकृत करें (Reject)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {showImageZoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto bg-slate-900 p-2 rounded-2xl border border-slate-700">
            <button
              onClick={() => setShowImageZoomModal(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-full transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={showImageZoomModal} alt="Zoomed Proof" className="max-w-full max-h-[85vh] object-contain rounded-xl mx-auto" />
          </div>
        </div>
      )}

    </div>
  );
};
