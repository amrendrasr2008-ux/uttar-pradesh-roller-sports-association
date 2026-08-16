import React from 'react';
import { Certificate, CertificateTemplate } from '../../../types';
import { Trophy, ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface CertificateCardViewProps {
  certificate: Certificate;
  template: CertificateTemplate;
  elementId?: string;
  showWatermark?: boolean;
}

export const CertificateCardView: React.FC<CertificateCardViewProps> = ({
  certificate,
  template,
  elementId = 'uprsa-official-certificate-element',
  showWatermark = true,
}) => {
  const isRevoked = certificate.status === 'Revoked';
  const isDraft = certificate.status === 'Draft';

  return (
    <div className="flex justify-center my-4 overflow-x-auto p-2">
      <div
        id={elementId}
        className="w-[900px] h-[636px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-8 border-amber-500/80 rounded-2xl p-8 relative shadow-2xl text-white font-sans flex flex-col justify-between overflow-hidden select-none"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 0 40px rgba(217, 119, 6, 0.15)',
        }}
      >
        {/* Decorative Corner Accents */}
        <div className="absolute top-3 left-3 w-12 h-12 border-t-4 border-l-4 border-amber-400 rounded-tl-lg pointer-events-none" />
        <div className="absolute top-3 right-3 w-12 h-12 border-t-4 border-r-4 border-amber-400 rounded-tr-lg pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-12 h-12 border-b-4 border-l-4 border-amber-400 rounded-bl-lg pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-12 h-12 border-b-4 border-r-4 border-amber-400 rounded-br-lg pointer-events-none" />

        {/* Top Tricolor Strip */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-white to-emerald-500" />

        {/* Watermark for Revoked or Draft */}
        {showWatermark && (isRevoked || isDraft) && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div
              className={`transform -rotate-12 border-8 px-12 py-4 rounded-3xl font-black text-4xl tracking-widest uppercase shadow-2xl backdrop-blur-sm ${
                isRevoked
                  ? 'border-red-600 text-red-500 bg-red-950/80'
                  : 'border-amber-500 text-amber-400 bg-slate-950/80'
              }`}
            >
              {isRevoked ? 'REVOKED / INVALID' : 'DRAFT CERTIFICATE'}
            </div>
          </div>
        )}

        {/* HEADER SECTION */}
        <div className="flex items-center justify-between border-b-2 border-amber-500/40 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-amber-400 p-1 flex items-center justify-center shadow-lg shrink-0">
              {template.logoUrl ? (
                <img
                  src={template.logoUrl}
                  alt="UPRSA Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              ) : (
                <Trophy className="w-8 h-8 text-amber-400" />
              )}
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-wider text-amber-400 uppercase leading-tight">
                {template.headerText || 'UTTAR PRADESH ROLLER SPORTS ASSOCIATION'}
              </h1>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                {template.subHeaderText ||
                  'Affiliated to Roller Skating Federation of India (RSFI) • Recognized by UP Olympic Association'}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="bg-slate-900/90 border border-amber-500/50 px-3.5 py-1.5 rounded-xl shadow font-mono text-xs">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Certificate No:</span>
              <strong className="text-amber-300 font-extrabold text-sm tracking-wider">
                {certificate.certificateNumber}
              </strong>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Issue Date: <span className="text-slate-200 font-semibold">{certificate.certificateDate || certificate.issueDate}</span>
            </div>
          </div>
        </div>

        {/* MAIN BODY CONTENT */}
        <div className="text-center my-auto space-y-3 px-4">
          
          {/* Certificate Title Banner */}
          <div className="inline-block px-8 py-1.5 bg-gradient-to-r from-amber-500/20 via-amber-500/40 to-amber-500/20 border-y border-amber-400/60 rounded-md">
            <h2 className="text-xl font-black text-amber-300 tracking-widest uppercase">
              {certificate.certificateType === 'Merit'
                ? 'CERTIFICATE OF MERIT & EXCELLENCE'
                : certificate.certificateType === 'Participation'
                ? 'CERTIFICATE OF PARTICIPATION'
                : template.title || 'CERTIFICATE OF ACHIEVEMENT'}
            </h2>
          </div>

          <p className="text-xs text-slate-300 font-serif italic">
            This official credential is proudly presented to
          </p>

          {/* Skater Name & Parent */}
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white tracking-wide underline decoration-amber-400/80 underline-offset-8">
              {certificate.skaterName}
            </h3>
            <p className="text-xs text-slate-300 pt-2 font-medium">
              Son / Daughter of: <strong className="text-white font-bold">{certificate.fatherMotherName}</strong>
              <span className="mx-2 text-amber-400">•</span>
              Reg. No: <strong className="text-amber-300 font-mono">{certificate.registrationNumber}</strong>
            </p>
          </div>

          <p className="text-xs text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Representing <strong className="text-white">{certificate.clubName}</strong> ({certificate.districtName} District), for outstanding performance in the
            {' '}<strong className="text-amber-300 font-bold">{certificate.tournamentName}</strong>
            {certificate.tournamentNumber ? ` (Ref No: ${certificate.tournamentNumber})` : ''}.
          </p>

          {/* Achievement Grid Box */}
          <div className="bg-slate-900/95 border border-amber-500/40 rounded-xl p-3 max-w-2xl mx-auto grid grid-cols-4 gap-2 text-xs shadow-inner">
            <div className="border-r border-slate-800 pr-2">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Event / Discipline</span>
              <strong className="text-white text-xs block truncate">{certificate.eventName || certificate.discipline}</strong>
            </div>

            <div className="border-r border-slate-800 pr-2">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Age Group & Gender</span>
              <strong className="text-slate-200 text-xs block truncate">{certificate.ageGroup} ({certificate.gender})</strong>
            </div>

            <div className="border-r border-slate-800 pr-2">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Position / Rank</span>
              <strong className="text-amber-400 font-black text-xs block truncate">{certificate.position}</strong>
            </div>

            <div>
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Timing / Score</span>
              <strong className="text-emerald-400 font-mono text-xs block truncate">{certificate.timing || certificate.score || 'N/A'}</strong>
            </div>
          </div>

        </div>

        {/* FOOTER SECTION SIGNATURES & OFFICIAL SEAL */}
        <div className="border-t-2 border-amber-500/40 pt-3 flex items-end justify-between">
          
          {/* President Signature */}
          <div className="text-center w-48 space-y-1">
            <div className="h-10 flex items-center justify-center">
              {template.presidentSignatureUrl ? (
                <img
                  src={template.presidentSignatureUrl}
                  alt="President Signature"
                  className="max-h-10 object-contain filter invert contrast-200"
                />
              ) : (
                <div className="font-serif italic text-amber-300 font-bold text-sm">D. S. Mishra</div>
              )}
            </div>
            <div className="border-t border-slate-700 pt-1">
              <div className="text-xs font-bold text-white leading-tight">{template.presidentName || 'Sri D. S. Mishra'}</div>
              <div className="text-[9px] text-slate-400 font-medium">{template.presidentTitle || 'President, UPRSA'}</div>
            </div>
          </div>

          {/* Official Seal / Crest */}
          <div className="text-center space-y-1">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 border-2 border-amber-400 p-1 flex items-center justify-center shadow-lg">
              {template.officialSealUrl ? (
                <img
                  src={template.officialSealUrl}
                  alt="Official Seal"
                  className="w-full h-full object-contain"
                />
              ) : (
                <ShieldCheck className="w-10 h-10 text-amber-400" />
              )}
            </div>
            <div className="text-[8px] text-amber-400/90 font-bold uppercase tracking-wider">
              UPRSA OFFICIAL SEAL
            </div>
          </div>

          {/* General Secretary Signature */}
          <div className="text-center w-48 space-y-1">
            <div className="h-10 flex items-center justify-center">
              {template.secretarySignatureUrl ? (
                <img
                  src={template.secretarySignatureUrl}
                  alt="Secretary Signature"
                  className="max-h-10 object-contain filter invert contrast-200"
                />
              ) : (
                <div className="font-serif italic text-amber-300 font-bold text-sm">Pankaj Sharma</div>
              )}
            </div>
            <div className="border-t border-slate-700 pt-1">
              <div className="text-xs font-bold text-white leading-tight">{template.secretaryName || 'Sri Pankaj Sharma'}</div>
              <div className="text-[9px] text-slate-400 font-medium">{template.secretaryTitle || 'General Secretary, UPRSA'}</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
