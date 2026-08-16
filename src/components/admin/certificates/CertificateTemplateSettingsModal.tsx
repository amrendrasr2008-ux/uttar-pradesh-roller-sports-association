import React, { useState } from 'react';
import { CertificateTemplate } from '../../../types';
import { dbStore } from '../../../lib/db';
import { compressImageToStrict15KB } from '../../../lib/storage';
import { X, Save, Sliders, CheckCircle2, RotateCcw } from 'lucide-react';

interface CertificateTemplateSettingsModalProps {
  onClose: () => void;
  onSaveSuccess: () => void;
}

export const CertificateTemplateSettingsModal: React.FC<CertificateTemplateSettingsModalProps> = ({
  onClose,
  onSaveSuccess,
}) => {
  const currentTemplate = dbStore.getCertificateTemplate();
  const [template, setTemplate] = useState<CertificateTemplate>(currentTemplate);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dbStore.saveCertificateTemplate(template);
    setSuccessMsg('Certificate template settings saved successfully!');
    setTimeout(() => {
      onSaveSuccess();
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    const defaultTpl = dbStore.getCertificateTemplate();
    setTemplate(defaultTpl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 text-slate-100">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              Configure UPRSA Certificate Template & Signatures
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          
          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-xl flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Header Text */}
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Header Main Title (Association Name)
              </label>
              <input
                type="text"
                value={template.headerText || ''}
                onChange={(e) => setTemplate({ ...template, headerText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-amber-400 font-bold text-xs"
                required
              />
            </div>

            {/* Sub Header Text */}
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Sub-Header Text (Affiliations & Recognitions)
              </label>
              <input
                type="text"
                value={template.subHeaderText || ''}
                onChange={(e) => setTemplate({ ...template, subHeaderText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-xs"
              />
            </div>

            {/* Main Certificate Title */}
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Certificate Default Title
              </label>
              <input
                type="text"
                value={template.title || ''}
                onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-xs"
              />
            </div>

            {/* Numbering Prefix */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Certificate Numbering Prefix
              </label>
              <input
                type="text"
                value={template.numberPrefix || 'UPRSA-CERT-2026-'}
                onChange={(e) => setTemplate({ ...template, numberPrefix: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-amber-300 text-xs"
                placeholder="e.g. UPRSA-CERT-2026-"
              />
            </div>

            {/* Logo URL & File Upload */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                UPRSA / UPIC Official Logo Image (यूपीआईसी का बड़ा लोगो)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={template.logoUrl || ''}
                  onChange={(e) => setTemplate({ ...template, logoUrl: e.target.value })}
                  placeholder="https://example.com/upic-logo.jpg"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono"
                />
                <label className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg cursor-pointer shrink-0 transition flex items-center justify-center">
                  <span>Upload JPG</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const compressed = await compressImageToStrict15KB(file, file.name);
                          setTemplate({ ...template, logoUrl: compressed.dataUrl });
                        } catch (err) {
                          console.error('Certificate logo compression error:', err);
                        }
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* President Name */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                President Name
              </label>
              <input
                type="text"
                value={template.presidentName || ''}
                onChange={(e) => setTemplate({ ...template, presidentName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-xs"
              />
            </div>

            {/* President Title */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                President Title
              </label>
              <input
                type="text"
                value={template.presidentTitle || ''}
                onChange={(e) => setTemplate({ ...template, presidentTitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-xs"
              />
            </div>

            {/* President Signature Image URL */}
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                President Digital Signature Image URL
              </label>
              <input
                type="text"
                value={template.presidentSignatureUrl || ''}
                onChange={(e) => setTemplate({ ...template, presidentSignatureUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300"
              />
            </div>

            {/* Secretary Name */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                General Secretary Name
              </label>
              <input
                type="text"
                value={template.secretaryName || ''}
                onChange={(e) => setTemplate({ ...template, secretaryName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-xs"
              />
            </div>

            {/* Secretary Title */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                General Secretary Title
              </label>
              <input
                type="text"
                value={template.secretaryTitle || ''}
                onChange={(e) => setTemplate({ ...template, secretaryTitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-xs"
              />
            </div>

            {/* Secretary Signature Image URL */}
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                General Secretary Digital Signature Image URL
              </label>
              <input
                type="text"
                value={template.secretarySignatureUrl || ''}
                onChange={(e) => setTemplate({ ...template, secretarySignatureUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300"
              />
            </div>

            {/* Official Seal URL */}
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Official Emblem / Seal Image URL
              </label>
              <input
                type="text"
                value={template.officialSealUrl || ''}
                onChange={(e) => setTemplate({ ...template, officialSealUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300"
              />
            </div>

            {/* Footer Notice Text */}
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Footer Credentials Line
              </label>
              <input
                type="text"
                value={template.footerText || ''}
                onChange={(e) => setTemplate({ ...template, footerText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300"
              />
            </div>

          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl transition flex items-center gap-1.5 shadow"
              >
                <Save className="w-4 h-4" /> Save Template
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
