import React, { useState, useEffect } from 'react';
import { dbStore } from '../../lib/db';
import { ChevronUp, ChevronRight, ChevronLeft, MessageSquare } from 'lucide-react';

interface FloatingSocialBarProps {
  onOpenChat?: () => void;
}

export const FloatingSocialBar: React.FC<FloatingSocialBarProps> = ({ onOpenChat }) => {
  const [websiteSettings, setWebsiteSettings] = useState(() => dbStore.getWebsiteSettings());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const refresh = () => setWebsiteSettings(dbStore.getWebsiteSettings());
    refresh();
    return dbStore.subscribe(refresh);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = {
    facebook: websiteSettings?.socialLinks?.facebook || 'https://facebook.com/uprsa.official',
    twitter: websiteSettings?.socialLinks?.twitter || 'https://twitter.com/uprsa_official',
    instagram: websiteSettings?.socialLinks?.instagram || 'https://instagram.com/uprsa_official',
    youtube: websiteSettings?.socialLinks?.youtube || 'https://youtube.com/@uprsa_official',
    linkedin: websiteSettings?.socialLinks?.linkedin || 'https://linkedin.com/company/uprsa',
    whatsapp: websiteSettings?.socialLinks?.whatsapp || 'https://wa.me/919415011223',
  };

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center transition-all duration-300">
      {/* Toggle collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="bg-slate-900 border border-r-0 border-amber-500/40 text-amber-400 p-1 rounded-l-md shadow-lg hover:bg-slate-800 transition text-xs flex items-center justify-center opacity-80 hover:opacity-100"
        title={collapsed ? "Expand Social Bar" : "Collapse Social Bar"}
      >
        {collapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {/* Floating Toolbar Stack */}
      {!collapsed && (
        <div className="flex flex-col rounded-l-xl overflow-hidden shadow-2xl border-l border-y border-slate-700/60 bg-slate-900/90 backdrop-blur-md">
          {/* Scroll To Top Arrow Button */}
          <button
            onClick={scrollToTop}
            className="w-10 h-10 bg-slate-950 hover:bg-slate-800 text-amber-400 flex items-center justify-center transition border-b border-slate-800 group relative"
            title="Scroll To Top (ऊपर जाएं)"
          >
            <ChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition" />
            <span className="absolute right-12 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 text-amber-400 text-[11px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap border border-amber-500/30">
              Scroll To Top
            </span>
          </button>

          {/* Quick Chat Board Launcher */}
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black flex items-center justify-center transition border-b border-slate-800 group relative shadow-md"
              title="लाइव चैट व कम्युनिटी बोर्ड"
            >
              <MessageSquare className="w-4 h-4 fill-slate-950" />
              <span className="absolute right-12 top-1/2 -translate-y-1/2 px-2 py-1 bg-amber-500 text-slate-950 text-[11px] font-black rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                💬 चैट बोर्ड (Live Chat)
              </span>
            </button>
          )}

          {/* Facebook */}
          {socialLinks.facebook && (
            <a
              href={socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-[#1877F2] hover:brightness-110 text-white flex items-center justify-center transition group relative"
              title="Facebook"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="absolute right-12 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#1877F2] text-white text-[11px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                Facebook
              </span>
            </a>
          )}

          {/* Instagram */}
          {socialLinks.instagram && (
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 hover:brightness-110 text-white flex items-center justify-center transition group relative"
              title="Instagram"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="absolute right-12 top-1/2 -translate-y-1/2 px-2 py-1 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white text-[11px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                Instagram
              </span>
            </a>
          )}

          {/* YouTube */}
          {socialLinks.youtube && (
            <a
              href={socialLinks.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-[#FF0000] hover:brightness-110 text-white flex items-center justify-center transition group relative"
              title="YouTube"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span className="absolute right-12 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#FF0000] text-white text-[11px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                YouTube
              </span>
            </a>
          )}

          {/* WhatsApp */}
          {socialLinks.whatsapp && (
            <a
              href={socialLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-[#25D366] hover:brightness-110 text-slate-950 font-bold flex items-center justify-center transition group relative"
              title="WhatsApp"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.285-.143-1.689-.834-1.95-.929-.261-.095-.451-.143-.641.143-.19.285-.736.929-.903 1.118-.167.19-.333.214-.618.071-.285-.143-1.205-.444-2.296-1.417-.848-.758-1.421-1.693-1.588-1.978-.167-.285-.018-.439.125-.581.128-.128.285-.333.428-.5.143-.167.19-.285.285-.476.095-.19.048-.357-.024-.5-.071-.143-.641-1.546-.879-2.117-.231-.557-.468-.481-.642-.49-.166-.008-.356-.01-.546-.01-.19 0-.5.071-.761.357-.261.285-.998.976-.998 2.38 0 1.404 1.022 2.76 1.165 2.951.143.19 2.013 3.074 4.877 4.312.681.295 1.213.471 1.628.603.685.218 1.309.187 1.802.114.549-.081 1.689-.69 1.927-1.356.237-.666.237-1.237.166-1.356-.07-.119-.261-.19-.546-.333z"/>
              </svg>
              <span className="absolute right-12 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#25D366] text-slate-950 text-[11px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                WhatsApp
              </span>
            </a>
          )}

          {/* Twitter / X */}
          {socialLinks.twitter && (
            <a
              href={socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-slate-950 hover:bg-slate-900 text-white flex items-center justify-center transition border-t border-slate-800 group relative"
              title="X (Twitter)"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="absolute right-12 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 text-white text-[11px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                X (Twitter)
              </span>
            </a>
          )}

          {/* LinkedIn */}
          {socialLinks.linkedin && (
            <a
              href={socialLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-[#0A66C2] hover:brightness-110 text-white flex items-center justify-center transition group relative"
              title="LinkedIn"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              <span className="absolute right-12 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#0A66C2] text-white text-[11px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                LinkedIn
              </span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};
