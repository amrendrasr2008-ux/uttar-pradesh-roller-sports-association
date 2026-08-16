import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Layers, 
  FileText, 
  Image as ImageIcon, 
  Bell, 
  Grid, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  CheckCircle, 
  Copy, 
  Globe, 
  ExternalLink,
  Sparkles,
  Users,
  MapPin,
  Building2,
  Trophy,
  Phone,
  Mail,
  Settings,
  ShieldCheck,
  Calendar,
  Award,
  Search,
  Check,
  RefreshCw,
  HelpCircle,
  FileCheck,
  Upload,
  ArrowRight,
  Radio
} from 'lucide-react';
import { EmailManagement } from './EmailManagement';
import { dbStore } from '../../lib/db';
import { 
  HeroSlide, 
  HomeSection, 
  WebsiteContent, 
  MediaItem, 
  Announcement, 
  GalleryItem, 
  CouncilMember, 
  WebsiteSettings,
  District,
  DistrictExecutiveMember,
  Club,
  DisciplineItem
} from '../../types';
import { useLanguage } from '../../context/LanguageContext';

import { compressImageToStrict15KB, validateFileType, processHeroOrBannerImage } from '../../lib/storage';

const compressImageFile = async (file: File): Promise<string> => {
  const validation = validateFileType(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file type.');
  }
  const result = await compressImageToStrict15KB(file, file.name);
  return result.dataUrl;
};

