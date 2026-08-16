import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Bot, 
  Settings, 
  Plus, 
  Pin, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  CheckCircle2,
  AlertCircle, 
  Search, 
  Filter, 
  Heart, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  Phone, 
  Mail, 
  Clock, 
  X, 
  ExternalLink,
  Users,
  Award,
  RefreshCw,
  Sliders,
  Check,
  Megaphone,
  HelpCircle,
  Building2,
  MapPin,
  MessageCircle,
  Trophy
} from 'lucide-react';
import { dbStore } from '../../lib/db';
import { CommunityChatPost, ChatBoardSettings } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

export const ChatBoardManagement: React.FC = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'helpdesk' | 'posts' | 'settings'>('helpdesk');

  // Posts State
  const [posts, setPosts] = useState<CommunityChatPost[]>(() => dbStore.getCommunityPosts());
  const [settings, setSettings] = useState<ChatBoardSettings>(() => dbStore.getChatBoardSettings());

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [pinnedOnly, setPinnedOnly] = useState(false);

  // Edit / Create Post Modal State
  const [editingPost, setEditingPost] = useState<CommunityChatPost | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [postFormData, setPostFormData] = useState<{
    authorName: string;
    authorRole: 'skater' | 'coach' | 'parent' | 'official' | 'guest';
    district: string;
    clubName: string;
    category: 'general' | 'tournament' | 'training' | 'inquiry' | 'achievement';
    message: string;
    likes: number;
    isPinned: boolean;
    isOfficial: boolean;
    isVerified: boolean;
  }>({
    authorName: 'UPRSA ऑफिशियल हेल्पडेस्क',
    authorRole: 'official',
    district: 'Lucknow',
    clubName: 'Uttar Pradesh Roller Sports Association',
    category: 'general',
    message: '',
    likes: 10,
    isPinned: false,
    isOfficial: true,
    isVerified: true
  });

  // Settings State Form
  const [settingsForm, setSettingsForm] = useState<ChatBoardSettings>(() => dbStore.getChatBoardSettings());
  const [newQuickQuestionHi, setNewQuickQuestionHi] = useState('');
  const [newQuickQuestionEn, setNewQuickQuestionEn] = useState('');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const handleUpdate = () => {
      setPosts(dbStore.getCommunityPosts());
      const s = dbStore.getChatBoardSettings();
      setSettings(s);
    };
    return dbStore.subscribe(handleUpdate);
  }, []);

  const openCreateModal = () => {
    setEditingPost(null);
    setIsCreatingNew(true);
    setPostFormData({
      authorName: 'UPRSA ऑफिशियल हेल्पडेस्क',
      authorRole: 'official',
      district: 'Lucknow',
      clubName: 'Uttar Pradesh Roller Sports Association',
      category: 'general',
      message: '',
      likes: 12,
      isPinned: true,
      isOfficial: true,
      isVerified: true
    });
  };

  const openEditModal = (post: CommunityChatPost) => {
    setIsCreatingNew(false);
    setEditingPost(post);
    setPostFormData({
      authorName: post.authorName,
      authorRole: post.authorRole || 'skater',
      district: post.district || 'Lucknow',
      clubName: post.clubName || '',
      category: post.category || 'general',
      message: post.message,
      likes: post.likes || 0,
      isPinned: !!post.isPinned,
      isOfficial: !!post.isOfficial,
      isVerified: !!post.isVerified
    });
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postFormData.message.trim() || !postFormData.authorName.trim()) {
      showToast('कृपया लेखक का नाम और संदेश दर्ज करें।');
      return;
    }

    if (isCreatingNew) {
      dbStore.addCommunityPost({
        authorName: postFormData.authorName.trim(),
        authorRole: postFormData.authorRole,
        district: postFormData.district.trim(),
        clubName: postFormData.clubName.trim() || undefined,
        category: postFormData.category,
        message: postFormData.message.trim(),
        isPinned: postFormData.isPinned,
        isOfficial: postFormData.isOfficial,
        isVerified: postFormData.isVerified
      });
      showToast('✅ नया कम्युनिटी संदेश सफलतापूर्वक प्रकाशित किया गया!');
    } else if (editingPost) {
      dbStore.updateCommunityPost(editingPost.id, {
        authorName: postFormData.authorName.trim(),
        authorRole: postFormData.authorRole,
        district: postFormData.district.trim(),
        clubName: postFormData.clubName.trim() || undefined,
        category: postFormData.category,
        message: postFormData.message.trim(),
        likes: postFormData.likes,
        isPinned: postFormData.isPinned,
        isOfficial: postFormData.isOfficial,
        isVerified: postFormData.isVerified
      });
      showToast('✅ पोस्ट सफलतापूर्वक अपडेट कर दी गई!');
    }

    setIsCreatingNew(false);
    setEditingPost(null);
    setPosts(dbStore.getCommunityPosts());
  };

  const handleDeletePost = (postId: string) => {
    if (window.confirm('क्या आप वाकई इस संदेश को कम्युनिटी बोर्ड से हटाना चाहते हैं?')) {
      dbStore.deleteCommunityPost(postId);
      setPosts(dbStore.getCommunityPosts());
      showToast('🗑️ संदेश हटा दिया गया!');
    }
  };

  const handleTogglePin = (postId: string, currentPinned: boolean) => {
    dbStore.pinCommunityPost(postId, !currentPinned);
    setPosts(dbStore.getCommunityPosts());
    showToast(!currentPinned ? '📌 संदेश को शीर्ष (Top) पर पिन कर दिया गया!' : 'संदेश अनपिन कर दिया गया।');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dbStore.saveChatBoardSettings(settingsForm);
    setSettings(dbStore.getChatBoardSettings());
    showToast('✅ चैट व हेल्पलाइन सेटिंग्स सफलतापूर्वक सुरक्षित कर दी गईं!');
  };

  const handleAddQuickQuestionHi = () => {
    if (!newQuickQuestionHi.trim()) return;
    const updated = [...(settingsForm.quickQuestionsHi || []), newQuickQuestionHi.trim()];
    setSettingsForm({ ...settingsForm, quickQuestionsHi: updated });
    setNewQuickQuestionHi('');
  };

  const handleRemoveQuickQuestionHi = (idx: number) => {
    const updated = [...(settingsForm.quickQuestionsHi || [])];
    updated.splice(idx, 1);
    setSettingsForm({ ...settingsForm, quickQuestionsHi: updated });
  };

  const handleAddQuickQuestionEn = () => {
    if (!newQuickQuestionEn.trim()) return;
    const updated = [...(settingsForm.quickQuestionsEn || []), newQuickQuestionEn.trim()];
    setSettingsForm({ ...settingsForm, quickQuestionsEn: updated });
    setNewQuickQuestionEn('');
  };

  const handleRemoveQuickQuestionEn = (idx: number) => {
    const updated = [...(settingsForm.quickQuestionsEn || [])];
    updated.splice(idx, 1);
    setSettingsForm({ ...settingsForm, quickQuestionsEn: updated });
  };

  // Filtered Posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      (post.message || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.authorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.district || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;
    const matchesRole = roleFilter === 'all' || post.authorRole === roleFilter;
    const matchesPinned = !pinnedOnly || post.isPinned;

    return matchesSearch && matchesCategory && matchesRole && matchesPinned;
  });

  const pinnedCount = posts.filter(p => p.isPinned).length;
  const totalLikes = posts.reduce((acc, p) => acc + (p.likes || 0), 0);

  return (
    <div className="space-y-6 text-slate-100 pb-16">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-2 border border-emerald-400 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
              <MessageSquare className="w-3.5 h-3.5" /> UPRSA Community & AI Helpdesk Manager
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              💬 लाइव चैट व कम्युनिटी बोर्ड प्रबंधन
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              यहां से कम्युनिटी पोस्ट्स को संपादित (Edit), पिन (Pin) अथवा डिलीट करें और AI हेल्पलाइन के त्वरित प्रश्नों (Quick Prompts) व संपर्क सूचनाओं को नियंत्रित करें।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" /> + नई आधिकारिक पोस्ट लिखें
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 mt-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('helpdesk')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-black transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'helpdesk'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Phone className="w-4 h-4 text-emerald-400" /> 📞 हेल्पडेस्क व संपर्क विवरण (Edit Helpdesk Info)
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-black transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'posts'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-400" /> 💬 कम्युनिटी संदेश संपादन ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-black transition flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4 text-purple-400" /> 🤖 AI चैट व सिस्टम सेटिंग्स
          </button>
        </div>
      </div>

      {/* TAB 1: HELPDESK & CONTACT DETAILS EDITOR */}
      {activeTab === 'helpdesk' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-white text-sm">आधिकारिक हेल्पडेस्क विवरण संपादन (Live Helpdesk Editor)</h3>
                <p className="text-xs text-slate-300">नीचे दी गई जानकारी को संपादित करके "सुरक्षित करें" बटन दबाएं। यह तुरंत सार्वजनिक चैट ड्रॉवर व वेबसाइट पर अपडेट हो जाएगी।</p>
              </div>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <CheckCircle className="w-4 h-4" /> विवरण सुरक्षित करें (Save)
            </button>
          </div>

          {/* Section 1: Secretariat Title & Subtitle */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> १. सचिवालय शीर्षक व संबद्धता विवरण (Secretariat Title & Subtitle)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">सचिवालय शीर्षक (Secretariat Title) *</label>
                <input
                  type="text"
                  value={settingsForm.helpdeskSecretariatTitle || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, helpdeskSecretariatTitle: e.target.value })}
                  placeholder="उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन (UPRSA) सचिवालय"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">मान्यता व संबद्धता विवरण (Affiliation & Description) *</label>
                <textarea
                  rows={2}
                  value={settingsForm.helpdeskSecretariatDesc || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, helpdeskSecretariatDesc: e.target.value })}
                  placeholder="उत्तर प्रदेश में रोलर स्केटिंग, स्पीड, इनलाइन, क्वाड और हॉकी का आधिकारिक राज्य नियामक संघ (Affiliated to Roller Skating Federation of India & Recognized by UP Olympic Association)."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: WhatsApp Support Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-400" /> २. आधिकारिक व्हाट्सएप हेल्पडेस्क (WhatsApp Support Card)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">व्हाट्सएप कार्ड शीर्षक (WhatsApp Title)</label>
                <input
                  type="text"
                  value={settingsForm.helpdeskWhatsappTitle || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, helpdeskWhatsappTitle: e.target.value })}
                  placeholder="आधिकारिक व्हाट्सएप हेल्पडेस्क"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">व्हाट्सएप नंबर (WhatsApp Phone Number with Country Code)</label>
                <input
                  type="text"
                  value={settingsForm.whatsappSupportNumber || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappSupportNumber: e.target.value })}
                  placeholder="+91 94150 11223"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">व्हाट्सएप कार्ड विवरण (WhatsApp Subtitle / Note)</label>
              <input
                type="text"
                value={settingsForm.helpdeskWhatsappDesc || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, helpdeskWhatsappDesc: e.target.value })}
                placeholder="पंजीकरण, आईडी कार्ड या परिणाम संबंधित तुरंत सहायता के लिए व्हाट्सएप पर संदेश भेजें।"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Section 3: State HQ Lucknow & Western UP Noida Offices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Lucknow Office */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" /> ३. राज्य मुख्यालय - लखनऊ (State HQ)
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">कार्यालय शीर्षक (Office Title)</label>
                <input
                  type="text"
                  value={settingsForm.helpdeskLucknowTitle || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, helpdeskLucknowTitle: e.target.value })}
                  placeholder="राज्य मुख्यालय (Lucknow)"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">पूरा पता (Full Address)</label>
                <textarea
                  rows={2}
                  value={settingsForm.helpdeskLucknowAddress || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, helpdeskLucknowAddress: e.target.value })}
                  placeholder="के.डी. सिंह बाबू स्टेडियम स्केटिंग कॉम्प्लेक्स, हज़रतगंज, लखनऊ, उत्तर प्रदेश - 226001"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">हेल्पलाइन फोन नंबर (Phone Numbers)</label>
                <input
                  type="text"
                  value={settingsForm.helpdeskLucknowPhones || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, helpdeskLucknowPhones: e.target.value, supportPhone: e.target.value })}
                  placeholder="+91 94150 11223 / +91 94150 11224"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Noida Office */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" /> ४. वेस्टर्न यूपी केंद्र - नोएडा (Western UP Office)
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">कार्यालय शीर्षक (Office Title)</label>
                <input
                  type="text"
                  value={settingsForm.helpdeskWesternTitle || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, helpdeskWesternTitle: e.target.value })}
                  placeholder="वेस्टर्न यूपी केंद्र (Noida)"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">पूरा पता (Full Address)</label>
                <textarea
                  rows={2}
                  value={settingsForm.helpdeskWesternAddress || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, helpdeskWesternAddress: e.target.value })}
                  placeholder="सेक्टर 21-A नोएडा स्पोर्ट्स कॉम्प्लेक्स, स्टेडियम रोड, नोएडा, उत्तर प्रदेश - 201301"
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">हेल्पलाइन फोन नंबर (Phone Number)</label>
                <input
                  type="text"
                  value={settingsForm.helpdeskWesternPhone || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, helpdeskWesternPhone: e.target.value })}
                  placeholder="+91 98110 33445"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

          </div>

          {/* Section 4: Email Support & Timings */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-400" /> ५. आधिकारिक ईमेल व कार्य समय (Email & Working Hours)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ईमेल कार्ड शीर्षक (Email Title)</label>
                <input
                  type="text"
                  value={settingsForm.helpdeskEmailTitle || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, helpdeskEmailTitle: e.target.value })}
                  placeholder="ईमेल सहायता"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">आधिकारिक ईमेल आईडी (Official Support Email) *</label>
                <input
                  type="email"
                  value={settingsForm.supportEmail || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                  placeholder="uprsa.official@gmail.com"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">ईमेल विवरण / नोट (Email Note / Subtitle)</label>
              <input
                type="text"
                value={settingsForm.helpdeskEmailDesc || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, helpdeskEmailDesc: e.target.value })}
                placeholder="आधिकारिक पत्राचार और क्लब मान्यता हेतु ईमेल भेजें।"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">सहायता कार्य समय (हिंदी)</label>
                <input
                  type="text"
                  value={settingsForm.supportHoursHi || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportHoursHi: e.target.value })}
                  placeholder="सोमवार से शनिवार: प्रातः 9:00 से सायं 6:00 बजे तक"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Support Working Hours (English)</label>
                <input
                  type="text"
                  value={settingsForm.supportHoursEn || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportHoursEn: e.target.value })}
                  placeholder="Monday - Saturday: 9:00 AM to 6:00 PM IST"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/20 transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" /> हेल्पडेस्क विवरण सुरक्षित करें (Save Helpdesk Details)
            </button>
          </div>
        </form>
      )}

      {/* TAB 1: POSTS MODERATION & EDITOR */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-bold uppercase">कुल संदेश (Total Posts)</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{posts.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-bold uppercase">शीर्ष पर पिन (Pinned)</div>
              <div className="text-2xl font-black text-purple-400 mt-1">{pinnedCount}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-bold uppercase">कुल चीयर्स / लाइक्स</div>
              <div className="text-2xl font-black text-rose-400 mt-1">{totalLikes}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400 font-bold uppercase">सक्रिय जिले (Districts)</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {new Set(posts.map(p => p.district)).size}
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="संदेश, लेखक का नाम या जिला खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">सभी श्रेणियां (All Categories)</option>
                <option value="general">सामान्य (General)</option>
                <option value="tournament">टूर्नामेंट (Tournaments)</option>
                <option value="training">ट्रेनिंग टिप्स (Training)</option>
                <option value="inquiry">सवाल / इंक्वायरी (Inquiry)</option>
                <option value="achievement">उपलब्धियां (Achievements)</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">सभी रोल्स (All Roles)</option>
                <option value="official">ऑफीशियल (Official)</option>
                <option value="coach">कोच (Coach)</option>
                <option value="skater">स्केटर (Skater)</option>
                <option value="parent">अभिभावक (Parent)</option>
                <option value="guest">अतिथि (Guest)</option>
              </select>

              <button
                onClick={() => setPinnedOnly(!pinnedOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  pinnedOnly 
                    ? 'bg-purple-600 text-white border-purple-500' 
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Pin className="w-3.5 h-3.5" /> केवल पिन ({pinnedCount})
              </button>
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="font-bold text-base text-slate-300">कोई संदेश नहीं मिला</p>
                <p className="text-xs mt-1">खोज शब्द बदलें या नई पोस्ट लिखें।</p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className={`bg-slate-900 border rounded-2xl p-5 transition relative shadow-lg ${
                    post.isPinned 
                      ? 'border-purple-500/50 bg-gradient-to-r from-purple-950/20 to-slate-900' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm uppercase ${
                        post.authorRole === 'official' ? 'bg-amber-500 text-slate-950' :
                        post.authorRole === 'coach' ? 'bg-blue-600 text-white' :
                        post.authorRole === 'parent' ? 'bg-emerald-600 text-white' :
                        'bg-slate-800 text-amber-400 border border-slate-700'
                      }`}>
                        {post.authorName ? post.authorName.charAt(0) : 'U'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-white text-sm sm:text-base">
                            {post.authorName}
                          </span>
                          
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            post.authorRole === 'official' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                            post.authorRole === 'coach' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                            post.authorRole === 'parent' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                            'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {post.authorRole}
                          </span>

                          {post.isOfficial && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> OFFICIAL
                            </span>
                          )}

                          {post.isPinned && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white flex items-center gap-1">
                              <Pin className="w-3 h-3" /> PINNED TO TOP
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>📍 {post.district}</span>
                          {post.clubName && <span>• 🏛️ {post.clubName}</span>}
                          <span>• 🕒 {new Date(post.timestamp).toLocaleString('hi-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTogglePin(post.id, !!post.isPinned)}
                        className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 border ${
                          post.isPinned 
                            ? 'bg-purple-600 text-white border-purple-500' 
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-purple-400 hover:border-purple-500/50'
                        }`}
                        title={post.isPinned ? 'अनपिन करें' : 'शीर्ष पर पिन करें'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{post.isPinned ? 'Unpin' : 'Pin'}</span>
                      </button>

                      <button
                        onClick={() => openEditModal(post)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs border border-amber-500/30 transition flex items-center gap-1"
                        title="एडिट करें"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>एडिट</span>
                      </button>

                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-xl text-xs border border-rose-500/30 transition"
                        title="हटाएं (Delete)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {post.message}
                  </div>

                  {/* Footer Stats & Tag */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold text-[11px] uppercase">
                      🏷️ {post.category || 'General'}
                    </span>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-rose-400 font-bold">
                        <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> {post.likes || 0} Cheers
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">ID: {post.id}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AI HELPLINE & CHATBOARD SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          
          {/* Master Toggles */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" /> मुख्य नियंत्रण (Master System Controls)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition">
                <div>
                  <div className="font-extrabold text-sm text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-purple-400" /> AI स्केटिंग असिस्टेंट
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Gemini AI चैटबॉट सक्षम करें</div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.aiBotEnabled}
                  onChange={(e) => setSettingsForm({ ...settingsForm, aiBotEnabled: e.target.checked })}
                  className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition">
                <div>
                  <div className="font-extrabold text-sm text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-400" /> कम्युनिटी चैट बोर्ड
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">सार्वजनिक संदेश बोर्ड सक्रिय रखें</div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.communityBoardEnabled}
                  onChange={(e) => setSettingsForm({ ...settingsForm, communityBoardEnabled: e.target.checked })}
                  className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition">
                <div>
                  <div className="font-extrabold text-sm text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" /> गेस्ट पोस्टिंग अनुमति
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">बिना लॉगिन संदेश पोस्ट की सुविधा</div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.allowGuestPosts}
                  onChange={(e) => setSettingsForm({ ...settingsForm, allowGuestPosts: e.target.checked })}
                  className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Sticky Notice / Announcement Banner in Chat */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-purple-400" /> चैट ड्रॉवर में पिन की गई घोषणा (Chat Announcement Banner)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">घोषणा संदेश (हिंदी)</label>
                <input
                  type="text"
                  value={settingsForm.pinnedAnnouncementHi || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, pinnedAnnouncementHi: e.target.value })}
                  placeholder="उदा. यूपी राज्य स्तरीय रोलर स्केटिंग चैंपियनशिप 2026 रजिस्ट्रेशन प्रारंभ!"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Announcement Message (English)</label>
                <input
                  type="text"
                  value={settingsForm.pinnedAnnouncementEn || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, pinnedAnnouncementEn: e.target.value })}
                  placeholder="e.g. State Championship 2026 registration is live!"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Welcome Messages */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> AI चैट वेलकम संदेश (Welcome Greeting)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">प्रारंभिक स्वागत संदेश (हिंदी)</label>
                <textarea
                  rows={4}
                  value={settingsForm.welcomeMessageHi}
                  onChange={(e) => setSettingsForm({ ...settingsForm, welcomeMessageHi: e.target.value })}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Welcome Message (English)</label>
                <textarea
                  rows={4}
                  value={settingsForm.welcomeMessageEn}
                  onChange={(e) => setSettingsForm({ ...settingsForm, welcomeMessageEn: e.target.value })}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Prompts (Frequently Asked Questions) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-400" /> त्वरित प्रश्न बटन (Quick Prompt Buttons)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hindi Prompts */}
              <div className="space-y-3">
                <div className="font-bold text-sm text-amber-400 flex items-center justify-between">
                  <span>हिंदी में त्वरित प्रश्न</span>
                  <span className="text-xs text-slate-400">{settingsForm.quickQuestionsHi?.length || 0} प्रश्न</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(settingsForm.quickQuestionsHi || []).map((q, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">
                      <span>• {q}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuickQuestionHi(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                        title="हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="नया प्रश्न दर्ज करें (उदा. उम्र सीमा क्या है?)"
                    value={newQuickQuestionHi}
                    onChange={(e) => setNewQuickQuestionHi(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuickQuestionHi}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> जोड़ें
                  </button>
                </div>
              </div>

              {/* English Prompts */}
              <div className="space-y-3">
                <div className="font-bold text-sm text-blue-400 flex items-center justify-between">
                  <span>English Quick Prompts</span>
                  <span className="text-xs text-slate-400">{settingsForm.quickQuestionsEn?.length || 0} Prompts</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(settingsForm.quickQuestionsEn || []).map((q, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200">
                      <span>• {q}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuickQuestionEn(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add new prompt (e.g. Rulebook PDF?)"
                    value={newQuickQuestionEn}
                    onChange={(e) => setNewQuickQuestionEn(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuickQuestionEn}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Official Contact & Helpdesk Information */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-amber-400" /> आधिकारिक हेल्पडेस्क संपर्क विवरण (Contact Info)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">व्हाट्सएप सपोर्ट नंबर (WhatsApp Link)</label>
                <input
                  type="text"
                  value={settingsForm.whatsappSupportNumber}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappSupportNumber: e.target.value })}
                  placeholder="+91 94150 11223"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">हेल्पलाइन फोन (Phone Helpline)</label>
                <input
                  type="text"
                  value={settingsForm.supportPhone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                  placeholder="+91 94150 11223"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">आधिकारिक ईमेल (Support Email)</label>
                <input
                  type="email"
                  value={settingsForm.supportEmail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                  placeholder="uprsa.official@gmail.com"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">सहायता समय (हिंदी)</label>
                <input
                  type="text"
                  value={settingsForm.supportHoursHi}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportHoursHi: e.target.value })}
                  placeholder="सोमवार से शनिवार: प्रातः 9:00 से सायं 6:00 बजे तक"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Support Hours (English)</label>
                <input
                  type="text"
                  value={settingsForm.supportHoursEn}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportHoursEn: e.target.value })}
                  placeholder="Monday - Saturday: 9:00 AM to 6:00 PM IST"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/20 transition flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" /> सेटिंग्स सुरक्षित करें (Save Settings)
            </button>
          </div>
        </form>
      )}

      {/* EDIT / CREATE POST MODAL */}
      {(isCreatingNew || editingPost) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                {isCreatingNew ? 'नई कम्युनिटी पोस्ट प्रकाशित करें' : 'कम्युनिटी संदेश संपादित करें'}
              </h3>
              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingPost(null);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-4 text-left">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">लेखक का नाम (Author Name) *</label>
                  <input
                    type="text"
                    required
                    value={postFormData.authorName}
                    onChange={(e) => setPostFormData({ ...postFormData, authorName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">रोल / पद (Author Role) *</label>
                  <select
                    value={postFormData.authorRole}
                    onChange={(e) => setPostFormData({ ...postFormData, authorRole: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="official">🏆 Official (अधिकारी / एसोसिएशन)</option>
                    <option value="coach">⛸️ Coach (प्रशिक्षक)</option>
                    <option value="skater">⚡ Skater (खिलाड़ी)</option>
                    <option value="parent">👨‍👩‍👧 Parent (अभिभावक)</option>
                    <option value="guest">👤 Guest (अतिथि)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">जिला (District) *</label>
                  <input
                    type="text"
                    required
                    value={postFormData.district}
                    onChange={(e) => setPostFormData({ ...postFormData, district: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">क्लब / संस्था (Club Name)</label>
                  <input
                    type="text"
                    value={postFormData.clubName}
                    onChange={(e) => setPostFormData({ ...postFormData, clubName: e.target.value })}
                    placeholder="उदा. Lucknow Roller Skating Academy"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">श्रेणी (Category)</label>
                  <select
                    value={postFormData.category}
                    onChange={(e) => setPostFormData({ ...postFormData, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="general">सामान्य (General)</option>
                    <option value="tournament">टूर्नामेंट / चैंपियनशिप (Tournament)</option>
                    <option value="training">ट्रेनिंग व प्रैक्टिस (Training)</option>
                    <option value="inquiry">सवाल / इंक्वायरी (Inquiry)</option>
                    <option value="achievement">उपलब्धियां व मेडल (Achievement)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">चीयर्स / लाइक्स संख्या</label>
                  <input
                    type="number"
                    min="0"
                    value={postFormData.likes}
                    onChange={(e) => setPostFormData({ ...postFormData, likes: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">संदेश (Message Text) *</label>
                <textarea
                  rows={4}
                  required
                  value={postFormData.message}
                  onChange={(e) => setPostFormData({ ...postFormData, message: e.target.value })}
                  placeholder="अपना संदेश लिखें..."
                  className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Special Badges Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <label className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={postFormData.isPinned}
                    onChange={(e) => setPostFormData({ ...postFormData, isPinned: e.target.checked })}
                    className="w-4 h-4 rounded accent-purple-500"
                  />
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                    <Pin className="w-3 h-3" /> Pin to Top (शीर्ष पर रखें)
                  </span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={postFormData.isOfficial}
                    onChange={(e) => setPostFormData({ ...postFormData, isOfficial: e.target.checked })}
                    className="w-4 h-4 rounded accent-amber-500"
                  />
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Official Badge
                  </span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={postFormData.isVerified}
                    onChange={(e) => setPostFormData({ ...postFormData, isVerified: e.target.checked })}
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Verified Skater
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setEditingPost(null);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> {isCreatingNew ? 'प्रकाशित करें' : 'बदलाव सुरक्षित करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

function HelpCircleIcon(props: any) {
  return <HelpCircle {...props} />;
}
