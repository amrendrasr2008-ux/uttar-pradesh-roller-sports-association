import React, { useState, useRef } from 'react';
import { dbStore } from '../../../lib/db';
import { PaymentSettings } from '../../../types';
import { 
  Settings, 
  Save, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  Mail, 
  DollarSign, 
  Info,
  Power,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  RefreshCw,
  Trash2,
  Eye,
  Download,
  Sparkles,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  FileImage
} from 'lucide-react';

export const AdminPaymentSettings: React.FC = () => {
  const [settings, setSettings] = useState<PaymentSettings>(() => dbStore.getPaymentSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const [qrInputMode, setQrInputMode] = useState<'upload' | 'url' | 'dynamic'>('upload');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate dynamic QR URL based on UPI ID
  const dynamicUpiUri = `upi://pay?pa=${encodeURIComponent(settings.upiId || 'uprsa@upi')}&pn=${encodeURIComponent(settings.upiDisplayName || 'UPRSA')}&cu=INR`;
  const dynamicQrGeneratedUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(dynamicUpiUri)}`;

  // Handle local JPG / PNG file upload
  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaveErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type (JPG, JPEG, PNG, WEBP)
    const isValidType = file.type.match(/^image\/(jpeg|jpg|png|webp)$/i) || file.name.match(/\.(jpg|jpeg|png|webp)$/i);
    if (!isValidType) {
      setSaveErrorMsg('अमान्य फ़ाइल प्रकार! कृपया केवल JPG, JPEG या PNG छवि फ़ाइल चुनें (Please upload a valid JPG/PNG image).');
      return;
    }

    // Read and convert to Data URL for instant rendering and offline persistence
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSettings(prev => ({
          ...prev,
          qrCodeUrl: dataUrl
        }));
        setUploadedFileName(file.name);
        setSaveSuccessMsg(`JPG बारकोड फ़ाइल "${file.name}" सफलतापूर्वक लोड हो गई! नीचे 'सेटिंग्स सहेजें' बटन दबाकर सुरक्षित करें।`);
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
    };
    reader.onerror = () => {
      setSaveErrorMsg('फ़ाइल पढ़ने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyDynamicQr = () => {
    if (!settings.upiId.trim()) {
      setSaveErrorMsg('कृपया पहले आधिकारिक UPI ID दर्ज करें।');
      return;
    }
    setSettings(prev => ({
      ...prev,
      qrCodeUrl: dynamicQrGeneratedUrl
    }));
    setUploadedFileName('');
    setSaveSuccessMsg('स्वचालित UPI QR कोड सफलतापूर्वक तैयार कर लागू किया गया!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleRemoveQrCode = () => {
    setSettings(prev => ({
      ...prev,
      qrCodeUrl: ''
    }));
    setUploadedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyUpi = () => {
    if (!settings.upiId) return;
    navigator.clipboard.writeText(settings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    try {
      const updated = dbStore.updatePaymentSettings({
        upiId: settings.upiId.trim(),
        upiDisplayName: settings.upiDisplayName.trim(),
        qrCodeUrl: settings.qrCodeUrl.trim(),
        paymentInstructions: settings.paymentInstructions.trim(),
        supportPhone: settings.supportPhone.trim(),
        supportEmail: settings.supportEmail.trim(),
        paymentEnabled: settings.paymentEnabled,
        defaultTournamentFee: Number(settings.defaultTournamentFee) || 500
      });

      setSettings(updated);
      setSaveSuccessMsg('भुगतान सेटिंग्स और बारकोड/QR कोड सफलतापूर्वक सहेजे गए! (Payment Settings & QR Code Saved)');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err: any) {
      setSaveErrorMsg(err?.message || 'सेटिंग्स सहेजने में विफल।');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shrink-0">
            <QrCode className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>UPRSA भुगतान व बारकोड सेटिंग्स</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono rounded-md">
                JPG Barcode Enabled
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              आधिकारिक UPI ID, बारकोड / QR कोड JPG फ़ोटो, पंजीकरण शुल्क एवं हेल्पलाइन विवरण प्रबंधित करें
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyUpi}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            title="UPI ID कॉपी करें"
          >
            {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedUpi ? 'कॉपी हुआ!' : settings.upiId || 'UPI ID'}</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center space-x-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {saveErrorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-semibold flex items-center space-x-2 shadow-lg animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Enable / Disable Payment Toggle */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-md">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Power className={`w-4 h-4 ${settings.paymentEnabled ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span>टूर्नामेंट भुगतान प्रणाली स्थिति (Payment Gateway Status)</span>
            </h4>
            <p className="text-xs text-slate-400">
              {settings.paymentEnabled ? 'भुगतान प्रणाली सक्रिय (ACTIVE) है — स्केटर्स UPI QR से पंजीकरण शुल्क जमा कर सकते हैं।' : 'भुगतान प्रणाली निष्क्रिय (INACTIVE) है।'}
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.paymentEnabled}
              onChange={(e) => setSettings({ ...settings, paymentEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* ===================== BARCODE / QR CODE (JPG OPTION) SECTION ===================== */}
        <div className="p-6 bg-slate-900 border-2 border-amber-500/30 rounded-2xl space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-amber-400 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-400" />
                <span>बार कोड / क्यूआर कोड प्रबंधन (UPI Barcode & QR Code Setup)</span>
              </h3>
              <p className="text-xs text-slate-400">
                यहाँ अपने बैंक / PhonePe / Google Pay / Paytm का <strong>JPG बारकोड फ़ोटो</strong> अपलोड करें या लिंक दर्ज करें
              </p>
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setQrInputMode('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  qrInputMode === 'upload' 
                    ? 'bg-amber-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>JPG फ़ोटो अपलोड</span>
              </button>
              <button
                type="button"
                onClick={() => setQrInputMode('url')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  qrInputMode === 'url' 
                    ? 'bg-amber-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>इमेज URL</span>
              </button>
              <button
                type="button"
                onClick={() => setQrInputMode('dynamic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  qrInputMode === 'dynamic' 
                    ? 'bg-amber-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>स्वतः जनरेटेड QR</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Input Options */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Option 1: JPG / PNG File Upload */}
              {qrInputMode === 'upload' && (
                <div className="space-y-4 animate-fade-in">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-amber-500/40 hover:border-amber-400 bg-slate-950/70 hover:bg-slate-950 rounded-2xl text-center cursor-pointer transition group flex flex-col items-center justify-center space-y-3"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleQrFileUpload}
                      className="hidden"
                    />
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center transition shadow-inner">
                      <FileImage className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                        बारकोड / QR कोड की JPG फ़ाइल यहाँ चुनें या ड्रैग करें
                      </p>
                      <p className="text-xs text-slate-400">
                        समर्थित प्रारूप: <span className="text-amber-400 font-mono font-bold">.JPG, .JPEG, .PNG, .WEBP</span>
                      </p>
                    </div>
                    <span className="px-4 py-2 bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-amber-400 text-xs font-bold rounded-xl border border-slate-700 group-hover:border-amber-500 transition shadow">
                      📁 JPG फ़ाइल ब्राउज़ करें (Select JPG File)
                    </span>
                  </div>

                  {uploadedFileName && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                      <span className="truncate">चयनित फ़ाइल: <strong>{uploadedFileName}</strong></span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded text-[10px]">JPG Loaded</span>
                    </div>
                  )}

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-400">
                    <p className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-amber-400" />
                      JPG बार कोड लगाने के आसान चरण:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                      <li>अपने PhonePe / Google Pay / Paytm / Bank App से QR कोड का स्क्रीनशॉट या JPG फोटो लें।</li>
                      <li>ऊपर 'JPG फ़ाइल ब्राउज़ करें' पर क्लिक करके उसे चुनें।</li>
                      <li>दाईं तरफ लाइव प्रिव्यू देखें और नीचे 'सेटिंग्स सहेजें' दबाएं।</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Option 2: Image URL */}
              {qrInputMode === 'url' && (
                <div className="space-y-3 animate-fade-in">
                  <label className="block text-xs font-bold text-slate-300">
                    कस्टम QR कोड / बारकोड छवि URL (Image URL)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={settings.qrCodeUrl}
                      onChange={(e) => {
                        setSettings({ ...settings, qrCodeUrl: e.target.value });
                        setUploadedFileName('');
                      }}
                      placeholder="https://example.com/my-upi-qr.jpg"
                      className="w-full px-3.5 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    क्लाउड, गूगल ड्राइव, Imgur या अपनी वेबसाइट पर होस्ट की गई सीधी JPG इमेज लिंक यहाँ पेस्ट कर सकते हैं।
                  </p>
                </div>
              )}

              {/* Option 3: Dynamic Generator */}
              {qrInputMode === 'dynamic' && (
                <div className="space-y-4 animate-fade-in p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      स्वचालित UPI डायनामिक QR कोड जनरेटर
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      यह विकल्प आपकी नीचे दी गई आधिकारिक UPI ID (<span className="text-amber-400 font-mono">{settings.upiId || 'uprsa@upi'}</span>) और संस्था नाम से स्वचालित रूप से एक नया हाई-रेजोल्यूशन QR कोड तैयार करता है।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyDynamicQr}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>वर्तमान UPI ID से नया QR कोड उत्पन्न कर लागू करें</span>
                  </button>
                </div>
              )}

              {/* Action Buttons for QR */}
              {settings.qrCodeUrl && (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleRemoveQrCode}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>वर्तमान QR / बारकोड हटाएं (Remove)</span>
                  </button>
                  <a
                    href={settings.qrCodeUrl}
                    download="uprsa-upi-qr.jpg"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>डाउनलोड / देखें (View/Download)</span>
                  </a>
                </div>
              )}

            </div>

            {/* Right Column: Live Barcode Scanner Simulation Preview */}
            <div className="lg:col-span-5">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-inner flex flex-col items-center text-center">
                <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    लाइव प्रिव्यू (Skater View)
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">
                    Active QR
                  </span>
                </div>

                {/* QR Display Card */}
                <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-slate-200 flex flex-col items-center max-w-[220px] mx-auto space-y-2">
                  <div className="w-full text-center pb-1 border-b border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-900 tracking-tight line-clamp-1">
                      {settings.upiDisplayName || 'UPRSA OFFICIAL'}
                    </p>
                    <p className="text-[9px] font-mono font-bold text-slate-500 line-clamp-1">
                      {settings.upiId || 'uprsa@upi'}
                    </p>
                  </div>

                  <div className="w-40 h-40 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 shadow-inner">
                    {settings.qrCodeUrl ? (
                      <img
                        src={settings.qrCodeUrl}
                        alt="UPI Payment QR Barcode"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <img
                        src={dynamicQrGeneratedUrl}
                        alt="Default Dynamic QR"
                        className="w-full h-full object-contain p-1"
                      />
                    )}
                  </div>

                  <div className="w-full pt-1 border-t border-slate-100 flex items-center justify-center gap-1 text-[9px] font-extrabold text-slate-700">
                    <span>Scan with Any UPI App</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  {settings.qrCodeUrl ? '✅ कस्टम JPG बारकोड सक्रिय है' : '⚡ स्वतः जनरेटेड डायनामिक QR सक्रिय है'}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Core UPI Credentials */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>UPI खाता विवरण (UPI Bank Credentials)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                आधिकारिक UPI ID (Official UPI Address) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={settings.upiId}
                onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                placeholder="e.g. uprsa@upi"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-400 font-mono text-sm focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                खाताधारक / पेई नाम (UPI Account Name) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={settings.upiDisplayName}
                onChange={(e) => setSettings({ ...settings, upiDisplayName: e.target.value })}
                placeholder="e.g. Uttar Pradesh Roller Sports Association"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                मानक पंजीकरण शुल्क (Default Registration Fee in ₹) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={settings.defaultTournamentFee}
                  onChange={(e) => setSettings({ ...settings, defaultTournamentFee: Number(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-bold text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Instructions and Support */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 uppercase tracking-wider flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-400" />
            <span>निर्देश व सहायता संपर्क (Instructions & Support Helpline)</span>
          </h3>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              भुगतान निर्देश (Payment Instructions displayed to Skaters)
            </label>
            <textarea
              value={settings.paymentInstructions}
              onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
              rows={4}
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                हेल्पलाइन फ़ोन नंबर (Support Phone)
              </label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                सहायता ईमेल (Support Email)
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl shadow-xl transition flex items-center space-x-2.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>सेटिंग्स व बारकोड सहेजें (Save Payment Settings)</span>
          </button>
        </div>

      </form>
    </div>
  );
};

