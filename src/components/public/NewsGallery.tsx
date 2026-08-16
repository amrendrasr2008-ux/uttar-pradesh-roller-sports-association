import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { dbStore } from '../../lib/db';
import { Newspaper, Image, Calendar, Video, Play, Film, X } from 'lucide-react';
import { GalleryItem } from '../../types';

export const NewsGallery: React.FC = () => {
  const { language, t } = useLanguage();
  const announcements = dbStore.getAnnouncements();
  const gallery = dbStore.getGallery();

  const [activeFilter, setActiveFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [selectedMedia, setSelectedMedia] = useState<GalleryItem | null>(null);

  const filteredGallery = gallery.filter(item => {
    const isVideo = item.mediaType === 'video' || !!item.videoUrl;
    if (activeFilter === 'photo') return !isVideo;
    if (activeFilter === 'video') return isVideo;
    return true;
  });

  return (
    <div className="w-full px-4 sm:px-8 py-10 space-y-12 text-slate-100">
      
      {/* News & Circulars */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Newspaper className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-black text-white">{t('latestNews')} & Official Circulars</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {announcements.map(ann => (
            <div key={ann.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-lg flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-bold uppercase tracking-wider text-[10px]">
                    {ann.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> {ann.date}
                  </span>
                </div>

                {ann.imageUrl && (
                  <div className="h-48 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
                    <img 
                      src={ann.imageUrl} 
                      alt={ann.titleEn} 
                      className="w-full h-full object-cover hover:scale-105 transition duration-500" 
                    />
                  </div>
                )}

                <h3 className="font-extrabold text-white text-base">
                  {language === 'en' ? ann.titleEn : (ann.titleHi || ann.titleEn)}
                </h3>

                <p className="text-slate-300 text-xs leading-relaxed">
                  {language === 'en' ? ann.contentEn : (ann.contentHi || ann.contentEn)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Media Photo & Video Gallery */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Image className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-black text-white">{t('gallery')} & Championship Highlights</h2>
          </div>

          {/* Media Type Filter Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold gap-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Media ({gallery.length})
            </button>
            <button
              onClick={() => setActiveFilter('photo')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeFilter === 'photo'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📷 Photos</span>
            </button>
            <button
              onClick={() => setActiveFilter('video')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeFilter === 'video'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>🎥 Videos</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGallery.map(g => {
            const isVideo = g.mediaType === 'video' || !!g.videoUrl;
            return (
              <div 
                key={g.id} 
                onClick={() => setSelectedMedia(g)}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg group cursor-pointer hover:border-amber-500/50 transition duration-300 flex flex-col justify-between"
              >
                <div className="h-60 overflow-hidden relative bg-black flex items-center justify-center">
                  {isVideo ? (
                    g.videoUrl && (g.videoUrl.endsWith('.mp4') || g.videoUrl.startsWith('data:video/')) ? (
                      <video 
                        src={g.videoUrl} 
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition duration-500" 
                        muted 
                        loop
                        playsInline
                      />
                    ) : (
                      <img 
                        src={g.imageUrl || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80'} 
                        alt={g.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    )
                  ) : (
                    <img 
                      src={g.imageUrl || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80'} 
                      alt={g.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  )}

                  {/* Play Overlay Icon for Video */}
                  {isVideo && (
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center group-hover:bg-slate-950/20 transition">
                      <div className="w-14 h-14 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xl transform group-hover:scale-110 transition ring-4 ring-amber-400/30">
                        <Play className="w-7 h-7 text-slate-950 fill-slate-950 ml-1" />
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-4 flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-1">
                      {isVideo ? (
                        <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase rounded flex items-center gap-1">
                          <Film className="w-3 h-3" /> Video Clip
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase rounded">
                          JPG Photo
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded">
                        {g.category}
                      </span>
                    </div>
                    <h4 className="text-white font-extrabold text-sm line-clamp-1">{g.titleEn || g.title}</h4>
                    <span className="text-[10px] text-slate-400">{g.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FULLSCREEN MEDIA LIGHTBOX MODAL */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-4 sm:p-6 overflow-hidden shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold transition shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {selectedMedia.mediaType === 'video' || selectedMedia.videoUrl ? (
                  <span className="px-3 py-1 bg-amber-500 text-slate-950 text-xs font-black rounded-lg uppercase flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" /> Video Clip
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-500 text-slate-950 text-xs font-black rounded-lg uppercase">
                    JPG Photo
                  </span>
                )}
                <span className="text-xs text-amber-400 font-bold">{selectedMedia.category} • {selectedMedia.date}</span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white">{selectedMedia.titleEn || selectedMedia.title}</h3>

              <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 max-h-[70vh] flex items-center justify-center">
                {selectedMedia.mediaType === 'video' || selectedMedia.videoUrl ? (
                  selectedMedia.videoUrl && (selectedMedia.videoUrl.endsWith('.mp4') || selectedMedia.videoUrl.startsWith('data:video/')) ? (
                    <video
                      src={selectedMedia.videoUrl}
                      controls
                      autoPlay
                      className="w-full max-h-[65vh] object-contain bg-black"
                    />
                  ) : (
                    <div className="p-8 text-center space-y-3">
                      <p className="text-sm text-slate-300">Video Player Link:</p>
                      <a 
                        href={selectedMedia.videoUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-sm transition"
                      >
                        <Play className="w-4 h-4 fill-slate-950" /> Watch Video in New Tab
                      </a>
                    </div>
                  )
                ) : (
                  <img
                    src={selectedMedia.imageUrl || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80'}
                    alt={selectedMedia.title}
                    className="w-full max-h-[65vh] object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

