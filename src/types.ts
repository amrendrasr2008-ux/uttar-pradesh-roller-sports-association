export type Language = 'en' | 'hi';

export type UserRole = 'public' | 'skater' | 'operator' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  skaterId?: string;
  registrationNumber?: string;
}

export interface DistrictExecutiveMember {
  id: string;
  districtId: string;
  nameEn: string;
  nameHi?: string;
  designationEn: string;
  designationHi?: string;
  contactPhone?: string;
  email?: string;
  photoUrl?: string;
  displayOrder?: number;
}

export interface District {
  id: string;
  code: string;
  nameEn: string;
  nameHi: string;
  zone: string;
  address?: string;
  logoUrl?: string;

  // President (अध्यक्ष)
  presidentName: string;
  presidentPhotoUrl?: string;
  presidentPhone?: string;
  presidentEmail?: string;
  presidentAddress?: string;

  // Secretary (महासचिव / सेक्रेटरी)
  secretaryName: string;
  secretaryPhotoUrl?: string;
  secretaryPhone?: string;
  secretaryEmail?: string;
  secretaryAddress?: string;

  // Treasurer (कोषाध्यक्ष / तिजरार / ट्रेजरार)
  treasurerName?: string;
  treasurerPhotoUrl?: string;
  treasurerPhone?: string;
  treasurerEmail?: string;
  treasurerAddress?: string;

  contactPhone: string;
  alternatePhone?: string;
  contactEmail: string;
  skaterCount?: number;
  executiveCommittee?: DistrictExecutiveMember[];
}

export interface Club {
  id: string;
  code: string;
  nameEn: string;
  nameHi: string;
  districtId: string;
  districtName: string;
  coachName: string;
  presidentName?: string;
  secretaryName?: string;
  contactPhone: string;
  alternatePhone?: string;
  email: string;
  address: string;
  logoUrl?: string;
  registrationNo?: string;
  descriptionEn?: string;
  descriptionHi?: string;
  status: 'pending' | 'approved' | 'rejected';
  skaterCount?: number;
  totalPoints?: number;
}

export type Gender = 'Male' | 'Female' | 'Other';

export type AgeGroup = 
  | 'Under 5 Years (Tiny Tots / नीचें 5 वर्ष)'
  | 'Tots / Cadet B: 6 to 8 years'
  | 'Minis: 8 to 10 years'
  | 'Cadet: 10 to 12 years'
  | 'Sub-Junior: 12 to 15 years'
  | 'Junior: 15 to 18 years'
  | 'Senior: Above 18 years'
  | 'Masters: 35 years and above'
  | string;

export type SkatingDiscipline = 
  | 'Speed Inline'
  | 'Speed Quad'
  | 'Speed Adjustable'
  | 'Speed Toy Inline'
  | 'Artistic'
  | 'Freestyle'
  | 'Roller Hockey'
  | 'Skateboarding'
  | 'Roller Derby';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type RegistrationStatus = 'pending' | 'verified' | 'approved' | 'rejected' | 'active' | 'suspended';

export interface SkaterDocument {
  id: string;
  skaterId: string;
  documentType: 'Aadhaar Card' | 'Birth Certificate' | 'Passport' | 'School ID' | 'Other';
  documentNumber?: string;
  documentUrl: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  uploadedAt: string;
}

export interface AgeGroupRule {
  id: string;
  code: string;
  name: AgeGroup;
  minAge: number; // inclusive
  maxAge: number; // inclusive
  description: string;
}

export interface IDCardRecord {
  id: string;
  skaterId: string;
  registrationNumber: string;
  issueDate: string;
  validityUntil: string;
  isActive: boolean;
  deactivatedAt?: string;
  deactivationReason?: string;
}

