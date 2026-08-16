import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  Radio
} from 'lucide-react';

interface AdminLoginModalProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onSuccess, onCancel }) => {
  const { adminLogin } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const success = await adminLogin(username.trim(), password.trim());
      setIsLoading(false);

      if (success) {
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg('अमान्य ईमेल/आईडी या पासवर्ड! (Invalid Admin Credentials or Permissions).');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'लॉगिन में त्रुटि हुई (Login Error).');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl text-slate-100 relative overflow-hidden">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />

        {/* Modal Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 mb-1 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
          </div>

          <h2 className="text-2xl font-black text-white">
            एडमिन पोर्टल सुरक्षित प्रवेश (Admin Login)
          </h2>
          <p className="text-xs text-slate-400">
            उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन (UPRSA) कंट्रोल सेंटर
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-400" />
              एडमिन आईडी (Admin Login ID)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-mono text-sm"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-400" />
              एडमिन पासवर्ड (Password)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="एडमिन पासवर्ड दर्ज करें..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500 text-sm"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
          >
            {isLoading ? (
              <>लॉगिन किया जा रहा है...</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                एडमिन पोर्टल में लॉगिन करें (Secure Admin Login)
              </>
            )}
          </button>

        </form>

        {/* Cancel / Return option */}
        {onCancel && (
          <div className="text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-300 font-bold transition underline"
            >
              वापस मुख्य वेबसाइट पर जाएं (Return to Home)
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
