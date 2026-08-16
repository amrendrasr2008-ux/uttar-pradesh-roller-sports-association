import React, { useState } from 'react';
import { Skater } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { downloadElementAsPdf } from '../../lib/pdfGenerator';
import { Trophy, Download, Printer, ShieldCheck, MapPin, Award, UserCheck, Calendar, Heart, AlertTriangle } from 'lucide-react';

interface DigitalIDCardProps {
  skater: Skater;
}

export const DigitalIDCard: React.FC<DigitalIDCardProps> = ({ skater }) => {
  const { t } = useLanguage();
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    downloadElementAsPdf('uprsa-digital-id-card', `UPRSA_ID_${skater.registrationNumber.replace(/[\/-]/g, '_')}`);
  };

  const isActive = skater.idCardActive ?? (skater.status === 'approved' || skater.status === 'active');

  return (
    <div className="space-y-6">
      
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h3 className="font-extrabold text-white text-sm">Official UPRSA Digital Identity Card</h3>
          <p className="text-xs text-slate-400">Official skater identity card for tournament access & verification.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Side Toggle */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-xs font-bold">
            <button
              onClick={() => setCardSide('front')}
              className={`px-3 py-1 rounded-lg transition ${cardSide === 'front' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Front
            </button>
            <button
              onClick={() => setCardSide('back')}
              className={`px-3 py-1 rounded-lg transition ${cardSide === 'back' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              Back
            </button>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-emerald-400" /> Print
          </button>
        </div>
      </div>

      {/* Card Inactive Warning Banner if Deactivated */}
      {!isActive && (
        <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-2xl text-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>This ID card is currently marked as <strong>INACTIVE / SUSPENDED</strong>. Please contact UPRSA admin for renewal.</span>
        </div>
      )}

      {/* ID Card Display Frame */}
      <div className="flex justify-center p-2">
        
        <div 
          id="uprsa-digital-id-card"
          className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/80 rounded-3xl overflow-hidden shadow-2xl relative text-white space-y-4 p-6"
        >
          {/* Header Tricolor Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-white to-emerald-500" />

          {cardSide === 'front' ? (
            /* FRONT OF ID CARD */
            <div className="space-y-4">
              
              {/* Association Branding Top */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 pt-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black tracking-wide text-amber-400 uppercase">
                      UTTAR PRADESH ROLLER SPORTS ASSOCIATION
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">
                      Affiliated to RSFI & Recognized by UPOA
                    </div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                  isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              {/* Main Photo & Reg Bar */}
              <div className="grid grid-cols-12 gap-4 items-center">
                
                {/* Photo Column */}
                <div className="col-span-4 space-y-2 text-center">
                  <div className="w-24 h-28 mx-auto rounded-xl bg-slate-800 border-2 border-amber-400 overflow-hidden shadow-md">
                    <img 
                      src={skater.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'} 
                      alt={skater.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono block truncate">
                    {skater.category || 'Amateur'}
                  </span>
                </div>

                {/* Skater Details Column */}
                <div className="col-span-8 space-y-1.5 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Skater Name</span>
                    <h2 className="text-base font-extrabold text-white leading-tight">{skater.name}</h2>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Registration Number</span>
                    <div className="font-mono font-black text-amber-400 text-sm tracking-wider">{skater.registrationNumber}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <div>
                      <span className="text-slate-400 text-[9px]">DOB / Age:</span>
                      <p className="font-semibold text-slate-200">{skater.dob} ({skater.age || 0} Yrs)</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px]">Blood Group:</span>
                      <p className="font-bold text-amber-300">{skater.bloodGroup || 'O+'}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Association Note */}
              <div className="bg-slate-950/80 border border-slate-800 p-2 rounded-xl text-[10px] text-slate-400 text-center">
                <span className="text-amber-400 font-bold">नोट:</span> चेस्ट / BIB नंबर प्रत्येक मैच व प्रतियोगिता हेतु अलग से आवंटित किया जाता है।
              </div>

              {/* Secondary Details */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-[11px] grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[9px] block">District Association:</span>
                  <strong className="text-white text-xs">{skater.districtName}</strong>
                </div>

                <div>
                  <span className="text-slate-400 text-[9px] block">Club / Academy:</span>
                  <strong className="text-white text-xs">{skater.clubName}</strong>
                </div>

                <div>
                  <span className="text-slate-400 text-[9px] block">Discipline:</span>
                  <span className="text-amber-300 font-bold text-xs">{skater.discipline}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[9px] block">Age Category:</span>
                  <span className="text-slate-200 font-medium text-xs">{skater.ageGroup}</span>
                </div>
              </div>

              {/* Footer Authenticated & Validity */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-[10px] text-slate-400">
                <div>
                  <div className="flex items-center gap-1 text-emerald-400 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" /> UPRSA Authenticated
                  </div>
                  <span>Valid Until: <strong className="text-white">{skater.validityUntil || '2027-03-31'}</strong></span>
                </div>

                <div className="text-right text-[9px] text-slate-500 font-mono">
                  REG: <strong className="text-amber-400">{skater.registrationNumber}</strong>
                </div>
              </div>

            </div>
          ) : (
            /* BACK OF ID CARD */
            <div className="space-y-4 text-xs">
              
              <div className="border-b border-slate-800 pb-2">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Guardian & Emergency Information</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-[11px]">
                <p>Father's Name: <strong className="text-white">{skater.fatherName || skater.fatherMotherName || 'Parent'}</strong></p>
                <p>Mother's Name: <strong className="text-white">{skater.motherName || 'N/A'}</strong></p>
                <p>Coach Name: <strong className="text-emerald-400">{skater.coachName || 'N/A'}</strong></p>
                <p>Mobile: <strong className="text-white font-mono">{skater.mobile}</strong></p>
                <p>Emergency Contact: <strong className="text-amber-300">{skater.emergencyContactName} ({skater.emergencyContactPhone || skater.mobile})</strong></p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px]">
                <span className="text-slate-400 text-[9px] block font-bold uppercase">Residential Address:</span>
                <p className="text-slate-200 leading-snug">{skater.address}, {skater.districtName}, Uttar Pradesh</p>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[10px] text-amber-200 space-y-1">
                <strong>Important Instructions:</strong>
                <p>1. Skaters must carry this card to all UPRSA district, state & trial meets.</p>
                <p>2. Non-transferable. Misuse results in immediate disqualification.</p>
              </div>

              <div className="text-center pt-2 border-t border-slate-800 text-[9px] text-slate-500 font-mono">
                UPRSA Official Digital Credential • Lucknow, UP
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
