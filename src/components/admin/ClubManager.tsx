import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { dbStore } from '../../lib/db';
import { Club } from '../../types';
import { Building2, Plus, CheckCircle2, XCircle, Search, User, Phone, Mail, MapPin } from 'lucide-react';

export const ClubManager: React.FC = () => {
  const { t } = useLanguage();
  const [clubs, setClubs] = useState<Club[]>(() => dbStore.getClubs());
  const districts = dbStore.getDistricts();

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    nameEn: '',
    nameHi: '',
    districtName: 'Lucknow',
    coachName: '',
    contactPhone: '',
    email: '',
    address: ''
  });

  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    const selDist = districts.find(d => d.nameEn === formData.districtName) || districts[0];
    
    const newClub = dbStore.addClub({
      code: formData.code.toUpperCase() || 'CLUB-' + Math.floor(100 + Math.random() * 900),
      nameEn: formData.nameEn,
      nameHi: formData.nameHi || formData.nameEn,
      districtId: selDist.id,
      districtName: selDist.nameEn,
      coachName: formData.coachName,
      contactPhone: formData.contactPhone,
      email: formData.email,
      address: formData.address,
      status: 'approved'
    });

    setClubs(dbStore.getClubs());
    setShowAddModal(false);
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const next = currentStatus === 'approved' ? 'rejected' : 'approved';
    dbStore.updateClubStatus(id, next as any);
    setClubs(dbStore.getClubs());
  };

  return (
    <div className="space-y-6 text-slate-100">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white">Club & Academy Management</h1>
          <p className="text-xs text-slate-400">Create, edit, approve clubs, and assign them to UP district associations.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" /> Add New Club / Academy
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map(club => (
          <div key={club.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-amber-400 font-bold text-xs">{club.code}</span>
                <button
                  onClick={() => handleToggleStatus(club.id, club.status)}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase transition ${
                    club.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {club.status}
                </button>
              </div>

              <div>
                <h3 className="font-extrabold text-white text-base leading-snug">{club.nameEn}</h3>
                <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> {club.districtName}
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <p>Coach: <strong>{club.coachName}</strong></p>
                <p>Phone: <strong>{club.contactPhone}</strong></p>
                <p>Email: <strong>{club.email}</strong></p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Skaters: <strong className="text-white">{club.skaterCount || 0}</strong></span>
              <span>Points: <strong className="text-amber-400">{club.totalPoints || 0} Pts</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <h2 className="text-lg font-black text-white">Create New Skating Club / Academy</h2>

            <form onSubmit={handleCreateClub} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold">Club Code</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. LRSA"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold">District</label>
                  <select
                    value={formData.districtName}
                    onChange={(e) => setFormData({ ...formData, districtName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {districts.map(d => (
                      <option key={d.id} value={d.nameEn}>{d.nameEn}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold">Club Name (English) *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Lucknow Roller Skating Academy"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold">Head Coach Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Coach Name"
                    value={formData.coachName}
                    onChange={(e) => setFormData({ ...formData, coachName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold">Contact Phone</label>
                  <input
                    required
                    type="tel"
                    placeholder="Phone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 text-slate-950 rounded-xl font-black"
                >
                  Save Club
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
