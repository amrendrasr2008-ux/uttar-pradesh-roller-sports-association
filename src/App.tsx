import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { FloatingSocialBar } from './components/layout/FloatingSocialBar';
import { FloatingLiveMatchButton } from './components/layout/FloatingLiveMatchButton';

import { Home } from './components/public/Home';
import { About } from './components/public/About';
import { Activities } from './components/public/Activities';
import { Districts } from './components/public/Districts';
import { Clubs } from './components/public/Clubs';
import { Tournaments } from './components/public/Tournaments';
import { Results } from './components/public/Results';
import { Rankings } from './components/public/Rankings';
import { NewsGallery } from './components/public/NewsGallery';
import { Contact } from './components/public/Contact';
import { LiveScoreboard } from './components/public/LiveScoreboard';
import { ChatBoardView } from './components/public/ChatBoardView';
import { ChatBoardModal } from './components/chat/ChatBoardModal';
import { FloatingChatButton } from './components/chat/FloatingChatButton';

import { RegistrationForm } from './components/skater/RegistrationForm';
import { SkaterPortal } from './components/skater/SkaterPortal';
import { AccountActivation } from './components/skater/AccountActivation';

import { AdminDashboard } from './components/admin/AdminDashboard';
import { SkaterDirectory } from './components/admin/SkaterDirectory';
import { ClubManager } from './components/admin/ClubManager';
import { DistrictManager } from './components/admin/DistrictManager';
import { TournamentManager } from './components/admin/TournamentManager';
import { TournamentRegistrations } from './components/admin/TournamentRegistrations';
import { TournamentResultUploader } from './components/admin/TournamentResultUploader';
import { TournamentReport } from './components/admin/TournamentReport';
import { CertificateGenerator } from './components/admin/CertificateGenerator';
import { CSVImport } from './components/admin/CSVImport';
import { SqlExportModal } from './components/admin/SqlExportModal';
import { WebsiteManagement } from './components/admin/WebsiteManagement';
import { AdminSecuritySettings } from './components/admin/AdminSecuritySettings';
import { ScoreboardController } from './components/admin/scoring/ScoreboardController';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminPaymentDashboard } from './components/admin/payments/AdminPaymentDashboard';
import { AdminPaymentSettings } from './components/admin/payments/AdminPaymentSettings';
import { ChatBoardManagement } from './components/admin/ChatBoardManagement';

import { 
  Building2, 
  MapPin, 
  Trophy, 
  Radio, 
  Award, 
  Upload, 
  Database, 
  Users, 
  FileText,
  ChevronRight,
  ShieldCheck,
  Globe,
  Key,
  LogOut,
  Tv,
  CreditCard,
  QrCode,
  MessageSquare
} from 'lucide-react';

const MainApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.includes('/activate') || (window.location.search.includes('email=') && window.location.search.includes('reg='))) {
        return 'activate';
      }
    }
    return 'home';
  });
  const [adminSubView, setAdminSubView] = useState<string>('dashboard');
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [isChatBoardOpen, setIsChatBoardOpen] = useState<boolean>(false);

  const { role, isAdminAuthenticated, adminLogout } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Header */}
      <Header 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onOpenSqlModal={() => setShowSqlModal(true)}
        onOpenChatBoard={() => setIsChatBoardOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        
        {/* PUBLIC MODULES */}
        {currentView === 'home' && <Home onNavigate={setCurrentView} />}
        {currentView === 'about' && <About />}
        {currentView === 'activities' && <Activities />}
        {currentView === 'districts' && <Districts />}
        {currentView === 'clubs' && <Clubs />}
        {currentView === 'tournaments' && <Tournaments onNavigate={setCurrentView} />}
        {currentView === 'results' && <Results />}
        {currentView === 'rankings' && <Rankings />}
        {(currentView === 'news-gallery' || currentView === 'news') && <NewsGallery />}
        {currentView === 'contact' && <Contact />}
        {currentView === 'live-scoreboard' && <LiveScoreboard />}
        {(currentView === 'chat' || currentView === 'chat-board') && <ChatBoardView onNavigate={setCurrentView} />}

        {/* SKATER REGISTRATION & PORTAL MODULES */}
        {(currentView === 'register' || currentView === 'registration') && (
          <RegistrationForm onSuccessNavigate={() => setCurrentView('portal')} />
        )}
        {currentView === 'portal' && <SkaterPortal />}
        {currentView === 'activate' && <AccountActivation onSuccessNavigate={() => setCurrentView('portal')} />}

        {/* ADMIN MANAGEMENT PANEL MODULE */}
        {currentView === 'admin' && (
          !isAdminAuthenticated ? (
            <AdminLoginModal onCancel={() => setCurrentView('home')} />
          ) : (
            <div className="w-full px-4 sm:px-6 py-8 space-y-6">
              
              {/* Admin Sub-Navigation Menu Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-xl">
                
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    onClick={() => setAdminSubView('dashboard')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      adminSubView === 'dashboard' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4" /> Overview
                  </button>

                  <button
                    onClick={() => setAdminSubView('skaters')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      adminSubView === 'skaters' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4 text-amber-400" /> Skaters Directory
                  </button>

                  <button
                    onClick={() => setAdminSubView('clubs')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      adminSubView === 'clubs' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-4 h-4" /> Clubs
                  </button>

                  <button
                    onClick={() => setAdminSubView('districts')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      adminSubView === 'districts' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <MapPin className="w-4 h-4" /> Districts
                  </button>

                  <button
                    onClick={() => setAdminSubView('tournaments')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      adminSubView === 'tournaments' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Trophy className="w-4 h-4" /> Meets
                  </button>

                  <button
                    onClick={() => setAdminSubView('tournament-entries')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      adminSubView === 'tournament-entries' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4" /> Registration Desk
                  </button>

                  <button
                    onClick={() => setAdminSubView('upload-results')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      adminSubView === 'upload-results' || adminSubView === 'operator' ? 'bg-emerald-600 text-white font-extrabold shadow-lg' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-emerald-400" /> Result Upload (रिजल्ट अपलोड)
                  </button>

                  <button
                    onClick={() => setAdminSubView('scoreboard-controller')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 border border-red-500/50 ${
                      adminSubView === 'scoreboard-controller' ? 'bg-red-600 text-white font-black shadow-lg shadow-red-600/30' : 'text-red-300 bg-red-950/40 hover:bg-red-900/60'
                    }`}
                  >
                    <Tv className="w-4 h-4 text-red-400 animate-pulse" /> Live Scoreboard Control (📺)
                  </button>

                  <button
                    onClick={() => setAdminSubView('payments')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 border border-emerald-500/40 ${
                      adminSubView === 'payments' ? 'bg-emerald-600 text-white font-extrabold shadow-lg' : 'text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-emerald-400" /> UPI भुगतान सत्यापन (QR Payments)
                  </button>

                  <button
                    onClick={() => setAdminSubView('payment-settings')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      adminSubView === 'payment-settings' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-amber-400" /> भुगतान सेटिंग्स
                  </button>

                  <button
                    onClick={() => setAdminSubView('reports')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      adminSubView === 'reports' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" /> Reports
                  </button>

                  <button
                    onClick={() => setAdminSubView('certificates')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      adminSubView === 'certificates' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Award className="w-4 h-4" /> Certificates
                  </button>

                  <button
                    onClick={() => setAdminSubView('chat-board')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 border border-amber-500/30 ${
                      adminSubView === 'chat-board' ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20' : 'text-amber-300 bg-amber-950/40 hover:bg-amber-900/60'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-amber-400" /> 💬 चैट व कम्युनिटी
                  </button>

                  <button
                    onClick={() => setAdminSubView('website')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      adminSubView === 'website' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-amber-400" /> Website CMS
                  </button>

                  <button
                    onClick={() => setAdminSubView('security')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 border border-amber-500/40 ${
                      adminSubView === 'security' ? 'bg-amber-500 text-slate-950' : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" /> सिक्योरिटी व पासवर्ड
                  </button>

                  <button
                    onClick={() => setAdminSubView('import-csv')}
                    className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                      adminSubView === 'import-csv' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Upload className="w-4 h-4" /> Excel Import
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSqlModal(true)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <Database className="w-4 h-4 text-emerald-400" /> Supabase SQL
                  </button>

                  <button
                    onClick={adminLogout}
                    className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 font-bold text-xs rounded-xl border border-red-800/60 transition flex items-center gap-1.5"
                    title="एडमिन पोर्टल से लॉगआउट करें"
                  >
                    <LogOut className="w-4 h-4 text-red-400" /> लॉगआउट
                  </button>
                </div>

              </div>

              {/* Sub View Content Render */}
              <div className="pt-2">
                {adminSubView === 'dashboard' && <AdminDashboard onNavigateSub={setAdminSubView} />}
                {adminSubView === 'skaters' && <SkaterDirectory />}
                {adminSubView === 'clubs' && <ClubManager />}
                {adminSubView === 'districts' && <DistrictManager />}
                {(adminSubView === 'tournaments' || adminSubView === 'create-tournament') && <TournamentManager />}
                {adminSubView === 'tournament-entries' && <TournamentRegistrations />}
                {(adminSubView === 'upload-results' || adminSubView === 'operator') && <TournamentResultUploader />}
                {adminSubView === 'reports' && <TournamentReport />}
                {adminSubView === 'certificates' && <CertificateGenerator />}
                {adminSubView === 'payments' && <AdminPaymentDashboard />}
                {adminSubView === 'payment-settings' && <AdminPaymentSettings />}
                {adminSubView === 'scoreboard-controller' && <ScoreboardController />}
                {adminSubView === 'chat-board' && <ChatBoardManagement />}
                {adminSubView === 'website' && <WebsiteManagement />}
                {adminSubView === 'security' && <AdminSecuritySettings />}
                {adminSubView === 'import-csv' && <CSVImport />}
              </div>

            </div>
          )
        )}

      </main>

      {/* Footer */}
      <Footer onNavigate={setCurrentView} />

      {/* Floating Side Social Media Toolbar & Scroll-To-Top */}
      <FloatingSocialBar onOpenChat={() => setIsChatBoardOpen(true)} />

      {/* Floating Live Match Button (Bottom Left) */}
      <FloatingLiveMatchButton />

      {/* Floating Live Chat & Community Board Launcher (Bottom Right) */}
      <FloatingChatButton 
        onClick={() => setIsChatBoardOpen(!isChatBoardOpen)} 
        isOpen={isChatBoardOpen} 
      />

      {/* Interactive Chat Board Modal / Drawer */}
      <ChatBoardModal 
        isOpen={isChatBoardOpen} 
        onClose={() => setIsChatBoardOpen(false)} 
        onNavigate={(v) => {
          setCurrentView(v);
          setIsChatBoardOpen(false);
        }}
      />

      {/* Supabase SQL Export Modal */}
      {showSqlModal && (
        <SqlExportModal onClose={() => setShowSqlModal(false)} />
      )}

    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