export const WebsiteManagement: React.FC = () => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    | 'home'
    | 'hero'
    | 'about'
    | 'mission'
    | 'activities'
    | 'council'
    | 'districts'
    | 'clubs'
    | 'tournaments'
    | 'results'
    | 'rankings'
    | 'news'
    | 'gallery'
    | 'contact'
    | 'footer'
    | 'media'
    | 'settings'
    | 'emails'
  >('home');

  // Core Data States
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [homeSections, setHomeSections] = useState<HomeSection[]>([]);
  const [websiteContent, setWebsiteContent] = useState<WebsiteContent[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>([]);
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>(dbStore.getWebsiteSettings());
  const [districts, setDistricts] = useState<District[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [disciplines, setDisciplines] = useState<DisciplineItem[]>([]);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);

  // Edit Modals and Form States
  const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide> | null>(null);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);

  const [editingContent, setEditingContent] = useState<Partial<WebsiteContent> | null>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);

  const [editingAnn, setEditingAnn] = useState<Partial<Announcement> | null>(null);
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);

  const [editingGal, setEditingGal] = useState<Partial<GalleryItem> | null>(null);
  const [isGalModalOpen, setIsGalModalOpen] = useState(false);

  const [editingCouncil, setEditingCouncil] = useState<Partial<CouncilMember> | null>(null);
  const [isCouncilModalOpen, setIsCouncilModalOpen] = useState(false);

  const [editingDistrict, setEditingDistrict] = useState<Partial<District> | null>(null);
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);

  const [editingClub, setEditingClub] = useState<Partial<Club> | null>(null);
  const [isClubModalOpen, setIsClubModalOpen] = useState(false);

  const [editingDiscipline, setEditingDiscipline] = useState<Partial<DisciplineItem> | null>(null);
  const [isDisciplineModalOpen, setIsDisciplineModalOpen] = useState(false);

  // Media Library Upload State
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaCategory, setNewMediaCategory] = useState<'hero' | 'gallery' | 'news' | 'general' | 'club' | 'district'>('general');
  const [mediaSearch, setMediaSearch] = useState('');

  const loadData = () => {
    setHeroSlides(dbStore.getHeroSlides());
    setHomeSections(dbStore.getHomeSections());
    setWebsiteContent(dbStore.getAllWebsiteContent());
    setMediaItems(dbStore.getMediaLibrary());
    setAnnouncements(dbStore.getAnnouncements());
    setGalleryItems(dbStore.getGallery());
    setCouncilMembers(dbStore.getCouncilMembers());
    setWebsiteSettings(dbStore.getWebsiteSettings());
    setDistricts(dbStore.getDistricts());
    setClubs(dbStore.getClubs());
    setDisciplines(dbStore.getAllDisciplines());
  };

  useEffect(() => {
    loadData();
    return dbStore.subscribe(loadData);
  }, []);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  // --- REVISION & DRAFT SYSTEM ---
  const handlePublishAll = () => {
    setIsDrafting(false);
    showNotification('All draft website content published live to the public portal!');
  };

  // --- HERO SLIDES HANDLERS ---
  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide?.titleEn || !editingSlide?.desktopImage) {
      showNotification('Title and Desktop Image URL are required', 'error');
      return;
    }

    if (editingSlide.id) {
      dbStore.updateHeroSlide(editingSlide.id, editingSlide);
      showNotification('Hero slide updated');
    } else {
      dbStore.addHeroSlide({
        desktopImage: editingSlide.desktopImage || '',
        mobileImage: editingSlide.mobileImage || editingSlide.desktopImage || '',
        videoUrl: editingSlide.videoUrl || '',
        titleEn: editingSlide.titleEn || '',
        titleHi: editingSlide.titleHi || editingSlide.titleEn || '',
        descriptionEn: editingSlide.descriptionEn || '',
        descriptionHi: editingSlide.descriptionHi || editingSlide.descriptionEn || '',
        primaryBtnTextEn: editingSlide.primaryBtnTextEn || 'Register Skater',
        primaryBtnTextHi: editingSlide.primaryBtnTextHi || 'स्केटर पंजीकरण करें',
        primaryBtnUrl: editingSlide.primaryBtnUrl || '/register',
        secondaryBtnTextEn: editingSlide.secondaryBtnTextEn || 'View Tournaments',
        secondaryBtnTextHi: editingSlide.secondaryBtnTextHi || 'प्रतियोगिताएं देखें',
        secondaryBtnUrl: editingSlide.secondaryBtnUrl || '/tournaments',
        overlayStrength: editingSlide.overlayStrength !== undefined ? editingSlide.overlayStrength : 60,
        active: editingSlide.active !== undefined ? editingSlide.active : true,
        order: heroSlides.length + 1
      });
      showNotification('New Hero slide added');
    }

    setIsSlideModalOpen(false);
    setEditingSlide(null);
  };

  const handleToggleSlideActive = (id: string, currentStatus: boolean) => {
    dbStore.updateHeroSlide(id, { active: !currentStatus });
    showNotification(`Slide ${!currentStatus ? 'activated' : 'deactivated'}`);
  };

  const handleDeleteSlide = (id: string) => {
    dbStore.deleteHeroSlide(id);
    showNotification('Hero slide deleted');
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...heroSlides];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSlides.length) return;

    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIdx];
    newSlides[targetIdx] = temp;

    dbStore.reorderHeroSlides(newSlides);
    showNotification('Hero slides order updated');
  };

  // --- HOME SECTIONS HANDLERS ---
  const handleToggleSection = (id: string, currentEnabled: boolean) => {
    const updated = homeSections.map(s => s.id === id ? { ...s, enabled: !currentEnabled } : s);
    dbStore.updateHomeSections(updated);
    showNotification(`Section ${!currentEnabled ? 'enabled' : 'disabled'}`);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...homeSections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    dbStore.updateHomeSections(newSections);
    showNotification('Homepage layout order saved');
  };

  // --- WEBSITE CONTENT HANDLERS ---
  const handleSaveContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContent?.key) return;

    dbStore.updateWebsiteContent(editingContent.key, {
      titleEn: editingContent.titleEn || '',
      titleHi: editingContent.titleHi || '',
      contentEn: editingContent.contentEn || '',
      contentHi: editingContent.contentHi || '',
      imageUrl: editingContent.imageUrl || ''
    });

    setIsContentModalOpen(false);
    setEditingContent(null);
    showNotification('Website content block saved successfully!');
  };

  // --- EXECUTIVE COUNCIL HANDLERS ---
  const handleSaveCouncilMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCouncil?.nameEn || !editingCouncil?.photoUrl) {
      showNotification('Name and Square Photo URL are required', 'error');
      return;
    }

    if (editingCouncil.id) {
      dbStore.updateCouncilMember(editingCouncil.id, editingCouncil);
      showNotification('Council member updated successfully!');
    } else {
      dbStore.addCouncilMember({
        nameEn: editingCouncil.nameEn || '',
        nameHi: editingCouncil.nameHi || editingCouncil.nameEn || '',
        designationEn: editingCouncil.designationEn || 'Member',
        designationHi: editingCouncil.designationHi || 'सदस्य',
        photoUrl: editingCouncil.photoUrl || '',
        bioEn: editingCouncil.bioEn || '',
        bioHi: editingCouncil.bioHi || editingCouncil.bioEn || '',
        displayOrder: councilMembers.length + 1,
        isActive: editingCouncil.isActive !== undefined ? editingCouncil.isActive : true
      });
      showNotification('New Council member added!');
    }

    setIsCouncilModalOpen(false);
    setEditingCouncil(null);
  };

  const handleDeleteCouncilMember = (id: string) => {
    dbStore.deleteCouncilMember(id);
    showNotification('Council member deleted');
  };

  const handleMoveCouncilMember = (index: number, direction: 'up' | 'down') => {
    const newMembers = [...councilMembers];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newMembers.length) return;

    const temp = newMembers[index];
    newMembers[index] = newMembers[targetIdx];
    newMembers[targetIdx] = temp;

    dbStore.reorderCouncilMembers(newMembers);
    showNotification('Council members order updated');
  };

  // --- NEWS & ANNOUNCEMENTS HANDLERS ---
  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn?.titleEn) {
      showNotification('News title is required', 'error');
      return;
    }

    if (editingAnn.id) {
      dbStore.updateAnnouncement(editingAnn.id, editingAnn);
      showNotification('News item updated');
    } else {
      dbStore.addAnnouncement({
        titleEn: editingAnn.titleEn || '',
        titleHi: editingAnn.titleHi || editingAnn.titleEn || '',
        contentEn: editingAnn.contentEn || '',
        contentHi: editingAnn.contentHi || editingAnn.contentEn || '',
        category: editingAnn.category || 'General',
        date: editingAnn.date || new Date().toISOString().split('T')[0],
        attachmentUrl: editingAnn.attachmentUrl || '',
        imageUrl: editingAnn.imageUrl || '',
        isPinned: editingAnn.isPinned || false,
        isPublished: editingAnn.isPublished !== undefined ? editingAnn.isPublished : true,
        isFeatured: editingAnn.isFeatured || false
      });
      showNotification('News announcement published!');
    }

    setIsAnnModalOpen(false);
    setEditingAnn(null);
  };

  const handleDeleteAnn = (id: string) => {
    dbStore.deleteAnnouncement(id);
    showNotification('News item deleted');
  };

  // --- GALLERY HANDLERS ---
  const handleSaveGalleryItem = (e: React.FormEvent) => {
    e.preventDefault();
    const isVideo = editingGal?.mediaType === 'video';
    if (!isVideo && !editingGal?.imageUrl) {
      showNotification('Photo JPG file or URL is required', 'error');
      return;
    }
    if (isVideo && !editingGal?.videoUrl && !editingGal?.imageUrl) {
      showNotification('Video file or Video link is required', 'error');
      return;
    }

    if (editingGal.id) {
      dbStore.updateGalleryItem(editingGal.id, {
        ...editingGal,
        mediaType: editingGal.mediaType || 'photo'
      });
      showNotification(isVideo ? 'Gallery video updated!' : 'Gallery photo updated!');
    } else {
      dbStore.addGalleryItem({
        title: editingGal.title || editingGal.titleEn || (isVideo ? 'UPRSA Event Video' : 'UPRSA Event Photo'),
        titleEn: editingGal.titleEn || editingGal.title || (isVideo ? 'UPRSA Event Video' : 'UPRSA Event Photo'),
        titleHi: editingGal.titleHi || editingGal.title || (isVideo ? 'यूपीआरएसए इवेंट वीडियो' : 'यूपीआरएसए इवेंट फोटो'),
        category: editingGal.category || 'General',
        mediaType: editingGal.mediaType || 'photo',
        imageUrl: editingGal.imageUrl || (isVideo ? 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80' : ''),
        videoUrl: editingGal.videoUrl || '',
        date: editingGal.date || new Date().toISOString().split('T')[0],
        isPublished: editingGal.isPublished !== undefined ? editingGal.isPublished : true
      });
      showNotification(isVideo ? 'Video added to gallery!' : 'JPG Photo added to gallery!');
    }

    setIsGalModalOpen(false);
    setEditingGal(null);
  };

  const handleDeleteGal = (id: string) => {
    dbStore.deleteGalleryItem(id);
    showNotification('Gallery item deleted');
  };

  // --- DISTRICT EDIT HANDLER ---
  const handleSaveDistrict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDistrict?.id) return;

    dbStore.updateDistrict(editingDistrict.id, editingDistrict);
    setIsDistrictModalOpen(false);
    setEditingDistrict(null);
    showNotification('District public profile updated');
  };

  // --- CLUB EDIT HANDLER ---
  const handleSaveClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClub?.id) return;

    dbStore.updateClub(editingClub.id, editingClub);
    setIsClubModalOpen(false);
    setEditingClub(null);
    showNotification('Club public profile updated');
  };

  // --- DISCIPLINE / ACTIVITY HANDLERS ---
  const handleSaveDiscipline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiscipline?.titleEn) {
      showNotification('English Title is required', 'error');
      return;
    }

    const eventsEnArray = typeof editingDiscipline.eventsEn === 'string'
      ? (editingDiscipline.eventsEn as string).split(',').map(s => s.trim()).filter(Boolean)
      : (editingDiscipline.eventsEn || []);
      
    const eventsHiArray = typeof editingDiscipline.eventsHi === 'string'
      ? (editingDiscipline.eventsHi as string).split(',').map(s => s.trim()).filter(Boolean)
      : (editingDiscipline.eventsHi || []);

    if (editingDiscipline.id) {
      dbStore.updateDiscipline(editingDiscipline.id, {
        ...editingDiscipline,
        eventsEn: eventsEnArray,
        eventsHi: eventsHiArray
      });
      showNotification('Discipline updated successfully');
    } else {
      dbStore.addDiscipline({
        titleEn: editingDiscipline.titleEn || '',
        titleHi: editingDiscipline.titleHi || '',
        subtitleEn: editingDiscipline.subtitleEn || '',
        subtitleHi: editingDiscipline.subtitleHi || '',
        descriptionEn: editingDiscipline.descriptionEn || '',
        descriptionHi: editingDiscipline.descriptionHi || '',
        imageUrl: editingDiscipline.imageUrl || 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=800&auto=format&fit=crop&q=80',
        eventsEn: eventsEnArray,
        eventsHi: eventsHiArray,
        isActive: editingDiscipline.isActive ?? true,
        displayOrder: disciplines.length + 1
      });
      showNotification('New Discipline added successfully');
    }
    setIsDisciplineModalOpen(false);
    setEditingDiscipline(null);
  };

  const handleDeleteDiscipline = (id: string) => {
    dbStore.deleteDiscipline(id);
    showNotification('Discipline deleted');
  };

  const handleToggleDisciplineActive = (id: string, current: boolean) => {
    dbStore.updateDiscipline(id, { isActive: !current });
    showNotification(`Discipline ${!current ? 'activated' : 'deactivated'}`);
  };

  // --- MEDIA LIBRARY HANDLERS ---
  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaUrl) return;

    dbStore.addMediaItem({
      fileName: newMediaUrl.split('/').pop() || 'uploaded_asset.jpg',
      fileUrl: newMediaUrl,
      fileSize: Math.floor(200000 + Math.random() * 300000),
      fileType: 'image/jpeg',
      category: newMediaCategory
    });

    setNewMediaUrl('');
    showNotification('Media asset added to library!');
  };

  const handleDeleteMedia = (id: string) => {
    dbStore.deleteMediaItem(id);
    showNotification('Media asset deleted');
  };

  // --- SETTINGS HANDLER ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dbStore.updateWebsiteSettings(websiteSettings);
    // Sync UPIC logo to certificate template if available
    try {
      const certTpl = dbStore.getCertificateTemplate();
      if (certTpl && websiteSettings.logoUrl) {
        dbStore.saveCertificateTemplate({ ...certTpl, logoUrl: websiteSettings.logoUrl });
      }
    } catch (err) {
      // ignore template sync if missing
    }
    showNotification('UPIC Logo & Website Settings Updated! (यूपीआईसी का बड़ा लोगो व सेटिंग्स सेव हो गईं!)');
  };

  const menuItems = [
    { id: 'home', labelEn: '1. Home Page', labelHi: '1. होम पेज', icon: Layers },
    { id: 'hero', labelEn: '2. Hero Slider', labelHi: '2. हीरो स्लाइडर', icon: Sliders },
    { id: 'about', labelEn: '3. About UPRSA', labelHi: '3. यूपीआरएसए परिचय', icon: FileText },
    { id: 'mission', labelEn: '4. Mission & Vision', labelHi: '4. लक्ष्य एवं दृष्टिकोण', icon: Award },
    { id: 'activities', labelEn: '5. Activities', labelHi: '5. गतिविधियां', icon: Calendar },
    { id: 'council', labelEn: '6. Executive Council', labelHi: '6. कार्यकारिणी परिषद', icon: Users },
    { id: 'districts', labelEn: '7. Districts', labelHi: '7. जिला संघ', icon: MapPin },
    { id: 'clubs', labelEn: '8. Clubs & Academies', labelHi: '8. सम्बद्ध क्लब', icon: Building2 },
    { id: 'tournaments', labelEn: '9. Tournaments', labelHi: '9. प्रतियोगिताएं', icon: Trophy },
    { id: 'results', labelEn: '10. Results', labelHi: '10. परिणाम', icon: FileCheck },
    { id: 'rankings', labelEn: '11. Rankings', labelHi: '11. रैंकिंग', icon: Award },
    { id: 'news', labelEn: '12. News & Notices', labelHi: '12. समाचार व सूचनाएं', icon: Bell },
    { id: 'gallery', labelEn: '13. Gallery', labelHi: '13. फोटो गैलरी', icon: Grid },
    { id: 'contact', labelEn: '14. Contact Us', labelHi: '14. संपर्क करें', icon: Phone },
    { id: 'footer', labelEn: '15. Footer CMS', labelHi: '15. फुटर प्रबंधन', icon: Globe },
    { id: 'media', labelEn: '16. Media Library', labelHi: '16. मीडिया लाइब्रेरी', icon: ImageIcon },
    { id: 'settings', labelEn: '17. UPIC Logo & Website Settings', labelHi: '17. यूपीआईसी लोगो व वेबसाइट सेटिंग्स', icon: Settings },
    { id: 'emails', labelEn: '18. Email & Dispatch', labelHi: '18. ईमेल प्रबंधन', icon: Mail },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              UPRSA Content Management System (CMS)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-400">
              {language === 'hi' ? 'वेबसाइट सामग्री प्रबंधन' : 'Website Content Management'}
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Fully customize the public website pages, executive council, news, photo gallery, hero sliders, and media assets in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('settings')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-xl text-sm transition shadow-xl shadow-amber-500/30 border-2 border-amber-300 cursor-pointer ring-4 ring-amber-400/20"
            >
              <Award className="w-5 h-5 text-slate-950 shrink-0" />
              <span>🖼️ यूपीआईसी का लोगो लगाएं (Upload UPIC Logo)</span>
            </button>
            <button
              onClick={handlePublishAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle className="w-4 h-4" />
              Publish Live Changes
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20"
            >
              <Globe className="w-4 h-4" />
              Live Website
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Notification */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold transition ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Submenu Navigation Grid Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isSettings = item.id === 'settings';
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                isActive 
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-2 ring-amber-400' 
                  : isSettings
                    ? 'bg-amber-100 text-slate-900 border-2 border-amber-400 hover:bg-amber-200 font-extrabold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSettings ? 'text-amber-700 font-bold' : ''}`} />
              <span>{language === 'hi' ? item.labelHi : item.labelEn}</span>
              {isSettings && (
                <span className="bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">
                  LOGO
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================== 18. EMAIL MANAGEMENT ==================== */}
      {activeTab === 'emails' && <EmailManagement />}

      {/* ==================== 1. HOME PAGE EDITOR ==================== */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* Quick UPIC Logo Upload Callout Card */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-4 sm:p-5 rounded-2xl shadow-lg border-2 border-amber-300 text-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-bold shrink-0 shadow-md">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-950">यूपीआईसी (UPIC) का बड़ा लोगो लगाना चाहते हैं?</h3>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  यहाँ क्लिक करें और सीधे डिवाइस से बड़ा JPG / PNG लोगो अपलोड करें।
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-400 font-extrabold text-xs sm:text-sm rounded-xl transition shadow-xl shrink-0 flex items-center justify-center gap-2 cursor-pointer border border-amber-400/40"
            >
              <span>🖼️ यहाँ क्लिक करके लोगो लगाएं</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Homepage Sections Architecture & Order</h2>
              <p className="text-xs text-slate-500">Toggle sections enable/disable, change section titles in English and Hindi, or drag/move section position.</p>
            </div>
            <button
              onClick={() => showNotification('Homepage layout configuration saved')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition"
            >
              <Save className="w-4 h-4" />
              Save Layout
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {homeSections.map((sec, index) => (
              <div key={sec.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    #{sec.order}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{sec.titleEn}</h3>
                      <span className="text-xs font-semibold text-amber-700">({sec.titleHi})</span>
                    </div>
                    <p className="text-xs text-slate-500">{sec.subtitleEn}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleMoveSection(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg text-slate-700 transition"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveSection(index, 'down')}
                      disabled={index === homeSections.length - 1}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg text-slate-700 transition"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleSection(sec.id, sec.enabled)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      sec.enabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {sec.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {sec.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 2. HERO SLIDER CMS ==================== */}
      {activeTab === 'hero' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Hero Section Slider Configuration</h2>
              <p className="text-xs text-slate-500">Manage rotating hero slider banners with desktop/mobile images, bilingual overlays, and custom CTA buttons.</p>
            </div>
            <button
              onClick={() => {
                setEditingSlide({
                  overlayStrength: 60,
                  active: true,
                  primaryBtnTextEn: 'Register Skater',
                  primaryBtnTextHi: 'स्केटर पंजीकरण करें',
                  primaryBtnUrl: '/register',
                  secondaryBtnTextEn: 'View Tournaments',
                  secondaryBtnTextHi: 'प्रतियोगिताएं देखें',
                  secondaryBtnUrl: '/tournaments'
                });
                setIsSlideModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add Hero Slide
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {heroSlides.map((slide, index) => (
              <div key={slide.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row gap-4 p-4 items-center">
                <div className="w-full md:w-56 h-36 relative rounded-lg overflow-hidden bg-slate-900 flex-shrink-0">
                  <img src={slide.desktopImage} alt={slide.titleEn} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                    <span className="bg-amber-500 text-slate-950 font-black text-xs px-2 py-1 rounded">
                      Slide #{slide.order}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-center md:text-left w-full">
                  <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${slide.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                      {slide.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Overlay: {slide.overlayStrength}%</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{slide.titleEn}</h3>
                  <p className="text-xs text-amber-700 font-semibold">{slide.titleHi}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{slide.descriptionEn}</p>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pt-1">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">Primary: {slide.primaryBtnTextEn} ({slide.primaryBtnUrl})</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">Secondary: {slide.secondaryBtnTextEn} ({slide.secondaryBtnUrl})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleMoveSlide(index, 'up')}
                    disabled={index === 0}
                    className="p-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg text-slate-700 transition"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveSlide(index, 'down')}
                    disabled={index === heroSlides.length - 1}
                    className="p-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg text-slate-700 transition"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleSlideActive(slide.id, slide.active)}
                    className={`p-2 rounded-lg transition ${slide.active ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    title={slide.active ? 'Disable' : 'Enable'}
                  >
                    {slide.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingSlide(slide);
                      setIsSlideModalOpen(true);
                    }}
                    className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition"
                    title="Edit Slide"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                    title="Delete Slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 3. ABOUT UPRSA CMS ==================== */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">About UPRSA Section CMS</h2>
            <p className="text-xs text-slate-500">Edit state governing body history, affiliation details, and general overview text in English and Hindi.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {websiteContent.filter(c => c.key === 'about_uprsa').map(content => (
              <div key={content.id} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Title (English)</label>
                    <input
                      type="text"
                      value={content.titleEn}
                      onChange={(e) => dbStore.updateWebsiteContent(content.key, { titleEn: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Title (Hindi)</label>
                    <input
                      type="text"
                      value={content.titleHi}
                      onChange={(e) => dbStore.updateWebsiteContent(content.key, { titleHi: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description (English)</label>
                    <textarea
                      rows={5}
                      value={content.contentEn}
                      onChange={(e) => dbStore.updateWebsiteContent(content.key, { contentEn: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description (Hindi)</label>
                    <textarea
                      rows={5}
                      value={content.contentHi}
                      onChange={(e) => dbStore.updateWebsiteContent(content.key, { contentHi: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => showNotification('About UPRSA content saved')}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition"
                  >
                    Save About UPRSA Content
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 4. MISSION & VISION CMS ==================== */}
      {activeTab === 'mission' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Mission, Vision & Strategic Objectives</h2>
            <p className="text-xs text-slate-500">Edit the core pillars and vision statements driving roller sports development in Uttar Pradesh.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {websiteContent.filter(c => c.key === 'mission_vision').map(content => (
              <div key={content.id} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mission & Vision Title (English)</label>
                    <input
                      type="text"
                      value={content.titleEn}
                      onChange={(e) => dbStore.updateWebsiteContent(content.key, { titleEn: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mission & Vision Title (Hindi)</label>
                    <input
                      type="text"
                      value={content.titleHi}
                      onChange={(e) => dbStore.updateWebsiteContent(content.key, { titleHi: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mission & Vision Statement (English)</label>
                    <textarea
                      rows={6}
                      value={content.contentEn}
                      onChange={(e) => dbStore.updateWebsiteContent(content.key, { contentEn: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mission & Vision Statement (Hindi)</label>
                    <textarea
                      rows={6}
                      value={content.contentHi}
                      onChange={(e) => dbStore.updateWebsiteContent(content.key, { contentHi: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => showNotification('Mission & Vision saved')}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition"
                  >
                    Save Mission & Vision
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 5. ACTIVITIES & DISCIPLINES CMS ==================== */}
      {activeTab === 'activities' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">UPRSA Official Skating Disciplines & Activities</h2>
              <p className="text-xs text-slate-500">Edit and manage disciplines displayed on the public UPRSA Disciplines page (title, description, image, events, and Hindi translations).</p>
            </div>
            <button
              onClick={() => {
                setEditingDiscipline({
                  isActive: true,
                  displayOrder: disciplines.length + 1,
                  eventsEn: [],
                  eventsHi: []
                });
                setIsDisciplineModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add Skating Discipline
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {disciplines.map((d) => (
              <div 
                key={d.id} 
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col justify-between transition ${
                  d.isActive ? 'border-slate-200' : 'border-slate-300 opacity-60 bg-slate-50'
                }`}
              >
                <div className="p-5 space-y-3">
                  <div className="h-40 rounded-xl overflow-hidden relative bg-slate-100">
                    <img src={d.imageUrl} alt={d.titleEn} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        d.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-200'
                      }`}>
                        {d.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center justify-between">
                      <span>{d.titleEn}</span>
                    </h3>
                    {d.titleHi && <p className="text-xs text-amber-600 font-semibold">{d.titleHi}</p>}
                    {d.subtitleEn && <p className="text-xs text-slate-500 mt-1 italic">{d.subtitleEn}</p>}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{d.descriptionEn}</p>

                  {d.eventsEn && d.eventsEn.length > 0 && (
                    <div className="space-y-1 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Key Events:</span>
                      <div className="flex flex-wrap gap-1">
                        {d.eventsEn.map((ev, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleDisciplineActive(d.id, !!d.isActive)}
                      className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                        d.isActive 
                          ? 'border-slate-300 text-slate-600 hover:bg-slate-100' 
                          : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                      title={d.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {d.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingDiscipline({
                          ...d,
                          eventsEn: d.eventsEn?.join(', ') as any,
                          eventsHi: d.eventsHi?.join(', ') as any
                        });
                        setIsDisciplineModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-amber-50 hover:border-amber-300 transition flex items-center gap-1 text-xs font-bold"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      Edit
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteDiscipline(d.id)}
                    className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                    title="Delete Discipline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 6. EXECUTIVE COUNCIL CMS ==================== */}
      {activeTab === 'council' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Executive Council Members (2026–30)</h2>
              <p className="text-xs text-slate-500">Manage council members with prominent square photo containers (240×240 desktop, 200×200 tablet, 160×160 mobile with object-fit: cover).</p>
            </div>
            <button
              onClick={() => {
                setEditingCouncil({
                  isActive: true,
                  displayOrder: councilMembers.length + 1
                });
                setIsCouncilModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add Council Member
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {councilMembers.map((member, index) => (
              <div key={member.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4 flex flex-col items-center relative group">
                <div className="w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] lg:w-[240px] lg:h-[240px] aspect-square mx-auto rounded-xl bg-slate-100 border-2 border-amber-500/50 overflow-hidden shadow-md flex-shrink-0">
                  <img src={member.photoUrl} alt={member.nameEn} className="w-full h-full object-cover" />
                </div>

                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs font-bold text-slate-400">#{member.displayOrder}</span>
                    <h3 className="font-extrabold text-slate-900 text-base">{member.nameEn}</h3>
                  </div>
                  <p className="text-amber-600 text-xs font-bold uppercase tracking-wider">{member.designationEn}</p>
                  <p className="text-slate-500 text-xs line-clamp-2">{member.bioEn}</p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 w-full justify-center">
                  <button
                    onClick={() => handleMoveCouncilMember(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg text-slate-700 transition"
                    title="Move Up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveCouncilMember(index, 'down')}
                    disabled={index === councilMembers.length - 1}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg text-slate-700 transition"
                    title="Move Down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingCouncil(member);
                      setIsCouncilModalOpen(true);
                    }}
                    className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition"
                    title="Edit Member"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCouncilMember(member.id)}
                    className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                    title="Delete Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 7. DISTRICTS MANAGEMENT ==================== */}
      {activeTab === 'districts' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">District Associations Public Profiles (75 Districts)</h2>
              <p className="text-xs text-slate-500">Edit contact details, district codes, officials, and active skater counts for affiliated district associations.</p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">
              75 Districts Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {districts.map(dist => (
              <div key={dist.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      {dist.logoUrl ? (
                        <img src={dist.logoUrl} alt={dist.nameEn} className="w-20 h-20 rounded-2xl object-contain bg-slate-50 border-2 border-slate-300 p-1.5 shadow shrink-0" />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-slate-300 flex items-center justify-center font-bold text-slate-600 text-sm shrink-0 shadow">
                          {dist.code}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 bg-slate-900 text-amber-400 font-mono text-[10px] font-bold rounded">{dist.code}</span>
                          <h3 className="font-bold text-slate-900 text-sm">{dist.nameEn}</h3>
                        </div>
                        {dist.nameHi && <p className="text-xs text-amber-700 font-semibold">{dist.nameHi}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingDistrict(dist);
                        setIsDistrictModalOpen(true);
                      }}
                      className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-bold transition shrink-0"
                      title="Edit District Profile & Contacts"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p><strong className="text-slate-800">President:</strong> {dist.presidentName || 'N/A'}</p>
                    <p><strong className="text-slate-800">Secretary:</strong> {dist.secretaryName || 'N/A'}</p>
                    <p><strong className="text-slate-800">Primary Phone:</strong> <span className="text-slate-900 font-medium">{dist.contactPhone || 'N/A'}</span></p>
                    {dist.alternatePhone && (
                      <p><strong className="text-slate-800">Alt Phone:</strong> <span className="text-slate-900 font-medium">{dist.alternatePhone}</span></p>
                    )}
                    {dist.contactEmail && (
                      <p><strong className="text-slate-800">Email:</strong> <span className="text-slate-700 truncate">{dist.contactEmail}</span></p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setEditingDistrict(dist);
                      setIsDistrictModalOpen(true);
                    }}
                    className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-lg p-2 text-xs font-bold transition flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Executive Committee (कार्यकारिणी समिति)
                    </span>
                    <span className="bg-amber-200/80 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                      {dist.executiveCommittee?.length || 0} Members
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-500">
                  <span>Zone: <strong className="text-slate-700">{dist.zone || 'Central'}</strong></span>
                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {dist.skaterCount || 0} Skaters
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 8. CLUBS & ACADEMIES ==================== */}
      {activeTab === 'clubs' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Affiliated Clubs & Academies Public Profiles</h2>
              <p className="text-xs text-slate-500">Manage public profile details, logos, head coaches, contact numbers, and rink addresses for registered skating academies.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
              {clubs.length} Clubs Affiliated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubs.map(club => (
              <div key={club.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      {club.logoUrl ? (
                        <img src={club.logoUrl} alt={club.nameEn} className="w-20 h-20 rounded-2xl object-contain bg-slate-50 border-2 border-slate-300 p-1.5 shadow shrink-0" />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-amber-500/10 text-amber-600 border-2 border-amber-300 flex items-center justify-center font-bold text-sm shrink-0 shadow">
                          {club.code}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{club.nameEn}</h3>
                        {club.nameHi && <p className="text-xs text-amber-700 font-semibold">{club.nameHi}</p>}
                        <p className="text-[11px] text-slate-500 font-medium">{club.districtName} District</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditingClub(club);
                        setIsClubModalOpen(true);
                      }}
                      className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-bold transition shrink-0"
                      title="Edit Club Profile & Contacts"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p><strong className="text-slate-800">Head Coach:</strong> {club.coachName || 'N/A'}</p>
                    {club.presidentName && <p><strong className="text-slate-800">President:</strong> {club.presidentName}</p>}
                    <p><strong className="text-slate-800">Primary Phone:</strong> <span className="text-slate-900 font-medium">{club.contactPhone || 'N/A'}</span></p>
                    {club.alternatePhone && (
                      <p><strong className="text-slate-800">Alt Phone:</strong> <span className="text-slate-900 font-medium">{club.alternatePhone}</span></p>
                    )}
                    {club.email && <p><strong className="text-slate-800">Email:</strong> <span className="text-slate-700 truncate">{club.email}</span></p>}
                    {club.registrationNo && <p><strong className="text-slate-800">Affiliation No:</strong> <span className="font-mono text-amber-800">{club.registrationNo}</span></p>}
                    {club.address && <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/60 line-clamp-2">{club.address}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-500">
                  <span className="font-mono text-slate-600 font-bold">{club.code}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">{club.skaterCount || 0} Skaters</span>
                    <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {club.totalPoints || 0} Pts
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 9. TOURNAMENTS CONTENT ==================== */}
      {activeTab === 'tournaments' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Public Championship Information</h2>
            <p className="text-xs text-slate-500">Display notice banners for upcoming events. (Core tournament data is synchronized with the Tournament Management Module).</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <h3 className="font-bold text-amber-900 text-sm">38th UPRSA UP State Roller Skating Championship 2026</h3>
              <p className="text-xs text-amber-800">Date: August 15-18, 2026 • Venue: KD Singh Babu Stadium Synthetic Track, Lucknow</p>
              <p className="text-xs text-amber-700">All registered skaters must bring physical digital ID card and age proof certificate for verification at the reporting desk.</p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 10. RESULTS ==================== */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Published Race Timings & Medal Tally</h2>
            <p className="text-xs text-slate-500">Official championship results synchronized with Electronic Photo-Finish Timing System.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-600">Results are managed authoritatively via the Live Scoring Operator Panel and automatically rendered on the public results page once approved by the Chief Referee.</p>
          </div>
        </div>
      )}

      {/* ==================== 11. RANKINGS ==================== */}
      {activeTab === 'rankings' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">State Rankings Engine Overview</h2>
            <p className="text-xs text-slate-500">Individual, Club, District, and Overall State Point Standings based on official RSFI point tables.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm text-slate-600">State standings are dynamically computed based on official race result points and displayed on the public Rankings view.</p>
          </div>
        </div>
      )}

      {/* ==================== 12. NEWS & NOTICES ==================== */}
      {activeTab === 'news' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">News & Press Releases</h2>
              <p className="text-xs text-slate-500">Publish bilingual news, circulars, and notices for skaters and parents.</p>
            </div>
            <button
              onClick={() => {
                setEditingAnn({
                  date: new Date().toISOString().split('T')[0],
                  isPublished: true,
                  category: 'General'
                });
                setIsAnnModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition"
            >
              <Plus className="w-4 h-4" />
              Create News Article
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map(ann => (
              <div key={ann.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">{ann.category}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingAnn(ann);
                          setIsAnnModalOpen(true);
                        }}
                        className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-bold transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnn(ann.id)}
                        className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-bold transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {ann.imageUrl && (
                    <div className="h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm">
                      <img src={ann.imageUrl} alt={ann.titleEn} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <h3 className="font-bold text-slate-900 text-base">{ann.titleEn}</h3>
                  {ann.titleHi && <p className="text-xs text-amber-700 font-semibold">{ann.titleHi}</p>}
                  <p className="text-xs text-slate-500 line-clamp-2">{ann.contentEn}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Date: {ann.date}</span>
                  {ann.imageUrl && <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">📷 Photo Attached</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 13. GALLERY CMS ==================== */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Photo & Video Gallery CMS (गैलरी प्रबंधन)</h2>
              <p className="text-xs text-slate-500">Upload JPG photos and MP4 video clips or video links from championships and ceremonies.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingGal({
                    date: new Date().toISOString().split('T')[0],
                    isPublished: true,
                    category: 'State Championship',
                    mediaType: 'photo'
                  });
                  setIsGalModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-md"
              >
                <Upload className="w-3.5 h-3.5 text-slate-950" />
                <span>📷 Add JPG Photo</span>
              </button>

              <button
                onClick={() => {
                  setEditingGal({
                    date: new Date().toISOString().split('T')[0],
                    isPublished: true,
                    category: 'State Championship',
                    mediaType: 'video'
                  });
                  setIsGalModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold rounded-xl text-xs transition shadow-md border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>🎥 Add Video Clip</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryItems.map(item => {
              const isVideo = item.mediaType === 'video' || !!item.videoUrl;
              return (
                <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm group flex flex-col justify-between">
                  <div>
                    <div className="h-40 relative bg-slate-900 flex items-center justify-center overflow-hidden">
                      {isVideo ? (
                        item.videoUrl && item.videoUrl.endsWith('.mp4') ? (
                          <video src={item.videoUrl} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={item.imageUrl || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80'} alt={item.title} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <img src={item.imageUrl || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80'} alt={item.title} className="w-full h-full object-cover" />
                      )}

                      {/* Media Badge Overlay */}
                      <div className="absolute top-2 left-2 z-10">
                        {isVideo ? (
                          <span className="px-2 py-0.5 bg-slate-950/80 text-amber-400 font-black text-[10px] rounded border border-amber-500/30 flex items-center gap-1">
                            🎥 Video Clip
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-950/80 text-emerald-400 font-black text-[10px] rounded border border-emerald-500/30 flex items-center gap-1">
                            📷 JPG Photo
                          </span>
                        )}
                      </div>

                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 z-20">
                        <button
                          onClick={() => {
                            setEditingGal(item);
                            setIsGalModalOpen(true);
                          }}
                          className="p-2 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold"
                          title="Edit Media Item"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGal(item.id)}
                          className="p-2 bg-red-600 text-white rounded-lg text-xs font-bold"
                          title="Delete Media Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-slate-900 text-xs truncate">{item.titleEn || item.title}</h4>
                      <p className="text-[10px] text-slate-400">{item.category} • {item.date}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== 14. CONTACT US CMS ==================== */}
      {activeTab === 'contact' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Contact Us Page & Map Details</h2>
            <p className="text-xs text-slate-500">Edit UPRSA headquarters address, helpline emails, phone numbers, and Google Map embed URL.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Email</label>
                <input
                  type="email"
                  value={websiteSettings.primaryEmail}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, primaryEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Phone / Helpline</label>
                <input
                  type="text"
                  value={websiteSettings.primaryPhone}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, primaryPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Office Address (English)</label>
                <textarea
                  rows={3}
                  value={websiteSettings.addressEn}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, addressEn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Office Address (Hindi)</label>
                <textarea
                  rows={3}
                  value={websiteSettings.addressHi}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, addressHi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Google Maps Location Link</label>
              <input
                type="text"
                value={websiteSettings.googleMapUrl || ''}
                onChange={(e) => setWebsiteSettings({ ...websiteSettings, googleMapUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveSettings}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition"
              >
                Save Contact Info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 15. FOOTER CMS ==================== */}
      {activeTab === 'footer' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
                <Globe className="w-4 h-4" /> Global Footer Editor (फुटर संपादन)
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Footer Content & Contact Info CMS</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Edit association description, affiliation badges, skating disciplines, central secretariat contact details, and copyright statements shown at the bottom of every page.
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 shrink-0 flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Footer Settings (फुटर सेटिंग्स सेव करें)
            </button>
          </div>

          {/* 1. COLUMN 1: ASSOCIATION INFO & BADGES */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              1. Column 1: Association Info & Affiliation Badges (एसोसिएशन जानकारी व मान्यता बैज)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Association Description (English)</label>
                <textarea
                  rows={2}
                  value={websiteSettings.associationDescEn || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, associationDescEn: e.target.value })}
                  placeholder="Dedicated to promoting speed, accuracy, discipline..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Association Description (Hindi)</label>
                <textarea
                  rows={2}
                  value={websiteSettings.associationDescHi || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, associationDescHi: e.target.value })}
                  placeholder="उत्तर प्रदेश में रोलर स्पोर्ट्स में गति, सटीकता..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Badge 1 Text (e.g. RSFI Affiliated)</label>
                <input
                  type="text"
                  value={websiteSettings.badge1Text || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, badge1Text: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Badge 2 Text (e.g. UPOA Recognized)</label>
                <input
                  type="text"
                  value={websiteSettings.badge2Text || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, badge2Text: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* 2. COLUMN 2: SKATING DISCIPLINES LIST */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              2. Column 2: Skating Disciplines List (स्केटिंग खेल विधाएं)
            </h3>

            <div className="space-y-2">
              {(websiteSettings.skatingDisciplines || [
                'Speed Inline Skating (100m - 10,000m)',
                'Speed Quad Skating',
                'Roller Hockey & Inline Hockey',
                'Inline Freestyle Slalom',
                'Artistic Roller Skating',
                'Skateboarding & Downhill'
              ]).map((discipline, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 w-6">#{idx + 1}</span>
                  <input
                    type="text"
                    value={discipline}
                    onChange={(e) => {
                      const updated = [...(websiteSettings.skatingDisciplines || [])];
                      updated[idx] = e.target.value;
                      setWebsiteSettings({ ...websiteSettings, skatingDisciplines: updated });
                    }}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (websiteSettings.skatingDisciplines || []).filter((_, i) => i !== idx);
                      setWebsiteSettings({ ...websiteSettings, skatingDisciplines: updated });
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const updated = [...(websiteSettings.skatingDisciplines || []), 'New Discipline Item'];
                  setWebsiteSettings({ ...websiteSettings, skatingDisciplines: updated });
                }}
                className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add New Discipline (नई विधा जोड़ें)
              </button>
            </div>
          </div>

          {/* 3. COLUMN 3: CENTRAL SECRETARIAT CONTACT DETAILS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              3. Column 3: Central Secretariat Contact Info (केंद्रीय सचिवालय संपर्क जानकारी)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Section Title (English)</label>
                <input
                  type="text"
                  value={websiteSettings.secretariatTitleEn || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, secretariatTitleEn: e.target.value })}
                  placeholder="Central Secretariat"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Section Title (Hindi)</label>
                <input
                  type="text"
                  value={websiteSettings.secretariatTitleHi || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, secretariatTitleHi: e.target.value })}
                  placeholder="केंद्रीय सचिवालय"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Address (English)</label>
                <textarea
                  rows={2}
                  value={websiteSettings.addressEn || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, addressEn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Address (Hindi)</label>
                <textarea
                  rows={2}
                  value={websiteSettings.addressHi || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, addressHi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Phone Number</label>
                <input
                  type="text"
                  value={websiteSettings.primaryPhone || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, primaryPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Email Address</label>
                <input
                  type="email"
                  value={websiteSettings.primaryEmail || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, primaryEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* 4. COLUMN 4: COPYRIGHT & BOTTOM FOOTER BAR */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-500" />
              4. Bottom Bar: Copyright & Social Links (सर्वाधिकार व सोशल मीडिया लिंक्स)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Copyright Text (English)</label>
                <input
                  type="text"
                  value={websiteSettings.copyrightTextEn || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, copyrightTextEn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Copyright Text (Hindi)</label>
                <input
                  type="text"
                  value={websiteSettings.copyrightTextHi || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, copyrightTextHi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bottom Portal Tagline (English)</label>
                <input
                  type="text"
                  value={websiteSettings.footerTaglineEn || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, footerTaglineEn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bottom Portal Tagline (Hindi)</label>
                <input
                  type="text"
                  value={websiteSettings.footerTaglineHi || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, footerTaglineHi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Facebook URL</label>
                <input
                  type="text"
                  placeholder="https://facebook.com/..."
                  value={websiteSettings.socialLinks?.facebook || ''}
                  onChange={(e) => setWebsiteSettings({
                    ...websiteSettings,
                    socialLinks: { ...websiteSettings.socialLinks, facebook: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">X / Twitter URL</label>
                <input
                  type="text"
                  placeholder="https://x.com/..."
                  value={websiteSettings.socialLinks?.twitter || ''}
                  onChange={(e) => setWebsiteSettings({
                    ...websiteSettings,
                    socialLinks: { ...websiteSettings.socialLinks, twitter: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instagram URL</label>
                <input
                  type="text"
                  placeholder="https://instagram.com/..."
                  value={websiteSettings.socialLinks?.instagram || ''}
                  onChange={(e) => setWebsiteSettings({
                    ...websiteSettings,
                    socialLinks: { ...websiteSettings.socialLinks, instagram: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">YouTube Channel URL</label>
                <input
                  type="text"
                  placeholder="https://youtube.com/@..."
                  value={websiteSettings.socialLinks?.youtube || ''}
                  onChange={(e) => setWebsiteSettings({
                    ...websiteSettings,
                    socialLinks: { ...websiteSettings.socialLinks, youtube: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn Company URL</label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/company/..."
                  value={websiteSettings.socialLinks?.linkedin || ''}
                  onChange={(e) => setWebsiteSettings({
                    ...websiteSettings,
                    socialLinks: { ...websiteSettings.socialLinks, linkedin: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Chat / Group Link</label>
                <input
                  type="text"
                  placeholder="https://wa.me/91..."
                  value={websiteSettings.socialLinks?.whatsapp || ''}
                  onChange={(e) => setWebsiteSettings({
                    ...websiteSettings,
                    socialLinks: { ...websiteSettings.socialLinks, whatsapp: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Footer Content (फुटर सेटिंग्स सेव करें)
              </button>
            </div>
          </div>

          {/* 5. FLOATING LIVE MATCH LAUNCHER SETTINGS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                  5. Floating Live Match Button (लेफ्ट साइड लाइव मैच बटन सेटिंग्स)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  वेबसाइट पर नीचे बाईं तरफ (Bottom-Left) दिखने वाले फ्लोटिंग 'लाइव मैच' बटन का लिंक व शीर्षक कॉन्फ़िगर करें।
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={websiteSettings.isLiveMatchActive !== false}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, isLiveMatchActive: e.target.checked })}
                  className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                />
                <span className="text-xs font-bold text-slate-800">
                  {websiteSettings.isLiveMatchActive !== false ? '🔴 बटन सक्रिय है (Active)' : 'बटन छिपाएं (Disabled)'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Live Match Title (Hindi)</label>
                <input
                  type="text"
                  placeholder="लाइव मैच"
                  value={websiteSettings.liveMatchTitleHi || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, liveMatchTitleHi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-red-600"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Live Match Title (English)</label>
                <input
                  type="text"
                  placeholder="Live Match"
                  value={websiteSettings.liveMatchTitleEn || ''}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, liveMatchTitleEn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Live Match Stream URL (New Tab)*</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://youtube.com/@uprsa_official/live"
                    value={websiteSettings.liveMatchUrl || ''}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, liveMatchUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-blue-600"
                  />
                  {websiteSettings.liveMatchUrl && (
                    <a
                      href={websiteSettings.liveMatchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-slate-900 text-amber-400 rounded-lg text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1 shrink-0"
                      title="Test Live Stream Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Test
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-red-600/20 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Live Match Settings (लाइव मैच सेटिंग्स सेव करें)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 16. MEDIA LIBRARY ==================== */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Central Media Library</h2>
              <p className="text-xs text-slate-500">Upload and manage images (JPG, PNG, WEBP) stored in Supabase Storage buckets.</p>
            </div>

            <form onSubmit={handleAddMedia} className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                placeholder="Paste image URL or upload to Supabase..."
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-xl text-sm"
                required
              />
              <select
                value={newMediaCategory}
                onChange={(e) => setNewMediaCategory(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm"
              >
                <option value="general">General</option>
                <option value="hero">Hero Banners</option>
                <option value="gallery">Gallery</option>
                <option value="news">News</option>
                <option value="club">Clubs</option>
                <option value="district">Districts</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition"
              >
                Upload Asset
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaItems.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm group">
                <div className="h-36 relative bg-slate-900">
                  <img src={item.fileUrl} alt={item.fileName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.fileUrl);
                        showNotification('Image URL copied to clipboard!');
                      }}
                      className="p-2 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold"
                      title="Copy URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMedia(item.id)}
                      className="p-2 bg-red-600 text-white rounded-lg text-xs font-bold"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="font-bold text-slate-900 text-xs truncate">{item.fileName}</h4>
                  <p className="text-[10px] text-slate-400 uppercase">{item.category} • {(item.fileSize / 1024).toFixed(0)} KB</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== 17. WEBSITE SETTINGS & UPIC LOGO ==================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" /> Branding & UPIC Logo Configuration
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">UPIC Official Logo & Global Settings (यूपीआईसी का लोगो व वेबसाइट सेटिंग्स)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your official high-resolution UPIC (Uttar Pradesh Roller Skating Association) JPG/PNG logo. This logo automatically displays in the header, certificates, ID cards, and registration PDFs.
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 shrink-0 flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save All Settings (सेटिंग्स सेव करें)
            </button>
          </div>

          {/* ================= UPIC LOGO UPLOAD & BIG PREVIEW BOX ================= */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider inline-block mb-1">
                  OFFICIAL LOGO MANAGEMENT
                </span>
                <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  UPIC High-Resolution JPG Logo (यूपीआईसी का बड़ा लोगो)
                </h3>
                <p className="text-xs text-slate-400">
                  Select and upload a large high-definition JPG, PNG, or WebP logo file from your computer or mobile.
                </p>
              </div>

              {websiteSettings.logoUrl && (
                <button
                  type="button"
                  onClick={() => setWebsiteSettings({ ...websiteSettings, logoUrl: '' })}
                  className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Logo (लोगो हटाएं)
                </button>
              )}
            </div>

            {/* BIG VISUAL PREVIEW DISPLAY AREA */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Big Visual Logo Preview (बड़ा सा लोगो प्रिव्यू)
              </label>

              <div className="w-full min-h-[260px] md:min-h-[320px] bg-slate-950/90 rounded-2xl border-2 border-dashed border-slate-700 p-6 flex flex-col items-center justify-center relative overflow-hidden group transition hover:border-amber-500/50">
                {/* Checkerboard subtle pattern for contrast */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

                {websiteSettings.logoUrl ? (
                  <div className="relative z-10 flex flex-col items-center justify-center space-y-4 max-w-full">
                    <div className="relative p-4 bg-slate-900/90 rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-md flex items-center justify-center max-w-full max-h-[260px]">
                      <img
                        src={websiteSettings.logoUrl}
                        alt="UPIC Official Logo"
                        className="max-h-56 max-w-full object-contain rounded-xl shadow-lg"
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-300 font-semibold">
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> High Quality Logo Loaded
                      </span>
                      <span className="px-2.5 py-1 bg-slate-800 text-amber-300 border border-slate-700 rounded-md">
                        Applied to Header, Certificates & ID Cards
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 text-center space-y-3 p-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-amber-400 shadow-inner">
                      <Award className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">अभी कोई यूपीआईसी लोगो सेट नहीं है</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        कृपया नीचे दिए गए बटन पर क्लिक करके अपने डिवाइस से यूपीआईसी (UPIC) का बड़ा JPG / PNG लोगो फ़ाइल चुनें।
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LOGO SIZE RESIZING CONTROL PANEL */}
            <div className="bg-slate-950/80 p-5 sm:p-6 rounded-2xl border border-amber-500/30 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>लोगो का आकार छोटा/बड़ा करें (Adjust Logo Display Size)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">वर्तमान साइज़:</span>
                  <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-lg shadow-md">
                    {websiteSettings.logoSize || 96} px
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Left: Slider & Presets */}
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                      <span>छोटा (40px)</span>
                      <span className="text-amber-400 font-black">स्लाइडर से साइज़ घटाएं / बढ़ाएं (Drag to Resize)</span>
                      <span>बहुत बड़ा (220px)</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="220"
                      step="4"
                      value={websiteSettings.logoSize || 96}
                      onChange={(e) => setWebsiteSettings({ ...websiteSettings, logoSize: Number(e.target.value) })}
                      className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  {/* Preset Size Quick Buttons */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      क्विक साइज़ ऑप्शंस (Quick Size Presets):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Small (60px)', size: 60 },
                        { label: 'Medium (80px)', size: 80 },
                        { label: 'Large (100px)', size: 100 },
                        { label: 'X-Large (130px)', size: 130 },
                        { label: 'Super Giant (160px)', size: 160 },
                      ].map((preset) => {
                        const isSelected = (websiteSettings.logoSize || 96) === preset.size;
                        return (
                          <button
                            key={preset.size}
                            type="button"
                            onClick={() => setWebsiteSettings({ ...websiteSettings, logoSize: preset.size })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300 font-black'
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                            }`}
                          >
                            <span>{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right: Real-time Live Header Preview */}
                <div className="lg:col-span-5 bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Header Live Simulation (हेडर में कैसा दिखेगा)</span>
                    <span className="text-slate-400 font-mono">{websiteSettings.logoSize || 96}px</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-3 overflow-hidden">
                    <div 
                      className="rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-blue-600 p-0.5 shrink-0 overflow-hidden flex items-center justify-center bg-slate-900 border border-amber-400/50 transition-all duration-150"
                      style={{
                        width: `${Math.min(websiteSettings.logoSize || 96, 110)}px`,
                        height: `${Math.min(websiteSettings.logoSize || 96, 110)}px`
                      }}
                    >
                      {websiteSettings.logoUrl ? (
                        <img src={websiteSettings.logoUrl} alt="Logo" className="w-full h-full rounded-full object-contain bg-slate-900" />
                      ) : (
                        <Award className="w-6 h-6 text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-amber-300 italic font-serif truncate">Uttar Pradesh Roller Sports</div>
                      <div className="text-[10px] text-slate-400 truncate">Official Association Portal</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FILE UPLOAD & LINK CONTROLS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Option A: Direct File Upload */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Upload className="w-4 h-4" /> Option 1: Upload JPG File from Device (फ़ाइल चुनें)
                </div>
                <p className="text-xs text-slate-400">
                  Select a high-resolution JPG image from your computer or phone. It will be loaded automatically into the preview.
                </p>

                <label className="block w-full">
                  <span className="sr-only">Choose UPIC Logo File</span>
                  <div className="cursor-pointer w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-sm rounded-xl text-center shadow-lg transition flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    बड़ा JPG लोगो फ़ाइल चुनें (Choose JPG File)
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 12 * 1024 * 1024) {
                          showNotification('फाइल का साइज़ 12MB से कम होना चाहिए', 'error');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === 'string') {
                            setWebsiteSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
                            showNotification('यूपीआईसी का बड़ा JPG लोगो लोड हो गया! अब नीचे सेव बटन दबाएं।');
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Option B: Direct Image URL */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <Globe className="w-4 h-4" /> Option 2: Image Web Link (इमेज यूआरएल)
                </div>
                <p className="text-xs text-slate-400">
                  Or paste a direct web image link (e.g. https://domain.com/upic-logo.jpg) below:
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={websiteSettings.logoUrl}
                    onChange={(e) => setWebsiteSettings({ ...websiteSettings, logoUrl: e.target.value })}
                    placeholder="https://example.com/upic-logo.jpg"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* PRESET SAMPLE LOGOS FOR QUICK TESTING */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Sample UPIC / Roller Sports Preset Logos (सैंपल प्रैसेट लोगो):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: 'Roller Sports Emblem', url: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=500&auto=format&fit=crop&q=80' },
                  { name: 'Speed Skating Crest', url: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=500&auto=format&fit=crop&q=80' },
                  { name: 'Championship Shield', url: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=500&auto=format&fit=crop&q=80' },
                  { name: 'Golden Cup Badge', url: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=500&auto=format&fit=crop&q=80' },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setWebsiteSettings({ ...websiteSettings, logoUrl: preset.url });
                      showNotification(`सैंपल लोगो चुन लिया गया: ${preset.name}`);
                    }}
                    className="p-2 bg-slate-950 border border-slate-800 hover:border-amber-500/60 rounded-xl flex items-center gap-2 text-left transition group"
                  >
                    <img src={preset.url} alt={preset.name} className="w-10 h-10 rounded-lg object-cover bg-slate-900 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-300 group-hover:text-amber-400 truncate">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* GENERAL WEBSITE CONFIGURATION CARD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Website Name & Language Settings (वेबसाइट नाम व भाषा सेटिंग्स)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Website Name (English)</label>
                <input
                  type="text"
                  value={websiteSettings.websiteNameEn}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, websiteNameEn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Website Name (Hindi)</label>
                <input
                  type="text"
                  value={websiteSettings.websiteNameHi}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, websiteNameHi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Default Language</label>
                <select
                  value={websiteSettings.defaultLanguage}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, defaultLanguage: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="maintenance"
                  checked={websiteSettings.maintenanceMode}
                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, maintenanceMode: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded"
                />
                <label htmlFor="maintenance" className="text-xs font-bold text-slate-800">
                  Enable Maintenance Mode (Restricts public viewing to emergency notice)
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Global Settings (सेटिंग्स सेव करें)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* HERO SLIDE EDIT MODAL */}
      {isSlideModalOpen && editingSlide && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              {editingSlide.id ? 'Edit Hero Slide' : 'Add New Hero Slide'}
            </h3>

            <form onSubmit={handleSaveSlide} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title (English)*</label>
                  <input
                    type="text"
                    required
                    value={editingSlide.titleEn || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, titleEn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title (Hindi)</label>
                  <input
                    type="text"
                    value={editingSlide.titleHi || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, titleHi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* IMAGE SELECTION & JPG FILE UPLOAD OPTION */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Hero Slide Image (JPG/PNG/WEBP)*</span>
                  {editingSlide.desktopImage && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                      Image Loaded
                    </span>
                  )}
                </label>

                {/* Direct Image URL input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Image Web Link / URL</label>
                  <input
                    type="text"
                    required
                    placeholder="https://... or upload file below"
                    value={editingSlide.desktopImage || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, desktopImage: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>

                {/* Option to Upload JPG file directly from Mobile/Computer */}
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5 text-amber-800">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      हीरो फोटो / बैनर अपलोड (Full HD Quality - No Compression):
                    </span>
                    <span className="text-[11px] text-slate-500">
                      हीरो स्लाइडर और मुख्य बैनर के लिए ओरिजिनल हाई-रिज़ॉल्यूशन फ़ोटो बिना किसी परिवर्तन के सुरक्षित रखी जाती है।
                    </span>
                  </div>

                  <label className="cursor-pointer shrink-0 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2">
                    <Upload className="w-4 h-4 text-slate-950" />
                    <span>HD फोटो चुनें (Original Quality)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            if (file.size > 20 * 1024 * 1024) {
                              showNotification('फ़ोटो का आकार 20MB से कम होना चाहिए', 'error');
                              return;
                            }
                            const heroImage = await processHeroOrBannerImage(file);
                            setEditingSlide({
                              ...editingSlide,
                              desktopImage: heroImage.dataUrl,
                              mobileImage: heroImage.dataUrl
                            });
                            showNotification('हीरो बैनर फ़ोटो ओरिजिनल HD क्वालिटी में लोड हो गई!');
                          } catch (err: any) {
                            showNotification(err.message || 'फ़ोटो लोड करने में त्रुटि हुई', 'error');
                          }
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Image Live Preview */}
                {editingSlide.desktopImage && (
                  <div className="mt-2 h-36 rounded-xl overflow-hidden bg-slate-900 relative border-2 border-amber-400 shadow-md">
                    <img
                      src={editingSlide.desktopImage}
                      alt="Hero slide preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-950/90 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>HD Hero Slide Preview (100% Quality Preserved)</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (English)</label>
                <textarea
                  rows={2}
                  value={editingSlide.descriptionEn || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, descriptionEn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSlideModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-sm"
                >
                  Save Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUNCIL MEMBER EDIT MODAL */}
      {isCouncilModalOpen && editingCouncil && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              {editingCouncil.id ? 'Edit Executive Council Member' : 'Add Council Member'}
            </h3>

            <form onSubmit={handleSaveCouncilMember} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Member Name (English)*</label>
                  <input
                    type="text"
                    required
                    value={editingCouncil.nameEn || ''}
                    onChange={(e) => setEditingCouncil({ ...editingCouncil, nameEn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Member Name (Hindi)</label>
                  <input
                    type="text"
                    value={editingCouncil.nameHi || ''}
                    onChange={(e) => setEditingCouncil({ ...editingCouncil, nameHi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation (English)*</label>
                  <input
                    type="text"
                    required
                    value={editingCouncil.designationEn || ''}
                    onChange={(e) => setEditingCouncil({ ...editingCouncil, designationEn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation (Hindi)</label>
                  <input
                    type="text"
                    value={editingCouncil.designationHi || ''}
                    onChange={(e) => setEditingCouncil({ ...editingCouncil, designationHi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* COUNCIL MEMBER PHOTO SELECTION & JPG FILE UPLOAD OPTION */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Member Photo (JPG/PNG/WEBP)*</span>
                  {editingCouncil.photoUrl && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                      Photo Loaded
                    </span>
                  )}
                </label>

                {/* Direct Image URL input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Photo Web Link / URL</label>
                  <input
                    type="text"
                    required
                    placeholder="https://... or select JPG file below"
                    value={editingCouncil.photoUrl || ''}
                    onChange={(e) => setEditingCouncil({ ...editingCouncil, photoUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>

                {/* Option to Upload JPG file directly from Mobile/Computer */}
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-900 block">फोटो अपलोड करें (JPG File Upload):</span>
                    गैलरी या फाइल मैनेजर से सदस्य की JPG फोटो चुनें।
                  </div>

                  <label className="cursor-pointer shrink-0 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2">
                    <Upload className="w-4 h-4 text-slate-950" />
                    <span>JPG फोटो चुनें (Select JPG)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            showNotification('फ़ाइल का आकार 10MB से कम होना चाहिए', 'error');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setEditingCouncil({
                                ...editingCouncil,
                                photoUrl: reader.result as string
                              });
                              showNotification('सदस्य की JPG फ़ोटो सफलतापूर्वक लोड हो गई!');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Photo Preview Box */}
                {editingCouncil.photoUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
                    <img
                      src={editingCouncil.photoUrl}
                      alt="Council member preview"
                      className="w-16 h-16 object-cover rounded-full border-2 border-amber-500 shadow-sm"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Photo Preview (फोटो प्रिव्यू)</span>
                      <span className="text-[10px] text-slate-500">1:1 Ratio Square Profile Photo</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Biography (English)</label>
                <textarea
                  rows={2}
                  value={editingCouncil.bioEn || ''}
                  onChange={(e) => setEditingCouncil({ ...editingCouncil, bioEn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCouncilModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-sm"
                >
                  Save Council Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEWS EDIT MODAL */}
      {isAnnModalOpen && editingAnn && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              {editingAnn.id ? 'Edit News Article' : 'Create News Article'}
            </h3>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title (English)*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 38th UP State Championship Announcement"
                    value={editingAnn.titleEn || ''}
                    onChange={(e) => setEditingAnn({ ...editingAnn, titleEn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title (Hindi - शीर्षक)</label>
                  <input
                    type="text"
                    placeholder="जैसे 38वीं यूपी स्टेट रोलर स्केटिंग चैंपियनशिप"
                    value={editingAnn.titleHi || ''}
                    onChange={(e) => setEditingAnn({ ...editingAnn, titleHi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={editingAnn.category || 'General'}
                    onChange={(e) => setEditingAnn({ ...editingAnn, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="Tournament">Tournament</option>
                    <option value="Registration">Registration</option>
                    <option value="Notice">Notice</option>
                    <option value="General">General Press Release</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Release Date</label>
                  <input
                    type="date"
                    value={editingAnn.date || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEditingAnn({ ...editingAnn, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Content / Details (English)</label>
                <textarea
                  rows={3}
                  placeholder="Enter news press release content..."
                  value={editingAnn.contentEn || ''}
                  onChange={(e) => setEditingAnn({ ...editingAnn, contentEn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Content / Details (Hindi - समाचार विवरण)</label>
                <textarea
                  rows={3}
                  placeholder="समाचार एवं प्रेस विज्ञप्ति का विवरण दर्ज करें..."
                  value={editingAnn.contentHi || ''}
                  onChange={(e) => setEditingAnn({ ...editingAnn, contentHi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              {/* NEWS PHOTO SELECTION & JPG FILE UPLOAD */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>News & Press Release Photo (JPG/PNG File)</span>
                  {editingAnn.imageUrl && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                      Photo Loaded
                    </span>
                  )}
                </label>

                {/* File Upload Option */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-900 block">फोटो अपलोड करें (JPG File Upload):</span>
                    मोबाइल या कंप्यूटर की गैलरी से न्यूज़/प्रेस विज्ञप्ति की JPG फोटो चुनें।
                  </div>

                  <label className="cursor-pointer shrink-0 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2">
                    <Upload className="w-4 h-4 text-slate-950" />
                    <span>JPG फोटो चुनें (Select JPG)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            showNotification('फ़ाइल का आकार 10MB से कम होना चाहिए', 'error');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setEditingAnn({
                                ...editingAnn,
                                imageUrl: reader.result as string
                              });
                              showNotification('न्यूज़ की JPG फ़ोटो लोड हो गई!');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Fallback Image Web URL */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Image Web Link / URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://... or upload file above"
                    value={editingAnn.imageUrl || ''}
                    onChange={(e) => setEditingAnn({ ...editingAnn, imageUrl: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>

                {/* News Photo Live Preview */}
                {editingAnn.imageUrl && (
                  <div className="mt-2 h-36 rounded-xl overflow-hidden bg-slate-900 relative border border-slate-300">
                    <img
                      src={editingAnn.imageUrl}
                      alt="News preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-950/80 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded">
                      News Photo Live Preview
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingAnn({ ...editingAnn, imageUrl: '' })}
                      className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow"
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAnnModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-sm"
                >
                  Save News Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GALLERY ITEM EDIT MODAL */}
      {isGalModalOpen && editingGal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingGal.id 
                  ? (editingGal.mediaType === 'video' ? 'Edit Gallery Video' : 'Edit Gallery Photo')
                  : (editingGal.mediaType === 'video' ? 'Add Gallery Video Clip' : 'Add Gallery JPG Photo')}
              </h3>
              <button 
                type="button"
                onClick={() => setIsGalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Media Type Selector Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setEditingGal({ ...editingGal, mediaType: 'photo' })}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 ${
                  (editingGal.mediaType || 'photo') === 'photo'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📷 JPG Photo (फ़ोटो)</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingGal({ ...editingGal, mediaType: 'video' })}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 ${
                  editingGal.mediaType === 'video'
                    ? 'bg-slate-900 text-amber-400 shadow-sm border border-slate-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🎥 Video Clip (वीडियो)</span>
              </button>
            </div>

            <form onSubmit={handleSaveGalleryItem} className="space-y-4">
              {/* PHOTO UPLOAD SECTION */}
              {editingGal.mediaType !== 'video' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Gallery Photo (JPG / PNG) *</span>
                    {editingGal.imageUrl && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                        Photo Loaded
                      </span>
                    )}
                  </label>

                  {/* Direct File Upload Button */}
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 text-center">
                      <Upload className="w-4 h-4 text-slate-950" />
                      <span>JPG / PNG फोटो फ़ाइल चुनें (Select JPG Photo)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              showNotification('फ़ाइल का आकार 10MB से कम होना चाहिए', 'error');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setEditingGal({
                                  ...editingGal,
                                  imageUrl: reader.result as string
                                });
                                showNotification('गैलरी की JPG फ़ोटो लोड हो गई!');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <span className="text-[11px] text-slate-500 text-center">
                      मोबाइल या कंप्यूटर की गैलरी से JPG फोटो चुनें
                    </span>
                  </div>

                  {/* Web URL input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Image Web URL (या लिंक दर्ज करें)</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={editingGal.imageUrl || ''}
                      onChange={(e) => setEditingGal({ ...editingGal, imageUrl: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>

                  {/* Live Photo Preview */}
                  {editingGal.imageUrl && (
                    <div className="mt-2 h-44 rounded-xl overflow-hidden bg-slate-900 relative border border-slate-300">
                      <img
                        src={editingGal.imageUrl}
                        alt="Gallery preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-slate-950/80 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
                        Photo Live Preview
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingGal({ ...editingGal, imageUrl: '' })}
                        className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* VIDEO UPLOAD SECTION */}
              {editingGal.mediaType === 'video' && (
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 space-y-3">
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Gallery Video Clip (MP4 Video File / Link) *</span>
                    {editingGal.videoUrl && (
                      <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                        Video Loaded
                      </span>
                    )}
                  </label>

                  {/* Direct Video File Upload Button */}
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 text-center">
                      <Upload className="w-4 h-4 text-slate-950" />
                      <span>MP4 / WebM वीडियो फ़ाइल चुनें (Select Video File)</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/ogg,video/quicktime"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 50 * 1024 * 1024) {
                              showNotification('वीडियो फ़ाइल का आकार 50MB से कम होना चाहिए', 'error');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setEditingGal({
                                  ...editingGal,
                                  videoUrl: reader.result as string,
                                  mediaType: 'video'
                                });
                                showNotification('वीडियो फ़ाइल अपलोड हो गई!');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <span className="text-[11px] text-slate-400 text-center">
                      मोबाइल/कंप्यूटर से MP4 वीडियो चुनकर गैलरी में अपलोड करें
                    </span>
                  </div>

                  {/* Web Video Link Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Video Link / URL (MP4 / YouTube URL)</label>
                    <input
                      type="text"
                      placeholder="https://... (.mp4 link or video URL)"
                      value={editingGal.videoUrl || ''}
                      onChange={(e) => setEditingGal({ ...editingGal, videoUrl: e.target.value, mediaType: 'video' })}
                      className="w-full px-3 py-1.5 border border-slate-700 rounded-lg text-xs bg-slate-950 text-white placeholder-slate-500"
                    />
                  </div>

                  {/* Video Thumbnail / Cover photo input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Video Cover Photo / Thumbnail (Optional JPG)</label>
                    <input
                      type="text"
                      placeholder="Cover image URL for video thumbnail..."
                      value={editingGal.imageUrl || ''}
                      onChange={(e) => setEditingGal({ ...editingGal, imageUrl: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-700 rounded-lg text-xs bg-slate-950 text-white placeholder-slate-500"
                    />
                  </div>

                  {/* Live Video Player Preview */}
                  {editingGal.videoUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden bg-black relative border border-slate-700">
                      {editingGal.videoUrl.endsWith('.mp4') || editingGal.videoUrl.startsWith('data:video/') ? (
                        <video
                          src={editingGal.videoUrl}
                          controls
                          className="w-full h-48 object-contain bg-black"
                        />
                      ) : (
                        <div className="p-4 text-center text-xs text-amber-300 bg-slate-950">
                          🎥 Video link attached: <span className="font-mono underline truncate block max-w-xs mx-auto mt-1">{editingGal.videoUrl}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-2 bg-slate-950 text-[10px] text-slate-400 border-t border-slate-800">
                        <span>Video Live Player Preview</span>
                        <button
                          type="button"
                          onClick={() => setEditingGal({ ...editingGal, videoUrl: '' })}
                          className="bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[10px]"
                        >
                          Remove Video
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Title and Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title / Caption (शीर्षक)*</label>
                <input
                  type="text"
                  required
                  value={editingGal.titleEn || editingGal.title || ''}
                  onChange={(e) => setEditingGal({ ...editingGal, titleEn: e.target.value, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g. 38th State Championship Speed Inline Final"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category (श्रेणी)</label>
                <select
                  value={editingGal.category || 'General'}
                  onChange={(e) => setEditingGal({ ...editingGal, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="State Championship">State Championship</option>
                  <option value="Awards & Medal Ceremony">Awards & Medal Ceremony</option>
                  <option value="Speed Skating">Speed Skating</option>
                  <option value="Roller Hockey">Roller Hockey</option>
                  <option value="Artistic & Freestyle">Artistic & Freestyle</option>
                  <option value="General">General Events</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGalModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-sm"
                >
                  {editingGal.mediaType === 'video' ? 'Save Gallery Video' : 'Save Gallery Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISTRICT EDIT MODAL */}
      {isDistrictModalOpen && editingDistrict && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Edit District Public Profile ({editingDistrict.nameEn})
              </h3>
              <button 
                onClick={() => setIsDistrictModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDistrict} className="space-y-4">
              {/* Logo Upload & Preview */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800">
                    District Association Logo (डिस्ट्रिक्ट एसोसिएशन लोगो) *
                  </label>
                  <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-2 py-0.5 rounded">JPG / PNG Format</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Large Logo Preview Box */}
                  <div className="w-28 h-28 rounded-2xl bg-white border-2 border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-md p-1.5 relative group">
                    {editingDistrict.logoUrl ? (
                      <img src={editingDistrict.logoUrl} alt="District Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                        <span className="block text-[10px] font-bold text-slate-400">NO LOGO</span>
                        <span className="text-[11px] font-black text-amber-600">{editingDistrict.code || 'DIST'}</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2.5 w-full">
                    {/* Direct File Upload Button */}
                    <div>
                      <label className="cursor-pointer inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition w-full sm:w-auto">
                        <Upload className="w-4 h-4" />
                        <span>Select JPG / PNG Image File (लोगो फ़ाइल चुनें)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setEditingDistrict(prev => prev ? { ...prev, logoUrl: reader.result as string } : null);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Or Paste Image URL */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Or Image Web URL (या इमेज लिंक दर्ज करें)</span>
                      <input
                        type="text"
                        placeholder="https://example.com/district-logo.jpg"
                        value={editingDistrict.logoUrl || ''}
                        onChange={(e) => setEditingDistrict({ ...editingDistrict, logoUrl: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {editingDistrict.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditingDistrict({ ...editingDistrict, logoUrl: '' })}
                        className="text-[10px] font-bold text-red-600 hover:text-red-700 underline"
                      >
                        ✕ Remove Logo (लोगो हटाएं)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={editingDistrict.nameEn || ''}
                    onChange={(e) => setEditingDistrict({ ...editingDistrict, nameEn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District Name (Hindi)</label>
                  <input
                    type="text"
                    value={editingDistrict.nameHi || ''}
                    onChange={(e) => setEditingDistrict({ ...editingDistrict, nameHi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Officials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">President Name</label>
                  <input
                    type="text"
                    value={editingDistrict.presidentName || ''}
                    onChange={(e) => setEditingDistrict({ ...editingDistrict, presidentName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Secretary Name</label>
                  <input
                    type="text"
                    value={editingDistrict.secretaryName || ''}
                    onChange={(e) => setEditingDistrict({ ...editingDistrict, secretaryName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Contact Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Contact Number (मुख्य फोन नंबर) *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9876543210"
                    value={editingDistrict.contactPhone || ''}
                    onChange={(e) => setEditingDistrict({ ...editingDistrict, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alternate Contact Number (अन्य संपर्क नंबर)</label>
                  <input
                    type="text"
                    placeholder="+91 9123456789"
                    value={editingDistrict.alternatePhone || ''}
                    onChange={(e) => setEditingDistrict({ ...editingDistrict, alternatePhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Email & Zone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="district@uprsa.org"
                    value={editingDistrict.contactEmail || ''}
                    onChange={(e) => setEditingDistrict({ ...editingDistrict, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Zone / Region</label>
                  <input
                    type="text"
                    placeholder="Central / Eastern / Western / Northern"
                    value={editingDistrict.zone || ''}
                    onChange={(e) => setEditingDistrict({ ...editingDistrict, zone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* District Executive Committee (जिला कार्यकारिणी समिति 2026–30) */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      District Executive Committee (जिला कार्यकारिणी समिति 2026–30)
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Add office bearers & executive members for {editingDistrict.nameEn} (President, General Secretary, Treasurer, Vice Presidents, etc.)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentList = editingDistrict.executiveCommittee || [];
                      const newMember: DistrictExecutiveMember = {
                        id: 'exec-' + Date.now(),
                        districtId: editingDistrict.id || '',
                        nameEn: '',
                        nameHi: '',
                        designationEn: 'Executive Member',
                        designationHi: 'कार्यकारिणी सदस्य',
                        contactPhone: '',
                        email: ''
                      };
                      setEditingDistrict({
                        ...editingDistrict,
                        executiveCommittee: [...currentList, newMember]
                      });
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Member (+ सदस्य जोड़ें)</span>
                  </button>
                </div>

                {/* Executive Members List */}
                {editingDistrict.executiveCommittee && editingDistrict.executiveCommittee.length > 0 ? (
                  <div className="space-y-3 pt-2 max-h-80 overflow-y-auto pr-1">
                    {editingDistrict.executiveCommittee.map((member, index) => (
                      <div key={member.id || index} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5 shadow-sm relative">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <span className="text-[11px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                            Member #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const updatedList = (editingDistrict.executiveCommittee || []).filter((_, i) => i !== index);
                              setEditingDistrict({ ...editingDistrict, executiveCommittee: updatedList });
                            }}
                            className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-bold transition flex items-center gap-1"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Delete</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700">Name (English) *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Rajeshwar Singh"
                              value={member.nameEn || ''}
                              onChange={(e) => {
                                const updated = [...(editingDistrict.executiveCommittee || [])];
                                updated[index] = { ...updated[index], nameEn: e.target.value };
                                setEditingDistrict({ ...editingDistrict, executiveCommittee: updated });
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 font-medium focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700">Name (Hindi)</label>
                            <input
                              type="text"
                              placeholder="उदा. राजेश्वर सिंह"
                              value={member.nameHi || ''}
                              onChange={(e) => {
                                const updated = [...(editingDistrict.executiveCommittee || [])];
                                updated[index] = { ...updated[index], nameHi: e.target.value };
                                setEditingDistrict({ ...editingDistrict, executiveCommittee: updated });
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 font-medium focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700">Designation (English)</label>
                            <input
                              type="text"
                              placeholder="President / Vice President / Secretary / Treasurer"
                              value={member.designationEn || ''}
                              onChange={(e) => {
                                const updated = [...(editingDistrict.executiveCommittee || [])];
                                updated[index] = { ...updated[index], designationEn: e.target.value };
                                setEditingDistrict({ ...editingDistrict, executiveCommittee: updated });
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 font-medium focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700">Designation (Hindi)</label>
                            <input
                              type="text"
                              placeholder="अध्यक्ष / उपाध्यक्ष / सचिव / कोषाध्यक्ष"
                              value={member.designationHi || ''}
                              onChange={(e) => {
                                const updated = [...(editingDistrict.executiveCommittee || [])];
                                updated[index] = { ...updated[index], designationHi: e.target.value };
                                setEditingDistrict({ ...editingDistrict, executiveCommittee: updated });
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 font-medium focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700">Phone Number</label>
                            <input
                              type="text"
                              placeholder="+91 9876543210"
                              value={member.contactPhone || ''}
                              onChange={(e) => {
                                const updated = [...(editingDistrict.executiveCommittee || [])];
                                updated[index] = { ...updated[index], contactPhone: e.target.value };
                                setEditingDistrict({ ...editingDistrict, executiveCommittee: updated });
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 font-medium focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700">Photo URL</label>
                            <input
                              type="text"
                              placeholder="https://images.unsplash.com/..."
                              value={member.photoUrl || ''}
                              onChange={(e) => {
                                const updated = [...(editingDistrict.executiveCommittee || [])];
                                updated[index] = { ...updated[index], photoUrl: e.target.value };
                                setEditingDistrict({ ...editingDistrict, executiveCommittee: updated });
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 font-medium focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-2 text-center bg-white rounded-lg border border-slate-200">
                    No custom executive committee members listed yet. Click "+ Add Member" above to add executive committee members.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDistrictModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-sm"
                >
                  Save District Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLUB EDIT MODAL */}
      {isClubModalOpen && editingClub && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Edit Club / Academy Profile ({editingClub.nameEn})
              </h3>
              <button 
                onClick={() => setIsClubModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClub} className="space-y-4">
              {/* Club Logo Upload & Preview */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800">
                    Club / Academy Logo (क्लब/अकादमी का लोगो) *
                  </label>
                  <span className="text-[10px] text-amber-700 bg-amber-100 font-bold px-2 py-0.5 rounded">JPG / PNG Format</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Large Logo Preview Box */}
                  <div className="w-28 h-28 rounded-2xl bg-white border-2 border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-md p-1.5 relative group">
                    {editingClub.logoUrl ? (
                      <img src={editingClub.logoUrl} alt="Club Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                        <span className="block text-[10px] font-bold text-slate-400">NO LOGO</span>
                        <span className="text-[11px] font-black text-amber-600">{editingClub.code || 'CLUB'}</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2.5 w-full">
                    {/* Direct File Upload Button */}
                    <div>
                      <label className="cursor-pointer inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition w-full sm:w-auto">
                        <Upload className="w-4 h-4" />
                        <span>Select JPG / PNG Image File (लोगो फ़ाइल चुनें)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setEditingClub(prev => prev ? { ...prev, logoUrl: reader.result as string } : null);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Or Paste Image URL */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Or Image Web URL (या इमेज लिंक दर्ज करें)</span>
                      <input
                        type="text"
                        placeholder="https://example.com/club-logo.jpg"
                        value={editingClub.logoUrl || ''}
                        onChange={(e) => setEditingClub({ ...editingClub, logoUrl: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {editingClub.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditingClub({ ...editingClub, logoUrl: '' })}
                        className="text-[10px] font-bold text-red-600 hover:text-red-700 underline"
                      >
                        ✕ Remove Logo (लोगो हटाएं)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Club Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={editingClub.nameEn || ''}
                    onChange={(e) => setEditingClub({ ...editingClub, nameEn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Club Name (Hindi)</label>
                  <input
                    type="text"
                    placeholder="उदा. लखनऊ रोलर स्केटिंग अकादमी"
                    value={editingClub.nameHi || ''}
                    onChange={(e) => setEditingClub({ ...editingClub, nameHi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Coach & Registration No */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Head Coach Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Coach Name"
                    value={editingClub.coachName || ''}
                    onChange={(e) => setEditingClub({ ...editingClub, coachName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Affiliation / Registration No.</label>
                  <input
                    type="text"
                    placeholder="UPRSA/CLUB/001"
                    value={editingClub.registrationNo || ''}
                    onChange={(e) => setEditingClub({ ...editingClub, registrationNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* President & Secretary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">President / Owner Name</label>
                  <input
                    type="text"
                    placeholder="President or Manager Name"
                    value={editingClub.presidentName || ''}
                    onChange={(e) => setEditingClub({ ...editingClub, presidentName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Secretary / Coordinator</label>
                  <input
                    type="text"
                    placeholder="Secretary Name"
                    value={editingClub.secretaryName || ''}
                    onChange={(e) => setEditingClub({ ...editingClub, secretaryName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Contact Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Contact Number (मुख्य फोन नंबर) *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98390 11111"
                    value={editingClub.contactPhone || ''}
                    onChange={(e) => setEditingClub({ ...editingClub, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alternate Contact Number (अन्य संपर्क नंबर)</label>
                  <input
                    type="text"
                    placeholder="+91 94150 11112"
                    value={editingClub.alternatePhone || ''}
                    onChange={(e) => setEditingClub({ ...editingClub, alternatePhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Email & Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="club@gmail.com"
                    value={editingClub.email || ''}
                    onChange={(e) => setEditingClub({ ...editingClub, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rink / Training Ground Address</label>
                  <input
                    type="text"
                    placeholder="Stadium Rink, City"
                    value={editingClub.address || ''}
                    onChange={(e) => setEditingClub({ ...editingClub, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClubModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-sm"
                >
                  Save Club Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCIPLINE EDIT / ADD MODAL */}
      {isDisciplineModalOpen && editingDiscipline && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingDiscipline.id ? `Edit Discipline (${editingDiscipline.titleEn})` : 'Add New Skating Discipline'}
              </h3>
              <button 
                onClick={() => setIsDisciplineModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDiscipline} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title (English) *</label>
                  <input
                    type="text"
                    required
                    value={editingDiscipline.titleEn || ''}
                    onChange={(e) => setEditingDiscipline({ ...editingDiscipline, titleEn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="e.g. Speed Inline Skating"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title (Hindi)</label>
                  <input
                    type="text"
                    value={editingDiscipline.titleHi || ''}
                    onChange={(e) => setEditingDiscipline({ ...editingDiscipline, titleHi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="उदा. स्पीड इनलाइन स्केटिंग"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle (English)</label>
                  <input
                    type="text"
                    value={editingDiscipline.subtitleEn || ''}
                    onChange={(e) => setEditingDiscipline({ ...editingDiscipline, subtitleEn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="e.g. High-Velocity Aerodynamic Racing"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle (Hindi)</label>
                  <input
                    type="text"
                    value={editingDiscipline.subtitleHi || ''}
                    onChange={(e) => setEditingDiscipline({ ...editingDiscipline, subtitleHi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="उदा. उच्च गति वायुगतिकी रेसिंग"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (English)</label>
                <textarea
                  rows={2}
                  value={editingDiscipline.descriptionEn || ''}
                  onChange={(e) => setEditingDiscipline({ ...editingDiscipline, descriptionEn: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Detailed description in English..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Hindi)</label>
                <textarea
                  rows={2}
                  value={editingDiscipline.descriptionHi || ''}
                  onChange={(e) => setEditingDiscipline({ ...editingDiscipline, descriptionHi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="हिंदी में विस्तृत विवरण..."
                />
              </div>

              {/* DISCIPLINE PHOTO SELECTION & JPG FILE UPLOAD OPTION */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Discipline Photo (JPG/PNG/WEBP)</span>
                  {editingDiscipline.imageUrl && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                      Image Loaded
                    </span>
                  )}
                </label>

                {/* Direct Image URL input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Image Web Link / URL</label>
                  <input
                    type="text"
                    placeholder="https://... or select JPG file below"
                    value={editingDiscipline.imageUrl || ''}
                    onChange={(e) => setEditingDiscipline({ ...editingDiscipline, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>

                {/* Option to Upload JPG file directly from Mobile/Computer */}
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-900 block">फोटो अपलोड करें (JPG File Upload):</span>
                    मोबाइल या कंप्यूटर से स्केटिंग खेल/गतिविधि की JPG फ़ोटो चुनें।
                  </div>

                  <label className="cursor-pointer shrink-0 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2">
                    <Upload className="w-4 h-4 text-slate-950" />
                    <span>JPG फोटो चुनें (Select JPG)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            showNotification('फ़ाइल का आकार 10MB से कम होना चाहिए', 'error');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setEditingDiscipline({
                                ...editingDiscipline,
                                imageUrl: reader.result as string
                              });
                              showNotification('स्केटिंग गेम की JPG फ़ोटो लोड हो गई!');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Image Live Preview */}
                {editingDiscipline.imageUrl && (
                  <div className="mt-2 h-28 rounded-lg overflow-hidden bg-slate-900 relative border border-slate-300">
                    <img
                      src={editingDiscipline.imageUrl}
                      alt="Discipline preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-950/80 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
                      Discipline Preview
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Key Events (English, comma-separated)</label>
                  <input
                    type="text"
                    value={editingDiscipline.eventsEn as any || ''}
                    onChange={(e) => setEditingDiscipline({ ...editingDiscipline, eventsEn: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="100m Sprint, 500m Rink, 1000m Lap"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Key Events (Hindi, comma-separated)</label>
                  <input
                    type="text"
                    value={editingDiscipline.eventsHi as any || ''}
                    onChange={(e) => setEditingDiscipline({ ...editingDiscipline, eventsHi: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="100 मीटर स्प्रिंट, 500 मीटर रिंक"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="discIsActive"
                  checked={editingDiscipline.isActive ?? true}
                  onChange={(e) => setEditingDiscipline({ ...editingDiscipline, isActive: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded border-slate-300"
                />
                <label htmlFor="discIsActive" className="text-xs font-bold text-slate-700">
                  Visible on Public Website (Active)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDisciplineModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-sm"
                >
                  Save Discipline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
