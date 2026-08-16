import React from 'react';
import { Skater } from '../../types';
import { ShieldCheck, Download, Printer, CheckCircle, FileText, Calendar, Building2, User, Phone, Mail, MapPin } from 'lucide-react';
import { downloadElementAsPdf, printElement } from '../../lib/pdfGenerator';

interface AnnualRegistrationPDFProps {
  skater: Skater;
  onClose?: () => void;
}

export const AnnualRegistrationPDF: React.FC<AnnualRegistrationPDFProps> = ({ skater, onClose }) => {
  const elementId = `annual-registration-form-${skater.id}`;
  const isApproved = skater.status === 'approved' || skater.status === 'active';

  const handleDownload = () => {
    downloadElementAsPdf(elementId, `UPRSA_Annual_Registration_${skater.applicationNumber || skater.registrationNumber}`);
  };

  const handlePrint = () => {
    printElement(elementId);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls / Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 text-slate-100">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="text-sm font-bold">Annual Registration Form 2026–27</h3>
            <p className="text-[11px] text-slate-400">
              Application No: <span className="font-mono text-amber-400">{skater.applicationNumber || 'UPRSA-APP-2026-000001'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>PRINT PDF</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-lg shadow transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD PDF</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Printable A4 Form Card */}
      <div className="overflow-x-auto p-1 bg-slate-950 rounded-xl">
        <div
          id={elementId}
          className="w-[210mm] min-h-[297mm] mx-auto bg-white text-slate-900 p-8 shadow-2xl relative font-sans text-xs border border-slate-300 space-y-5"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=600&auto=format&fit=crop&q=80"
              alt="UPRSA Logo Watermark"
              className="w-96 h-96 object-contain"
            />
          </div>

          {/* Header Section */}
          <div className="border-b-2 border-amber-600 pb-4 text-center relative">
            <div className="flex items-center justify-between gap-4">
              <div className="w-20 h-20 bg-amber-50 border border-amber-200 rounded-xl p-1 flex items-center justify-center shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=200&auto=format&fit=crop&q=80"
                  alt="UPRSA Official Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 text-center">
                <h1 className="text-xl font-black tracking-tight text-amber-900 uppercase">
                  UTTAR PRADESH ROLLER SPORTS ASSOCIATION
                </h1>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                  (Recognized by U.P. Olympic Association & Roller Skating Federation of India)
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Regd. Office: K.D. Singh Babu Stadium, Hazratganj, Lucknow, Uttar Pradesh – 226001
                </p>
                
                <div className="inline-block mt-2 px-4 py-1 bg-amber-600 text-white font-extrabold text-xs rounded-full uppercase tracking-wider shadow-sm">
                  ANNUAL SKATER REGISTRATION FORM 2026–2027
                </div>
              </div>

              {/* Skater Passport Photo */}
              <div className="w-24 h-28 border-2 border-slate-400 bg-slate-50 p-1 rounded flex flex-col items-center justify-center text-center shrink-0">
                {skater.photoUrl ? (
                  <img
                    src={skater.photoUrl}
                    alt={skater.name}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="text-[9px] text-slate-400 italic">Affix Passport Photo</div>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Strip */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] font-medium">
            <div>
              <span className="text-slate-500 block text-[9px] font-bold uppercase">Application Number</span>
              <span className="font-mono font-bold text-amber-900">{skater.applicationNumber || 'UPRSA-APP-2026-000001'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] font-bold uppercase">UPRSA Registration ID</span>
              <span className="font-mono font-bold text-slate-900">
                {isApproved ? skater.registrationNumber : 'PENDING APPROVAL'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] font-bold uppercase">Registration Status</span>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
              }`}>
                {skater.status || 'PENDING VERIFICATION'}
              </span>
            </div>
          </div>

          {/* Section 1: Skater Personal Details */}
          <div className="space-y-2">
            <h2 className="text-xs font-black uppercase text-amber-900 bg-amber-50 px-3 py-1.5 rounded border-l-4 border-amber-600 flex items-center justify-between">
              <span>1. Skater Personal Information (स्केटर का व्यक्तिगत विवरण)</span>
              <span className="text-[10px] font-normal text-slate-600">Category: {skater.category || 'Amateur'}</span>
            </h2>

            <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded border border-slate-200">
              <div className="space-y-1.5">
                <p><strong className="text-slate-600">Skater's Full Name:</strong> <span className="font-bold text-slate-900 text-sm">{skater.name}</span></p>
                <p><strong className="text-slate-600">Father's Name:</strong> <span className="font-medium text-slate-800">{skater.fatherName || skater.fatherMotherName}</span></p>
                <p><strong className="text-slate-600">Mother's Name:</strong> <span className="font-medium text-slate-800">{skater.motherName || 'N/A'}</span></p>
                <p><strong className="text-slate-600">Date of Birth:</strong> <span className="font-mono font-semibold text-slate-900">{skater.dob}</span> ({skater.age || 14} Years)</p>
              </div>

              <div className="space-y-1.5">
                <p><strong className="text-slate-600">Gender:</strong> <span className="font-semibold text-slate-900">{skater.gender}</span></p>
                <p><strong className="text-slate-600">Age Group:</strong> <span className="font-bold text-amber-900">{skater.ageGroup}</span></p>
                <p><strong className="text-slate-600">Blood Group:</strong> <span className="font-mono font-bold text-slate-900">{skater.bloodGroup || 'O+'}</span></p>
                <p><strong className="text-slate-600">Contact Number:</strong> <span className="font-mono font-medium text-slate-800">{skater.mobile}</span></p>
              </div>

              <div className="col-span-2 space-y-1 pt-1 border-t border-slate-100">
                <p><strong className="text-slate-600">Email Address:</strong> <span className="font-mono text-slate-800">{skater.email}</span></p>
                <p><strong className="text-slate-600">Residential Address:</strong> <span className="text-slate-800">{skater.address}</span></p>
              </div>
            </div>
          </div>

          {/* Section 2: Affiliation & Discipline */}
          <div className="space-y-2">
            <h2 className="text-xs font-black uppercase text-amber-900 bg-amber-50 px-3 py-1.5 rounded border-l-4 border-amber-600">
              2. District Association, Club & Discipline Details (जिला, क्लब एवं अनुशासन विवरण)
            </h2>

            <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded border border-slate-200">
              <p><strong className="text-slate-600">District Association:</strong> <br /><span className="font-bold text-slate-900">{skater.districtName} District Roller Sports Association</span></p>
              <p><strong className="text-slate-600">Affiliated Club / Academy:</strong> <br /><span className="font-bold text-slate-900">{skater.clubName}</span></p>
              <p><strong className="text-slate-600">Skating Discipline:</strong> <br /><span className="font-bold text-amber-900 text-sm">{skater.discipline}</span></p>
              <p><strong className="text-slate-600">Coach Name:</strong> <br /><span className="font-medium text-slate-800">{skater.coachName || 'N/A'}</span></p>
            </div>
          </div>

          {/* Section 3: Declaration */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded border border-slate-200 text-[10px] leading-relaxed">
            <h3 className="font-black text-slate-900 uppercase">Declaration by Skater & Parent / Guardian (घोषणा पत्र)</h3>
            <p className="text-slate-700">
              I hereby declare that all information supplied in this registration form is true, correct, and complete to the best of my knowledge and belief. I agree to abide by the rules, code of conduct, and regulations laid down by the Uttar Pradesh Roller Sports Association (UPRSA) and Roller Skating Federation of India (RSFI).
            </p>
          </div>

          {/* Section 4: Signatures & Verification */}
          <div className="pt-6 grid grid-cols-4 gap-3 text-center border-t border-slate-300 text-[9px] font-bold">
            <div className="flex flex-col items-center justify-between h-20 p-1 border border-dashed border-slate-300 rounded">
              <div className="text-slate-400 text-[8px]">Skater / Parent Signature</div>
              <div className="text-slate-800 font-serif italic text-xs">{skater.name}</div>
              <div className="border-t border-slate-400 w-full pt-0.5 text-slate-600">Signature of Parent / Skater</div>
            </div>

            <div className="flex flex-col items-center justify-between h-20 p-1 border border-dashed border-slate-300 rounded">
              <div className="text-slate-400 text-[8px]">Club Seal & Sign</div>
              <div className="text-slate-800 text-[9px] font-mono">{skater.clubName}</div>
              <div className="border-t border-slate-400 w-full pt-0.5 text-slate-600">Secretary / Coach Seal</div>
            </div>

            <div className="flex flex-col items-center justify-between h-20 p-1 border border-dashed border-slate-300 rounded">
              <div className="text-slate-400 text-[8px]">District Seal & Sign</div>
              <div className="text-slate-800 text-[9px] font-mono">{skater.districtName} DRSA</div>
              <div className="border-t border-slate-400 w-full pt-0.5 text-slate-600">District Secretary Seal</div>
            </div>

            <div className="flex flex-col items-center justify-between h-20 p-1 border border-amber-300 bg-amber-50/50 rounded relative">
              <div className="text-amber-800 text-[8px]">UPRSA State Verification</div>
              {isApproved ? (
                <div className="flex items-center gap-1 text-emerald-700 font-extrabold text-[9px]">
                  <CheckCircle className="w-3 h-3 text-emerald-600" /> VERIFIED & APPROVED
                </div>
              ) : (
                <div className="text-amber-700 italic text-[8px]">Pending Verification</div>
              )}
              <div className="border-t border-amber-400 w-full pt-0.5 text-amber-900">General Secretary, UPRSA</div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[8px] text-slate-400 border-t border-slate-200 pt-2">
            This document is the official Annual Skater Registration Form generated by UPRSA Portal (https://uprollersports.org).
          </div>
        </div>
      </div>
    </div>
  );
};
