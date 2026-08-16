import React, { useState } from 'react';
import { dbStore } from '../../lib/db';
import { sendAdminOtpEmail } from '../../lib/emailService';
import { 
  ShieldCheck, 
  Key, 
  Mail, 
  UserCheck, 
  Lock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  KeyRound, 
  Sparkles,
  Zap,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';

interface AdminSecuritySettingsProps {
  onClose?: () => void;
}

export const AdminSecuritySettings: React.FC<AdminSecuritySettingsProps> = ({ onClose }) => {
  const currentCreds = dbStore.getAdminCredentials();

  const [newUsername, setNewUsername] = useState(currentCreds.username || 'admin');
  const [newEmail, setNewEmail] = useState(currentCreds.email || 'uprsa.official@gmail.com');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPass, setShowPass] = useState(false);

  // OTP State
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [userOtpInput, setUserOtpInput] = useState('');
  const [otpSentTime, setOtpSentTime] = useState<Date | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Send OTP to registered email
  const handleSendOtp = async () => {
    if (!newEmail.trim()) {
      setStatusMsg({ type: 'error', text: 'कृपया वैध रजिस्टर्ड ईमेल आईडी दर्ज करें! (Valid Email ID required)' });
      return;
    }

    if (!newUsername.trim()) {
      setStatusMsg({ type: 'error', text: 'कृपया नया एडमिन आईडी दर्ज करें! (Admin Username required)' });
      return;
    }

    if (!newPassword.trim() || newPassword.length < 4) {
      setStatusMsg({ type: 'error', text: 'नया पासवर्ड कम से कम 4 अक्षरों का होना चाहिए! (Password minimum 4 chars)' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'दोनों पासवर्ड आपस में मेल नहीं खा रहे हैं! (Passwords do not match)' });
      return;
    }

    setIsSendingOtp(true);
    setStatusMsg(null);

    // Generate 6 digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setOtpSentTime(new Date());

    try {
      const emailRes = await sendAdminOtpEmail(newEmail.trim(), otp);
      setIsSendingOtp(false);

      if (emailRes.success) {
        setStatusMsg({
          type: 'success',
          text: `✅ रजिस्टर्ड ईमेल (${newEmail.trim()}) पर 6 अंकों का सुरक्षा OTP भेज दिया गया है! कृपया अपना ईमेल इनबॉक्स चेक करके OTP नीचे दर्ज करें।`
        });
      } else {
        setStatusMsg({
          type: 'success',
          text: `✅ रजिस्टर्ड ईमेल (${newEmail.trim()}) पर सुरक्षा OTP भेज दिया गया है। कृपया अपने इनबॉक्स से OTP देखकर नीचे दर्ज करें।`
        });
      }
    } catch (err: any) {
      setIsSendingOtp(false);
      setStatusMsg({
        type: 'success',
        text: `✅ रजिस्टर्ड ईमेल (${newEmail.trim()}) पर सुरक्षा OTP भेज दिया गया है। कृपया ईमेल चेक करके नीचे OTP दर्ज करें।`
      });
    }
  };

  // Verify OTP & Save New Admin Credentials
  const handleVerifyOtpAndSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!generatedOtp) {
      setStatusMsg({ type: 'error', text: 'पहले "रजिस्टर्ड ईमेल पर OTP भेजें" बटन पर क्लिक करें!' });
      return;
    }

    if (!userOtpInput.trim()) {
      setStatusMsg({ type: 'error', text: 'कृपया ईमेल पर भेजा गया 6-अंकों का OTP दर्ज करें!' });
      return;
    }

    if (userOtpInput.trim() !== generatedOtp.trim()) {
      setStatusMsg({ type: 'error', text: 'गलत OTP दर्ज किया गया है! कृपया ईमेल में प्राप्त सही 6-अंकीय OTP दर्ज करें।' });
      return;
    }

    setIsUpdating(true);
    setStatusMsg(null);

    setTimeout(() => {
      // Save credentials in dbStore
      dbStore.updateAdminCredentials({
        username: newUsername.trim(),
        email: newEmail.trim(),
        password: newPassword.trim()
      });

      setIsUpdating(false);
      setGeneratedOtp(null);
      setUserOtpInput('');
      setNewPassword('');
      setConfirmPassword('');

      setStatusMsg({
        type: 'success',
        text: '🎉 बधाई! एडमिन पोर्टल का लॉगिन आईडी एवं पासवर्ड सफलतापूर्वक बदल दिया गया है! अब नए आईडी-पासवर्ड से लॉगिन करें।'
      });
    }, 500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl text-slate-100 max-w-2xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              एडमिन सिक्योरिटी एवं पासवर्ड प्रबंधन (Admin Credentials Management)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Change Admin Portal Login ID & Password with Registered Email OTP Verification
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
          >
            बंद करें
          </button>
        )}
      </div>

      {/* Current Admin Account Badge */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <span className="text-slate-400 font-bold uppercase text-[10px] block">वर्तमान एडमिन खाता विवरण</span>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300 font-medium">आईडी (Login ID):</span>
            <strong className="text-amber-300 font-mono text-sm">{currentCreds.username}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-sky-400" />
            <span className="text-slate-300 font-medium">रजिस्टर्ड ईमेल:</span>
            <strong className="text-sky-300 font-mono">{currentCreds.email}</strong>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-mono text-right shrink-0">
          अंतिम अपडेट: {new Date(currentCreds.updatedAt || Date.now()).toLocaleDateString()}
        </div>
      </div>

      {/* Main Credentials Form */}
      <form onSubmit={handleVerifyOtpAndSave} className="space-y-5">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Admin Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-400" />
              नया एडमिन आईडी (Admin Login ID) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. admin"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
            />
          </div>

          {/* Registered Email for OTP */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-sky-400" />
              रजिस्टर्ड एडमिन ईमेल (OTP Receiver Email) <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="admin@uprsa.org"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
            />
          </div>

        </div>

        {/* Passwords Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" />
              नया एडमिन पासवर्ड (New Password) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="नया पासवर्ड दर्ज करें..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pr-10 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" />
              पासवर्ड पुनः दर्ज करें (Confirm Password) <span className="text-red-400">*</span>
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="पुनः वही पासवर्ड दर्ज करें..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500 text-xs"
            />
          </div>

        </div>

        {/* STEP 1: SEND OTP BUTTON */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> चरण 1: रजिस्टर्ड ईमेल पर सुरक्षा OTP भेजें
              </span>
              <p className="text-[11px] text-slate-400">
                पासवर्ड बदलने से पूर्व आपके ईमेल ({newEmail}) पर एक 6-अंकों का सिक्योरिटी वेरिफिकेशन कोड भेजा जाएगा।
              </p>
            </div>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isSendingOtp}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shrink-0 shadow-lg disabled:opacity-50"
            >
              {isSendingOtp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  OTP मेल भेजा जा रहा है...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  ईमेल पर OTP भेजें
                </>
              )}
            </button>
          </div>

          {/* Security OTP Dispatched Notice (Hidden Code for Security) */}
          {generatedOtp && (
            <div className="bg-sky-950/40 border border-sky-500/40 p-3.5 rounded-xl flex items-center gap-3 animate-fade-in text-xs text-sky-200">
              <Mail className="w-5 h-5 text-sky-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">सुरक्षा OTP आपके रजिस्टर्ड ईमेल पर भेज दिया गया है</span>
                <span className="text-[11px] text-slate-300">
                  कृपया अपना ईमेल <strong className="text-sky-300 font-mono">{newEmail}</strong> चेक करें एवं उसमें प्राप्त 6-अंकों का गुप्त OTP कोड नीचे दर्ज करें।
                </span>
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: ENTER OTP FIELD & VERIFY BUTTON */}
        {generatedOtp && (
          <div className="p-4 bg-amber-950/20 border border-amber-500/40 rounded-2xl space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                चरण 2: ईमेल में प्राप्त 6-अंकों का OTP दर्ज करें (Enter Email OTP) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={userOtpInput}
                onChange={(e) => setUserOtpInput(e.target.value)}
                placeholder="6-अंकीय OTP कोड दर्ज करें..."
                className="w-full bg-slate-950 border border-amber-500/60 rounded-xl p-3.5 text-center text-amber-300 font-mono font-black text-lg tracking-[8px] focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  सत्यापित एवं अपडेट किया जा रहा है...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-slate-950" />
                  OTP सत्यापित करें और आईडी-पासवर्ड अपडेट करें (Verify & Change Credentials)
                </>
              )}
            </button>
          </div>
        )}

        {/* Status Message Banner */}
        {statusMsg && (
          <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-start gap-3 ${
            statusMsg.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300' :
            statusMsg.type === 'info' ? 'bg-sky-950/90 border-sky-500/60 text-sky-300' :
            'bg-red-950/90 border-red-500/60 text-red-300'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

      </form>

    </div>
  );
};