export interface Skater {
  id: string;
  registrationNumber: string;
  applicationNumber?: string;
  bibNumber?: string; // Permanent Chest No / BIB Number for all matches & tournaments
  name: string;
  fatherName?: string;
  motherName?: string;
  fatherMotherName: string;
  dob: string;
  age?: number;
  gender: Gender;
  ageGroup: AgeGroup;
  mobile: string;
  email: string;
  address: string;
  districtId: string;
  districtName: string;
  clubId: string;
  clubName: string;
  coachName?: string;
  discipline: SkatingDiscipline;
  category: 'Amateur' | 'State' | 'National';
  bloodGroup?: BloodGroup;
  photoUrl: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  documents?: SkaterDocument[];
  validityUntil: string;
  status: RegistrationStatus;
  idCardActive?: boolean;
  idCardGeneratedAt?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  accountStatus?: 'uninvited' | 'pending' | 'invited' | 'active' | 'suspended';
  emailStatus?: 'pending' | 'sent' | 'delivered' | 'failed';
  userId?: string;
  registrationPdfUrl?: string;
  pdfGeneratedAt?: string;
  pdfVersion?: number;
  authUserEmail?: string;
  loginId?: string;
  tempPassword?: string;
  mustChangePassword?: boolean;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  key: 'registration_received' | 'registration_under_review' | 'registration_approved' | 'registration_rejected' | 'password_reset';
  nameEn: string;
  nameHi: string;
  subjectEn: string;
  subjectHi: string;
  bodyEn: string;
  bodyHi: string;
  variables: string[];
}

export interface EmailLog {
  id: string;
  recipient: string;
  emailType: string;
  subject: string;
  sentAt: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  error?: string;
  skaterId?: string;
  applicationNumber?: string;
  payload?: any;
}

export type TournamentStatus = 'Upcoming' | 'Live' | 'Completed';

export interface Tournament {
  id: string;
  tournamentNumber: string;
  nameEn: string;
  nameHi: string;
  venue: string;
  districtName: string;
  startDate: string;
  endDate: string;
  lastDate?: string; // Last Date for Registration (रजिस्ट्रेशन की अंतिम तिथि)
  maxEventsPerSkater?: number; // Default maximum allowed events per skater for this tournament (e.g. 2 or 3)
  ageGroupEventLimits?: Record<string, number>; // Specific limit per Age Group (e.g. Tiny Tots: 2, Junior: 3)
  disciplineEventLimits?: Record<string, number>; // Specific limit per Discipline (e.g. Speed Adjustable: 2, Speed Quad: 3)
  disciplineAgeGroupEventLimits?: Record<string, Record<string, number>>; // Matrix limit: [Discipline][AgeGroup] = maxEvents (e.g. Quad -> Under 6: 2, Quad -> Senior: 5)
  organizer: string;
  status: TournamentStatus;
  descriptionEn?: string;
  descriptionHi?: string;
}

export type QualificationFormat = 'DIRECT_FINAL' | 'HEATS_TO_FINAL' | 'HEATS_SEMI_FINAL';
export type QualificationSource = 'HEAT_WINNER' | 'QUALIFIED_TIME' | 'SEMI_FINAL' | 'MANUAL';

export type RaceStatus = 'NOT_STARTED' | 'READY' | 'LIVE' | 'FINISHED' | 'RESULT_SUBMITTED' | 'APPROVED' | 'PUBLISHED' | 'CANCELLED' | 'Scheduled' | 'Ready' | 'Live' | 'Finished' | 'Cancelled';
export type ScoringMethod = 'TIMING' | 'SCORE' | 'MANUAL';
export type ParticipantStatus = 'VALID' | 'DNS' | 'DNF' | 'DSQ';
export type ApprovalStatus = 'Draft' | 'Submitted' | 'Reviewed' | 'Published' | 'Locked';

export interface TournamentEvent {
  id: string;
  tournamentId: string;
  discipline: SkatingDiscipline;
  ageGroup: AgeGroup;
  gender: Gender;
  distance: string; // e.g. '500m', '1000m Lap', '3000m Point-to-Point'
  eventName?: string;
  raceNumber?: string;
  heatCount?: number;
  maxParticipants?: number;
  scoringMethod?: ScoringMethod;
  qualificationFormat?: QualificationFormat;
  finalBoxes?: number;
}

