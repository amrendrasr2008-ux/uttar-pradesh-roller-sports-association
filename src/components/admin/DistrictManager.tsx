import React, { useState } from 'react';
import { dbStore } from '../../lib/db';
import { District } from '../../types';
import { compressImageToStrict15KB, validateFileType } from '../../lib/storage';
import { 
  MapPin, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  Edit3, 
  X, 
  CheckCircle2, 
  Image as ImageIcon, 
  Building2, 
  Search,
  Upload,
  LayoutGrid,
  Table as TableIcon,
  Camera,
  Check
} from 'lucide-react';

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
];

const SAMPLE_LOGOS = [
  'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&auto=format&fit=crop&q=80',
];

export const DistrictManager: React.FC = () => {
  const [districts, setDistricts] = useState<District[]>(() => dbStore.getDistricts());
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Quick edit modal for Phone & JPG Photo update
  const [quickEditDistrict, setQuickEditDistrict] = useState<District | null>(null);
  const [quickPhones, setQuickPhones] = useState({
    contactPhone: '',
    presidentPhone: '',
    secretaryPhone: '',
    treasurerPhone: ''
  });
  const [quickPhotos, setQuickPhotos] = useState({
    logoUrl: '',
    presidentPhotoUrl: '',
    secretaryPhotoUrl: '',
    treasurerPhotoUrl: ''
  });
  const [quickSavedToast, setQuickSavedToast] = useState(false);

  const emptyForm: Omit<District, 'id'> = {
    code: '',
    nameEn: '',
    nameHi: '',
    zone: 'Central',
    address: '',
    logoUrl: '',

    presidentName: '',
    presidentPhotoUrl: '',
    presidentPhone: '',
    presidentEmail: '',
    presidentAddress: '',

    secretaryName: '',
    secretaryPhotoUrl: '',
    secretaryPhone: '',
    secretaryEmail: '',
    secretaryAddress: '',

    treasurerName: '',
    treasurerPhotoUrl: '',
    treasurerPhone: '',
    treasurerEmail: '',
    treasurerAddress: '',

    contactPhone: '',
    contactEmail: '',
    skaterCount: 0
  };

  const [formData, setFormData] = useState<Omit<District, 'id'>>(emptyForm);

  const handleOpenAdd = () => {
    setEditingDistrict(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dist: District) => {
    setEditingDistrict(dist);
    setFormData({
      code: dist.code || '',
      nameEn: dist.nameEn || '',
      nameHi: dist.nameHi || '',
      zone: dist.zone || 'Central',
      address: dist.address || '',
      logoUrl: dist.logoUrl || '',

      presidentName: dist.presidentName || '',
      presidentPhotoUrl: dist.presidentPhotoUrl || '',
      presidentPhone: dist.presidentPhone || '',
      presidentEmail: dist.presidentEmail || '',
      presidentAddress: dist.presidentAddress || '',

      secretaryName: dist.secretaryName || '',
      secretaryPhotoUrl: dist.secretaryPhotoUrl || '',
      secretaryPhone: dist.secretaryPhone || '',
      secretaryEmail: dist.secretaryEmail || '',
      secretaryAddress: dist.secretaryAddress || '',

      treasurerName: dist.treasurerName || '',
      treasurerPhotoUrl: dist.treasurerPhotoUrl || '',
      treasurerPhone: dist.treasurerPhone || '',
      treasurerEmail: dist.treasurerEmail || '',
      treasurerAddress: dist.treasurerAddress || '',

      contactPhone: dist.contactPhone || '',
      contactEmail: dist.contactEmail || '',
      skaterCount: dist.skaterCount || 0
    });
    setIsModalOpen(true);
  };

  const handleOpenQuickEdit = (dist: District) => {
    setQuickEditDistrict(dist);
    setQuickPhones({
      contactPhone: dist.contactPhone || '',
      presidentPhone: dist.presidentPhone || '',
      secretaryPhone: dist.secretaryPhone || '',
      treasurerPhone: dist.treasurerPhone || ''
    });
    setQuickPhotos({
      logoUrl: dist.logoUrl || '',
      presidentPhotoUrl: dist.presidentPhotoUrl || '',
      secretaryPhotoUrl: dist.secretaryPhotoUrl || '',
      treasurerPhotoUrl: dist.treasurerPhotoUrl || ''
    });
  };

  const handleSaveQuickEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditDistrict) return;

    dbStore.updateDistrict(quickEditDistrict.id, {
      contactPhone: quickPhones.contactPhone,
      presidentPhone: quickPhones.presidentPhone,
      secretaryPhone: quickPhones.secretaryPhone,
      treasurerPhone: quickPhones.treasurerPhone,
      logoUrl: quickPhotos.logoUrl,
      presidentPhotoUrl: quickPhotos.presidentPhotoUrl,
      secretaryPhotoUrl: quickPhotos.secretaryPhotoUrl,
      treasurerPhotoUrl: quickPhotos.treasurerPhotoUrl,
    });

    setDistricts(dbStore.getDistricts());
    setQuickSavedToast(true);
    setTimeout(() => {
      setQuickSavedToast(false);
      setQuickEditDistrict(null);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingDistrict) {
      dbStore.updateDistrict(editingDistrict.id, formData);
    } else {
      dbStore.addDistrict({
        ...formData,
        code: formData.code.toUpperCase() || 'DIST-' + Math.floor(10 + Math.random() * 90)
      });
    }

    setDistricts(dbStore.getDistricts());
    setIsModalOpen(false);
  };

  // Helper for JPG/JPEG image upload simulation & FileReader (strictly <= 15 KB)
  const handleImageUpload = async (field: keyof Omit<District, 'id'>, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFileType(file);
      if (!validation.valid) return;
      try {
        const compressed = await compressImageToStrict15KB(file, file.name);
        setFormData(prev => ({ ...prev, [field]: compressed.dataUrl }));
      } catch (err) {
        console.error('District image upload compression error:', err);
      }
    }
  };

  const handleQuickImageUpload = async (key: keyof typeof quickPhotos, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFileType(file);
      if (!validation.valid) return;
      try {
        const compressed = await compressImageToStrict15KB(file, file.name);
        setQuickPhotos(prev => ({ ...prev, [key]: compressed.dataUrl }));
      } catch (err) {
        console.error('District quick image upload error:', err);
      }
    }
  };

  const filtered = districts.filter(d =>
    (d.nameEn || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (d.nameHi || '').includes(search || '') ||
    (d.code || '').toLowerCase().includes((search || '').toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            जिला संघ प्रबंधन (District Associations Management)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            यहाँ से उत्तर प्रदेश के सभी जिला संघों के कॉलम में फोटो (JPG / JPEG फॉर्मेट) लगाएँ और मोबाइल नंबर संपादित (Edit) करें।
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> नया जिला जोड़ें (Add District)
        </button>
      </div>

      {/* Controls: Search & View Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="जिला का नाम या कोड खोजें..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl shrink-0 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'grid' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> ग्रिड कार्ड दृश्य
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'table' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" /> तालिका कॉलम दृश्य (Table View)
          </button>
        </div>
      </div>

      {/* ==================== TABLE / COLUMN VIEW ==================== */}
      {viewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                  <th className="p-4">कोड व नाम (District)</th>
                  <th className="p-4 text-center">लोगो (JPG Photo)</th>
                  <th className="p-4">हेल्पलाइन फोन (Mobile)</th>
                  <th className="p-4">अध्यक्ष (President & Mobile)</th>
                  <th className="p-4">महासचिव (Secretary & Mobile)</th>
                  <th className="p-4">कोषाध्यक्ष (Treasurer & Mobile)</th>
                  <th className="p-4 text-center">एक्शन (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map(dist => (
                  <tr key={dist.id} className="hover:bg-slate-850/50 transition">
                    
                    {/* District Name */}
                    <td className="p-4 font-bold">
                      <span className="font-mono text-amber-400 font-bold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 block w-fit mb-1">
                        {dist.code}
                      </span>
                      <div className="text-white text-sm font-extrabold">{dist.nameEn}</div>
                      <div className="text-slate-400 text-xs font-bold">{dist.nameHi}</div>
                    </td>

                    {/* Logo JPG */}
                    <td className="p-4 text-center">
                      <div className="relative inline-block group">
                        {dist.logoUrl ? (
                          <img src={dist.logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-contain bg-slate-950 border border-slate-700 p-1 mx-auto shadow" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 font-black text-xs">
                            NO LOGO
                          </div>
                        )}
                        <label className="absolute inset-0 bg-slate-950/80 text-amber-400 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-xl cursor-pointer text-[9px] font-bold">
                          <Camera className="w-3.5 h-3.5 mb-0.5" /> JPG बदलें
                          <input 
                            type="file" 
                            accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  dbStore.updateDistrict(dist.id, { logoUrl: reader.result as string });
                                  setDistricts(dbStore.getDistricts());
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </td>

                    {/* Helpline Phone */}
                    <td className="p-4 font-mono text-amber-300 font-bold">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{dist.contactPhone || 'N/A'}</span>
                      </div>
                    </td>

                    {/* President Column */}
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        {dist.presidentPhotoUrl ? (
                          <img src={dist.presidentPhotoUrl} alt="Pres" className="w-10 h-10 rounded-xl object-cover border border-emerald-500 shadow shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-400 font-extrabold flex items-center justify-center text-xs shrink-0">P</div>
                        )}
                        <div>
                          <span className="font-extrabold text-white block leading-tight">{dist.presidentName || 'N/A'}</span>
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" /> {dist.presidentPhone || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Secretary Column */}
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        {dist.secretaryPhotoUrl ? (
                          <img src={dist.secretaryPhotoUrl} alt="Sec" className="w-10 h-10 rounded-xl object-cover border border-blue-500 shadow shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-500 text-blue-400 font-extrabold flex items-center justify-center text-xs shrink-0">S</div>
                        )}
                        <div>
                          <span className="font-extrabold text-white block leading-tight">{dist.secretaryName || 'N/A'}</span>
                          <span className="text-[10px] font-mono text-blue-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" /> {dist.secretaryPhone || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Treasurer Column */}
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        {dist.treasurerPhotoUrl ? (
                          <img src={dist.treasurerPhotoUrl} alt="Treas" className="w-10 h-10 rounded-xl object-cover border border-purple-500 shadow shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500 text-purple-400 font-extrabold flex items-center justify-center text-xs shrink-0">T</div>
                        )}
                        <div>
                          <span className="font-extrabold text-white block leading-tight">{dist.treasurerName || 'N/A'}</span>
                          <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" /> {dist.treasurerPhone || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenQuickEdit(dist)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 rounded-xl font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                          title="मोबाइल नंबर व JPG फोटो एडिट करें"
                        >
                          <Phone className="w-3 h-3" /> मोबाइल व JPG एडिट
                        </button>

                        <button
                          onClick={() => handleOpenEdit(dist)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                          title="पूरा फॉर्म सम्पादित करें"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== GRID CARDS VIEW ==================== */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(dist => (
            <div 
              key={dist.id} 
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                
                {/* Card Top / Big Logo & Title */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-3 gap-3">
                  <div className="flex items-center gap-3">
                    {dist.logoUrl ? (
                      <img 
                        src={dist.logoUrl} 
                        alt={dist.nameEn} 
                        className="w-16 h-16 rounded-2xl object-contain bg-slate-950 border-2 border-slate-700 p-1.5 shrink-0 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center shrink-0">
                        <Building2 className="w-8 h-8 text-amber-400" />
                      </div>
                    )}
                    <div>
                      <span className="font-mono text-amber-400 font-bold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {dist.code}
                      </span>
                      <h3 className="font-black text-white text-base leading-tight mt-1">
                        {dist.nameEn}
                      </h3>
                      <p className="text-xs font-bold text-slate-400">{dist.nameHi}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenQuickEdit(dist)}
                      className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-400 rounded-xl text-xs font-bold border border-amber-500/30 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Phone className="w-3 h-3" /> मोबाइल व JPG एडिट
                    </button>
                    <button
                      onClick={() => handleOpenEdit(dist)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" /> पूर्ण फॉर्म
                    </button>
                  </div>
                </div>

                {/* Address */}
                {dist.address && (
                  <div className="text-xs text-slate-300 flex items-start gap-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{dist.address}</span>
                  </div>
                )}

                {/* Officials Quick Summary (President, Secretary, Treasurer) */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                    पदाधिकारी एवं मोबाइल नंबर (Officials & Mobile):
                  </span>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {/* President */}
                    <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 space-y-1.5 flex flex-col items-center relative group">
                      {dist.presidentPhotoUrl ? (
                        <img src={dist.presidentPhotoUrl} alt="President" className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-emerald-950 border-2 border-emerald-500 text-emerald-400 font-extrabold flex items-center justify-center text-lg shadow-md">
                          P
                        </div>
                      )}
                      <span className="text-[9px] font-bold text-emerald-400 block uppercase">अध्यक्ष</span>
                      <span className="text-[11px] font-extrabold text-white truncate w-full">{dist.presidentName || 'N/A'}</span>
                      <span className="text-[9px] font-mono text-emerald-300 font-bold block truncate w-full">{dist.presidentPhone || 'No Phone'}</span>
                    </div>

                    {/* Secretary */}
                    <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 space-y-1.5 flex flex-col items-center">
                      {dist.secretaryPhotoUrl ? (
                        <img src={dist.secretaryPhotoUrl} alt="Secretary" className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-md" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-blue-950 border-2 border-blue-500 text-blue-400 font-extrabold flex items-center justify-center text-lg shadow-md">
                          S
                        </div>
                      )}
                      <span className="text-[9px] font-bold text-blue-400 block uppercase">महासचिव</span>
                      <span className="text-[11px] font-extrabold text-white truncate w-full">{dist.secretaryName || 'N/A'}</span>
                      <span className="text-[9px] font-mono text-blue-300 font-bold block truncate w-full">{dist.secretaryPhone || 'No Phone'}</span>
                    </div>

                    {/* Treasurer */}
                    <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 space-y-1.5 flex flex-col items-center">
                      {dist.treasurerPhotoUrl ? (
                        <img src={dist.treasurerPhotoUrl} alt="Treasurer" className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-500 shadow-md" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-purple-950 border-2 border-purple-500 text-purple-400 font-extrabold flex items-center justify-center text-lg shadow-md">
                          T
                        </div>
                      )}
                      <span className="text-[9px] font-bold text-purple-400 block uppercase">कोषाध्यक्ष (तिजरार)</span>
                      <span className="text-[11px] font-extrabold text-white truncate w-full">{dist.treasurerName || 'N/A'}</span>
                      <span className="text-[9px] font-mono text-purple-300 font-bold block truncate w-full">{dist.treasurerPhone || 'No Phone'}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Contact Details */}
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 font-mono text-amber-300 font-bold">
                  <Phone className="w-3 h-3 text-amber-400 shrink-0" /> {dist.contactPhone || 'No Phone'}
                </span>
                <span className="flex items-center gap-1 truncate font-mono text-slate-400">
                  <Mail className="w-3 h-3 text-purple-400 shrink-0" /> {dist.contactEmail || 'No Email'}
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ==================== QUICK PHONE & JPG PHOTO EDIT MODAL ==================== */}
      {quickEditDistrict && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            
            <button
              onClick={() => setQuickEditDistrict(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-slate-800 pb-3 pr-8">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-amber-400" />
                मोबाइल नंबर व JPG फोटो एडिट: <span className="text-amber-400">{quickEditDistrict.nameEn}</span>
              </h2>
              <p className="text-xs text-slate-400">
                यहाँ से सीधे जिला हेल्पलाइन एवं अध्यक्ष, महासचिव व कोषाध्यक्ष के मोबाइल नंबर दर्ज करें तथा JPG/JPEG फोटो अपलोड करें।
              </p>
            </div>

            {quickSavedToast && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
                <Check className="w-4 h-4" />
                सफलतापूर्वक मोबाइल नंबर एवं JPG फोटो सुरक्षित कर दिए गए हैं!
              </div>
            )}

            <form onSubmit={handleSaveQuickEdit} className="space-y-4 text-xs">
              
              {/* Helpline Phone & Logo JPG */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-extrabold text-amber-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> 1. जिला संघ हेल्पलाइन व लोगो (JPG)
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">आधिकारिक हेल्पलाइन नंबर</label>
                    <input
                      type="text"
                      placeholder="+91 94150 00000"
                      value={quickPhones.contactPhone}
                      onChange={(e) => setQuickPhones({ ...quickPhones, contactPhone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">जिला बड़ा लोगो (JPG/JPEG)</label>
                    <label className="flex items-center justify-between w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 cursor-pointer hover:border-amber-500 transition">
                      <span className="text-slate-400 text-[10px] truncate max-w-[150px]">
                        {quickPhotos.logoUrl ? '✓ JPG लोगो लोड है' : 'JPG फोटो चुनें'}
                      </span>
                      <span className="px-2 py-1 bg-amber-500 text-slate-950 font-black rounded text-[10px] flex items-center gap-1">
                        <Upload className="w-3 h-3" /> JPG अपलोड
                      </span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
                        className="hidden"
                        onChange={(e) => handleQuickImageUpload('logoUrl', e)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* President Phone & JPG Photo */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-emerald-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-emerald-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4" /> 2. अध्यक्ष (President): {quickEditDistrict.presidentName || 'N/A'}
                  </h3>
                  {quickPhotos.presidentPhotoUrl && (
                    <img src={quickPhotos.presidentPhotoUrl} alt="Pres" className="w-10 h-10 rounded-xl object-cover border border-emerald-500" />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">अध्यक्ष का मोबाइल नंबर</label>
                    <input
                      type="text"
                      placeholder="+91 94150 11223"
                      value={quickPhones.presidentPhone}
                      onChange={(e) => setQuickPhones({ ...quickPhones, presidentPhone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">अध्यक्ष फोटो (JPG/JPEG)</label>
                    <label className="flex items-center justify-between w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 cursor-pointer hover:border-emerald-500 transition">
                      <span className="text-slate-400 text-[10px] truncate max-w-[150px]">
                        {quickPhotos.presidentPhotoUrl ? '✓ JPG फोटो संलग्न' : 'JPG फोटो चुनें'}
                      </span>
                      <span className="px-2 py-1 bg-emerald-500 text-slate-950 font-black rounded text-[10px] flex items-center gap-1">
                        <Upload className="w-3 h-3" /> JPG अपलोड
                      </span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
                        className="hidden"
                        onChange={(e) => handleQuickImageUpload('presidentPhotoUrl', e)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Secretary Phone & JPG Photo */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-blue-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-blue-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4" /> 3. महासचिव (Secretary): {quickEditDistrict.secretaryName || 'N/A'}
                  </h3>
                  {quickPhotos.secretaryPhotoUrl && (
                    <img src={quickPhotos.secretaryPhotoUrl} alt="Sec" className="w-10 h-10 rounded-xl object-cover border border-blue-500" />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">महासचिव का मोबाइल नंबर</label>
                    <input
                      type="text"
                      placeholder="+91 94150 11224"
                      value={quickPhones.secretaryPhone}
                      onChange={(e) => setQuickPhones({ ...quickPhones, secretaryPhone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">महासचिव फोटो (JPG/JPEG)</label>
                    <label className="flex items-center justify-between w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 cursor-pointer hover:border-blue-500 transition">
                      <span className="text-slate-400 text-[10px] truncate max-w-[150px]">
                        {quickPhotos.secretaryPhotoUrl ? '✓ JPG फोटो संलग्न' : 'JPG फोटो चुनें'}
                      </span>
                      <span className="px-2 py-1 bg-blue-500 text-slate-950 font-black rounded text-[10px] flex items-center gap-1">
                        <Upload className="w-3 h-3" /> JPG अपलोड
                      </span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
                        className="hidden"
                        onChange={(e) => handleQuickImageUpload('secretaryPhotoUrl', e)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Treasurer Phone & JPG Photo */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-purple-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-purple-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4" /> 4. कोषाध्यक्ष/तिजरार (Treasurer): {quickEditDistrict.treasurerName || 'N/A'}
                  </h3>
                  {quickPhotos.treasurerPhotoUrl && (
                    <img src={quickPhotos.treasurerPhotoUrl} alt="Treas" className="w-10 h-10 rounded-xl object-cover border border-purple-500" />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">तिजरार का मोबाइल नंबर</label>
                    <input
                      type="text"
                      placeholder="+91 94150 11226"
                      value={quickPhones.treasurerPhone}
                      onChange={(e) => setQuickPhones({ ...quickPhones, treasurerPhone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">तिजरार फोटो (JPG/JPEG)</label>
                    <label className="flex items-center justify-between w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 cursor-pointer hover:border-purple-500 transition">
                      <span className="text-slate-400 text-[10px] truncate max-w-[150px]">
                        {quickPhotos.treasurerPhotoUrl ? '✓ JPG फोटो संलग्न' : 'JPG फोटो चुनें'}
                      </span>
                      <span className="px-2 py-1 bg-purple-500 text-slate-950 font-black rounded text-[10px] flex items-center gap-1">
                        <Upload className="w-3 h-3" /> JPG अपलोड
                      </span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
                        className="hidden"
                        onChange={(e) => handleQuickImageUpload('treasurerPhotoUrl', e)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickEditDistrict(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black uppercase text-xs tracking-wider rounded-xl transition shadow-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> अपडेट सुरक्षित करें
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ==================== ADD / EDIT DISTRICT MODAL ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-slate-800 pb-4 pr-8">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                {editingDistrict ? `जिला संघ अपडेट करें: ${editingDistrict.nameEn}` : 'नया जिला संघ जोड़ें'}
              </h2>
              <p className="text-xs text-slate-400">
                नीचे सभी विवरण, बड़ा लोगो (JPG/JPEG), कार्यालय का पता, एवं अध्यक्ष, सचिव व कोषाध्यक्ष (तिजरार) की JPG फोटो व सम्पर्क जानकारी भरें:
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs max-h-[75vh] overflow-y-auto pr-2">
              
              {/* SECTION 1: DISTRICT BASIC INFO */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <h3 className="font-extrabold text-amber-400 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> 1. जिला संघ का नाम, कोड एवं लोगो (District Basic Details)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">जिला कोड (District Code)</label>
                    <input
                      required
                      placeholder="e.g. LKO, VNS, GBN"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">जिला नाम (English)</label>
                    <input
                      required
                      placeholder="Lucknow District Roller Skating Association"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">जिला नाम (हिन्दी)</label>
                    <input
                      placeholder="लखनऊ जिला रोलर स्केटिंग संघ"
                      value={formData.nameHi}
                      onChange={(e) => setFormData({ ...formData, nameHi: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                {/* Logo & Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                      <span>जिला बड़ा लोगो URL / JPG</span>
                      <label className="cursor-pointer text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-bold">
                        <Upload className="w-3 h-3" /> JPG अपलोड करें
                        <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png" className="hidden" onChange={(e) => handleImageUpload('logoUrl', e)} />
                      </label>
                    </label>
                    <input
                      placeholder="https://... photo URL or upload JPG"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
                    />
                    
                    {/* Sample Logo Picker */}
                    <div className="flex items-center gap-1.5 mt-2 overflow-x-auto">
                      <span className="text-[10px] text-slate-400 shrink-0">सैंपल लोगो:</span>
                      {SAMPLE_LOGOS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, logoUrl: url })}
                          className="w-6 h-6 rounded border border-slate-700 overflow-hidden shrink-0 hover:scale-110 transition cursor-pointer"
                        >
                          <img src={url} alt="sample" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">संघ कार्यालय का पूरा पता (Office Address)</label>
                    <textarea
                      rows={2}
                      placeholder="KD Singh Babu Stadium, Civil Lines, Lucknow..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">आधिकारिक फोन (Helpline Phone)</label>
                    <input
                      placeholder="+91 94150 00000"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">आधिकारिक ईमेल (Official Email)</label>
                    <input
                      placeholder="lucknow@uprsa.org"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

              </div>

              {/* SECTION 2: PRESIDENT (अध्यक्ष) DETAILS */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-emerald-900/60">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-emerald-400 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4" /> 2. अध्यक्ष विवरण (President Details)
                  </h3>
                  {!!formData.presidentPhotoUrl && (
                    <img src={formData.presidentPhotoUrl} alt="Pres" className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-md" />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">अध्यक्ष का नाम (President Name)</label>
                    <input
                      placeholder="e.g. Rajeshwar Singh"
                      value={formData.presidentName}
                      onChange={(e) => setFormData({ ...formData, presidentName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                      <span>अध्यक्ष JPG फोटो URL</span>
                      <label className="cursor-pointer text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-bold">
                        <Upload className="w-3 h-3" /> JPG फोटो अपलोड
                        <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png" className="hidden" onChange={(e) => handleImageUpload('presidentPhotoUrl', e)} />
                      </label>
                    </label>
                    <input
                      placeholder="https://... photo URL or upload JPG"
                      value={formData.presidentPhotoUrl}
                      onChange={(e) => setFormData({ ...formData, presidentPhotoUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
                    />

                    {/* Avatar Preset Helper */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] text-slate-400 shrink-0">सैंपल फोटो:</span>
                      {SAMPLE_AVATARS.slice(0, 3).map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, presidentPhotoUrl: url })}
                          className="w-5 h-5 rounded-full overflow-hidden border border-emerald-500 hover:scale-110 transition cursor-pointer"
                        >
                          <img src={url} alt="avatar" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">सम्पर्क फोन/मोबाइल नंबर (Phone No.)</label>
                    <input
                      placeholder="+91 94150 11223"
                      value={formData.presidentPhone}
                      onChange={(e) => setFormData({ ...formData, presidentPhone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">ईमेल आईडी (Email ID)</label>
                    <input
                      placeholder="president@uprsa.org"
                      value={formData.presidentEmail}
                      onChange={(e) => setFormData({ ...formData, presidentEmail: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">अध्यक्ष का व्यक्तिगत/कार्यालयी पता (Address)</label>
                  <input
                    placeholder="12/A Park Road, Lucknow"
                    value={formData.presidentAddress}
                    onChange={(e) => setFormData({ ...formData, presidentAddress: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              {/* SECTION 3: SECRETARY (महासचिव/सेक्रेटरी) DETAILS */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-blue-900/60">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-blue-400 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4" /> 3. सेक्रेटरी / महासचिव विवरण (Secretary Details)
                  </h3>
                  {!!formData.secretaryPhotoUrl && (
                    <img src={formData.secretaryPhotoUrl} alt="Sec" className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-md" />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">सेक्रेटरी का नाम (Secretary Name)</label>
                    <input
                      placeholder="e.g. Anoop Srivastava"
                      value={formData.secretaryName}
                      onChange={(e) => setFormData({ ...formData, secretaryName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                      <span>सेक्रेटरी JPG फोटो URL</span>
                      <label className="cursor-pointer text-[10px] text-blue-400 hover:underline flex items-center gap-1 font-bold">
                        <Upload className="w-3 h-3" /> JPG फोटो अपलोड
                        <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png" className="hidden" onChange={(e) => handleImageUpload('secretaryPhotoUrl', e)} />
                      </label>
                    </label>
                    <input
                      placeholder="https://... photo URL or upload JPG"
                      value={formData.secretaryPhotoUrl}
                      onChange={(e) => setFormData({ ...formData, secretaryPhotoUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
                    />

                    {/* Avatar Preset Helper */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] text-slate-400 shrink-0">सैंपल फोटो:</span>
                      {SAMPLE_AVATARS.slice(2, 5).map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, secretaryPhotoUrl: url })}
                          className="w-5 h-5 rounded-full overflow-hidden border border-blue-500 hover:scale-110 transition cursor-pointer"
                        >
                          <img src={url} alt="avatar" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">सम्पर्क फोन/मोबाइल नंबर (Phone No.)</label>
                    <input
                      placeholder="+91 94150 11224"
                      value={formData.secretaryPhone}
                      onChange={(e) => setFormData({ ...formData, secretaryPhone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">ईमेल आईडी (Email ID)</label>
                    <input
                      placeholder="secretary@uprsa.org"
                      value={formData.secretaryEmail}
                      onChange={(e) => setFormData({ ...formData, secretaryEmail: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">सेक्रेटरी का व्यक्तिगत/कार्यालयी पता (Address)</label>
                  <input
                    placeholder="45-B Gokhale Marg, Lucknow"
                    value={formData.secretaryAddress}
                    onChange={(e) => setFormData({ ...formData, secretaryAddress: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              {/* SECTION 4: TREASURER (तिजरार/कोषाध्यक्ष/ट्रेजरार) DETAILS */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-purple-900/60">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-purple-400 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4" /> 4. कोषाध्यक्ष / तिजरार विवरण (Treasurer Details)
                  </h3>
                  {!!formData.treasurerPhotoUrl && (
                    <img src={formData.treasurerPhotoUrl} alt="Treas" className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500 shadow-md" />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">तिजरार/कोषाध्यक्ष का नाम (Treasurer Name)</label>
                    <input
                      placeholder="e.g. V. K. Sharma"
                      value={formData.treasurerName}
                      onChange={(e) => setFormData({ ...formData, treasurerName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                      <span>तिजरार JPG फोटो URL</span>
                      <label className="cursor-pointer text-[10px] text-purple-400 hover:underline flex items-center gap-1 font-bold">
                        <Upload className="w-3 h-3" /> JPG फोटो अपलोड
                        <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png" className="hidden" onChange={(e) => handleImageUpload('treasurerPhotoUrl', e)} />
                      </label>
                    </label>
                    <input
                      placeholder="https://... photo URL or upload JPG"
                      value={formData.treasurerPhotoUrl}
                      onChange={(e) => setFormData({ ...formData, treasurerPhotoUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
                    />

                    {/* Avatar Preset Helper */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] text-slate-400 shrink-0">सैंपल फोटो:</span>
                      {SAMPLE_AVATARS.slice(3, 6).map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, treasurerPhotoUrl: url })}
                          className="w-5 h-5 rounded-full overflow-hidden border border-purple-500 hover:scale-110 transition cursor-pointer"
                        >
                          <img src={url} alt="avatar" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">सम्पर्क फोन/मोबाइल नंबर (Phone No.)</label>
                    <input
                      placeholder="+91 94150 11226"
                      value={formData.treasurerPhone}
                      onChange={(e) => setFormData({ ...formData, treasurerPhone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">ईमेल आईडी (Email ID)</label>
                    <input
                      placeholder="treasurer@uprsa.org"
                      value={formData.treasurerEmail}
                      onChange={(e) => setFormData({ ...formData, treasurerEmail: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">तिजरार का व्यक्तिगत/कार्यालयी पता (Address)</label>
                  <input
                    placeholder="78 Mahanagar Extension, Lucknow"
                    value={formData.treasurerAddress}
                    onChange={(e) => setFormData({ ...formData, treasurerAddress: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black uppercase text-xs tracking-wider rounded-xl transition shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingDistrict ? 'सुरक्षित करें (Save Updates)' : 'नया जिला जोड़ें (Create District)'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
