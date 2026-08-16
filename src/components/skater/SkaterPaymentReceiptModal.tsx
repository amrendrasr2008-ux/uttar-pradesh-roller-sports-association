import React from 'react';
import { TournamentPayment } from '../../types';
import { Printer, ShieldCheck, X, Download, CheckCircle2 } from 'lucide-react';

interface SkaterPaymentReceiptModalProps {
  payment: TournamentPayment;
  onClose: () => void;
}

export const SkaterPaymentReceiptModal: React.FC<SkaterPaymentReceiptModalProps> = ({
  payment,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-200">
        
        {/* Action Header - Hidden on Print */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">डिजिटल भुगतान रसीद (Official Payment Receipt)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट रसीद (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-8 space-y-6 bg-white font-sans text-slate-900">
          
          {/* Header Branding */}
          <div className="border-b-2 border-emerald-600 pb-4 text-center space-y-1">
            <div className="flex items-center justify-center space-x-3">
              <img 
                src="https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=120&auto=format&fit=crop&q=80" 
                alt="UPRSA Logo" 
                className="w-12 h-12 object-contain"
              />
              <div className="text-left">
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  UTTAR PRADESH ROLLER SPORTS ASSOCIATION
                </h2>
                <p className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase">
                  Recognized by UP Olympic Association & RSFI Affiliated
                </p>
              </div>
            </div>
          </div>

          {/* Title & Badge */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Official Receipt No</span>
              <p className="text-sm font-mono font-bold text-slate-900">UPRSA/PAY/2026/{payment.id.slice(-8).toUpperCase()}</p>
            </div>
            <div className="px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black rounded-full flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>PAYMENT VERIFIED</span>
            </div>
          </div>

          {/* Skater Info Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">स्केटर एवं जिला विवरण (Skater Details)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 text-[10px]">स्केटर का नाम:</p>
                <p className="font-bold text-slate-900 text-sm">{payment.skaterName}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px]">पंजीकरण संख्या (Reg #):</p>
                <p className="font-mono font-bold text-emerald-700">{payment.registrationNumber}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px]">जिला (District):</p>
                <p className="font-medium text-slate-800">{payment.districtName}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px]">क्लब / अकादमी:</p>
                <p className="font-medium text-slate-800">{payment.clubName}</p>
              </div>
            </div>
          </div>

          {/* Tournament & Fee Breakdown */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">विवरण (Description)</th>
                  <th className="p-3">UTR / Ref Number</th>
                  <th className="p-3 text-right">राशि (Amount)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3">
                    <p className="font-bold text-slate-900">{payment.tournamentName}</p>
                    <p className="text-[10px] text-slate-500">Tournament Entry Fee (UPI QR Payment)</p>
                  </td>
                  <td className="p-3 font-mono font-bold text-amber-700">
                    {payment.utrNumber}
                  </td>
                  <td className="p-3 text-right font-black text-slate-900 text-sm">
                    ₹{payment.amount}.00
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="p-3 text-right text-slate-700">कुल भुगतान (Total Amount Paid):</td>
                  <td className="p-3 text-right font-black text-emerald-700 text-base">₹{payment.amount}.00</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Dates & Verification Signature */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs text-slate-600">
            <div>
              <p><strong>भुगतान तिथि:</strong> {new Date(payment.submittedAt).toLocaleDateString()}</p>
              <p><strong>सत्यापन तिथि:</strong> {payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleDateString() : 'VERIFIED'}</p>
              <p className="text-[10px] text-slate-400 mt-2">Computer generated official digital receipt. Authorized by UPRSA Admin.</p>
            </div>
            <div className="text-right flex flex-col items-end justify-end space-y-1">
              <div className="w-24 h-12 border-b border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-400">
                Digital Stamp
              </div>
              <p className="font-bold text-slate-900 text-[11px]">General Secretary / Treasurer</p>
              <p className="text-[10px] text-slate-500">UPRSA Finance Cell</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
