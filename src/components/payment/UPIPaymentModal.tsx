import React, { useState } from 'react';
import { dbStore } from '../../lib/db';
import { compressImageToStrict15KB, validateFileType, UploadResult } from '../../lib/storage';
import { QrCode, Upload, CheckCircle2, AlertTriangle, ShieldCheck, Copy, Info, X, Clock } from 'lucide-react';

interface UPIPaymentModalProps {
  skaterId: string;
  skaterName: string;
  tournamentId: string;
  tournamentName: string;
  registrationId?: string;
  feeAmount?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UPIPaymentModal: React.FC<UPIPaymentModalProps> = ({
  skaterId,
  skaterName,
  tournamentId,
  tournamentName,
  registrationId,
  feeAmount,
  onClose,
  onSuccess
}) => {
  const paymentSettings = dbStore.getPaymentSettings();
  const amount = feeAmount || paymentSettings.defaultTournamentFee || 500;

  const [utrNumber, setUtrNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedDataUrl, setCompressedDataUrl] = useState<string>('');
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [submittedUtr, setSubmittedUtr] = useState('');

  // Auto-generate dynamic QR code data URL using standard UPI URI string
  const upiUri = `upi://pay?pa=${encodeURIComponent(paymentSettings.upiId)}&pn=${encodeURIComponent(paymentSettings.upiDisplayName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Reg ${skaterName}`)}`;
  const qrImageUrl = paymentSettings.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(paymentSettings.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const val = validateFileType(file);
    if (!val.valid) {
      setErrorMsg(val.error || 'अमान्य फ़ाइल। कृपया JPG, PNG, या WEBP छवि अपलोड करें।');
      return;
    }

    setSelectedFile(file);
    setIsCompressing(true);

    try {
      // Compress to strictly <= 15,360 bytes
      const comp = await compressImageToStrict15KB(file, `pay-${skaterId}-${Date.now()}.webp`);
      setCompressedBlob(comp.blob);
      setCompressedDataUrl(comp.dataUrl);
      setCompressedSize(comp.sizeInBytes);
    } catch (err: any) {
      setErrorMsg(err?.message || 'चित्र कंप्रेस करने में विफल। कृपया छोटा चित्र अपलोड करें।');
      setSelectedFile(null);
      setCompressedBlob(null);
      setCompressedDataUrl('');
      setCompressedSize(0);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUTR = utrNumber.trim();
    if (!cleanUTR) {
      setErrorMsg('कृपया 12-अंकों का UTR / Transaction ID दर्ज करें।');
      return;
    }

    if (cleanUTR.length < 8 || cleanUTR.length > 25) {
      setErrorMsg('UTR / Transaction ID की लंबाई 8 से 25 वर्णों के बीच होनी चाहिए।');
      return;
    }

    // Check duplicate UTR
    if (dbStore.checkDuplicateUTR(cleanUTR)) {
      setErrorMsg('यह UTR / Transaction ID पहले से ही एक अन्य भुगतान के लिए दर्ज है।');
      return;
    }

    if (!compressedDataUrl && !compressedBlob) {
      setErrorMsg('कृपया भुगतान का स्क्रीनशॉट (Payment Proof) अपलोड करें।');
      return;
    }

    setIsSubmitting(true);

    try {
      const storagePath = `payment-proofs/${skaterId}/pay-${Date.now()}.webp`;

      // Submit payment to dbStore
      const res = dbStore.submitTournamentPayment({
        registrationId,
        skaterId,
        tournamentId,
        amount,
        utrNumber: cleanUTR,
        screenshotStoragePath: storagePath,
        screenshotUrl: compressedDataUrl,
        paymentMethod: 'UPI_QR'
      });

      if (!res.success) {
        setErrorMsg(res.error || 'भुगतान जमा करने में विफल।');
        setIsSubmitting(false);
        return;
      }

      setSubmittedUtr(cleanUTR);
      setIsSubmittedSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'त्रुटि हुई। कृपया पुन: प्रयास करें।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">टूर्नामेंट शुल्क भुगतान (UPI QR)</h3>
              <p className="text-xs text-slate-400">UPRSA Tournament Registration Payment</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {isSubmittedSuccess ? (
          <div className="p-6 text-center space-y-5">
            <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-500/40 text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/30 mb-2">
                PAYMENT_PENDING
              </span>
              <h4 className="text-xl font-bold text-white">भुगतान सत्यापन लंबित है</h4>
              <p className="text-sm text-slate-300 mt-2">
                आपका UTR <span className="font-mono text-amber-400 font-bold">{submittedUtr}</span> तथा भुगतान प्रमाण पत्र UPRSA को प्राप्त हो गया है।
              </p>
            </div>

            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl text-left space-y-2 text-xs text-slate-300">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold">
                <Info className="w-4 h-4 shrink-0" />
                <span>सत्यापन प्रक्रिया (Manual Verification):</span>
              </div>
              <p>
                • UPRSA एडमिन आपके बैंक UTR व स्क्रीनशॉट का मिलान करने के उपरांत इसे <strong>PAYMENT_VERIFIED</strong> करेगा।
              </p>
              <p>
                • सत्यापन पूर्ण होने पर आपको ईमेल एवं स्केटर पोर्टल पर <strong>डिजिटल भुगतान रसीद (Payment Receipt)</strong> प्राप्त होगी।
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition"
            >
              ठीक है (Got It)
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            
            {/* Amount Banner */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-950/60 to-slate-800/80 border border-emerald-500/30 rounded-xl">
              <div>
                <p className="text-xs text-slate-400">कुल पंजीकरण शुल्क (Registration Fee):</p>
                <p className="text-xs text-slate-300 font-medium truncate max-w-[200px]">{tournamentName}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-emerald-400">₹{amount}</p>
                <p className="text-[10px] text-emerald-300/80 font-medium">INR (UPI Payment)</p>
              </div>
            </div>

            {/* QR & UPI Section */}
            <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
              <div className="relative p-2 bg-white rounded-xl shadow-md shrink-0">
                <img 
                  src={qrImageUrl} 
                  alt="UPRSA UPI QR Code" 
                  className="w-36 h-36 object-contain"
                />
                <div className="absolute inset-x-0 -bottom-2 flex justify-center">
                  <span className="px-2 py-0.5 bg-slate-900 text-[9px] text-emerald-400 font-extrabold rounded-full border border-emerald-500/40 uppercase">
                    SCAN TO PAY
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">UPRSA Official UPI ID</h5>
                <div className="flex items-center justify-between p-2 bg-slate-900 border border-slate-700 rounded-lg">
                  <span className="text-xs font-mono font-bold text-amber-400 truncate">{paymentSettings.upiId}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1.5 text-xs text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedUpi ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  पेई नाम: <strong className="text-slate-200">{paymentSettings.upiDisplayName}</strong>
                </p>
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-300 space-y-0.5">
                  <p><strong>निर्देश:</strong> किसी भी UPI App (GPay, PhonePe, Paytm, BHIM) से ₹{amount} का सटीक भुगतान करें।</p>
                </div>
              </div>
            </div>

            {/* UTR Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                12-अंकों का UTR / Transaction ID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 422158901234 or UPI/1234567890"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
              <p className="text-[10px] text-slate-400">
                भुगतान के बाद आपके UPI ऐप की रसीद पर उपलब्ध 12 अंकों का UTR / Ref Number यहाँ दर्ज करें।
              </p>
            </div>

            {/* Screenshot Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                भुगतान स्क्रीनशॉट (Payment Proof) <span className="text-rose-400">* (Max 15 KB strict limit)</span>
              </label>

              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-950 p-4 rounded-xl text-center transition cursor-pointer relative">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {isCompressing ? (
                  <div className="py-3 text-emerald-400 text-xs font-medium flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>चित्र को 15 KB सीमा में ऑटो-कंप्रेस किया जा रहा है...</span>
                  </div>
                ) : compressedDataUrl ? (
                  <div className="flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={compressedDataUrl} 
                        alt="Proof Preview" 
                        className="w-12 h-12 object-cover rounded-lg border border-slate-700 shrink-0" 
                      />
                      <div>
                        <p className="text-xs font-bold text-white truncate max-w-[180px]">{selectedFile?.name}</p>
                        <p className="text-[10px] text-emerald-400 font-mono">
                          साइज: {(compressedSize / 1024).toFixed(2)} KB (Strict ≤ 15.0 KB Pass ✓)
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-lg border border-emerald-500/30">
                      Compressed
                    </span>
                  </div>
                ) : (
                  <div className="py-2 text-slate-400 hover:text-slate-200 transition">
                    <Upload className="w-6 h-6 mx-auto mb-1 text-slate-500" />
                    <p className="text-xs font-semibold text-slate-300">भुगतान स्क्रीनशॉट अपलोड करें</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, या WEBP (ऑटोमैटिक 15 KB में कम किया जाएगा)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Manual Verification Disclaimer */}
            <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-xs text-blue-200 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-blue-300">सत्यापन सूचना (Manual Verification Notice):</strong>
                <p className="text-[11px] text-blue-200/90 mt-0.5">
                  भुगतान का UTR व प्रमाण पत्र UPRSA अधिकारियों द्वारा मैन्युअल जांच के बाद सत्यापित (VERIFIED) किया जाएगा।
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isCompressing}
                className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>जमा हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>भुगतान जमा करें (Submit Payment)</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
