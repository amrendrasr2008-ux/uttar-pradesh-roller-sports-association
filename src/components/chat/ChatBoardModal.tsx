import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { dbStore } from '../../lib/db';
import { safeSetLocalStorage } from '../../lib/idbStorage';
import { ChatMessage, CommunityChatPost, ChatBoardSettings } from '../../types';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  Users, 
  Sparkles, 
  X, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  ThumbsUp, 
  Heart, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Share2, 
  ChevronRight, 
  HelpCircle, 
  Award, 
  Trophy, 
  Calendar, 
  Volume2, 
  VolumeX, 
  ExternalLink,
  MessageCircle,
  Clock,
  ShieldCheck,
  Flame,
  Search,
  Filter,
  Plus,
  Edit3
} from 'lucide-react';

interface ChatBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
  initialTab?: 'ai' | 'community' | 'contact';
}

export const ChatBoardModal: React.FC<ChatBoardModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  initialTab = 'ai'
}) => {
  const { language, t } = useLanguage();
  const { role, activeSkater, isAdminAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<'ai' | 'community' | 'contact'>(initialTab);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // AI Chat State
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('uprsa_chat_history_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        text: language === 'hi' 
          ? 'नमस्ते! उत्तर प्रदेश रोलर स्पोर्ट्स संघ (UPRSA) के आधिकारिक AI चैट डेस्क में आपका स्वागत है। ⛸️\n\nआप स्केटिंग पंजीकरण, जन्मतिथि से आयु वर्ग (Age Category), आगामी प्रतियोगिताएं, स्पीड इनलाइन/क्वाड नियम या रिजल्ट के बारे में कोई भी प्रश्न पूछ सकते हैं।'
          : 'Welcome to the Official UPRSA AI Skating Support Desk! ⛸️\n\nAsk any question regarding skater registration, age categories, upcoming championships, Speed Inline/Quad rules, or results & certificates.',
        timestamp: new Date().toISOString(),
        suggestions: [
          'रजिस्ट्रेशन कैसे करें?',
          'Age Category के क्या नियम हैं?',
          'स्पीड इनलाइन व क्वाड में क्या अंतर है?',
          'प्रतियोगिता फीस कैसे जमा करें?',
          'डिजिटल सर्टिफिकेट कैसे डाउनलोड करें?'
        ]
      }
    ];
  });

  // Community Board State
  const [communityPosts, setCommunityPosts] = useState<CommunityChatPost[]>(() => dbStore.getCommunityPosts());
  const [settings, setSettings] = useState<ChatBoardSettings>(() => dbStore.getChatBoardSettings());
  const [postAuthorName, setPostAuthorName] = useState<string>(activeSkater?.name || '');
  const [postAuthorRole, setPostAuthorRole] = useState<'skater' | 'coach' | 'parent' | 'official' | 'guest'>('skater');
  const [postDistrict, setPostDistrict] = useState<string>(activeSkater?.districtName || 'Lucknow');
  const [postCategory, setPostCategory] = useState<'general' | 'tournament' | 'training' | 'inquiry' | 'achievement'>('general');
  const [postMessage, setPostMessage] = useState<string>('');
  const [showNewPostForm, setShowNewPostForm] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync community posts and settings
  useEffect(() => {
    const updateData = () => {
      setCommunityPosts(dbStore.getCommunityPosts());
      setSettings(dbStore.getChatBoardSettings());
    };
    return dbStore.subscribe(updateData);
  }, []);

  // Save chat history safely
  useEffect(() => {
    try {
      const recent = chatHistory.slice(-30);
      safeSetLocalStorage('uprsa_chat_history_v1', recent);
    } catch (e) {
      // ignore
    }
  }, [chatHistory]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (activeTab === 'ai') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isTyping, activeTab]);

  if (!isOpen) return null;

  const quickQuestions = [
    {
      label: language === 'hi' ? '📝 रजिस्ट्रेशन कैसे करें?' : '📝 How to Register?',
      prompt: 'UPRSA में ऑनलाइन स्केटर रजिस्ट्रेशन करने की पूरी प्रक्रिया क्या है?'
    },
    {
      label: language === 'hi' ? '🎯 Age Category कैसे तय होती है?' : '🎯 Age Category Rules?',
      prompt: 'जन्म तिथि (DOB) के अनुसार आयु वर्ग (Age Group) कैसे तय किया जाता है?'
    },
    {
      label: language === 'hi' ? '⚡ Inline vs Quad में क्या अंतर है?' : '⚡ Inline vs Quad?',
      prompt: 'Speed Inline और Speed Quad स्केटिंग में क्या अंतर है और कौन से इवेंट होते हैं?'
    },
    {
      label: language === 'hi' ? '💳 फीस और UPI पेमेंट?' : '💳 Fees & UPI Payment?',
      prompt: 'पंजीकरण व टूर्नामेंट फीस कितनी है और UPI QR से भुगतान कैसे करें?'
    },
    {
      label: language === 'hi' ? '🏆 सर्टिफिकेट व रिजल्ट?' : '🏆 Certificate & Results?',
      prompt: 'टूर्नामेंट परिणाम और डिजिटल सर्टिफिकेट क्यूआर कोड के साथ कैसे डाउनलोड करें?'
    },
    {
      label: language === 'hi' ? '📞 UPRSA हेड ऑफिस संपर्क?' : '📞 Contact Info?',
      prompt: 'उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन का पता और हेल्पलाइन नंबर क्या है?'
    }
  ];

  const districtsList = [
    'Lucknow', 'Gautam Buddha Nagar (Noida)', 'Ghaziabad', 'Kanpur Nagar', 'Varanasi',
    'Agra', 'Meerut', 'Prayagraj (Allahabad)', 'Bareilly', 'Aligarh', 'Moradabad',
    'Gorakhpur', 'Ayodhya', 'Jhansi', 'Saharanpur', 'Mathura', 'Other UP District'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    try {
      // Call server backend /api/chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatHistory.slice(-6).map(m => ({ role: m.role, text: m.text }))
        })
      });

      const data = await response.json();
      const replyText = data.reply || 'माफ़ करें, इस समय प्रतिक्रिया प्राप्त नहीं हो सकी। कृपया पुनः प्रयास करें या हमारे हेल्पलाइन नंबर पर संपर्क करें।';

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toISOString(),
        source: data.source || 'gemini'
      };

      setChatHistory(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: 'नमस्ते! आप UPRSA वेबसाइट पर सीधे रजिस्ट्रेशन कर सकते हैं या किसी भी अन्य सहायता हेतु हमारे हेल्पलाइन नंबर +91 94150 11223 पर कॉल कर सकते हैं।',
        timestamp: new Date().toISOString(),
        source: 'fallback'
      };
      setChatHistory(prev => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(language === 'hi' ? 'क्या आप चैट हिस्ट्री को रीसेट करना चाहते हैं?' : 'Reset chat history?')) {
      const resetMsg: ChatMessage = {
        id: 'msg-welcome',
        role: 'assistant',
        text: language === 'hi' 
          ? 'चैट रीसेट हो गई है। आप UPRSA से जुड़े कोई भी प्रश्न पूछ सकते हैं।' 
          : 'Chat history cleared. How may I help you with UP Roller Sports Association today?',
        timestamp: new Date().toISOString()
      };
      setChatHistory([resetMsg]);
      localStorage.removeItem('uprsa_chat_history_v1');
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postAuthorName.trim() || !postMessage.trim()) {
      alert(language === 'hi' ? 'कृपया नाम और संदेश दोनों भरें।' : 'Please enter your name and message.');
      return;
    }

    dbStore.addCommunityPost({
      authorName: postAuthorName.trim(),
      authorRole: postAuthorRole,
      district: postDistrict,
      category: postCategory,
      message: postMessage.trim()
    });

    setPostMessage('');
    setShowNewPostForm(false);
    setCommunityPosts(dbStore.getCommunityPosts());
  };

  const handleLikePost = (postId: string) => {
    dbStore.likeCommunityPost(postId);
    setCommunityPosts(dbStore.getCommunityPosts());
  };

  const handleDeletePost = (postId: string) => {
    if (window.confirm(language === 'hi' ? 'क्या आप इस संदेश को हटाना चाहते हैं?' : 'Delete this message?')) {
      dbStore.deleteCommunityPost(postId);
      setCommunityPosts(dbStore.getCommunityPosts());
    }
  };

  const filteredPosts = communityPosts.filter(p => {
    const matchesCat = filterCategory === 'all' || p.category === filterCategory;
    const matchesSearch = !searchFilter.trim() || 
      p.authorName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.district.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.message.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getRoleBadge = (roleStr: string) => {
    switch (roleStr) {
      case 'official':
        return <span className="px-2 py-0.5 text-[10px] font-black bg-purple-900/80 text-purple-200 border border-purple-500/50 rounded-full flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-purple-400" /> UPRSA Official</span>;
      case 'coach':
        return <span className="px-2 py-0.5 text-[10px] font-black bg-blue-900/80 text-blue-200 border border-blue-500/50 rounded-full flex items-center gap-1"><Award className="w-3 h-3 text-blue-400" /> Coach</span>;
      case 'parent':
        return <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-900/80 text-emerald-200 border border-emerald-500/50 rounded-full flex items-center gap-1"><Heart className="w-3 h-3 text-emerald-400" /> Parent</span>;
      case 'skater':
        return <span className="px-2 py-0.5 text-[10px] font-black bg-amber-900/80 text-amber-200 border border-amber-500/50 rounded-full flex items-center gap-1"><Flame className="w-3 h-3 text-amber-400" /> Skater</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700 rounded-full">Member</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      
      {/* Modal / Drawer Container */}
      <div 
        className={`w-full bg-slate-900 border border-amber-500/40 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isExpanded 
            ? 'h-[96vh] max-w-6xl' 
            : 'h-[88vh] sm:h-[680px] max-w-2xl'
        }`}
      >
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 px-4 py-3.5 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                  UPRSA लाइव चैट व कम्युनिटी बोर्ड
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Online Helpdesk" />
              </div>
              <p className="text-[11px] sm:text-xs text-amber-400/90 font-medium">
                {language === 'hi' ? 'उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन — 24x7 ऑनलाइन सहायता' : 'UP Roller Sports Association — 24x7 Online Assistance'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tab switch inside header for quick access */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:flex p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs items-center justify-center"
              title={isExpanded ? "Collapse View" : "Expand Full View"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-300 transition text-xs flex items-center justify-center"
              title="बंद करें (Close)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="bg-slate-950 border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'ai'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>{language === 'hi' ? '🤖 AI स्केटिंग हेल्पलाइन' : '🤖 AI Skating Assistant'}</span>
            </button>

            <button
              onClick={() => setActiveTab('community')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'community'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{language === 'hi' ? '💬 कम्युनिटी चैट बोर्ड' : '💬 Community Board'}</span>
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[10px]">
                {communityPosts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('contact')}
              className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'contact'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>{language === 'hi' ? '📞 अधिकारी संपर्क' : '📞 Helpdesk'}</span>
            </button>
          </div>

          {activeTab === 'ai' && (
            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 transition text-[11px] flex items-center gap-1 shrink-0 border border-slate-800"
              title="क्लियर चैट हिस्ट्री"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">रीसेट</span>
            </button>
          )}

          {activeTab === 'community' && (
            <button
              onClick={() => setShowNewPostForm(!showNewPostForm)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1 shadow-md shrink-0 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'नया संदेश लिखें' : 'Post Message'}</span>
            </button>
          )}
        </div>

        {/* Tab 1: AI Skating Helpline Desk */}
        {activeTab === 'ai' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950/60">
            
            {/* Chat Messages Scrollable Area */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-4">
              
              {/* Quick Prompt Chips */}
              <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
                <p className="text-[11px] font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  {language === 'hi' ? 'अक्सर पूछे जाने वाले सवाल (तुरंत उत्तर हेतु टैप करें):' : 'Frequently Asked Topics:'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q.prompt)}
                      disabled={isTyping}
                      className="px-2.5 py-1.5 bg-slate-950 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-xs font-semibold rounded-xl border border-slate-800 hover:border-amber-500/40 transition text-left"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message List */}
              {chatHistory.map(msg => (
                <div 
                  key={msg.id} 
                  className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-black text-xs' 
                      : 'bg-gradient-to-tr from-purple-600 to-blue-600 text-white'
                  }`}>
                    {msg.role === 'user' ? 'YOU' : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-slate-950 font-semibold rounded-tr-none'
                      : 'bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-wrap font-sans">
                      {msg.text}
                    </div>

                    <div className={`flex items-center justify-between gap-2 mt-2 pt-1 border-t text-[10px] ${
                      msg.role === 'user' ? 'border-slate-900/20 text-slate-900/70 font-medium' : 'border-slate-800 text-slate-400'
                    }`}>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.source && (
                        <span className="italic">
                          {msg.source === 'gemini' ? '✨ Gemini AI' : '⚡ UPRSA Desk'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2.5 text-slate-400 text-xs pl-2">
                  <div className="w-7 h-7 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 flex items-center gap-1.5 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-[11px] text-amber-300 ml-1">UPRSA AI उत्तर तैयार कर रहा है...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={language === 'hi' ? 'यहाँ अपना सवाल लिखें (उदा. Age Group, Registration, Results)...' : 'Type your question here...'}
                disabled={isTyping}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-2xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">पूछें</span>
              </button>
            </form>

          </div>
        )}

        {/* Tab 2: Community Chat & Notice Board */}
        {activeTab === 'community' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950/60 p-3 sm:p-4 overflow-y-auto space-y-4">
            
            {/* New Post Form Drawer */}
            {showNewPostForm && (
              <form 
                onSubmit={handleCreatePost}
                className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 space-y-3 shadow-xl animate-fadeIn"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> नया कम्युनिटी संदेश पोस्ट करें
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setShowNewPostForm(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    रद्द करें
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">आपका नाम (Your Name)</label>
                    <input 
                      type="text" 
                      value={postAuthorName}
                      onChange={e => setPostAuthorName(e.target.value)}
                      placeholder="उदा. राजेश शर्मा"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">भूमिका (Role)</label>
                    <select 
                      value={postAuthorRole}
                      onChange={e => setPostAuthorRole(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="skater">स्केटर (Skater)</option>
                      <option value="parent">अभिभावक (Parent)</option>
                      <option value="coach">कोच (Coach)</option>
                      <option value="official">अधिकारी (District Official)</option>
                      <option value="guest">दर्शक / फैन (Guest)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">जिला (District)</label>
                    <select 
                      value={postDistrict}
                      onChange={e => setPostDistrict(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {districtsList.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">संदेश (Message / Question / Tip)</label>
                  <textarea
                    rows={3}
                    value={postMessage}
                    onChange={e => setPostMessage(e.target.value)}
                    placeholder="स्केटिंग मीट, प्रैक्टिस अनुभव या खेल से जुड़ा अपना संदेश लिखें..."
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-bold">कैटेगरी:</span>
                    <select 
                      value={postCategory}
                      onChange={e => setPostCategory(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-amber-400 font-bold"
                    >
                      <option value="general">सामान्य (General)</option>
                      <option value="tournament">प्रतियोगिता (Tournament)</option>
                      <option value="training">प्रशिक्षण टिप्स (Training)</option>
                      <option value="inquiry">सवाल / इन्क्वायरी (Inquiry)</option>
                      <option value="achievement">उपलब्धि (Achievement)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> पोस्ट करें
                  </button>
                </div>
              </form>
            )}

            {/* Filter & Search Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl">
              <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  placeholder="संदेश, जिला या नाम खोजें..."
                  className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setFilterCategory('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${filterCategory === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  सभी
                </button>
                <button
                  onClick={() => setFilterCategory('tournament')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${filterCategory === 'tournament' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  टूर्नामेंट
                </button>
                <button
                  onClick={() => setFilterCategory('training')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${filterCategory === 'training' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  ट्रेनिंग
                </button>
                <button
                  onClick={() => setFilterCategory('inquiry')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${filterCategory === 'inquiry' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  सवाल
                </button>
              </div>
            </div>

            {/* Posts Stream */}
            <div className="space-y-3">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-10 bg-slate-900/40 rounded-2xl border border-slate-800">
                  <MessageCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-bold">कोई संदेश नहीं मिला।</p>
                  <p className="text-xs text-slate-500 mt-1">पहला संदेश पोस्ट करने के लिए "नया संदेश लिखें" पर क्लिक करें।</p>
                </div>
              ) : (
                filteredPosts.map(post => (
                  <div 
                    key={post.id}
                    className="bg-slate-900 border border-slate-800 hover:border-amber-500/30 rounded-2xl p-3.5 space-y-2.5 transition shadow-lg"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-amber-400 text-xs">
                          {post.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-white">
                              {post.authorName}
                            </span>
                            {getRoleBadge(post.authorRole)}
                          </div>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-amber-400" />
                            <span>{post.district}</span>
                            <span>•</span>
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{new Date(post.timestamp).toLocaleDateString()} {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </p>
                        </div>
                      </div>

                      {isAdminAuthenticated && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-lg transition"
                          title="डिलीट करें"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Content */}
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap pl-10">
                      {post.message}
                    </p>

                    {/* Actions footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 pl-10">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl transition ${
                          post.userLiked 
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40 font-bold' 
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${post.userLiked ? 'fill-current' : ''}`} />
                        <span>{post.likes} Cheers</span>
                      </button>

                      <span className="text-[10px] text-slate-500 font-medium">
                        #{post.category || 'general'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* Tab 3: Official Helpdesk & Key Contacts */}
        {activeTab === 'contact' && (
          <div className="flex-1 bg-slate-950/60 p-4 sm:p-6 overflow-y-auto space-y-4">
            
            {/* Admin Quick Action if authenticated */}
            {isAdminAuthenticated && (
              <div className="flex items-center justify-between bg-amber-500/15 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>एडमिन: आप यह हेल्पडेस्क जानकारी सीधे एडमिन पैनल से बदल सकते हैं</span>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => {
                      onNavigate('admin');
                      onClose();
                    }}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> विवरण संपादित करें (Edit)
                  </button>
                )}
              </div>
            )}

            {/* Secretariat Header */}
            <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4">
              <h4 className="text-sm font-black text-amber-400 flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-amber-400" /> {settings.helpdeskSecretariatTitle || 'उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन (UPRSA) सचिवालय'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {settings.helpdeskSecretariatDesc || 'उत्तर प्रदेश में रोलर स्केटिंग, स्पीड, इनलाइन, क्वाड और हॉकी का आधिकारिक राज्य नियामक संघ (Affiliated to Roller Skating Federation of India & Recognized by UP Olympic Association).'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* WhatsApp Support Box */}
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <MessageCircle className="w-5 h-5" /> {settings.helpdeskWhatsappTitle || 'आधिकारिक व्हाट्सएप हेल्पडेस्क'}
                </div>
                <p className="text-xs text-slate-300">
                  {settings.helpdeskWhatsappDesc || 'पंजीकरण, आईडी कार्ड या परिणाम संबंधित तुरंत सहायता के लिए व्हाट्सएप पर संदेश भेजें।'}
                </p>
                <a
                  href={`https://wa.me/${(settings.whatsappSupportNumber || '+919415011223').replace(/[^0-9]/g, '')}?text=Namaste%20UPRSA%20Helpline,%20I%20have%20a%20query%20regarding%20roller%20skating%20registration.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-slate-950 font-black text-xs rounded-xl hover:brightness-110 transition shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> चैट शुरू करें ({settings.whatsappSupportNumber || '+91 94150 11223'})
                </a>
              </div>

              {/* Head Office Contact (Lucknow) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <MapPin className="w-5 h-5" /> {settings.helpdeskLucknowTitle || 'राज्य मुख्यालय (Lucknow)'}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {settings.helpdeskLucknowAddress || 'के.डी. सिंह बाबू स्टेडियम स्केटिंग कॉम्प्लेक्स, हज़रतगंज, लखनऊ, उत्तर प्रदेश - 226001'}
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 flex-wrap">
                  <Phone className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>{settings.helpdeskLucknowPhones || settings.supportPhone || '+91 94150 11223 / +91 94150 11224'}</span>
                </div>
              </div>

              {/* Western UP Office (Noida) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <MapPin className="w-5 h-5" /> {settings.helpdeskWesternTitle || 'वेस्टर्न यूपी केंद्र (Noida)'}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {settings.helpdeskWesternAddress || 'सेक्टर 21-A नोएडा स्पोर्ट्स कॉम्प्लेक्स, स्टेडियम रोड, नोएडा, उत्तर प्रदेश - 201301'}
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Phone className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <a href={`tel:${(settings.helpdeskWesternPhone || '+91 98110 33445').replace(/[^0-9+]/g, '')}`} className="hover:underline">
                    {settings.helpdeskWesternPhone || '+91 98110 33445'}
                  </a>
                </div>
              </div>

              {/* Email Support */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Mail className="w-5 h-5" /> {settings.helpdeskEmailTitle || 'ईमेल सहायता'}
                </div>
                <p className="text-xs text-slate-300">
                  {settings.helpdeskEmailDesc || 'आधिकारिक पत्राचार और क्लब मान्यता हेतु ईमेल भेजें।'}
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Mail className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <a href={`mailto:${settings.supportEmail || 'uprsa.official@gmail.com'}`} className="hover:underline text-amber-300 font-black">
                    {settings.supportEmail || 'uprsa.official@gmail.com'}
                  </a>
                </div>
                {(settings.supportHoursHi || settings.supportHoursEn) && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{language === 'hi' ? settings.supportHoursHi : (settings.supportHoursEn || settings.supportHoursHi)}</span>
                  </div>
                )}
              </div>

            </div>

            {/* Quick Action Links */}
            {onNavigate && (
              <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    onNavigate('register');
                    onClose();
                  }}
                  className="px-3 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow"
                >
                  <ChevronRight className="w-3.5 h-3.5" /> स्केटर रजिस्ट्रेशन
                </button>
                <button
                  onClick={() => {
                    onNavigate('tournaments');
                    onClose();
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" /> प्रतियोगिताएं
                </button>
                <button
                  onClick={() => {
                    onNavigate('results');
                    onClose();
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5 text-emerald-400" /> रिजल्ट व सर्टिफिकेट
                </button>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};
