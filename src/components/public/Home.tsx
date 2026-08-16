import React, { useState, useEffect } from 'react';
import { Hero } from './Hero';
import { useLanguage } from '../../context/LanguageContext';
import { dbStore } from '../../lib/db';
import { HomeSection, WebsiteContent, Announcement, GalleryItem } from '../../types';
import { 
  Trophy, 
  Calendar, 
  Award, 
  Newspaper, 
  ChevronRight, 
  Building2, 
  MapPin, 
  Radio, 
  Sparkles,
  Users,
  Grid,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface HomeProps {
  setActiveTab?: (tab: string) => void;
  onNavigate?: (view: string) => void;
}

export const Home: React.FC<HomeProps> = ({ setActiveTab, onNavigate }) => {
  const { t, language } = useLanguage();
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [contentMap, setContentMap] = useState<Record<string, WebsiteContent>>({});

  const loadData = () => {
    const secList = dbStore.getHomeSections().filter(s => s.enabled);
    setSections(secList);

    const allContent = dbStore.getAllWebsiteContent();
    const map: Record<string, WebsiteContent> = {};
    allContent.forEach(c => { map[c.key] = c; });
    setContentMap(map);
  };

  useEffect(() => {
    loadData();
    return dbStore.subscribe(loadData);
  }, []);

  const handleNavigate = (tab: string) => {
    let view = tab;
    if (tab === 'registration') view = 'register';
    if (tab === 'news') view = 'news-gallery';
    if (setActiveTab) setActiveTab(view);
    if (onNavigate) onNavigate(view);
  };

  const tournaments = dbStore.getTournaments();
  const liveTournaments = tournaments.filter(tr => tr.status === 'Live');
  const results = dbStore.getResults().slice(0, 6);
  const districtRankings = dbStore.getDistrictRankings().slice(0, 5);
  const announcements = dbStore.getAnnouncements().slice(0, 4);
  const gallery = dbStore.getGallery().slice(0, 4);
  const clubs = dbStore.getClubs().slice(0, 6);
  const districts = dbStore.getDistricts().slice(0, 6);
  const skaters = dbStore.getSkaters();

  const getLocalized = (enStr?: string, hiStr?: string) => {
    if (language === 'hi' && hiStr) return hiStr;
    return enStr || '';
  };

  const renderSection = (sec: HomeSection) => {
    switch (sec.id) {
      case 'hero':
        return <Hero key={sec.id} setActiveTab={handleNavigate} onNavigate={handleNavigate} />;

      case 'about': {
        const aboutContent = contentMap['about_uprsa'];
        const presidentContent = contentMap['president_message'];
        return (
          <section key={sec.id} className="w-full px-4 sm:px-8 py-8 space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                {getLocalized(sec.subtitleEn, sec.subtitleHi)}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {getLocalized(sec.titleEn, sec.titleHi)}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-bold border border-amber-500/20">
                  <ShieldCheck className="w-4 h-4" />
                  Official Association Profile
                </div>
                <h3 className="text-xl font-bold text-white">
                  {getLocalized(aboutContent?.titleEn, aboutContent?.titleHi) || 'Governing Roller Skating in Uttar Pradesh'}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {getLocalized(aboutContent?.contentEn, aboutContent?.contentHi) || 'UPRSA is the premier state organization affiliated with RSFI, promoting speed skating, artistic skating, roller hockey, and inline freestyle across all 75 districts of Uttar Pradesh.'}
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => handleNavigate('about')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition inline-flex items-center gap-1.5"
                  >
                    Read Full History <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {presidentContent && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden">
                  <div className="text-amber-400 font-bold text-xs uppercase tracking-wider">Leadership Message</div>
                  <h3 className="text-lg font-bold text-white">
                    {getLocalized(presidentContent.titleEn, presidentContent.titleHi)}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-amber-500 pl-4">
                    "{getLocalized(presidentContent.contentEn, presidentContent.contentHi)}"
                  </p>
                  <div className="pt-2 text-xs font-bold text-amber-400">
                    Executive Committee, UPRSA
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      }

      case 'stats':
        return (
          <section key={sec.id} className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-y border-slate-800 py-12">
            <div className="w-full px-4 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-amber-400">{skaters.length}+</div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t('registeredSkaters')}</div>
              </div>
              <div className="p-4 space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-emerald-400">{clubs.length}+</div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t('affiliatedClubs')}</div>
              </div>
              <div className="p-4 space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-blue-400">{districts.length}+</div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t('activeDistricts')}</div>
              </div>
              <div className="p-4 space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-purple-400">38+</div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t('championshipsHeld')}</div>
              </div>
            </div>
          </section>
        );

      case 'tournaments':
        return (
          <section key={sec.id} className="w-full px-4 sm:px-8 py-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  {getLocalized(sec.subtitleEn, sec.subtitleHi)}
                </div>
                <h2 className="text-2xl font-black text-white">
                  {getLocalized(sec.titleEn, sec.titleHi)}
                </h2>
              </div>

              <button
                onClick={() => handleNavigate('tournaments')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl transition"
              >
                View All Meets <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.slice(0, 3).map(tour => (
                <div 
                  key={tour.id}
                  className={`bg-slate-900 border rounded-2xl p-5 space-y-4 relative flex flex-col justify-between hover:border-slate-700 transition shadow-lg ${
                    tour.status === 'Live' ? 'border-amber-500/60 ring-1 ring-amber-500/30' : 'border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-slate-400">{tour.tournamentNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        tour.status === 'Live' 
                          ? 'bg-red-500 text-white animate-pulse flex items-center gap-1'
                          : tour.status === 'Upcoming'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {tour.status === 'Live' && <Radio className="w-3 h-3" />}
                        {tour.status}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-white leading-snug">
                      {language === 'en' ? tour.nameEn : tour.nameHi}
                    </h3>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{tour.venue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{tour.startDate} to {tour.endDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{tour.organizer}</span>
                    <button
                      onClick={() => {
                        localStorage.setItem('uprsa_selected_tour_id', tour.id);
                        handleNavigate('tournaments');
                      }}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition"
                    >
                      विवरण व फॉर्म भरें
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'live_results':
        return (
          <section key={sec.id} className="w-full px-4 sm:px-8 py-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-black text-white">
                    {getLocalized(sec.titleEn, sec.titleHi)}
                  </h3>
                </div>

                <button
                  onClick={() => handleNavigate('results')}
                  className="text-xs text-amber-400 hover:underline font-bold"
                >
                  Full Scoreboard <ChevronRight className="w-3.5 h-3.5 inline" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Skater</th>
                      <th className="p-3">District</th>
                      <th className="p-3">Timing</th>
                      <th className="p-3 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {results.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-800/50 transition">
                        <td className="p-3 font-bold">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                            res.position === 1 ? 'bg-amber-400 text-slate-950' :
                            res.position === 2 ? 'bg-slate-300 text-slate-950' :
                            res.position === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {res.position}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-white">
                          {res.skaterName}
                          <div className="text-[10px] text-slate-400 font-normal">{res.registrationNumber}</div>
                        </td>
                        <td className="p-3 text-slate-300">{res.districtName}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">{res.timing}</td>
                        <td className="p-3 font-black text-amber-400 text-right">+{res.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        );

      case 'rankings':
        return (
          <section key={sec.id} className="w-full px-4 sm:px-8 py-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Award className="w-4 h-4" />
                  {getLocalized(sec.subtitleEn, sec.subtitleHi)}
                </div>
                <h2 className="text-2xl font-black text-white">
                  {getLocalized(sec.titleEn, sec.titleHi)}
                </h2>
              </div>

              <button
                onClick={() => handleNavigate('rankings')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl transition"
              >
                All State Rankings <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {districtRankings.map((d, i) => (
                <div 
                  key={d.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-slate-700 transition shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400 font-extrabold text-sm w-5">#{i + 1}</span>
                    <div>
                      <div className="font-extrabold text-white text-sm">{d.name}</div>
                      <div className="text-[11px] text-slate-400">{d.skaterCount} Registered Skaters</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      <span>🥇</span> {d.goldMedals}
                    </div>
                    <div className="flex items-center gap-0.5 text-slate-300">
                      <span>🥈</span> {d.silverMedals}
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-700">
                      <span>🥉</span> {d.bronzeMedals}
                    </div>
                    <div className="ml-1 px-2 py-1 bg-amber-500/20 text-amber-300 rounded font-black text-xs">
                      {d.totalPoints}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'news':
        return (
          <section key={sec.id} className="w-full px-4 sm:px-8 py-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Newspaper className="w-4 h-4" />
                  {getLocalized(sec.subtitleEn, sec.subtitleHi)}
                </div>
                <h2 className="text-2xl font-black text-white">
                  {getLocalized(sec.titleEn, sec.titleHi)}
                </h2>
              </div>

              <button
                onClick={() => handleNavigate('news')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl transition"
              >
                View All Notices <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcements.map(ann => (
                <div key={ann.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2 hover:border-slate-700 transition">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-full font-bold uppercase">
                      {ann.category}
                    </span>
                    <span>{ann.date}</span>
                  </div>
                  <h4 className="font-bold text-white text-base">
                    {language === 'hi' ? ann.titleHi || ann.titleEn : ann.titleEn}
                  </h4>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {language === 'hi' ? ann.contentHi || ann.contentEn : ann.contentEn}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );

      case 'gallery':
        return (
          <section key={sec.id} className="w-full px-4 sm:px-8 py-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Grid className="w-4 h-4" />
                  {getLocalized(sec.subtitleEn, sec.subtitleHi)}
                </div>
                <h2 className="text-2xl font-black text-white">
                  {getLocalized(sec.titleEn, sec.titleHi)}
                </h2>
              </div>

              <button
                onClick={() => handleNavigate('news')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl transition"
              >
                Full Gallery <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.map(item => (
                <div key={item.id} className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 h-48">
                  <img src={item.imageUrl || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80'} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-4 flex flex-col justify-end">
                    <span className="text-[10px] text-amber-400 font-bold uppercase">{item.category}</span>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{item.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'clubs':
        return (
          <section key={sec.id} className="w-full px-4 sm:px-8 py-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Building2 className="w-4 h-4" />
                  {getLocalized(sec.subtitleEn, sec.subtitleHi)}
                </div>
                <h2 className="text-2xl font-black text-white">
                  {getLocalized(sec.titleEn, sec.titleHi)}
                </h2>
              </div>

              <button
                onClick={() => handleNavigate('clubs')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl transition"
              >
                All Clubs Directory <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {clubs.map(club => (
                <div key={club.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 hover:border-slate-700 transition">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 font-black text-sm flex items-center justify-center shrink-0">
                    {club.code}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-white text-sm truncate">{club.nameEn}</h4>
                    <p className="text-xs text-slate-400">{club.districtName} District</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'districts':
        return (
          <section key={sec.id} className="w-full px-4 sm:px-8 py-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  {getLocalized(sec.subtitleEn, sec.subtitleHi)}
                </div>
                <h2 className="text-2xl font-black text-white">
                  {getLocalized(sec.titleEn, sec.titleHi)}
                </h2>
              </div>

              <button
                onClick={() => handleNavigate('districts')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl transition"
              >
                75 Districts Map <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {districts.map(dist => (
                <div key={dist.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center space-y-1 hover:border-amber-500/40 transition">
                  <div className="text-xs font-extrabold text-white truncate">{dist.nameEn}</div>
                  <div className="text-[10px] text-amber-400 font-semibold">{dist.code}</div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'cta':
        return (
          <section key={sec.id} className="w-full px-4 sm:px-8 py-8">
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 rounded-3xl p-8 sm:p-12 text-slate-950 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-2 max-w-2xl text-center md:text-left">
                <span className="px-3 py-1 bg-slate-950/20 text-slate-950 font-extrabold text-xs rounded-full uppercase tracking-wider inline-block">
                  Registration Season 2026 Active
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight">
                  {getLocalized(sec.titleEn, sec.titleHi)}
                </h2>
                <p className="text-slate-900 text-sm md:text-base font-semibold">
                  {getLocalized(sec.subtitleEn, sec.subtitleHi)}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                <button
                  onClick={() => handleNavigate('register')}
                  className="px-6 py-3.5 bg-slate-950 hover:bg-slate-900 text-amber-400 font-extrabold rounded-xl transition shadow-xl text-sm flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Register Skater Now
                </button>
                <button
                  onClick={() => handleNavigate('portal')}
                  className="px-6 py-3.5 bg-white/30 hover:bg-white/40 text-slate-950 font-bold rounded-xl transition text-sm flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Skater ID Portal
                </button>
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12 bg-slate-950 text-slate-100">
      {sections.map(sec => renderSection(sec))}
    </div>
  );
};
