import React, { useState, useEffect } from 'react';
import { dbStore } from '../../lib/db';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Skater } from '../../types';
import { ShieldCheck, Key, CheckCircle2, AlertCircle, Loader2, Lock, ArrowRight, UserCheck } from 'lucide-react';

interface AccountActivationProps {
  onSuccessNavigate: () => void;
}

export const AccountActivation: React.FC<AccountActivationProps> = ({ onSuccessNavigate }) => {
  const { loginSkater } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const paramEmail = searchParams.get('email') || '';
  const paramReg = searchParams.get('reg') || '';

  const [emailInput, setEmailInput] = useState(paramEmail);
  const [regInput, setRegInput] = useState(paramReg);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [skater, setSkater] = useState<Skater | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (paramEmail || paramReg) {
      findSkater(paramEmail, paramReg);
    }
  }, [paramEmail, paramReg]);

  const findSkater = (email: string, reg: string) => {
    const skaters = dbStore.getSkaters();
    const found = skaters.find(s => 
      (email && s.email.toLowerCase() === email.toLowerCase()) ||
      (reg && (s.registrationNumber.toLowerCase() === reg.toLowerCase() || s.applicationNumber?.toLowerCase() === reg.toLowerCase()))
    );
    if (found) {
      setSkater(found);
      setEmailInput(found.email);
      setRegInput(found.registrationNumber);
    }
  };

  const handleVerifyDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!emailInput.trim() && !regInput.trim()) {
      setErrorMsg('कृपया रजिस्टर्ड ईमेल या रजिस्ट्रेशन नंबर दर्ज करें। (Please enter registered email or registration number)');
      return;
    }
    findSkater(emailInput.trim(), regInput.trim());
    if (!skater) {
      setErrorMsg('प्रविष्ट किए गए विवरण से कोई स्वीकृत स्केटर रिकॉर्ड नहीं मिला। (No record found matching the details)');
    }
  };

  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!skater) {
      setErrorMsg('कृपया पहले स्केटर विवरण का सत्यापन करें।');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('पासवर्ड न्यूनतम 6 वर्णों का होना चाहिए। (Password must be at least 6 characters)');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('दोनों पासवर्ड समान होने चाहिए। (Passwords do not match)');
      return;
    }

    setLoading(true);

    try {
      // 1. Set password in Supabase Auth
      let authUser = null;
      if (supabase) {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: skater.email,
          password: password,
          options: {
            data: {
              full_name: skater.name,
              role: 'skater',
              skater_id: skater.id,
              registration_number: skater.registrationNumber
            }
          }
        });

        if (signUpErr && !signUpErr.message.includes('already registered')) {
          console.warn('Supabase auth signup notice:', signUpErr.message);
        } else if (signUpData?.user) {
          authUser = signUpData.user;
        }
      }

      // 2. Update Skater Record Status to active in Local / Database store
      dbStore.updateSkater(skater.id, {
        status: 'active',
        accountStatus: 'active',
        idCardActive: true
      });

      // 3. Log in skater using Auth Context
      await loginSkater(skater.email, password);

      setLoading(false);
      setSuccessMsg('✅ आपका UPRSA स्केटर खाता सफलतापूर्वक सक्रिय हो गया है! (Account successfully activated)');

      setTimeout(() => {
        onSuccessNavigate();
      }, 1500);

    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'खाता सक्रियण में त्रुटि हुई। कृपया पुनः प्रयास करें।');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 text-slate-100">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <UserCheck className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black text-white">UPRSA Skater Account Activation</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन - स्केटर खाता सक्रियण एवं पासवर्ड सेट करें
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-200 text-xs p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Step 1: Verification Form if Skater not yet found */}
        {!skater ? (
          <form onSubmit={handleVerifyDetails} className="space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  रजिस्टर्ड ईमेल आईडी (Registered Email)
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. skater@gmail.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  UPRSA रजिस्ट्रेशन / एप्लीकेशन नंबर (Registration Number)
                </label>
                <input
                  type="text"
                  value={regInput}
                  onChange={(e) => setRegInput(e.target.value)}
                  placeholder="e.g. UPRSA-LKO-00001"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              स्केटर विवरण सत्यापित करें (Verify Skater Record) <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Step 2: Set Password Form */
          <form onSubmit={handleActivateAccount} className="space-y-5">
            {/* Verified Skater Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-left">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800">
                Verified Record
              </span>
              <div className="text-base font-extrabold text-white mt-1">{skater.name}</div>
              <div className="text-xs text-slate-400 font-mono">Reg No: <strong className="text-amber-400">{skater.registrationNumber}</strong></div>
              <div className="text-xs text-slate-400">District: {skater.districtName} • Club: {skater.clubName}</div>
              <div className="text-xs text-slate-400">Email: {skater.email}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  नया पासवर्ड सेट करें (Set New Password) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="न्यूनतम 6 अक्षर (At least 6 characters)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  पासवर्ड की पुष्टि करें (Confirm Password) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="पासवर्ड पुनः दर्ज करें"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl transition shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  खाता सक्रिय हो रहा है... (Activating Account...)
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  खाता सक्रिय करें एवं लॉगिन करें (Activate & Login)
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