export interface Race {
  id: string;
  tournamentId: string;
  eventId: string;
  raceNumber: string;
  heatNumber: number;
  discipline: SkatingDiscipline;
  ageGroup: AgeGroup;
  gender: Gender;
  distance: string;
  maxParticipants: number;
  scheduledStartTime: string;
  status: RaceStatus;
  scoringMethod: ScoringMethod;
  qualificationFormat?: QualificationFormat;
  finalBoxes?: number;
  createdAt?: string;
}

export interface RaceParticipant {
  id: string;
  raceId: string;
  tournamentId: string;
  eventId: string;
  skaterId: string;
  skaterName: string;
  registrationNumber: string;
  bibNumber: string;
  gender: Gender;
  ageGroup: AgeGroup;
  clubName: string;
  districtName: string;
  laneNumber: number;
  heatNumber: number;
  status?: ParticipantStatus;
  qualificationSource?: QualificationSource;
  qualificationLabel?: string;
}

export interface RaceResult {
  id: string;
  tournamentId: string;
  eventId: string;
  raceId: string;
  participantId?: string;
  skaterId: string;
  skaterName: string;
  registrationNumber: string;
  districtName: string;
  clubName: string;
  bibNumber: string;
  discipline?: string;
  ageGroup?: string;
  gender?: string;
  rawTiming: string;
  penaltySeconds: number;
  finalTiming: string;
  score: number;
  position: number;
  points: number;
  medal: Medal;
  status: ParticipantStatus;
  approvalStatus: ApprovalStatus;
  remarks?: string;
  tieStatus?: boolean;
  tieBreakMethod?: string;
  changedBy?: string;
  changedAt?: string;
  changeReason?: string;
  qualificationSource?: QualificationSource;
  qualificationLabel?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'CANCELLED';

export interface PaymentSettings {
  id: string;
  upiId: string;
  upiDisplayName: string;
  qrCodeUrl: string;
  paymentInstructions: string;
  supportPhone: string;
  supportEmail: string;
  paymentEnabled: boolean;
  defaultTournamentFee: number;
  updatedAt: string;
}

export interface TournamentPayment {
  id: string;
  registrationId: string;
  skaterId: string;
  skaterName?: string;
  registrationNumber?: string;
  districtName?: string;
  clubName?: string;
  tournamentId: string;
  tournamentName?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  upiId: string;
  utrNumber: string;
  transactionDate: string;
  screenshotStoragePath?: string;
  screenshotUrl?: string;
  status: PaymentStatus;
  rejectionReason?: string;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  eventId: string;
  skaterId: string;
  skaterName: string;
  registrationNumber: string;
  districtName: string;
  clubName: string;
  discipline: SkatingDiscipline;
  ageGroup: AgeGroup;
  gender: Gender;
  distance: string;
  bibNumber?: string;
  heatNumber?: number;
  laneNumber?: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentStatus?: 'UNPAID' | 'PENDING' | 'PAID' | 'REJECTED';
  feeAmount?: number;
  registeredAt: string;
}

export interface TournamentResult {
  id: string;
  tournamentId: string;
  eventId: string;
  raceId?: string;
  skaterId: string;
  skaterName: string;
  registrationNumber: string;
  districtName: string;
  clubName: string;
  bibNumber: string;
  discipline?: string;
  ageGroup?: string;
  gender?: string;
  timing: string; // e.g. "00:48.21"
  rawTiming?: string;
  penaltySeconds?: number;
  score?: number;
  position: number;
  points: number;
  medal?: 'Gold' | 'Silver' | 'Bronze' | 'None';
  status?: ParticipantStatus;
  approvalStatus?: ApprovalStatus;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ScoreboardDisplayMode = 
  | 'MODE_1_CURRENT_RACE'
  | 'MODE_2_EVENT_RESULTS'
  | 'MODE_3_MEDAL_TALLY'
  | 'MODE_4_CLUB_RANKING'
  | 'MODE_5_DISTRICT_RANKING'
  | 'MODE_6_STATE_RANKING'
  | 'MODE_7_TOURNAMENT_HIGHLIGHTS';

export interface ScoreboardState {
  tournamentId: string;
  eventId?: string;
  raceId?: string;
  mode: ScoreboardDisplayMode;
  customTitle?: string;
  customSubtitle?: string;
  tickerText?: string;
  autoRotate?: boolean;
  autoRotateIntervalSeconds?: number;
  rotationModes?: ScoreboardDisplayMode[];
  customMessage?: string;
  isLiveBroadcasting?: boolean;
  updatedAt: string;
}

export interface PointRule {
  position: number;
  points: number;
  label: string;
}

export interface IndividualRank {
  rank: number;
  skaterId: string;
  skaterName: string;
  registrationNumber: string;
  districtName: string;
  clubName: string;
  discipline: SkatingDiscipline;
  totalPoints: number;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
  tournamentsPlayed: number;
}

export interface EntityRank {
  rank: number;
  id: string;
  name: string;
  districtName?: string;
  totalPoints: number;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
  skaterCount: number;
}

export type Medal = 'Gold' | 'Silver' | 'Bronze' | 'None';

export type CertificateStatus = 'Draft' | 'Generated' | 'Issued' | 'Verified' | 'Revoked';
export type CertificateType = 'Merit' | 'Participation' | 'Official' | 'Custom';

export interface Certificate {
  id: string;
  certificateNumber: string;
  skaterId: string;
  skaterName: string;
  registrationNumber: string;
  fatherMotherName: string;
  tournamentId?: string;
  tournamentName: string;
  tournamentNumber?: string;
  eventId?: string;
  eventName: string;
  discipline: SkatingDiscipline;
  ageGroup: AgeGroup;
  gender: Gender;
  position: string;
  score?: string;
  timing?: string;
  clubName: string;
  districtName: string;
  certificateDate: string;
  issueDate: string;
  status: CertificateStatus;
  verificationCode: string;
  certificateType: CertificateType;
  pdfUrl?: string;
  revokedReason?: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CertificateTemplate {
  id: string;
  title: string;
  logoUrl: string;
  backgroundUrl?: string;
  headerText: string;
  subHeaderText: string;
  presidentName: string;
  presidentTitle: string;
  presidentSignatureUrl: string;
  secretaryName: string;
  secretaryTitle: string;
  secretarySignatureUrl: string;
  officialSealUrl: string;
  numberPrefix: string;
  footerText: string;
  primaryColor: string;
  secondaryColor: string;
  isDefault: boolean;
  updatedAt: string;
}

export interface CSVImportCertificateRow {
  Certificate_No: string;
  Name: string;
  Father_Name: string;
  Registration_No: string;
  Tournament_Name: string;
  Tournament_Number: string;
  Event: string;
  Discipline: string;
  Age_Group: string;
  Gender: string;
  Position: string;
  Score: string;
  Timing: string;
  Club: string;
  District: string;
  Certificate_Date: string;
}

export interface Announcement {
  id: string;
  titleEn: string;
  titleHi: string;
  contentEn: string;
  contentHi: string;
  category: 'Tournament' | 'Registration' | 'Notice' | 'General';
  date: string;
  attachmentUrl?: string;
  imageUrl?: string;
  isPinned?: boolean;
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  titleEn?: string;
  titleHi?: string;
  category: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaType?: 'photo' | 'video';
  date: string;
  isPublished?: boolean;
}

export interface HeroSlide {
  id: string;
  desktopImage: string;
  mobileImage?: string;
  videoUrl?: string;
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  primaryBtnTextEn: string;
  primaryBtnTextHi: string;
  primaryBtnUrl: string;
  secondaryBtnTextEn: string;
  secondaryBtnTextHi: string;
  secondaryBtnUrl: string;
  overlayStrength: number;
  active: boolean;
  order: number;
}

export interface HomeSection {
  id: string;
  titleEn: string;
  titleHi: string;
  subtitleEn: string;
  subtitleHi: string;
  enabled: boolean;
  order: number;
  config?: Record<string, any>;
}

export interface WebsiteContent {
  id: string;
  key: string;
  section: string;
  titleEn: string;
  titleHi: string;
  contentEn: string;
  contentHi: string;
  imageUrl?: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  category: 'hero' | 'gallery' | 'news' | 'general' | 'club' | 'district';
  uploadedAt: string;
}

export interface CouncilMember {
  id: string;
  nameEn: string;
  nameHi?: string;
  designationEn: string;
  designationHi?: string;
  photoUrl: string;
  bioEn?: string;
  bioHi?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface DisciplineItem {
  id: string;
  titleEn: string;
  titleHi?: string;
  subtitleEn: string;
  subtitleHi?: string;
  descriptionEn: string;
  descriptionHi?: string;
  imageUrl: string;
  eventsEn: string[];
  eventsHi?: string[];
  isActive?: boolean;
  displayOrder?: number;
}

export interface WebsiteSettings {
  id: string;
  websiteNameEn: string;
  websiteNameHi: string;
  logoUrl: string;
  logoSize?: number; // Size in pixels for header/branding logo (e.g., 80 to 200)
  faviconUrl?: string;
  primaryEmail: string;
  primaryPhone: string;
  addressEn: string;
  addressHi: string;
  defaultLanguage: 'en' | 'hi';
  maintenanceMode: boolean;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    whatsapp?: string;
  };
  copyrightTextEn: string;
  copyrightTextHi: string;
  associationDescEn?: string;
  associationDescHi?: string;
  badge1Text?: string;
  badge2Text?: string;
  skatingDisciplines?: string[];
  secretariatTitleEn?: string;
  secretariatTitleHi?: string;
  footerTaglineEn?: string;
  footerTaglineHi?: string;
  googleMapUrl?: string;
  officeHoursEn?: string;
  officeHoursHi?: string;
  liveMatchUrl?: string;
  liveMatchTitleEn?: string;
  liveMatchTitleHi?: string;
  isLiveMatchActive?: boolean;
}

export interface CSVImportResult {
  totalRows: number;
  validRows: Skater[];
  invalidRows: { rowNumber: number; reason: string; data: Record<string, string> }[];
  duplicateCount: number;
}

export interface AdminCredentials {
  username: string;
  email: string;
  password: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  suggestions?: string[];
  source?: 'gemini' | 'fallback';
}

export interface CommunityChatPost {
  id: string;
  authorName: string;
  authorRole: 'skater' | 'coach' | 'parent' | 'official' | 'guest';
  district: string;
  clubName?: string;
  message: string;
  timestamp: string;
  likes: number;
  userLiked?: boolean;
  category?: 'general' | 'tournament' | 'training' | 'inquiry' | 'achievement';
  repliesCount?: number;
  isPinned?: boolean;
  isOfficial?: boolean;
  isVerified?: boolean;
}

export interface ChatBoardSettings {
  welcomeMessageEn: string;
  welcomeMessageHi: string;
  quickQuestionsEn: string[];
  quickQuestionsHi: string[];
  whatsappSupportNumber: string;
  supportPhone: string;
  supportPhone2?: string;
  supportEmail: string;
  supportHoursEn: string;
  supportHoursHi: string;
  aiBotEnabled: boolean;
  communityBoardEnabled: boolean;
  allowGuestPosts: boolean;
  pinnedAnnouncementEn?: string;
  pinnedAnnouncementHi?: string;
  aiKnowledgeNotesEn?: string;
  aiKnowledgeNotesHi?: string;

  // Helpdesk Modal / View Editable Fields
  helpdeskSecretariatTitle?: string;
  helpdeskSecretariatDesc?: string;
  helpdeskWhatsappTitle?: string;
  helpdeskWhatsappDesc?: string;
  helpdeskLucknowTitle?: string;
  helpdeskLucknowAddress?: string;
  helpdeskLucknowPhones?: string;
  helpdeskWesternTitle?: string;
  helpdeskWesternAddress?: string;
  helpdeskWesternPhone?: string;
  helpdeskEmailTitle?: string;
  helpdeskEmailDesc?: string;

  updatedAt?: string;
}

