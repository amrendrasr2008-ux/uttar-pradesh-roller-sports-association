import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { dbStore } from '../../lib/db';
import { sendSkaterEmail } from '../../lib/emailService';
import { AnnualRegistrationPDF } from './AnnualRegistrationPDF';
import { Gender, AgeGroup, SkatingDiscipline, BloodGroup } from '../../types';
import { getAgeGroupForDob, calculateAge, getDetailedAge, ALL_OFFICIAL_AGE_GROUPS } from '../../lib/ageGroupRules';
import { getDistrictCode } from '../../lib/regNumber';
import { 
  validateFileType, 
  compressImageToStrict15KB, 
  validateAndProcessPDF, 
  uploadToSupabaseStorage, 
  MAX_FILE_BYTES 
} from '../../lib/storage';
import { 
  UserPlus, 
  Sparkles, 
  CheckCircle2, 
  Trophy, 
  ShieldCheck, 
  Upload, 
  ArrowRight,
  FileCheck,
  Calendar,
  AlertCircle,
  FileText,
  User,
  Heart,
  Camera,
  Image as ImageIcon,
  Check,
  X,
  Zap,
  Clock
} from 'lucide-react';

interface RegistrationFormProps {
  onSuccessNavigate: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccessNavigate }) => {
  const { t } = useLanguage();
  const { loginSkater } = useAuth();
  
  const districts = dbStore.getDistricts();
  const clubs = dbStore.getClubs();

  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    motherName: '',
    dob: '2012-06-15',
    gender: 'Male' as Gender,
    ageGroup: 'Sub-Junior: 12 to 15 years' as AgeGroup,
    mobile: '',
    email: '',
    address: '',
    districtName: 'Lucknow',
    clubName: 'Lucknow Roller Skating Academy',
    coachName: 'Coach Amit Rathi',
    discipline: 'Speed Inline' as SkatingDiscipline,
    category: 'State' as 'Amateur' | 'State' | 'National',
    bloodGroup: 'B+' as BloodGroup,
    photoUrl: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });

  // Skater Photo State
  const [photoFileName, setPhotoFileName] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoSizeKb, setPhotoSizeKb] = useState<number | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState<boolean>(false);

  // Compulsory Document 1: Aadhaar Card
  const [aadhaarNumber, setAadhaarNumber] = useState<string>('');
  const [aadhaarFileName, setAadhaarFileName] = useState<string>('');
  const [aadhaarPreview, setAadhaarPreview] = useState<string>('');
  const [aadhaarSizeKb, setAadhaarSizeKb] = useState<number | null>(null);

  // Compulsory Document 2: Birth Certificate
  const [birthCertNumber, setBirthCertNumber] = useState<string>('');
  const [birthCertFileName, setBirthCertFileName] = useState<string>('');
  const [birthCertPreview, setBirthCertPreview] = useState<string>('');
  const [birthCertSizeKb, setBirthCertSizeKb] = useState<number | null>(null);

  // Optional Document: Passport or School ID Card
  const [optionalDocType, setOptionalDocType] = useState<'School ID' | 'Passport'>('School ID');
  const [optionalDocNumber, setOptionalDocNumber] = useState<string>('');
  const [optionalDocFileName, setOptionalDocFileName] = useState<string>('');
  const [optionalDocPreview, setOptionalDocPreview] = useState<string>('');
  const [optionalDocSizeKb, setOptionalDocSizeKb] = useState<number | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [calculatedAgeVal, setCalculatedAgeVal] = useState<number>(14);
  const [detailedAgeText, setDetailedAgeText] = useState<string>('14 वर्ष (14 Yrs)');
  const [suggestedAgeGroupVal, setSuggestedAgeGroupVal] = useState<AgeGroup>('Sub-Junior: 12 to 15 years');
  const [previewRegNumber, setPreviewRegNumber] = useState<string>('UPRSA-LKO-00001');
  const [registeredSkater, setRegisteredSkater] = useState<any | null>(null);

  // Synchronous DOB Handler
  const handleDobChange = (newDob: string) => {
    if (!newDob) {
      setFormData(prev => ({ ...prev, dob: '' }));
      return;
    }
    const res = getAgeGroupForDob(newDob, dbStore.getAgeGroupRules());
    const detailed = getDetailedAge(newDob);
    setCalculatedAgeVal(res.age);
    setDetailedAgeText(`${detailed.formattedTextHi} (${detailed.formattedText})`);
    setSuggestedAgeGroupVal(res.ageGroup);
    setFormData(prev => ({ 
      ...prev, 
      dob: newDob,
      ageGroup: res.ageGroup 
    }));
  };

  // Manual Age Group Selector
  const handleAgeGroupChange = (newGroup: AgeGroup) => {
    setFormData(prev => ({ ...prev, ageGroup: newGroup }));
  };

  // Ensure Initial state is properly calculated
  useEffect(() => {
    if (formData.dob) {
      const res = getAgeGroupForDob(formData.dob, dbStore.getAgeGroupRules());
      const detailed = getDetailedAge(formData.dob);
      setCalculatedAgeVal(res.age);
      setDetailedAgeText(`${detailed.formattedTextHi} (${detailed.formattedText})`);
      setSuggestedAgeGroupVal(res.ageGroup);
    }
  }, []);

  // Update district code preview whenever district changes
  useEffect(() => {
    const code = getDistrictCode(formData.districtName);
    setPreviewRegNumber(`UPRSA-${code}-XXXXX`);
  }, [formData.districtName]);

  // Handle Photo Upload (Enforces strict <= 15 KB limit)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFileType(file);
      if (!validation.valid) {
        setFormError(validation.error || 'अमान्य फ़ाइल प्रकार (Invalid file type)');
        return;
      }
      setFormError(null);
      setPhotoFileName(file.name);
      setIsCompressingPhoto(true);

      try {
        const compressed = await compressImageToStrict15KB(file, file.name);
        const sizeKb = parseFloat((compressed.sizeInBytes / 1024).toFixed(1));
        setPhotoPreview(compressed.dataUrl);
        setPhotoSizeKb(sizeKb);
        setFormData(prev => ({ ...prev, photoUrl: compressed.dataUrl }));
        
        // Asynchronously stage to Supabase Storage if configured
        uploadToSupabaseStorage('skater-photos', `temp/${Date.now()}_${file.name}`, compressed.blob, compressed.mimeType);
      } catch (err: any) {
        setFormError(err.message || 'फोटो कंप्रेस करने में त्रुटि (Error compressing photo)');
      } finally {
        setIsCompressingPhoto(false);
      }
    }
  };

  // Handle Document Uploads (Enforces strict <= 15 KB limit for PDF & Images)
  const handleDocUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docCategory: 'aadhaar' | 'birthCert' | 'optional'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFileType(file);
      if (!validation.valid) {
        setFormError(validation.error || 'अमान्य फ़ाइल प्रकार (Invalid file type)');
        return;
      }
      setFormError(null);

      try {
        let dataUrl = '';
        let byteSize = 0;
        let mimeType = file.type;
        let blobToUpload: Blob;

        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          const pdfResult = await validateAndProcessPDF(file);
          byteSize = pdfResult.sizeInBytes;
          blobToUpload = pdfResult.blob;
          
          const reader = new FileReader();
          dataUrl = await new Promise((res) => {
            reader.onload = () => res(reader.result as string);
            reader.readAsDataURL(file);
          });
        } else {
          const compressed = await compressImageToStrict15KB(file, file.name);
          dataUrl = compressed.dataUrl;
          byteSize = compressed.sizeInBytes;
          mimeType = compressed.mimeType;
          blobToUpload = compressed.blob;
        }

        const sizeKb = parseFloat((byteSize / 1024).toFixed(1));

        if (docCategory === 'aadhaar') {
          setAadhaarFileName(file.name);
          setAadhaarPreview(dataUrl);
          setAadhaarSizeKb(sizeKb);
        } else if (docCategory === 'birthCert') {
          setBirthCertFileName(file.name);
          setBirthCertPreview(dataUrl);
          setBirthCertSizeKb(sizeKb);
        } else {
          setOptionalDocFileName(file.name);
          setOptionalDocPreview(dataUrl);
          setOptionalDocSizeKb(sizeKb);
        }

        uploadToSupabaseStorage('private-documents', `temp/${docCategory}_${Date.now()}_${file.name}`, blobToUpload, mimeType);
      } catch (err: any) {
        setFormError(err.message || 'फ़ाइल अपलोड करने में त्रुटि (Upload error)');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation checks
    const currentPhoto = photoPreview || formData.photoUrl;
    if (!currentPhoto) {
      setFormError('कृपया स्केटर की पासपोर्ट साइज़ फोटो अपलोड करें। (Skater passport photo upload is compulsory)');
      return;
    }

    if (!aadhaarNumber.trim()) {
      setFormError('कृपया 12-अंकों का आधार कार्ड नंबर दर्ज करें। (Aadhaar Card number is compulsory)');
      return;
    }

    if (!aadhaarFileName && !aadhaarPreview) {
      setFormError('कृपया आधार कार्ड (Aadhaar Card) दस्तावेज अपलोड करें। (Aadhaar Card document file upload is compulsory)');
      return;
    }

    if (!birthCertNumber.trim()) {
      setFormError('कृपया जन्म प्रमाण पत्र संख्या दर्ज़ करें। (Birth Certificate number is compulsory)');
      return;
    }

    if (!birthCertFileName && !birthCertPreview) {
      setFormError('कृपया जन्म प्रमाण पत्र (Birth Certificate) दस्तावेज अपलोड करें। (Birth Certificate document file upload is compulsory)');
      return;
    }

    const selectedDist = districts.find(d => d.nameEn === formData.districtName) || districts[0];
    const selectedClub = clubs.find(c => c.nameEn === formData.clubName) || clubs[0];

    const fatherMotherCombined = formData.fatherName || formData.motherName 
      ? `${formData.fatherName}${formData.fatherName && formData.motherName ? ' / ' : ''}${formData.motherName}`
      : 'Parent';

    const newSkater = dbStore.registerSkater({
      name: formData.name,
      fatherName: formData.fatherName,
      motherName: formData.motherName,
      fatherMotherName: fatherMotherCombined,
      dob: formData.dob,
      age: calculatedAgeVal,
      gender: formData.gender,
      ageGroup: formData.ageGroup,
      mobile: formData.mobile,
      email: formData.email,
      address: formData.address,
      districtId: selectedDist.id,
      districtName: selectedDist.nameEn,
      clubId: selectedClub.id,
      clubName: selectedClub.nameEn,
      coachName: formData.coachName,
      discipline: formData.discipline,
      category: formData.category,
      bloodGroup: formData.bloodGroup,
      photoUrl: currentPhoto,
      emergencyContactName: formData.emergencyContactName || formData.fatherName || 'Emergency Contact',
      emergencyContactPhone: formData.emergencyContactPhone || formData.mobile,
      validityUntil: '2027-03-31',
      status: 'pending'
    });

    // Save Compulsory Document 1: Aadhaar Card
    dbStore.addSkaterDocument({
      skaterId: newSkater.id,
      documentType: 'Aadhaar Card',
      documentNumber: aadhaarNumber,
      documentUrl: aadhaarPreview || 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&auto=format&fit=crop&q=80',
      verificationStatus: 'pending'
    });

    // Save Compulsory Document 2: Birth Certificate
    dbStore.addSkaterDocument({
      skaterId: newSkater.id,
      documentType: 'Birth Certificate',
      documentNumber: birthCertNumber,
      documentUrl: birthCertPreview || 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&auto=format&fit=crop&q=80',
      verificationStatus: 'pending'
    });

    // Save Optional Document if provided
    if (optionalDocFileName || optionalDocNumber) {
      dbStore.addSkaterDocument({
        skaterId: newSkater.id,
        documentType: optionalDocType,
        documentNumber: optionalDocNumber || 'OPT-' + Date.now(),
        documentUrl: optionalDocPreview || 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&auto=format&fit=crop&q=80',
        verificationStatus: 'pending'
      });
    }

    // Send confirmation email asynchronously
    sendSkaterEmail({
      to: newSkater.email,
      templateKey: 'registration_received',
      skater: newSkater
    }).catch(err => console.error('Error sending registration received email:', err));

    setRegisteredSkater(newSkater);
  };

  const [showSuccessPdfModal, setShowSuccessPdfModal] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-slate-100">
      
      {registeredSkater ? (
        /* Registration Success View */
        <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-8 space-y-6 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">{t('regSuccess')}</h2>
            <p className="text-xs text-slate-300 max-w-lg mx-auto">
              Your application has been registered with initial status <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold font-mono">PENDING VERIFICATION</span>.
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 max-w-lg mx-auto space-y-4">
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-amber-500 uppercase font-bold block">Application Number</span>
                <span className="text-sm font-mono font-black text-amber-300">{registeredSkater.applicationNumber || 'UPRSA-APP-2026-000001'}</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">UPRSA Reg ID</span>
                <span className="text-sm font-mono font-bold text-slate-200">{registeredSkater.registrationNumber}</span>
              </div>
            </div>

            <div className="text-xs text-slate-300 font-semibold">{registeredSkater.name} ({registeredSkater.districtName})</div>
            <p className="text-[11px] text-slate-400">
              Age: <strong className="text-white">{registeredSkater.age} Yrs</strong> • Category: <strong className="text-amber-300">{registeredSkater.ageGroup}</strong> • Discipline: <strong className="text-white">{registeredSkater.discipline}</strong>
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => setShowSuccessPdfModal(true)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>View Annual Registration PDF</span>
            </button>
            <button
              onClick={onSuccessNavigate}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-2 shadow-lg"
            >
              Go to Skater Portal <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {showSuccessPdfModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md overflow-y-auto p-4 flex items-center justify-center">
              <div className="max-w-4xl w-full my-8">
                <AnnualRegistrationPDF
                  skater={registeredSkater}
                  onClose={() => setShowSuccessPdfModal(false)}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Skater Form */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold uppercase">
                <Sparkles className="w-4 h-4" /> Official Skater Membership
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">UPRSA Skater Registration Form</h1>
              <p className="text-xs text-slate-400">
                Register under Uttar Pradesh Roller Sports Association with official document verification & QR Digital ID.
              </p>
            </div>

            {/* Registration Number Preview Badge */}
            <div className="bg-slate-950 px-4 py-3 rounded-2xl border border-amber-500/30 text-right shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Reg Format</span>
              <span className="font-mono font-black text-amber-400 text-sm">{previewRegNumber}</span>
            </div>
          </div>

          {formError && (
            <div className="p-4 bg-red-950/80 border border-red-500/60 rounded-2xl text-red-200 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div className="font-bold">{formError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 text-xs">
            
            {/* Section 1: Personal Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <User className="w-4 h-4" /> 1. {t('personalInfo')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                  <label className="text-slate-300 font-bold">{t('skaterName')} *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full Name as per Aadhaar / Birth Cert"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Father's Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    placeholder="Father's Full Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Mother's Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.motherName}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    placeholder="Mother's Full Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Date of Birth (DOB) Input */}
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t('dob')} (जन्म तिथि) *</span>
                    </label>
                    <span className="text-[10px] text-amber-400 font-semibold">
                      (DOB से आयु स्वतः निकलेगी)
                    </span>
                  </div>
                  <input
                    required
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleDobChange(e.target.value)}
                    className="w-full bg-slate-950 border-2 border-amber-500/40 focus:border-amber-400 rounded-xl px-3 py-2.5 text-white focus:outline-none font-mono text-xs font-bold transition shadow-inner"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">{t('gender')} *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Male">Male (पुरुष)</option>
                    <option value="Female">Female (महिला)</option>
                    <option value="Other">Other (अन्य)</option>
                  </select>
                </div>

                {/* Auto Calculated Age & Live Feedback Banner */}
                <div className="sm:col-span-2 lg:col-span-1 p-3.5 bg-gradient-to-br from-amber-950/40 to-slate-950 border-2 border-amber-500/50 rounded-2xl space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      स्वतः आयु गणना (Auto Age)
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-xs rounded-md shadow">
                      {calculatedAgeVal} वर्ष
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-200 font-medium">
                    आयु विवरण: <strong className="text-emerald-400 font-bold">{detailedAgeText}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-0.5 border-t border-slate-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>DOB के आधार पर आयु व ग्रुप स्वतः लागू</span>
                  </div>
                </div>

                {/* Auto-Assigned Age Group with Single Strict Option */}
                <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('ageGroup')} (आयु वर्ग / श्रेणी) *</span>
                    </label>
                  </div>

                  {formData.dob ? (
                    <select
                      value={formData.ageGroup || suggestedAgeGroupVal}
                      onChange={(e) => handleAgeGroupChange(e.target.value as AgeGroup)}
                      className="w-full bg-slate-950 border-2 border-emerald-500/80 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-emerald-300 font-extrabold text-xs focus:outline-none transition shadow-inner cursor-not-allowed"
                    >
                      <option value={suggestedAgeGroupVal} className="bg-slate-900 text-emerald-300 font-black">
                        🏆 {suggestedAgeGroupVal} (आधिकारिक श्रेणी - स्वतः चयनित)
                      </option>
                    </select>
                  ) : (
                    <div className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-500 text-xs font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>कृपया ऊपर पहले जन्म तिथि (DOB) चुनें...</span>
                    </div>
                  )}

                  <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        मान्य श्रेणी: <strong className="text-white font-bold">{formData.dob ? (formData.ageGroup || suggestedAgeGroupVal) : 'जन्म तिथि के अनुसार तय होगी'}</strong>
                      </span>
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">
                      (अन्य विकल्प स्वतः बंद)
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">{t('category')} *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Amateur">Amateur / Club Level</option>
                    <option value="State">State Championship Qualified</option>
                    <option value="National">National Championship Medalist</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Section 2: Contact Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                2. {t('contactInfo')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">{t('mobile')} *</label>
                  <input
                    required
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="+91 10-digit mobile"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">{t('email')} *</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="skater@email.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder="Guardian / Emergency Person"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    placeholder="+91 Emergency Phone"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4 space-y-1">
                  <label className="text-slate-300 font-bold">{t('address')} *</label>
                  <input
                    required
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="House/Street, Landmark, City, PIN Code, Uttar Pradesh"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Association & Club Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                3. {t('associationDetails')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">{t('district')} *</label>
                  <select
                    value={formData.districtName}
                    onChange={(e) => setFormData({ ...formData, districtName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    {districts.map(d => (
                      <option key={d.id} value={d.nameEn}>{d.nameEn}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">{t('club')} *</label>
                  <select
                    value={formData.clubName}
                    onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    {clubs.map(c => (
                      <option key={c.id} value={c.nameEn}>{c.nameEn}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Coach Name</label>
                  <input
                    type="text"
                    value={formData.coachName}
                    onChange={(e) => setFormData({ ...formData, coachName: e.target.value })}
                    placeholder="Head Coach Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">{t('discipline')} *</label>
                  <select
                    value={formData.discipline}
                    onChange={(e) => setFormData({ ...formData, discipline: e.target.value as SkatingDiscipline })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Speed Inline">Speed Inline</option>
                    <option value="Speed Quad">Speed Quad</option>
                    <option value="Speed Adjustable">Speed Adjustable</option>
                    <option value="Speed Toy Inline">Speed Toy Inline</option>
                    <option value="Artistic">Artistic</option>
                    <option value="Freestyle">Freestyle</option>
                    <option value="Roller Hockey">Roller Hockey</option>
                    <option value="Skateboarding">Skateboarding</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Passport Photo & Identity Documents Upload */}
            <div className="space-y-6">
              <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <FileCheck className="w-4 h-4" /> 4. Passport Photo & Age/Identity Proof Documents (फोटो व प्रमाण पत्र)
              </h3>

              {/* 4A: Skater Photo Upload (JPG/PNG Direct File Selection) */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                      <Camera className="w-4 h-4 text-amber-400" />
                      4A. Skater Passport Size Photo (स्केटर पासपोर्ट साइज फोटो) *
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Upload photo in <strong className="text-amber-300">any file size</strong>. System automatically optimizes & converts it to <strong className="text-emerald-400">10 to 15 KB</strong>.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded font-bold text-[10px] uppercase">
                    Mandatory / अनिवार्य *
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  {/* Photo Preview Box */}
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800">
                    {photoPreview ? (
                      <div className="space-y-2 text-center">
                        <img 
                          src={photoPreview} 
                          alt="Skater Photo" 
                          className="w-24 h-28 object-cover rounded-lg border-2 border-amber-400 mx-auto shadow-md"
                        />
                        <span className="text-[10px] text-emerald-400 font-bold block truncate max-w-[140px]">
                          ✓ {photoFileName || 'Photo Loaded'}
                        </span>
                        {photoSizeKb && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                            <Zap className="w-3 h-3 text-amber-400" /> {photoSizeKb} KB Auto-Compressed
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-24 h-28 rounded-lg bg-slate-950 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 gap-1">
                        <ImageIcon className="w-6 h-6 text-slate-600" />
                        <span className="text-[9px] font-bold text-center px-1">NO PHOTO SELECTED</span>
                      </div>
                    )}
                  </div>

                  {/* File Upload Zone */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="relative block border-2 border-dashed border-amber-500/40 hover:border-amber-400 bg-slate-900/60 hover:bg-slate-900 rounded-2xl p-4 text-center cursor-pointer transition">
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/jpg" 
                        onChange={handlePhotoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center gap-1.5 text-slate-300">
                        <Upload className="w-6 h-6 text-amber-400" />
                        <span className="font-bold text-xs text-amber-300">
                          {photoFileName ? `Selected: ${photoFileName}` : 'Select Photo File (Any Size)'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" /> ऑटोमैटिक 10 से 15 KB में कन्वर्ट व सेव होगा (Auto Converts to 10-15 KB)
                        </span>
                      </div>
                    </label>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFileName('');
                          setPhotoPreview('');
                          setPhotoSizeKb(null);
                          setFormData(prev => ({ ...prev, photoUrl: '' }));
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 underline font-semibold block"
                      >
                        ✕ Clear Selected Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 4B: Compulsory Documents (Aadhaar Card + Birth Certificate) */}
              <div className="space-y-4">
                <div className="bg-amber-950/20 border border-amber-500/40 p-3 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" /> 
                    Compulsory Proof Documents (आधार कार्ड तथा बर्थ सर्टिफिकेट - दोनों अनिवार्य)
                  </span>
                  <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded uppercase">
                    2 Mandatory Docs *
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* COMPULSORY DOC 1: Aadhaar Card */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-400" />
                        1. Aadhaar Card (आधार कार्ड) *
                      </span>
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">COMPULSORY</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold block">Aadhaar Number (12 Digit) *</label>
                      <input
                        required
                        type="text"
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value)}
                        placeholder="XXXX XXXX XXXX"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold block">Aadhaar Document Copy (JPG / PNG / PDF) *</label>
                      <label className="relative block border-2 border-dashed border-slate-800 hover:border-amber-500 bg-slate-900/50 rounded-xl p-3 text-center cursor-pointer transition">
                        <input 
                          type="file" 
                          accept="image/*,.pdf"
                          onChange={(e) => handleDocUpload(e, 'aadhaar')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center gap-1 text-slate-300">
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-amber-400" />
                            <span className="text-xs truncate max-w-[200px]">
                              {aadhaarFileName ? `✓ ${aadhaarFileName}` : 'Choose Aadhaar File'}
                            </span>
                          </div>
                          {aadhaarSizeKb && (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-400" /> Auto Compressed to {aadhaarSizeKb} KB
                            </span>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* COMPULSORY DOC 2: Birth Certificate */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-extrabold text-white text-xs flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-400" />
                        2. Birth Certificate (जन्म प्रमाण पत्र) *
                      </span>
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">COMPULSORY</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold block">Birth Certificate Reg. Number *</label>
                      <input
                        required
                        type="text"
                        value={birthCertNumber}
                        onChange={(e) => setBirthCertNumber(e.target.value)}
                        placeholder="Registration No. / Certificate No."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold block">Birth Certificate Copy (JPG / PNG / PDF) *</label>
                      <label className="relative block border-2 border-dashed border-slate-800 hover:border-amber-500 bg-slate-900/50 rounded-xl p-3 text-center cursor-pointer transition">
                        <input 
                          type="file" 
                          accept="image/*,.pdf"
                          onChange={(e) => handleDocUpload(e, 'birthCert')}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center gap-1 text-slate-300">
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-amber-400" />
                            <span className="text-xs truncate max-w-[200px]">
                              {birthCertFileName ? `✓ ${birthCertFileName}` : 'Choose Birth Certificate File'}
                            </span>
                          </div>
                          {birthCertSizeKb && (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-400" /> Auto Compressed to {birthCertSizeKb} KB
                            </span>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                </div>
              </div>

              {/* 4C: Optional Document (Passport or School ID Card) */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-slate-300 text-xs flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                    3. Optional Identity Proof (पासपोर्ट या स्कूल आई.डी. कार्ड में से कोई एक)
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">OPTIONAL / ऐच्छिक</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">Document Type</label>
                    <select
                      value={optionalDocType}
                      onChange={(e) => setOptionalDocType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="School ID">School ID Card (स्कूल आई.डी.)</option>
                      <option value="Passport">Passport (पासपोर्ट)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">Doc / Roll No. (Optional)</label>
                    <input
                      type="text"
                      value={optionalDocNumber}
                      onChange={(e) => setOptionalDocNumber(e.target.value)}
                      placeholder="e.g. Passport No or School Admission No."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold block">Attach File (Optional)</label>
                    <label className="relative block border border-dashed border-slate-800 hover:border-slate-600 bg-slate-900/50 rounded-xl p-2 text-center cursor-pointer transition">
                      <input 
                        type="file" 
                        accept="image/*,.pdf"
                        onChange={(e) => handleDocUpload(e, 'optional')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex items-center justify-center gap-2 text-slate-400 py-0.5">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs truncate max-w-[150px]">
                          {optionalDocFileName ? `✓ ${optionalDocFileName}` : 'Upload Optional File'}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-slate-950 font-black rounded-xl text-sm transition shadow-xl flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" /> Submit Skater Registration & Generate Digital ID Card
            </button>

          </form>

        </div>
      )}

    </div>
  );
};
