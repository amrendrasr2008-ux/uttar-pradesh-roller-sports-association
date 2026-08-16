import { maskSkatersForOperator } from './operatorMask';
import { 
  District, 
  Club, 
  Skater, 
  Tournament, 
  TournamentEvent, 
  TournamentRegistration, 
  TournamentResult, 
  PointRule, 
  Certificate, 
  CertificateTemplate,
  Announcement, 
  GalleryItem,
  IndividualRank,
  EntityRank,
  AgeGroupRule,
  SkaterDocument,
  IDCardRecord,
  RegistrationStatus,
  UserRole,
  Race,
  RaceParticipant,
  RaceResult,
  RaceStatus,
  ScoringMethod,
  ParticipantStatus,
  ApprovalStatus,
  ScoreboardDisplayMode,
  ScoreboardState,
  HeroSlide,
  HomeSection,
  WebsiteContent,
  MediaItem,
  CouncilMember,
  WebsiteSettings,
  DisciplineItem,
  EmailTemplate,
  EmailLog,
  AdminCredentials,
  AgeGroup,
  PaymentSettings,
  TournamentPayment,
  PaymentStatus,
  CommunityChatPost,
  ChatBoardSettings
} from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { generateRegistrationNumber, generateApplicationNumber } from './regNumber';
import { defaultAgeGroupRules, getAgeGroupForDob, calculateAge } from './ageGroupRules';
import { 
  getIdbItem, 
  setIdbItem, 
  safeSetLocalStorage, 
  cleanupLegacyAndOversizeLocalStorage 
} from './idbStorage';

const DB_KEY_PREFIX = 'uprsa_db_v1_';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(DB_KEY_PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  // 1. Asynchronously persist to high-quota IndexedDB
  setIdbItem(key, value).catch(() => {});

  // 2. Safely persist sanitized/compact representation to localStorage without exceeding quota
  safeSetLocalStorage(DB_KEY_PREFIX + key, value);
}

// Initial UP Districts
const defaultDistricts: District[] = [
  { 
    id: 'dist-1', 
    code: 'LKO', 
    nameEn: 'Lucknow District Roller Skating Association', 
    nameHi: 'लखनऊ जिला रोलर स्केटिंग संघ', 
    zone: 'Central', 
    address: 'K.D. Singh Babu Stadium Skating Complex, Hazratganj, Lucknow, UP - 226001',
    logoUrl: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=300&auto=format&fit=crop&q=80',
    presidentName: 'Rajeshwar Singh', 
    presidentPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    presidentPhone: '+91 94150 11223',
    presidentEmail: 'president.lko@uprsa.org',
    presidentAddress: '12/A Park Road, Civil Lines, Lucknow',
    secretaryName: 'Anoop Srivastava', 
    secretaryPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    secretaryPhone: '+91 94150 11224',
    secretaryEmail: 'secretary.lko@uprsa.org',
    secretaryAddress: '45-B Gokhale Marg, Hazratganj, Lucknow',
    treasurerName: 'V. K. Sharma',
    treasurerPhotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    treasurerPhone: '+91 94150 11226',
    treasurerEmail: 'treasurer.lko@uprsa.org',
    treasurerAddress: '78 Mahanagar Extension, Lucknow',
    contactPhone: '+91 94150 11223', 
    contactEmail: 'lucknow@uprsa.org', 
    skaterCount: 48,
    executiveCommittee: [
      { id: 'lko-exec-1', districtId: 'dist-1', nameEn: 'Rajeshwar Singh', nameHi: 'राजेश्वर सिंह', designationEn: 'President', designationHi: 'अध्यक्ष', contactPhone: '+91 94150 11223', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
      { id: 'lko-exec-2', districtId: 'dist-1', nameEn: 'Anoop Srivastava', nameHi: 'अनूप श्रीवास्तव', designationEn: 'General Secretary', designationHi: 'महासचिव', contactPhone: '+91 94150 11224', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
      { id: 'lko-exec-3', districtId: 'dist-1', nameEn: 'Dr. Sanjeev Kumar', nameHi: 'डॉ. संजीव कुमार', designationEn: 'Vice President', designationHi: 'उपाध्यक्ष', contactPhone: '+91 94150 11225', photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80' },
      { id: 'lko-exec-4', districtId: 'dist-1', nameEn: 'V. K. Sharma', nameHi: 'वी. के. शर्मा', designationEn: 'Treasurer', designationHi: 'कोषाध्यक्ष', contactPhone: '+91 94150 11226', photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
      { id: 'lko-exec-5', districtId: 'dist-1', nameEn: 'Anita Verma', nameHi: 'अनीता वर्मा', designationEn: 'Joint Secretary', designationHi: 'संयुक्त सचिव', contactPhone: '+91 94150 11227', photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80' }
    ]
  },
  { 
    id: 'dist-2', 
    code: 'GBN', 
    nameEn: 'Gautam Buddha Nagar (Noida) Roller Sports Association', 
    nameHi: 'गौतम बुद्ध नगर (नोएडा) रोलर स्पोर्ट्स संघ', 
    zone: 'Western', 
    address: 'Sector 21-A Noida Sports Complex, Stadium Road, Noida - 201301',
    logoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=300&auto=format&fit=crop&q=80',
    presidentName: 'Vikramaditya Rao', 
    presidentPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    presidentPhone: '+91 98110 33445',
    presidentEmail: 'president.gbn@uprsa.org',
    presidentAddress: 'B-14 Sector 15, Noida, UP',
    secretaryName: 'Sanjay Tyagi', 
    secretaryPhotoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    secretaryPhone: '+91 98110 33446',
    secretaryEmail: 'secretary.gbn@uprsa.org',
    secretaryAddress: 'A-89 Sector 62, Noida, UP',
    treasurerName: 'Rakesh Nagar',
    treasurerPhotoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
    treasurerPhone: '+91 98110 33447',
    treasurerEmail: 'treasurer.gbn@uprsa.org',
    treasurerAddress: 'C-34 Greater Noida, UP',
    contactPhone: '+91 98110 33445', 
    contactEmail: 'noida@uprsa.org', 
    skaterCount: 62,
    executiveCommittee: [
      { id: 'gbn-exec-1', districtId: 'dist-2', nameEn: 'Vikramaditya Rao', nameHi: 'विक्रमादित्य राव', designationEn: 'President', designationHi: 'अध्यक्ष', contactPhone: '+91 98110 33445', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
      { id: 'gbn-exec-2', districtId: 'dist-2', nameEn: 'Sanjay Tyagi', nameHi: 'संजय त्यागी', designationEn: 'General Secretary', designationHi: 'महासचिव', contactPhone: '+91 98110 33446', photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80' },
      { id: 'gbn-exec-3', districtId: 'dist-2', nameEn: 'Rakesh Nagar', nameHi: 'राकेश नागर', designationEn: 'Treasurer', designationHi: 'कोषाध्यक्ष', contactPhone: '+91 98110 33447', photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80' }
    ]
  },
  { 
    id: 'dist-3', 
    code: 'KNP', 
    nameEn: 'Kanpur Nagar District Roller Sports Association', 
    nameHi: 'कानपुर नगर जिला रोलर स्पोर्ट्स संघ', 
    zone: 'Central', 
    address: 'Green Park Stadium Rink Building, Civil Lines, Kanpur - 208001',
    logoUrl: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=300&auto=format&fit=crop&q=80',
    presidentName: 'Mahendra Kapoor', 
    presidentPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    presidentPhone: '+91 93361 55667',
    presidentEmail: 'president.knp@uprsa.org',
    presidentAddress: '112 Swaroop Nagar, Kanpur',
    secretaryName: 'Ramesh Chaurasia', 
    secretaryPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    secretaryPhone: '+91 93361 55668',
    secretaryEmail: 'secretary.knp@uprsa.org',
    secretaryAddress: '88 Tilak Nagar, Kanpur',
    treasurerName: 'O. P. Gupta',
    treasurerPhotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    treasurerPhone: '+91 93361 55669',
    treasurerEmail: 'treasurer.knp@uprsa.org',
    treasurerAddress: '54 Kakadeo, Kanpur',
    contactPhone: '+91 93361 55667', 
    contactEmail: 'kanpur@uprsa.org', 
    skaterCount: 39,
    executiveCommittee: [
      { id: 'knp-exec-1', districtId: 'dist-3', nameEn: 'Mahendra Kapoor', nameHi: 'महेंद्र कपूर', designationEn: 'President', designationHi: 'अध्यक्ष', contactPhone: '+91 93361 55667' },
      { id: 'knp-exec-2', districtId: 'dist-3', nameEn: 'Ramesh Chaurasia', nameHi: 'रमेश चौरसिया', designationEn: 'General Secretary', designationHi: 'महासचिव', contactPhone: '+91 93361 55668' }
    ]
  },
  { 
    id: 'dist-4', 
    code: 'VNS', 
    nameEn: 'Varanasi District Roller Sports Association', 
    nameHi: 'वाराणसी जिला रोलर स्पोर्ट्स संघ', 
    zone: 'Eastern', 
    address: 'Dr. Sampurnanand Sports Stadium, Sigra, Varanasi - 221002',
    logoUrl: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=300&auto=format&fit=crop&q=80',
    presidentName: 'Pandit Somnath Mishra', 
    presidentPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    presidentPhone: '+91 94505 77889',
    presidentEmail: 'president.vns@uprsa.org',
    presidentAddress: 'B-21/80 Kamachha, Varanasi',
    secretaryName: 'Praveen Yadav', 
    secretaryPhotoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    secretaryPhone: '+91 94505 77890',
    secretaryEmail: 'secretary.vns@uprsa.org',
    secretaryAddress: 'C-14/110 Lanka, Varanasi',
    treasurerName: 'Shyam Sundar Sharma',
    treasurerPhotoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
    treasurerPhone: '+91 94505 77891',
    treasurerEmail: 'treasurer.vns@uprsa.org',
    treasurerAddress: 'D-32 Orderly Bazar, Varanasi',
    contactPhone: '+91 94505 77889', 
    contactEmail: 'varanasi@uprsa.org', 
    skaterCount: 31,
    executiveCommittee: [
      { id: 'vns-exec-1', districtId: 'dist-4', nameEn: 'Pandit Somnath Mishra', nameHi: 'पंडित सोमनाथ मिश्रा', designationEn: 'President', designationHi: 'अध्यक्ष', contactPhone: '+91 94505 77889' },
      { id: 'vns-exec-2', districtId: 'dist-4', nameEn: 'Praveen Yadav', nameHi: 'प्रवीण यादव', designationEn: 'General Secretary', designationHi: 'महासचिव', contactPhone: '+91 94505 77890' }
    ]
  },
  { id: 'dist-5', code: 'GZB', nameEn: 'Ghaziabad Roller Sports Association', nameHi: 'गाजियाबाद रोलर स्पोर्ट्स संघ', zone: 'Western', address: 'Mahamaya Sports Stadium, Raj Nagar, Ghaziabad - 201002', logoUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&auto=format&fit=crop&q=80', presidentName: 'Dharmendra Sharma', presidentPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', presidentPhone: '+91 98712 99001', secretaryName: 'Suresh Nagar', secretaryPhotoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80', secretaryPhone: '+91 98712 99002', treasurerName: 'Sunil Goel', treasurerPhotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80', treasurerPhone: '+91 98712 99003', contactPhone: '+91 98712 99001', contactEmail: 'ghaziabad@uprsa.org', skaterCount: 42 },
  { id: 'dist-6', code: 'AGR', nameEn: 'Agra District Roller Skating Association', nameHi: 'आगरा जिला रोलर स्केटिंग संघ', zone: 'Western', address: 'Eklavya Sports Stadium, MG Road, Agra - 282001', logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=300&auto=format&fit=crop&q=80', presidentName: 'Dr. B. K. Bansal', presidentPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', presidentPhone: '+91 94122 11234', secretaryName: 'Kapil Gautam', secretaryPhotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80', secretaryPhone: '+91 94122 11235', treasurerName: 'Deepak Agrawal', treasurerPhotoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80', treasurerPhone: '+91 94122 11236', contactPhone: '+91 94122 11234', contactEmail: 'agra@uprsa.org', skaterCount: 27 },
  { id: 'dist-7', code: 'PRJ', nameEn: 'Prayagraj District Roller Sports Association', nameHi: 'प्रयागराज जिला रोलर स्पोर्ट्स संघ', zone: 'Eastern', address: 'Madan Mohan Malaviya Stadium, Prayagraj - 211002', logoUrl: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=300&auto=format&fit=crop&q=80', presidentName: 'Justice R. K. Dwivedi', presidentPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', presidentPhone: '+91 94152 44556', secretaryName: 'Alok Pandey', secretaryPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', secretaryPhone: '+91 94152 44557', treasurerName: 'Sanjay Mishra', treasurerPhotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80', treasurerPhone: '+91 94152 44558', contactPhone: '+91 94152 44556', contactEmail: 'prayagraj@uprsa.org', skaterCount: 35 },
  { id: 'dist-8', code: 'MRT', nameEn: 'Meerut District Roller Skating Association', nameHi: 'मेरठ जिला रोलर स्केटिंग संघ', zone: 'Western', address: 'Kailash Prakash Sports Stadium, Meerut - 250001', logoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=300&auto=format&fit=crop&q=80', presidentName: 'Col. Jasbir Singh', presidentPhotoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80', presidentPhone: '+91 98370 66778', secretaryName: 'Vikas Tomar', secretaryPhotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80', secretaryPhone: '+91 98370 66779', treasurerName: 'Rajiv Bali', treasurerPhotoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80', treasurerPhone: '+91 98370 66780', contactPhone: '+91 98370 66778', contactEmail: 'meerut@uprsa.org', skaterCount: 29 },
  { id: 'dist-9', code: 'GKP', nameEn: 'Gorakhpur District Roller Sports Association', nameHi: 'गोरखपुर जिला रोलर स्पोर्ट्स संघ', zone: 'Eastern', address: 'Regional Sports Stadium, Gorakhpur - 273001', logoUrl: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=300&auto=format&fit=crop&q=80', presidentName: 'Rameshwar Nath', presidentPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80', presidentPhone: '+91 94153 88990', secretaryName: 'Dr. Sunil Singh', secretaryPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80', secretaryPhone: '+91 94153 88991', treasurerName: 'K. P. Srivastava', treasurerPhotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80', treasurerPhone: '+91 94153 88992', contactPhone: '+91 94153 88990', contactEmail: 'gorakhpur@uprsa.org', skaterCount: 22 },
  { id: 'dist-10', code: 'BLY', nameEn: 'Bareilly District Roller Sports Association', nameHi: 'बरेली जिला रोलर स्पोर्ट्स संघ', zone: 'Rohilkhand', address: 'Sports Stadium, Civil Lines, Bareilly - 243001', logoUrl: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=300&auto=format&fit=crop&q=80', presidentName: 'Subhash Saxena', secretaryName: 'Mohit Agarwal', treasurerName: 'Rajesh Gangwar', contactPhone: '+91 94121 22334', contactEmail: 'bareilly@uprsa.org', skaterCount: 18 },
  { id: 'dist-11', code: 'ALG', nameEn: 'Aligarh District Roller Sports Association', nameHi: 'अलीगढ़ जिला रोलर स्पोर्ट्स संघ', zone: 'Western', address: 'AMU Pavilion / Sports Complex, Aligarh - 202001', logoUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&auto=format&fit=crop&q=80', presidentName: 'Dr. Tariq Mansoor', secretaryName: 'Ashish Varshney', treasurerName: 'Rahul Sharma', contactPhone: '+91 94123 44556', contactEmail: 'aligarh@uprsa.org', skaterCount: 15 },
  { id: 'dist-12', code: 'AYD', nameEn: 'Ayodhya District Roller Sports Association', nameHi: 'अयोध्या जिला रोलर स्पोर्ट्स संघ', zone: 'Central', address: 'Sports Stadium, Ayodhya - 224123', logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=300&auto=format&fit=crop&q=80', presidentName: 'Hanuman Prasad', secretaryName: 'Rakesh Mishra', treasurerName: 'Vinod Verma', contactPhone: '+91 94151 66778', contactEmail: 'ayodhya@uprsa.org', skaterCount: 20 },
];

// Initial Clubs
const defaultClubs: Club[] = [
  { id: 'club-1', code: 'LRSA', nameEn: 'Lucknow Roller Skating Academy', nameHi: 'लखनऊ रोलर स्केटिंग अकादमी', districtId: 'dist-1', districtName: 'Lucknow', coachName: 'Coach Amit Rathi', presidentName: 'Dr. V.K. Shukla', secretaryName: 'Amit Rathi', contactPhone: '+91 98390 11111', alternatePhone: '+91 94150 11112', email: 'lrsa@gmail.com', address: 'KD Singh Babu Stadium Rink, Lucknow', registrationNo: 'UPRSA/CLUB/001', logoUrl: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=200&auto=format&fit=crop&q=80', status: 'approved', skaterCount: 28, totalPoints: 145 },
  { id: 'club-2', code: 'NSSC', nameEn: 'Noida Speed Skaters Club', nameHi: 'नोएडा स्पीड स्केटर्स क्लब', districtId: 'dist-2', districtName: 'Gautam Buddha Nagar (Noida)', coachName: 'Coach Deepali Shah', presidentName: 'Sunil Malhotra', secretaryName: 'Deepali Shah', contactPhone: '+91 98100 22222', alternatePhone: '+91 98100 22223', email: 'noida.speed@gmail.com', address: 'Sector 21-A Sports Complex, Noida', registrationNo: 'UPRSA/CLUB/002', logoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=200&auto=format&fit=crop&q=80', status: 'approved', skaterCount: 34, totalPoints: 182 },
  { id: 'club-3', code: 'KERC', nameEn: 'Kanpur Express Roller Club', nameHi: 'कानपुर एक्सप्रेस रोलर क्लब', districtId: 'dist-3', districtName: 'Kanpur Nagar', coachName: 'Coach Tarun Kanti', presidentName: 'Ramesh Chander', secretaryName: 'Tarun Kanti', contactPhone: '+91 93360 33333', alternatePhone: '+91 93360 33334', email: 'kanpurexpress@gmail.com', address: 'Green Park Stadium, Kanpur', registrationNo: 'UPRSA/CLUB/003', logoUrl: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=200&auto=format&fit=crop&q=80', status: 'approved', skaterCount: 22, totalPoints: 98 },
  { id: 'club-4', code: 'KWSA', nameEn: 'Kashi Wheels Skating Academy', nameHi: 'काशी व्हील्स स्केटिंग अकादमी', districtId: 'dist-4', districtName: 'Varanasi', coachName: 'Coach Shivam Tripathy', presidentName: 'Pandit Gopal Das', secretaryName: 'Shivam Tripathy', contactPhone: '+91 94500 44444', alternatePhone: '+91 94500 44445', email: 'kashiwheels@gmail.com', address: 'Sigra Stadium, Varanasi', registrationNo: 'UPRSA/CLUB/004', logoUrl: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=200&auto=format&fit=crop&q=80', status: 'approved', skaterCount: 19, totalPoints: 76 },
  { id: 'club-5', code: 'TCRC', nameEn: 'Taj City Roller Sports Club', nameHi: 'ताज सिटी रोलर स्पोर्ट्स क्लब', districtId: 'dist-6', districtName: 'Agra', coachName: 'Coach Manish Jain', presidentName: 'Ajay Gupta', secretaryName: 'Manish Jain', contactPhone: '+91 94120 55555', alternatePhone: '+91 94120 55556', email: 'tajroller@gmail.com', address: 'Eklavya Sports Stadium, Agra', registrationNo: 'UPRSA/CLUB/005', logoUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80', status: 'approved', skaterCount: 15, totalPoints: 62 },
  { id: 'club-6', code: 'GIA', nameEn: 'Ghaziabad Inline Academy', nameHi: 'गाजियाबाद इनलाइन अकादमी', districtId: 'dist-5', districtName: 'Ghaziabad', coachName: 'Coach Nitin Choudhary', presidentName: 'Suresh Tyagi', secretaryName: 'Nitin Choudhary', contactPhone: '+91 98710 66666', alternatePhone: '+91 98710 66667', email: 'ghaziabadinline@gmail.com', address: 'Mahamaya Sports Stadium, Ghaziabad', registrationNo: 'UPRSA/CLUB/006', logoUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&auto=format&fit=crop&q=80', status: 'approved', skaterCount: 26, totalPoints: 110 },
];

// Initial Skaters
const defaultSkaters: Skater[] = [
  {
    id: 'skater-vns-01006',
    registrationNumber: 'UPRSA-VNS-01006',
    applicationNumber: 'UPRSA-VNS-01006',
    bibNumber: '1006',
    loginId: 'UPRSA-VNS-01006',
    tempPassword: '123456',
    name: 'Aarav Sharma',
    fatherMotherName: 'Sanjay Sharma',
    dob: '2015-05-14',
    gender: 'Male',
    ageGroup: '10-12 Years',
    mobile: '+91 98390 12345',
    email: 'aarav.sharma@gmail.com',
    address: 'B-42, Lanka, Varanasi, UP',
    districtId: 'dist-4',
    districtName: 'Varanasi',
    clubId: 'club-4',
    clubName: 'Kashi Wheels Skating Academy',
    discipline: 'Speed Inline',
    category: 'State',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    emergencyContactName: 'Sanjay Sharma',
    emergencyContactPhone: '+91 98390 12345',
    validityUntil: '2027-03-31',
    status: 'active',
    createdAt: '2026-01-10'
  },
  {
    id: 'skater-1',
    registrationNumber: 'UPRSA/2026/01001',
    bibNumber: '1001',
    name: 'Aarav Sharma',
    fatherMotherName: 'Sanjay Sharma',
    dob: '2013-05-14',
    gender: 'Male',
    ageGroup: '10-12 Years',
    mobile: '+91 98390 12345',
    email: 'aarav.sharma@gmail.com',
    address: 'B-42, Gomti Nagar, Lucknow, UP',
    districtId: 'dist-1',
    districtName: 'Lucknow',
    clubId: 'club-1',
    clubName: 'Lucknow Roller Skating Academy',
    discipline: 'Speed Inline',
    category: 'State',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    emergencyContactName: 'Sanjay Sharma',
    emergencyContactPhone: '+91 98390 12345',
    validityUntil: '2027-03-31',
    status: 'active',
    createdAt: '2026-01-10'
  },
  {
    id: 'skater-2',
    registrationNumber: 'UPRSA/2026/01002',
    bibNumber: '1002',
    name: 'Ananya Verma',
    fatherMotherName: 'Rakesh Verma',
    dob: '2010-09-22',
    gender: 'Female',
    ageGroup: 'Junior (15-18 Years)',
    mobile: '+91 98100 54321',
    email: 'ananya.v@gmail.com',
    address: 'A-108, Sector 62, Noida, UP',
    districtId: 'dist-2',
    districtName: 'Gautam Buddha Nagar (Noida)',
    clubId: 'club-2',
    clubName: 'Noida Speed Skaters Club',
    discipline: 'Speed Quad',
    category: 'National',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    emergencyContactName: 'Rakesh Verma',
    emergencyContactPhone: '+91 98100 54321',
    validityUntil: '2027-03-31',
    status: 'active',
    createdAt: '2026-01-12'
  },
  {
    id: 'skater-3',
    registrationNumber: 'UPRSA/2026/01003',
    bibNumber: '1003',
    name: 'Kabir Singh',
    fatherMotherName: 'Gurpreet Singh',
    dob: '2005-03-18',
    gender: 'Male',
    ageGroup: 'Senior (18+ Years)',
    mobile: '+91 93360 98765',
    email: 'kabir.skate@gmail.com',
    address: '7/110, Swaroop Nagar, Kanpur, UP',
    districtId: 'dist-3',
    districtName: 'Kanpur Nagar',
    clubId: 'club-3',
    clubName: 'Kanpur Express Roller Club',
    discipline: 'Speed Inline',
    category: 'National',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    emergencyContactName: 'Gurpreet Singh',
    emergencyContactPhone: '+91 93360 98765',
    validityUntil: '2027-03-31',
    status: 'active',
    createdAt: '2026-01-15'
  },
  {
    id: 'skater-4',
    registrationNumber: 'UPRSA/2026/01004',
    bibNumber: '1004',
    name: 'Diya Patel',
    fatherMotherName: 'Harish Patel',
    dob: '2015-11-04',
    gender: 'Female',
    ageGroup: 'Cadet (10-12 Years)',
    mobile: '+91 94500 11223',
    email: 'diya.patel@gmail.com',
    address: 'C-12, Lanka, Varanasi, UP',
    districtId: 'dist-4',
    districtName: 'Varanasi',
    clubId: 'club-4',
    clubName: 'Kashi Wheels Skating Academy',
    discipline: 'Freestyle',
    category: 'State',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    emergencyContactName: 'Harish Patel',
    emergencyContactPhone: '+91 94500 11223',
    validityUntil: '2027-03-31',
    status: 'active',
    createdAt: '2026-01-18'
  },
  {
    id: 'skater-5',
    registrationNumber: 'UPRSA/2026/01005',
    bibNumber: '1005',
    name: 'Rohan Gupta',
    fatherMotherName: 'Manoj Gupta',
    dob: '2012-07-29',
    gender: 'Male',
    ageGroup: 'Sub-Junior (12-15 Years)',
    mobile: '+91 94120 99887',
    email: 'rohan.g@gmail.com',
    address: '45, Taj Ganj, Agra, UP',
    districtId: 'dist-6',
    districtName: 'Agra',
    clubId: 'club-5',
    clubName: 'Taj City Roller Sports Club',
    discipline: 'Speed Quad',
    category: 'Amateur',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    emergencyContactName: 'Manoj Gupta',
    emergencyContactPhone: '+91 94120 99887',
    validityUntil: '2027-03-31',
    status: 'active',
    createdAt: '2026-02-01'
  }
];

// Initial Tournaments
const defaultTournaments: Tournament[] = [
  {
    id: 'tour-1',
    tournamentNumber: 'UPRSA-TN-2026-01',
    nameEn: '38th UPRSA UP State Roller Skating Championship 2026',
    nameHi: '38वीं यूपीआरएसए उत्तर प्रदेश राज्य रोलर स्केटिंग चैम्पियनशिप 2026',
    venue: 'KD Singh Babu Stadium Synthetic Track, Lucknow',
    districtName: 'Lucknow',
    startDate: '2026-08-10',
    endDate: '2026-08-14',
    lastDate: '2026-08-08',
    maxEventsPerSkater: 2,
    ageGroupEventLimits: {
      'Tiny Tots (Under 6)': 2,
      'Tiny Tots (6-8 Years)': 2,
      'Cadet (8-10 Years)': 2,
      'Cadet (10-12 Years)': 2,
      'Sub-Junior (12-15 Years)': 3,
      'Junior (15-18 Years)': 3,
      'Senior (18+ Years)': 3,
      'Masters (35+ Years)': 3
    },
    disciplineEventLimits: {
      'Speed Adjustable': 2,
      'Speed Toy Inline': 2,
      'Speed Quad': 3,
      'Speed Inline': 3,
      'Artistic': 2,
      'Freestyle': 2,
      'Roller Hockey': 1,
      'Skateboarding': 1
    },
    disciplineAgeGroupEventLimits: {
      'Speed Quad': {
        'Tiny Tots (Under 6)': 2,
        'Tiny Tots (6-8 Years)': 2,
        'Cadet (8-10 Years)': 2,
        'Cadet (10-12 Years)': 2,
        'Sub-Junior (12-15 Years)': 3,
        'Junior (15-18 Years)': 3,
        'Senior (18+ Years)': 3,
        'Masters (35+ Years)': 3
      },
      'Speed Inline': {
        'Tiny Tots (Under 6)': 2,
        'Tiny Tots (6-8 Years)': 2,
        'Cadet (8-10 Years)': 2,
        'Cadet (10-12 Years)': 2,
        'Sub-Junior (12-15 Years)': 3,
        'Junior (15-18 Years)': 3,
        'Senior (18+ Years)': 3,
        'Masters (35+ Years)': 3
      },
      'Speed Adjustable': {
        'Tiny Tots (Under 6)': 2,
        'Tiny Tots (6-8 Years)': 2,
        'Cadet (8-10 Years)': 2,
        'Cadet (10-12 Years)': 2,
        'Sub-Junior (12-15 Years)': 2,
        'Junior (15-18 Years)': 2,
        'Senior (18+ Years)': 2,
        'Masters (35+ Years)': 2
      }
    },
    organizer: 'Uttar Pradesh Roller Sports Association',
    status: 'Live',
    descriptionEn: 'The marquee annual state roller sports championship featuring Speed Inline, Speed Quad, and Freestyle events.',
    descriptionHi: 'उत्तर प्रदेश की सर्वोच्च वार्षिक राज्य स्तरीय प्रतियोगिता।'
  },
  {
    id: 'tour-2',
    tournamentNumber: 'UPRSA-TN-2026-02',
    nameEn: 'UPRSA All-UP Inter-District Speed & Freestyle Meet 2026',
    nameHi: 'यूपीआरएसए ऑल-यूपी अंतर-जिला स्पीड एवं फ्रीस्टाइल मीट 2026',
    venue: 'Sector 21-A Sports Complex Rink, Noida',
    districtName: 'Gautam Buddha Nagar (Noida)',
    startDate: '2026-09-05',
    endDate: '2026-09-08',
    lastDate: '2026-08-31',
    organizer: 'GBN District Roller Skating Association',
    status: 'Upcoming',
    descriptionEn: 'Inter-district competitive championship selecting provincial teams for national ranking.',
    descriptionHi: 'राष्ट्रीय स्तर की रैंकिंग हेतु प्रांतीय टीम चयन मीट।'
  },
  {
    id: 'tour-3',
    tournamentNumber: 'UPRSA-TN-2025-04',
    nameEn: 'UPRSA State Selection Championship 2025-26',
    nameHi: 'यूपीआरएसए राज्य चयन चैम्पियनशिप 2025-26',
    venue: 'Green Park Stadium Skating Track, Kanpur',
    districtName: 'Kanpur Nagar',
    startDate: '2026-01-15',
    endDate: '2026-01-18',
    lastDate: '2026-01-10',
    organizer: 'Kanpur District Roller Skating Association',
    status: 'Completed',
    descriptionEn: 'Selection championship completed with official certificates issued.',
    descriptionHi: 'सफलतापूर्वक संपन्न राज्य चयन प्रतियोगिता।'
  },
  {
    id: 'tour-test',
    tournamentNumber: 'UPRSA-TN-2026-TEST',
    nameEn: 'UPRSA TEST CHAMPIONSHIP 2026',
    nameHi: 'यूपीआरएसए टेस्ट चैम्पियनशिप 2026',
    venue: 'KD Singh Babu Stadium, Lucknow',
    districtName: 'Lucknow',
    startDate: '2026-08-15',
    endDate: '2026-08-16',
    lastDate: '2026-08-25',
    organizer: 'Uttar Pradesh Roller Sports Association',
    status: 'Live',
    descriptionEn: 'Official UPRSA test championship for live timing, scoring, and scoreboard validation.',
    descriptionHi: 'लाइव टाइमिंग एवं स्कोरबोर्ड सत्यापन हेतु परीक्षण प्रतियोगिता।'
  }
];

// Initial Events
const defaultEvents: TournamentEvent[] = [
  {
    id: 'event-aarav-500',
    tournamentId: 'tour-1',
    discipline: 'Speed Inline',
    ageGroup: '10-12 Years',
    gender: 'Male',
    distance: '500 Meter',
    raceNumber: 'RACE-500M',
    heatCount: 1,
    maxParticipants: 30
  },
  {
    id: 'event-aarav-1000',
    tournamentId: 'tour-1',
    discipline: 'Speed Inline',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Male',
    distance: '1000 Meter Lap Race',
    raceNumber: 'RACE-1000M',
    heatCount: 1,
    maxParticipants: 30
  },
  {
    id: 'event-aarav-1500',
    tournamentId: 'tour-1',
    discipline: 'Speed Inline',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Male',
    distance: '1500 Meter Road Race',
    raceNumber: 'RACE-1500M',
    heatCount: 1,
    maxParticipants: 30
  },
  {
    id: 'event-aarav-3000',
    tournamentId: 'tour-1',
    discipline: 'Speed Inline',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Male',
    distance: '3000 Meter Point-to-Point',
    raceNumber: 'RACE-3000M',
    heatCount: 1,
    maxParticipants: 30
  },
  {
    id: 'event-1',
    tournamentId: 'tour-1',
    discipline: 'Speed Inline',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Male',
    distance: '500 Meter Rink Race',
    raceNumber: 'RACE-IN-01',
    heatCount: 2,
    maxParticipants: 16
  },
  {
    id: 'event-2',
    tournamentId: 'tour-1',
    discipline: 'Speed Quad',
    ageGroup: 'Junior (15-18 Years)',
    gender: 'Female',
    distance: '1000 Meter Lap Race',
    raceNumber: 'RACE-QD-02',
    heatCount: 1,
    maxParticipants: 12
  },
  {
    id: 'event-ananya-500',
    tournamentId: 'tour-1',
    discipline: 'Speed Quad',
    ageGroup: 'Junior (15-18 Years)',
    gender: 'Female',
    distance: '500 Meter Quad Rink Race',
    raceNumber: 'RACE-QD-500M',
    heatCount: 1,
    maxParticipants: 16
  },
  {
    id: 'event-ananya-1500',
    tournamentId: 'tour-1',
    discipline: 'Speed Quad',
    ageGroup: 'Junior (15-18 Years)',
    gender: 'Female',
    distance: '1500 Meter Quad Road Race',
    raceNumber: 'RACE-QD-1500M',
    heatCount: 1,
    maxParticipants: 16
  },
  {
    id: 'event-3',
    tournamentId: 'tour-1',
    discipline: 'Speed Inline',
    ageGroup: 'Senior (18+ Years)',
    gender: 'Male',
    distance: '3000 Meter Point-to-Point',
    raceNumber: 'RACE-IN-03',
    heatCount: 1,
    maxParticipants: 10
  },
  {
    id: 'event-test',
    tournamentId: 'tour-test',
    discipline: 'Speed Inline',
    ageGroup: 'Cadet (10-12 Years)',
    gender: 'Male',
    distance: 'Speed Inline 500M',
    raceNumber: 'RACE-001',
    heatCount: 1,
    maxParticipants: 8
  }
];

// Initial Registrations
const defaultRegistrations: TournamentRegistration[] = [
  {
    id: 'reg-1',
    tournamentId: 'tour-1',
    eventId: 'event-1',
    skaterId: 'skater-1',
    skaterName: 'Aarav Sharma',
    registrationNumber: 'UPRSA/2026/01001',
    districtName: 'Lucknow',
    clubName: 'Lucknow Roller Skating Academy',
    discipline: 'Speed Inline',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Male',
    distance: '500 Meter Rink Race',
    bibNumber: '101',
    heatNumber: 1,
    status: 'approved',
    registeredAt: '2026-08-01'
  },
  {
    id: 'reg-2',
    tournamentId: 'tour-1',
    eventId: 'event-2',
    skaterId: 'skater-2',
    skaterName: 'Ananya Verma',
    registrationNumber: 'UPRSA/2026/01002',
    districtName: 'Gautam Buddha Nagar (Noida)',
    clubName: 'Noida Speed Skaters Club',
    discipline: 'Speed Quad',
    ageGroup: 'Junior (15-18 Years)',
    gender: 'Female',
    distance: '1000 Meter Lap Race',
    bibNumber: '202',
    heatNumber: 1,
    status: 'approved',
    registeredAt: '2026-08-02'
  },
  {
    id: 'reg-3',
    tournamentId: 'tour-1',
    eventId: 'event-3',
    skaterId: 'skater-3',
    skaterName: 'Kabir Singh',
    registrationNumber: 'UPRSA/2026/01003',
    districtName: 'Kanpur Nagar',
    clubName: 'Kanpur Express Roller Club',
    discipline: 'Speed Inline',
    ageGroup: 'Senior (18+ Years)',
    gender: 'Male',
    distance: '3000 Meter Point-to-Point',
    bibNumber: '303',
    heatNumber: 1,
    status: 'approved',
    registeredAt: '2026-08-03'
  }
];

// Initial Live Results
const defaultResults: TournamentResult[] = [
  {
    id: 'res-aarav-1',
    tournamentId: 'tour-1',
    eventId: 'event-1',
    raceId: 'race-1',
    skaterId: 'skater-1',
    skaterName: 'Aarav Sharma',
    registrationNumber: 'UPRSA/2026/01001',
    districtName: 'Lucknow',
    clubName: 'Lucknow Roller Skating Academy',
    bibNumber: '101',
    discipline: 'Speed Inline',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Male',
    timing: '00:42.18',
    rawTiming: '00:42.18',
    position: 1,
    points: 5,
    medal: 'Gold',
    status: 'VALID',
    approvalStatus: 'Published',
    remarks: '500m Rink Race - Gold Medal',
    createdAt: '2026-08-10 10:30'
  },
  {
    id: 'res-aarav-2',
    tournamentId: 'tour-1',
    eventId: 'event-aarav-1000',
    raceId: 'race-1000m',
    skaterId: 'skater-1',
    skaterName: 'Aarav Sharma',
    registrationNumber: 'UPRSA/2026/01001',
    districtName: 'Lucknow',
    clubName: 'Lucknow Roller Skating Academy',
    bibNumber: '101',
    discipline: 'Speed Inline',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Male',
    timing: '01:28.45',
    rawTiming: '01:28.45',
    position: 1,
    points: 5,
    medal: 'Gold',
    status: 'VALID',
    approvalStatus: 'Published',
    remarks: '1000m Lap Race - Gold Medal',
    createdAt: '2026-08-10 11:15'
  },
  {
    id: 'res-aarav-3',
    tournamentId: 'tour-1',
    eventId: 'event-aarav-1500',
    raceId: 'race-1500m',
    skaterId: 'skater-1',
    skaterName: 'Aarav Sharma',
    registrationNumber: 'UPRSA/2026/01001',
    districtName: 'Lucknow',
    clubName: 'Lucknow Roller Skating Academy',
    bibNumber: '101',
    discipline: 'Speed Inline',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Male',
    timing: '02:15.10',
    rawTiming: '02:15.10',
    position: 2,
    points: 3,
    medal: 'Silver',
    status: 'VALID',
    approvalStatus: 'Published',
    remarks: '1500m Road Race - Silver Medal',
    createdAt: '2026-08-10 12:00'
  },
  {
    id: 'res-aarav-4',
    tournamentId: 'tour-1',
    eventId: 'event-aarav-3000',
    raceId: 'race-3000m',
    skaterId: 'skater-1',
    skaterName: 'Aarav Sharma',
    registrationNumber: 'UPRSA/2026/01001',
    districtName: 'Lucknow',
    clubName: 'Lucknow Roller Skating Academy',
    bibNumber: '101',
    discipline: 'Speed Inline',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Male',
    timing: '04:50.00',
    rawTiming: '04:50.00',
    position: 1,
    points: 5,
    medal: 'Gold',
    status: 'VALID',
    approvalStatus: 'Published',
    remarks: '3000m Point-to-Point - Gold Medal',
    createdAt: '2026-08-10 12:45'
  },
  {
    id: 'res-2',
    tournamentId: 'tour-1',
    eventId: 'event-2',
    skaterId: 'skater-2',
    skaterName: 'Ananya Verma',
    registrationNumber: 'UPRSA/2026/01002',
    districtName: 'Gautam Buddha Nagar (Noida)',
    clubName: 'Noida Speed Skaters Club',
    bibNumber: '202',
    timing: '01:38.45',
    position: 1,
    points: 5,
    medal: 'Gold',
    status: 'VALID',
    approvalStatus: 'Published',
    createdAt: '2026-08-10 11:15'
  },
  {
    id: 'res-3',
    tournamentId: 'tour-1',
    eventId: 'event-3',
    skaterId: 'skater-3',
    skaterName: 'Kabir Singh',
    registrationNumber: 'UPRSA/2026/01003',
    districtName: 'Kanpur Nagar',
    clubName: 'Kanpur Express Roller Club',
    bibNumber: '303',
    timing: '05:12.80',
    position: 2,
    points: 3,
    medal: 'Silver',
    status: 'VALID',
    approvalStatus: 'Published',
    createdAt: '2026-08-10 12:00'
  },
  {
    id: 'res-4',
    tournamentId: 'tour-1',
    eventId: 'event-4',
    skaterId: 'skater-4',
    skaterName: 'Myra Gupta',
    registrationNumber: 'UPRSA/2026/01004',
    districtName: 'Lucknow',
    clubName: 'Lucknow Roller Skating Academy',
    bibNumber: '104',
    timing: '00:55.20',
    position: 3,
    points: 1,
    medal: 'Bronze',
    status: 'VALID',
    approvalStatus: 'Published',
    createdAt: '2026-08-10 12:30'
  }
];

// Point Rules
const defaultPointRules: PointRule[] = [
  { position: 1, points: 5, label: '1st Place (Gold)' },
  { position: 2, points: 3, label: '2nd Place (Silver)' },
  { position: 3, points: 1, label: '3rd Place (Bronze)' },
  { position: 4, points: 0, label: '4th Place' },
  { position: 5, points: 0, label: '5th Place' },
];

// Default Certificate Template
export const defaultCertificateTemplate: CertificateTemplate = {
  id: 'template-default-uprsa',
  title: 'CERTIFICATE OF MERIT & ACHIEVEMENT',
  logoUrl: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=200&auto=format&fit=crop&q=80',
  headerText: 'UTTAR PRADESH ROLLER SPORTS ASSOCIATION',
  subHeaderText: 'Affiliated to Roller Skating Federation of India (RSFI) • Recognized by UP Olympic Association',
  presidentName: 'Sri D. S. Mishra',
  presidentTitle: 'President, UPRSA',
  presidentSignatureUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Jon_Kirsch_Signature.png',
  secretaryName: 'Sri Pankaj Sharma',
  secretaryTitle: 'General Secretary, UPRSA',
  secretarySignatureUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Signature_example.svg',
  officialSealUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Seal_of_Uttar_Pradesh.svg/300px-Seal_of_Uttar_Pradesh.svg.png',
  numberPrefix: 'UPRSA-CERT-2026-',
  footerText: 'Official UPRSA Digital Credential • Scannable QR Code for Authentication',
  primaryColor: '#d97706',
  secondaryColor: '#0f172a',
  isDefault: true,
  updatedAt: new Date().toISOString()
};

// Certificates
const defaultCertificates: Certificate[] = [
  {
    id: 'cert-1',
    certificateNumber: 'UPRSA-CERT-2026-000001',
    skaterId: 'skater-1',
    skaterName: 'Aarav Sharma',
    registrationNumber: 'UPRSA/2026/01001',
    fatherMotherName: 'Sanjay Sharma',
    tournamentId: 'tour-1',
    tournamentName: '38th UPRSA UP State Roller Skating Championship 2026',
    tournamentNumber: 'UPRSA-TR-2026-01',
    eventId: 'event-1',
    eventName: 'Speed Inline 500 Meter Rink Race',
    discipline: 'Speed Inline',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Male',
    position: '1st Position (Gold Medal)',
    score: 'Gold Medalist',
    timing: '00:48.21',
    clubName: 'Lucknow Roller Skating Academy',
    districtName: 'Lucknow',
    certificateDate: '2026-08-10',
    issueDate: '2026-08-10',
    status: 'Verified',
    verificationCode: 'UPRSA-CERT-2026-000001',
    certificateType: 'Merit',
    createdAt: '2026-08-10T10:00:00Z'
  },
  {
    id: 'cert-2',
    certificateNumber: 'UPRSA-CERT-2026-000002',
    skaterId: 'skater-2',
    skaterName: 'Ananya Verma',
    registrationNumber: 'UPRSA/2026/01002',
    fatherMotherName: 'Rakesh Verma',
    tournamentId: 'tour-1',
    tournamentName: '38th UPRSA UP State Roller Skating Championship 2026',
    tournamentNumber: 'UPRSA-TR-2026-01',
    eventId: 'event-2',
    eventName: 'Speed Quad 1000 Meter Lap Race',
    discipline: 'Speed Quad',
    ageGroup: 'Junior (15-18 Years)',
    gender: 'Female',
    position: '1st Position (Gold Medal)',
    score: 'Gold Medalist',
    timing: '01:34.12',
    clubName: 'Noida Speed Skaters Club',
    districtName: 'Gautam Buddha Nagar (Noida)',
    certificateDate: '2026-08-10',
    issueDate: '2026-08-10',
    status: 'Verified',
    verificationCode: 'UPRSA-CERT-2026-000002',
    certificateType: 'Merit',
    createdAt: '2026-08-10T10:05:00Z'
  }
];

// Announcements
const defaultAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    titleEn: 'Official Notification: 38th UPRSA State Championship Live Results Published',
    titleHi: 'आधिकारिक सूचना: 38वीं यूपीआरएसए राज्य प्रतियोगिता के परिणाम प्रकाशित',
    contentEn: 'All district associations and registered clubs are hereby informed that live race timings and official rankings for the 38th State Championship are active.',
    contentHi: 'समस्त जिला संघों एवं सम्बद्ध अकादमियों को सूचित किया जाता है कि राज्य प्रतियोगिता के परिणाम एवं लाइव स्कोरबोर्ड सक्रिय हैं।',
    category: 'Tournament',
    date: '2026-08-10',
    isPinned: true
  },
  {
    id: 'ann-2',
    titleEn: 'Mandatory Digital ID Cards for All Skaters Participating in 2026 Season',
    titleHi: 'वर्ष 2026 सत्र में भाग लेने वाले सभी स्केटरों के लिए डिजिटल आईडी कार्ड अनिवार्य',
    contentEn: 'Every skater must carry their UPRSA Digital ID Card at tournament venues for verification.',
    contentHi: 'प्रतियोगिता स्थल पर प्रवेश एवं सत्यापन हेतु सभी स्केटरों को अपना डिजिटल आईडी प्रस्तुत करना अनिवार्य है।',
    category: 'Registration',
    date: '2026-08-05',
    isPinned: false
  }
];

// Gallery
const defaultGallery: GalleryItem[] = [
  {
    id: 'gal-1',
    title: '38th UP State Championship Opening Ceremony Lucknow',
    category: 'Championship',
    mediaType: 'photo',
    imageUrl: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=800&auto=format&fit=crop&q=80',
    date: '2026-08-10'
  },
  {
    id: 'gal-2',
    title: 'Speed Inline 500m Final Sprint KD Singh Babu Stadium',
    category: 'Action',
    mediaType: 'photo',
    imageUrl: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=800&auto=format&fit=crop&q=80',
    date: '2026-08-10'
  },
  {
    id: 'gal-3',
    title: 'Medal Ceremony & Podium Winners',
    category: 'Awards',
    mediaType: 'photo',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=800&auto=format&fit=crop&q=80',
    date: '2026-08-10'
  },
  {
    id: 'gal-v1',
    title: 'UP State Championship 2026 - Speed Skating Highlights',
    category: 'Championship',
    mediaType: 'video',
    imageUrl: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    date: '2026-08-11'
  },
  {
    id: 'gal-v2',
    title: 'Roller Hockey Final Match Highlights & Goal Clips',
    category: 'Roller Hockey',
    mediaType: 'video',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    date: '2026-08-12'
  }
];

// Default Races
const defaultRaces: Race[] = [
  {
    id: 'race-1',
    tournamentId: 'tour-1',
    eventId: 'event-1',
    raceNumber: 'R-101',
    heatNumber: 1,
    discipline: 'Speed Inline',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Male',
    distance: '500m Rink',
    maxParticipants: 8,
    scheduledStartTime: '10:00 AM',
    status: 'Finished',
    scoringMethod: 'TIMING',
    createdAt: '2026-08-10T10:00:00Z'
  },
  {
    id: 'race-2',
    tournamentId: 'tour-1',
    eventId: 'event-2',
    raceNumber: 'R-102',
    heatNumber: 1,
    discipline: 'Speed Quad',
    ageGroup: 'Cadet (10-12 Years)',
    gender: 'Female',
    distance: '1000m Lap',
    maxParticipants: 8,
    scheduledStartTime: '11:00 AM',
    status: 'Live',
    scoringMethod: 'TIMING',
    createdAt: '2026-08-10T11:00:00Z'
  },
  {
    id: 'race-test',
    tournamentId: 'tour-test',
    eventId: 'event-test',
    raceNumber: 'Race 001',
    heatNumber: 1,
    discipline: 'Speed Inline',
    ageGroup: 'Cadet (10-12 Years)',
    gender: 'Male',
    distance: 'Speed Inline 500M',
    maxParticipants: 8,
    scheduledStartTime: '10:00 AM',
    status: 'Finished',
    scoringMethod: 'TIMING',
    createdAt: '2026-08-15T10:00:00Z'
  }
];

// Default Race Participants
const defaultRaceParticipants: RaceParticipant[] = [
  {
    id: 'part-1',
    raceId: 'race-1',
    tournamentId: 'tour-1',
    eventId: 'event-1',
    skaterId: 'skater-1',
    skaterName: 'Aarav Sharma',
    registrationNumber: 'UPRSA/2026/01001',
    bibNumber: '101',
    gender: 'Male',
    ageGroup: 'Sub-Junior (12-15 Years)',
    clubName: 'Lucknow Roller Skating Academy',
    districtName: 'Lucknow',
    laneNumber: 1,
    heatNumber: 1,
    status: 'VALID'
  },
  {
    id: 'part-2',
    raceId: 'race-1',
    tournamentId: 'tour-1',
    eventId: 'event-1',
    skaterId: 'skater-2',
    skaterName: 'Ananya Verma',
    registrationNumber: 'UPRSA/2026/01002',
    bibNumber: '102',
    gender: 'Female',
    ageGroup: 'Cadet (10-12 Years)',
    clubName: 'Noida Speed Skaters Club',
    districtName: 'Gautam Buddha Nagar (Noida)',
    laneNumber: 2,
    heatNumber: 1,
    status: 'VALID'
  },
  {
    id: 'part-3',
    raceId: 'race-1',
    tournamentId: 'tour-1',
    eventId: 'event-1',
    skaterId: 'skater-3',
    skaterName: 'Kabir Singh',
    registrationNumber: 'UPRSA/2026/01003',
    bibNumber: '103',
    gender: 'Male',
    ageGroup: 'Sub-Junior (12-15 Years)',
    clubName: 'Kanpur Express Roller Club',
    districtName: 'Kanpur Nagar',
    laneNumber: 3,
    heatNumber: 1,
    status: 'VALID'
  },
  {
    id: 'part-4',
    raceId: 'race-1',
    tournamentId: 'tour-1',
    eventId: 'event-1',
    skaterId: 'skater-4',
    skaterName: 'Myra Gupta',
    registrationNumber: 'UPRSA/2026/01004',
    bibNumber: '104',
    gender: 'Female',
    ageGroup: 'Junior (15-18 Years)',
    clubName: 'Lucknow Roller Skating Academy',
    districtName: 'Lucknow',
    laneNumber: 4,
    heatNumber: 1,
    status: 'VALID'
  },
  {
    id: 'part-t1',
    raceId: 'race-test',
    tournamentId: 'tour-test',
    eventId: 'event-test',
    skaterId: 'skater-1',
    skaterName: 'Aarav Sharma',
    registrationNumber: 'UPRSA/2026/01001',
    bibNumber: '101',
    gender: 'Male',
    ageGroup: 'Cadet (10-12 Years)',
    clubName: 'Lucknow Roller Skating Academy',
    districtName: 'Lucknow',
    laneNumber: 1,
    heatNumber: 1,
    status: 'VALID'
  },
  {
    id: 'part-t2',
    raceId: 'race-test',
    tournamentId: 'tour-test',
    eventId: 'event-test',
    skaterId: 'skater-2',
    skaterName: 'Ananya Verma',
    registrationNumber: 'UPRSA/2026/01002',
    bibNumber: '102',
    gender: 'Male',
    ageGroup: 'Cadet (10-12 Years)',
    clubName: 'Noida Speed Skaters Club',
    districtName: 'Gautam Buddha Nagar (Noida)',
    laneNumber: 2,
    heatNumber: 1,
    status: 'VALID'
  },
  {
    id: 'part-t3',
    raceId: 'race-test',
    tournamentId: 'tour-test',
    eventId: 'event-test',
    skaterId: 'skater-3',
    skaterName: 'Kabir Singh',
    registrationNumber: 'UPRSA/2026/01003',
    bibNumber: '103',
    gender: 'Male',
    ageGroup: 'Cadet (10-12 Years)',
    clubName: 'Kanpur Express Roller Club',
    districtName: 'Kanpur Nagar',
    laneNumber: 3,
    heatNumber: 1,
    status: 'VALID'
  },
  {
    id: 'part-t4',
    raceId: 'race-test',
    tournamentId: 'tour-test',
    eventId: 'event-test',
    skaterId: 'skater-4',
    skaterName: 'Diya Patel',
    registrationNumber: 'UPRSA/2026/01004',
    bibNumber: '104',
    gender: 'Male',
    ageGroup: 'Cadet (10-12 Years)',
    clubName: 'Kashi Wheels Skating Academy',
    districtName: 'Varanasi',
    laneNumber: 4,
    heatNumber: 1,
    status: 'VALID'
  },
  {
    id: 'part-t5',
    raceId: 'race-test',
    tournamentId: 'tour-test',
    eventId: 'event-test',
    skaterId: 'skater-5',
    skaterName: 'Rohan Gupta',
    registrationNumber: 'UPRSA/2026/01005',
    bibNumber: '105',
    gender: 'Male',
    ageGroup: 'Cadet (10-12 Years)',
    clubName: 'Taj City Roller Sports Club',
    districtName: 'Agra',
    laneNumber: 5,
    heatNumber: 1,
    status: 'VALID'
  }
];

// Default Race Results
const defaultRaceResults: RaceResult[] = [
  {
    id: 'rres-t1',
    tournamentId: 'tour-test',
    eventId: 'event-test',
    raceId: 'race-test',
    participantId: 'part-t1',
    skaterId: 'skater-1',
    skaterName: 'Aarav Sharma',
    registrationNumber: 'UPRSA/2026/01001',
    districtName: 'Lucknow',
    clubName: 'Lucknow Roller Skating Academy',
    bibNumber: '101',
    rawTiming: '00:42.18',
    penaltySeconds: 0,
    finalTiming: '00:42.18',
    score: 0,
    position: 1,
    points: 5,
    medal: 'Gold',
    status: 'VALID',
    approvalStatus: 'Published',
    remarks: '1st Place Gold Medalist',
    createdAt: '2026-08-15T10:15:00Z',
    updatedAt: '2026-08-15T10:15:00Z'
  },
  {
    id: 'rres-t2',
    tournamentId: 'tour-test',
    eventId: 'event-test',
    raceId: 'race-test',
    participantId: 'part-t2',
    skaterId: 'skater-2',
    skaterName: 'Ananya Verma',
    registrationNumber: 'UPRSA/2026/01002',
    districtName: 'Gautam Buddha Nagar (Noida)',
    clubName: 'Noida Speed Skaters Club',
    bibNumber: '102',
    rawTiming: '00:43.02',
    penaltySeconds: 0,
    finalTiming: '00:43.02',
    score: 0,
    position: 2,
    points: 3,
    medal: 'Silver',
    status: 'VALID',
    approvalStatus: 'Published',
    remarks: '2nd Place Silver Medalist',
    createdAt: '2026-08-15T10:15:00Z',
    updatedAt: '2026-08-15T10:15:00Z'
  },
  {
    id: 'rres-t3',
    tournamentId: 'tour-test',
    eventId: 'event-test',
    raceId: 'race-test',
    participantId: 'part-t3',
    skaterId: 'skater-3',
    skaterName: 'Kabir Singh',
    registrationNumber: 'UPRSA/2026/01003',
    districtName: 'Kanpur Nagar',
    clubName: 'Kanpur Express Roller Club',
    bibNumber: '103',
    rawTiming: '00:44.11',
    penaltySeconds: 0,
    finalTiming: '00:44.11',
    score: 0,
    position: 3,
    points: 1,
    medal: 'Bronze',
    status: 'VALID',
    approvalStatus: 'Published',
    remarks: '3rd Place Bronze Medalist',
    createdAt: '2026-08-15T10:15:00Z',
    updatedAt: '2026-08-15T10:15:00Z'
  },
  {
    id: 'rres-t4',
    tournamentId: 'tour-test',
    eventId: 'event-test',
    raceId: 'race-test',
    participantId: 'part-t4',
    skaterId: 'skater-4',
    skaterName: 'Diya Patel',
    registrationNumber: 'UPRSA/2026/01004',
    districtName: 'Varanasi',
    clubName: 'Kashi Wheels Skating Academy',
    bibNumber: '104',
    rawTiming: '00:45.27',
    penaltySeconds: 0,
    finalTiming: '00:45.27',
    score: 0,
    position: 4,
    points: 0,
    medal: 'None',
    status: 'VALID',
    approvalStatus: 'Published',
    remarks: '4th Place Finisher',
    createdAt: '2026-08-15T10:15:00Z',
    updatedAt: '2026-08-15T10:15:00Z'
  },
  {
    id: 'rres-t5',
    tournamentId: 'tour-test',
    eventId: 'event-test',
    raceId: 'race-test',
    participantId: 'part-t5',
    skaterId: 'skater-5',
    skaterName: 'Rohan Gupta',
    registrationNumber: 'UPRSA/2026/01005',
    districtName: 'Agra',
    clubName: 'Taj City Roller Sports Club',
    bibNumber: '105',
    rawTiming: '00:46.50',
    penaltySeconds: 0,
    finalTiming: '00:46.50',
    score: 0,
    position: 5,
    points: 0,
    medal: 'None',
    status: 'VALID',
    approvalStatus: 'Published',
    remarks: '5th Place Finisher',
    createdAt: '2026-08-15T10:15:00Z',
    updatedAt: '2026-08-15T10:15:00Z'
  },
  {
    id: 'rres-aarav-1',
    tournamentId: 'tour-1',
    eventId: 'event-1',
    raceId: 'race-1',
    participantId: 'part-1',
    skaterId: 'skater-1',
    skaterName: 'Aarav Sharma',
    registrationNumber: 'UPRSA/2026/01001',
    districtName: 'Lucknow',
    clubName: 'Lucknow Roller Skating Academy',
    bibNumber: '101',
    discipline: 'Speed Inline',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Male',
    rawTiming: '00:42.18',
    penaltySeconds: 0,
    finalTiming: '00:42.18',
    score: 0,
    position: 1,
    points: 5,
    medal: 'Gold',
    status: 'VALID',
    approvalStatus: 'Published',
    remarks: '500m Rink Race - Gold Medal',
    createdAt: '2026-08-10T10:30:00Z',
    updatedAt: '2026-08-10T10:30:00Z'
  },
  {
    id: 'rres-aarav-2',
    tournamentId: 'tour-1',
    eventId: 'event-aarav-1000',
    raceId: 'race-1000m',
    participantId: 'part-aarav-2',
    skaterId: 'skater-1',
    skaterName: 'Aarav Sharma',
    registrationNumber: 'UPRSA/2026/01001',
    districtName: 'Lucknow',
    clubName: 'Lucknow Roller Skating Academy',
    bibNumber: '101',
    discipline: 'Speed Inline',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Male',
    rawTiming: '01:28.45',
    penaltySeconds: 0,
    finalTiming: '01:28.45',
    score: 0,
    position: 1,
    points: 5,
    medal: 'Gold',
    status: 'VALID',
    approvalStatus: 'Published',
    remarks: '1000m Lap Race - Gold Medal',
    createdAt: '2026-08-10T11:15:00Z',
    updatedAt: '2026-08-10T11:15:00Z'
  },
  {
    id: 'rres-aarav-3',
    tournamentId: 'tour-1',
    eventId: 'event-aarav-1500',
    raceId: 'race-1500m',
    participantId: 'part-aarav-3',
    skaterId: 'skater-1',
    skaterName: 'Aarav Sharma',
    registrationNumber: 'UPRSA/2026/01001',
    districtName: 'Lucknow',
    clubName: 'Lucknow Roller Skating Academy',
    bibNumber: '101',
    discipline: 'Speed Inline',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Male',
    rawTiming: '02:15.10',
    penaltySeconds: 0,
    finalTiming: '02:15.10',
    score: 0,
    position: 2,
    points: 3,
    medal: 'Silver',
    status: 'VALID',
    approvalStatus: 'Published',
    remarks: '1500m Road Race - Silver Medal',
    createdAt: '2026-08-10T12:00:00Z',
    updatedAt: '2026-08-10T12:00:00Z'
  },
  {
    id: 'rres-aarav-4',
    tournamentId: 'tour-1',
    eventId: 'event-aarav-3000',
    raceId: 'race-3000m',
    participantId: 'part-aarav-4',
    skaterId: 'skater-1',
    skaterName: 'Aarav Sharma',
    registrationNumber: 'UPRSA/2026/01001',
    districtName: 'Lucknow',
    clubName: 'Lucknow Roller Skating Academy',
    bibNumber: '101',
    discipline: 'Speed Inline',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Male',
    rawTiming: '04:50.00',
    penaltySeconds: 0,
    finalTiming: '04:50.00',
    score: 0,
    position: 1,
    points: 5,
    medal: 'Gold',
    status: 'VALID',
    approvalStatus: 'Published',
    remarks: '3000m Point-to-Point - Gold Medal',
    createdAt: '2026-08-10T12:45:00Z',
    updatedAt: '2026-08-10T12:45:00Z'
  },
  {
    id: 'rres-2',
    tournamentId: 'tour-1',
    eventId: 'event-1',
    raceId: 'race-1',
    participantId: 'part-2',
    skaterId: 'skater-2',
    skaterName: 'Ananya Verma',
    registrationNumber: 'UPRSA/2026/01002',
    districtName: 'Gautam Buddha Nagar (Noida)',
    clubName: 'Noida Speed Skaters Club',
    bibNumber: '102',
    discipline: 'Speed Quad',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Female',
    rawTiming: '00:43.02',
    penaltySeconds: 0,
    finalTiming: '00:43.02',
    score: 0,
    position: 2,
    points: 3,
    medal: 'Silver',
    status: 'VALID',
    approvalStatus: 'Published',
    remarks: 'Silver Medalist',
    createdAt: '2026-08-10T10:30:00Z',
    updatedAt: '2026-08-10T10:30:00Z'
  },
  {
    id: 'rres-3',
    tournamentId: 'tour-1',
    eventId: 'event-1',
    raceId: 'race-1',
    participantId: 'part-3',
    skaterId: 'skater-3',
    skaterName: 'Kabir Singh',
    registrationNumber: 'UPRSA/2026/01003',
    districtName: 'Kanpur Nagar',
    clubName: 'Kanpur Express Roller Club',
    bibNumber: '103',
    discipline: 'Speed Quad',
    ageGroup: 'Junior (15-18 Years)',
    gender: 'Male',
    rawTiming: '00:44.11',
    penaltySeconds: 0,
    finalTiming: '00:44.11',
    score: 0,
    position: 3,
    points: 1,
    medal: 'Bronze',
    status: 'VALID',
    approvalStatus: 'Published',
    remarks: 'Bronze Medalist',
    createdAt: '2026-08-10T10:30:00Z',
    updatedAt: '2026-08-10T10:30:00Z'
  },
  {
    id: 'rres-4',
    tournamentId: 'tour-1',
    eventId: 'event-1',
    raceId: 'race-1',
    participantId: 'part-4',
    skaterId: 'skater-4',
    skaterName: 'Myra Gupta',
    registrationNumber: 'UPRSA/2026/01004',
    districtName: 'Lucknow',
    clubName: 'Lucknow Roller Skating Academy',
    bibNumber: '104',
    discipline: 'Inline Freestyle',
    ageGroup: 'Sub-Junior (12-15 Years)',
    gender: 'Female',
    rawTiming: '00:46.50',
    penaltySeconds: 2,
    finalTiming: '00:48.50',
    score: 0,
    position: 4,
    points: 0,
    medal: 'None',
    status: 'VALID',
    approvalStatus: 'Published',
    remarks: '+2s Penalty for lane encroachment',
    createdAt: '2026-08-10T10:30:00Z',
    updatedAt: '2026-08-10T10:30:00Z'
  }
];

const defaultScoreboardState: ScoreboardState = {
  tournamentId: 'tour-1',
  eventId: 'event-1',
  raceId: 'race-1',
  mode: 'MODE_1_CURRENT_RACE',
  customTitle: '38th UPRSA UP State Roller Skating Championship 2026',
  customSubtitle: 'Official Real-Time Stadium LED Scoreboard & Live Results Sync',
  tickerText: 'WELCOME TO UPRSA STATE CHAMPIONSHIP • LIVE SCORING IN PROGRESS • NEXT UP: 500M INLINE HEATS • ALL ATHLETES REPORT TO CALL ROOM',
  autoRotate: true,
  autoRotateIntervalSeconds: 10,
  rotationModes: [
    'MODE_1_CURRENT_RACE',
    'MODE_2_EVENT_RESULTS',
    'MODE_3_MEDAL_TALLY',
    'MODE_4_CLUB_RANKING',
    'MODE_5_DISTRICT_RANKING',
    'MODE_6_STATE_RANKING',
    'MODE_7_TOURNAMENT_HIGHLIGHTS'
  ],
  isLiveBroadcasting: true,
  updatedAt: new Date().toISOString()
};

const defaultHeroSlides: HeroSlide[] = [
  {
    id: 'slide-1',
    desktopImage: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=1920&auto=format&fit=crop&q=90',
    mobileImage: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=800&auto=format&fit=crop&q=90',
    titleEn: '38th UPRSA State Championship 2026',
    titleHi: '38वीं यूपीआरएसए राज्य स्केटिंग प्रतियोगिता 2026',
    descriptionEn: 'Uttar Pradesh Roller Sports Association — Official State Championship & Ranking Meet',
    descriptionHi: 'उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन — आधिकारिक राज्य स्तरीय स्केटिंग चैंपियनशिप',
    primaryBtnTextEn: 'Register Skater',
    primaryBtnTextHi: 'स्केटर पंजीकरण करें',
    primaryBtnUrl: '/register',
    secondaryBtnTextEn: 'View Tournaments',
    secondaryBtnTextHi: 'प्रतियोगिताएं देखें',
    secondaryBtnUrl: '/tournaments',
    overlayStrength: 50,
    active: true,
    order: 1
  },
  {
    id: 'slide-2',
    desktopImage: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=1920&auto=format&fit=crop&q=90',
    mobileImage: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=800&auto=format&fit=crop&q=90',
    titleEn: 'Official Skater Registration 2026',
    titleHi: 'आधिकारिक स्केटर पंजीकरण 2026',
    descriptionEn: 'Register and become part of UPRSA official state network & obtain digital ID card',
    descriptionHi: 'यूपीआरएसए के आधिकारिक राज्य नेटवर्क से जुड़ें एवं डिजिटल आईडी कार्ड प्राप्त करें',
    primaryBtnTextEn: 'Register Skater',
    primaryBtnTextHi: 'स्केटर पंजीकरण करें',
    primaryBtnUrl: '/register',
    secondaryBtnTextEn: 'Skater Portal',
    secondaryBtnTextHi: 'स्केटर पोर्टल',
    secondaryBtnUrl: '/portal',
    overlayStrength: 55,
    active: true,
    order: 2
  },
  {
    id: 'slide-3',
    desktopImage: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=1920&auto=format&fit=crop&q=90',
    mobileImage: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=800&auto=format&fit=crop&q=90',
    titleEn: 'State & District Championships',
    titleHi: 'राज्य एवं जिला स्तरीय चैंपियनशिप',
    descriptionEn: 'Participate in UPRSA accredited Speed Inline, Quad, Artistic & Roller Hockey Meets',
    descriptionHi: 'स्पीड, इनलाइन, क्वाड एवं आर्टिस्टिक वर्ग की मान्यता प्राप्त प्रतियोगिताओं में भाग लें',
    primaryBtnTextEn: 'View Schedule',
    primaryBtnTextHi: 'शेड्यूल देखें',
    primaryBtnUrl: '/tournaments',
    secondaryBtnTextEn: 'Live Results',
    secondaryBtnTextHi: 'लाइव परिणाम',
    secondaryBtnUrl: '/results',
    overlayStrength: 50,
    active: true,
    order: 3
  },
  {
    id: 'slide-4',
    desktopImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&auto=format&fit=crop&q=90',
    mobileImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=90',
    titleEn: 'Live Stadium Scoreboard & Timings',
    titleHi: 'लाइव स्टेडियम स्कोरबोर्ड एवं टाइमिंग',
    descriptionEn: 'Follow real-time heat timings, race results, and medal counts live from venue',
    descriptionHi: 'लाइव रेस टाइमिंग, हीट रिजल्ट्स और मेडल टैली को रियल-टाइम में देखें',
    primaryBtnTextEn: 'Open Live Scoreboard',
    primaryBtnTextHi: 'लाइव स्कोरबोर्ड खोलें',
    primaryBtnUrl: '/live-scoreboard',
    secondaryBtnTextEn: 'Race Results',
    secondaryBtnTextHi: 'रेस परिणाम',
    secondaryBtnUrl: '/results',
    overlayStrength: 60,
    active: true,
    order: 4
  },
  {
    id: 'slide-5',
    desktopImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1920&auto=format&fit=crop&q=90',
    mobileImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=90',
    titleEn: 'State Standings & Official Rankings',
    titleHi: 'राज्य रैंकिंग एवं आधिकारिक तालिका',
    descriptionEn: 'Individual, Club and District Rankings based on official UPRSA point system',
    descriptionHi: 'यूपीआरएसए के आधिकारिक अंकों के आधार पर व्यक्तिगत, क्लब एवं जिला रैंकिंग देखें',
    primaryBtnTextEn: 'View Full Rankings',
    primaryBtnTextHi: 'पूरी रैंकिंग देखें',
    primaryBtnUrl: '/rankings',
    secondaryBtnTextEn: 'District Standings',
    secondaryBtnTextHi: 'जिला तालिका',
    secondaryBtnUrl: '/districts',
    overlayStrength: 50,
    active: true,
    order: 5
  }
];

const defaultHomeSections: HomeSection[] = [
  { id: 'hero', titleEn: 'Hero Banner Slider', titleHi: 'मुख्य बैनर स्लाइडर', subtitleEn: 'Main entrance presentation banner', subtitleHi: 'मुख्य प्रस्तुति बैनर', enabled: true, order: 1 },
  { id: 'about', titleEn: 'About UPRSA', titleHi: 'यूपीआरएसए के बारे में', subtitleEn: 'Governing body for roller sports in Uttar Pradesh', subtitleHi: 'उत्तर प्रदेश में रोलर स्पोर्ट्स की शीर्ष संस्था', enabled: true, order: 2 },
  { id: 'stats', titleEn: 'State Association Statistics', titleHi: 'राज्य संघ के आंकड़े', subtitleEn: 'Live statistics from database', subtitleHi: 'डेटाबेस से लाइव आंकड़े', enabled: true, order: 3 },
  { id: 'tournaments', titleEn: 'Upcoming & Active Tournaments', titleHi: 'आगामी एवं सक्रिय प्रतियोगिताएं', subtitleEn: 'Official state & district championships schedule', subtitleHi: 'आधिकारिक राज्य एवं जिला चैंपियनशिप शेड्यूल', enabled: true, order: 4 },
  { id: 'live_results', titleEn: 'Latest Results & Live Scoring', titleHi: 'नवीनतम परिणाम एवं लाइव स्कोरिंग', subtitleEn: 'Official race timings and position ticker', subtitleHi: 'आधिकारिक रेस टाइमिंग एवं परिणाम टिकर', enabled: true, order: 5 },
  { id: 'rankings', titleEn: 'State Rankings Preview', titleHi: 'राज्य रैंकिंग झलक', subtitleEn: 'Top skaters, clubs, and districts', subtitleHi: 'शीर्ष स्केटर, क्लब एवं जिले', enabled: true, order: 6 },
  { id: 'news', titleEn: 'News & Announcements', titleHi: 'समाचार एवं घोषणाएं', subtitleEn: 'Latest notices and press releases', subtitleHi: 'नवीनतम सूचनाएं एवं प्रेस विज्ञप्ति', enabled: true, order: 7 },
  { id: 'gallery', titleEn: 'Photo Gallery', titleHi: 'फोटो गैलरी', subtitleEn: 'Highlights from state championships', subtitleHi: 'राज्य प्रतियोगिताओं की मुख्य झलकियां', enabled: true, order: 8 },
  { id: 'clubs', titleEn: 'Affiliated Clubs & Academies', titleHi: 'सम्बद्ध क्लब एवं अकादमियां', subtitleEn: 'Recognized roller skating centers in UP', subtitleHi: 'यूपी में मान्यता प्राप्त रोलर स्केटिंग केंद्र', enabled: true, order: 9 },
  { id: 'districts', titleEn: 'District Associations', titleHi: 'जिला संघ', subtitleEn: '75 affiliated districts across Uttar Pradesh', subtitleHi: 'उत्तर प्रदेश के 75 सम्बद्ध जिला संघ', enabled: true, order: 10 },
  { id: 'cta', titleEn: 'Join UPRSA Today', titleHi: 'आज ही यूपीआरएसए से जुड़ें', subtitleEn: 'Register as a skater or affiliate your club', subtitleHi: 'स्केटर पंजीकरण करें या अपने क्लब को सम्बद्ध कराएं', enabled: true, order: 11 },
  { id: 'footer', titleEn: 'Footer Navigation', titleHi: 'फुटर नेविगेशन', subtitleEn: 'Links and copyright info', subtitleHi: 'लिंक एवं कॉपीराइट जानकारी', enabled: true, order: 12 }
];

const defaultWebsiteContent: WebsiteContent[] = [
  {
    id: 'content-1',
    key: 'about_uprsa',
    section: 'about',
    titleEn: 'About Uttar Pradesh Roller Sports Association',
    titleHi: 'उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन के बारे में',
    contentEn: 'The Uttar Pradesh Roller Sports Association (UPRSA) is the official state governing body for roller skating, speed inline, quad, artistic skating, and roller hockey in Uttar Pradesh. Affiliated with the Roller Skating Federation of India (RSFI) and recognized by the UP Olympic Association, UPRSA nurtures athletic talent from all 75 districts of Uttar Pradesh.',
    contentHi: 'उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन (UPRSA) उत्तर प्रदेश में रोलर स्केटिंग, स्पीड इनलाइन, क्वाड, आर्टिस्टिक स्केटिंग एवं रोलर हॉकी की आधिकारिक राज्य शासी संस्था है। भारतीय रोलर स्केटिंग महासंघ (RSFI) से सम्बद्ध एवं यूपी ओलंपिक संघ द्वारा मान्यता प्राप्त, यूपीआरएसए राज्य के सभी 75 जिलों के खिलाड़ियों को बढ़ावा देता है।',
    imageUrl: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=800&auto=format&fit=crop&q=80',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'content-2',
    key: 'mission_vision',
    section: 'about',
    titleEn: 'Mission & Vision',
    titleHi: 'लक्ष्य एवं दृष्टिकोण',
    contentEn: 'Our mission is to build world-class roller sports infrastructure across Uttar Pradesh, provide transparent electronic timing and digital credentials to all skaters, and develop national and international medal winners for India.',
    contentHi: 'हमारा लक्ष्य संपूर्ण उत्तर प्रदेश में विश्वस्तरीय रोलर स्पोर्ट्स इंफ्रास्ट्रक्चर का निर्माण करना, सभी खिलाड़ियों को पारदर्शी इलेक्ट्रॉनिक टाइमिंग एवं डिजिटल क्रेडेंशियल प्रदान करना और भारत के लिए राष्ट्रीय एवं अंतर्राष्ट्रीय पदक विजेता तैयार करना है।',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=800&auto=format&fit=crop&q=80',
    updatedAt: new Date().toISOString()
  }
];

const defaultMediaLibrary: MediaItem[] = [
  {
    id: 'media-1',
    fileName: 'championship_hero.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=1200&auto=format&fit=crop&q=80',
    fileSize: 450000,
    fileType: 'image/jpeg',
    category: 'hero',
    uploadedAt: new Date().toISOString()
  },
  {
    id: 'media-2',
    fileName: 'podium_ceremony.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=1200&auto=format&fit=crop&q=80',
    fileSize: 380000,
    fileType: 'image/jpeg',
    category: 'gallery',
    uploadedAt: new Date().toISOString()
  },
  {
    id: 'media-3',
    fileName: 'speed_skating_sprint.jpg',
    fileUrl: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=1200&auto=format&fit=crop&q=80',
    fileSize: 510000,
    fileType: 'image/jpeg',
    category: 'gallery',
    uploadedAt: new Date().toISOString()
  }
];

const defaultCouncilMembers: CouncilMember[] = [
  {
    id: 'council-1',
    nameEn: 'Shri Rajeshwar Singh',
    nameHi: 'श्री राजेश्वर सिंह',
    designationEn: 'President',
    designationHi: 'अध्यक्ष',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    bioEn: 'Ex-IRS & Member, UP Sports Advisory Board',
    bioHi: 'पूर्व आईआरएस एवं सदस्य, यूपी खेल सलाहकार बोर्ड',
    displayOrder: 1,
    isActive: true
  },
  {
    id: 'council-2',
    nameEn: 'Shri Anoop Srivastava',
    nameHi: 'श्री अनूप श्रीवास्तव',
    designationEn: 'General Secretary',
    designationHi: 'महासचिव',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bioEn: 'RSFI International Certified Technical Official',
    bioHi: 'आरएसएफआई अंतर्राष्ट्रीय प्रमाणित तकनीकी अधिकारी',
    displayOrder: 2,
    isActive: true
  },
  {
    id: 'council-3',
    nameEn: 'Shri Sanjay Tyagi',
    nameHi: 'श्री संजय त्यागी',
    designationEn: 'Treasurer',
    designationHi: 'कोषाध्यक्ष',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    bioEn: 'Former Senior State Champion',
    bioHi: 'पूर्व वरिष्ठ राज्य चैंपियन',
    displayOrder: 3,
    isActive: true
  }
];

const defaultDisciplines: DisciplineItem[] = [
  {
    id: 'disc-1',
    titleEn: 'Speed Inline Skating',
    titleHi: 'स्पीड इनलाइन स्केटिंग',
    subtitleEn: 'High-Velocity Aerodynamic Racing',
    subtitleHi: 'उच्च गति वायुगतिकी रेसिंग',
    descriptionEn: 'Featuring 3-wheel and 4-wheel inline skates on 200m banked tracks, road circuits, and marathons reaching speeds over 50 km/h.',
    descriptionHi: '200 मीटर बैंक्ड ट्रैक, रोड सर्किट और मैराथन पर 3-व्हील और 4-व्हील इनलाइन स्केट के साथ 50 किमी/घंटा से अधिक की गति।',
    imageUrl: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=800&auto=format&fit=crop&q=80',
    eventsEn: ['100m Sprint', '500m Rink', '1000m Lap', '3000m Point-to-Point', '10,000m Elimination'],
    eventsHi: ['100 मीटर स्प्रिंट', '500 मीटर रिंक', '1000 मीटर लैप', '3000 मीटर प्वाइंट-टू-प्वाइंट', '10,000 मीटर एलिमिनेशन'],
    isActive: true,
    displayOrder: 1
  },
  {
    id: 'disc-2',
    titleEn: 'Speed Quad Skating',
    titleHi: 'स्पीड क्वाड स्केटिंग',
    subtitleEn: 'Traditional 4-Wheel Precision Racing',
    subtitleHi: 'पारंपरिक 4-व्हील सटीक रेसिंग',
    descriptionEn: 'The classic roller racing discipline tested on flat rinks requiring agility, tactical positioning, and intense stamina.',
    descriptionHi: 'सपाट रिंक पर क्लासिक रोलर रेसिंग अनुशासन जिसके लिए चपलता, सामरिक स्थिति और सहनशक्ति की आवश्यकता होती है।',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=800&auto=format&fit=crop&q=80',
    eventsEn: ['300m Time Trial', '500m Rink', '1000m Lap', '3000m Relay'],
    eventsHi: ['300 मीटर टाइम ट्रायल', '500 मीटर रिंक', '1000 मीटर लैप', '3000 मीटर रिले'],
    isActive: true,
    displayOrder: 2
  },
  {
    id: 'disc-3',
    titleEn: 'Roller Hockey & Inline Hockey',
    titleHi: 'रोलर हॉकी व इनलाइन हॉकी',
    subtitleEn: 'Team Contact & Precision Puck Control',
    subtitleHi: 'टीम संपर्क व पकी नियंत्रण',
    descriptionEn: 'Fast-paced, high-contact team sport played on hard courts with sticks, protective armor, and curved pucks or balls.',
    descriptionHi: 'हार्ड कोर्ट पर स्टिक, सुरक्षात्मक कवच और पकी या बॉल के साथ खेला जाने वाला तीव्र गति वाला टीम खेल।',
    imageUrl: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=800&auto=format&fit=crop&q=80',
    eventsEn: ['Senior Men Hockey', 'Senior Women Hockey', 'Sub-Junior Tournament'],
    eventsHi: ['सीनियर पुरुष हॉकी', 'सीनियर महिला हॉकी', 'सब-जूनियर टूर्नामेंट'],
    isActive: true,
    displayOrder: 3
  },
  {
    id: 'disc-4',
    titleEn: 'Inline Freestyle Slalom',
    titleHi: 'इनलाइन फ्रीस्टाइल स्लैलम',
    subtitleEn: 'Cone Maneuvers, Jumps & Tricks',
    subtitleHi: 'कोन युद्धाभ्यास, कूद और ट्रिक्स',
    descriptionEn: 'Artistic precision obstacle weaving between spaced cones choreographed to musical beats.',
    descriptionHi: 'संगीत की धुन पर कोरियोग्राफ किए गए शंकुओं के बीच कलात्मक बाधा बुनाई।',
    imageUrl: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=800&auto=format&fit=crop&q=80',
    eventsEn: ['Classic Slalom', 'Speed Slalom', 'Free Jump', 'Slides'],
    eventsHi: ['क्लासिक स्लैलम', 'स्पीड स्लैलम', 'फ्री जंप', 'स्लाइड्स'],
    isActive: true,
    displayOrder: 4
  },
  {
    id: 'disc-5',
    titleEn: 'Artistic Roller Skating',
    titleHi: 'आर्टिस्टिक रोलर स्केटिंग',
    subtitleEn: 'Choreographed Figures, Spins & Jumps',
    subtitleHi: 'कोरियोग्राफ किए गए चित्र, स्पिन और कूद',
    descriptionEn: 'Similar to figure skating on ice, featuring dance routines, pirouettes, loops, and pair performances on quads.',
    descriptionHi: 'बर्फ पर फिगर स्केटिंग के समान, जिसमें नृत्य दिनचर्या, पिरोएट्स, लूप्स और क्वाड्स पर युगल प्रदर्शन शामिल हैं।',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    eventsEn: ['Solo Dance', 'Free Skating', 'Pairs Dance', 'Precision Group'],
    eventsHi: ['सोलो डांस', 'फ्री स्केटिंग', 'पेयर्स डांस', 'प्रिसिजन ग्रुप'],
    isActive: true,
    displayOrder: 5
  },
  {
    id: 'disc-6',
    titleEn: 'Skateboarding & Park',
    titleHi: 'स्केटबोर्डिंग व पार्क',
    subtitleEn: 'Olympic Discipline Street & Bowl',
    subtitleHi: 'ओलंपिक खेल स्ट्रीट व बाउल',
    descriptionEn: 'Olympic sport focusing on street rails, ramps, bowl maneuvers, kickflips, and aerial tricks.',
    descriptionHi: 'स्ट्रीट रेल, रैंप, बाउल युद्धाभ्यास, किकफ्लिप और एरियल ट्रिक्स पर ध्यान केंद्रित करने वाला ओलंपिक खेल।',
    imageUrl: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=800&auto=format&fit=crop&q=80',
    eventsEn: ['Street Skateboarding', 'Park / Bowl', 'Best Trick'],
    eventsHi: ['स्ट्रीट स्केटबोर्डिंग', 'पार्क / बाउल', 'बेस्ट ट्रिक'],
    isActive: true,
    displayOrder: 6
  }
];

const defaultWebsiteSettings: WebsiteSettings = {
  id: 'settings-default',
  websiteNameEn: 'Uttar Pradesh Roller Sports Association (UPRSA)',
  websiteNameHi: 'उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन (UPRSA)',
  logoUrl: '/logo.png',
  logoSize: 96,
  faviconUrl: '/favicon.ico',
  primaryEmail: 'uprsa.official@gmail.com',
  primaryPhone: '+91 94150 11223',
  addressEn: 'UPRSA Headquarters, K.D. Singh Babu Stadium, Hazratganj, Lucknow, Uttar Pradesh - 226001',
  addressHi: 'यूपीआरएसए मुख्यालय, के.डी. सिंह बाबू स्टेडियम, हज़रतगंज, लखनऊ, उत्तर प्रदेश - 226001',
  defaultLanguage: 'en',
  maintenanceMode: false,
  socialLinks: {
    facebook: 'https://facebook.com/uprsa.official',
    twitter: 'https://twitter.com/uprsa_official',
    instagram: 'https://instagram.com/uprsa_official',
    youtube: 'https://youtube.com/@uprsa_official',
    linkedin: 'https://linkedin.com/company/uprsa',
    whatsapp: 'https://wa.me/919415011223'
  },
  copyrightTextEn: '© 2026 Uttar Pradesh Roller Sports Association (UPRSA). All rights reserved.',
  copyrightTextHi: '© 2026 उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन (UPRSA)। सर्वाधिकार सुरक्षित।',
  associationDescEn: 'Dedicated to promoting speed, accuracy, discipline, and sportsmanship in roller sports across Uttar Pradesh.',
  associationDescHi: 'उत्तर प्रदेश में रोलर स्पोर्ट्स में गति, सटीकता, अनुशासन और खेल भावना को बढ़ावा देने के लिए समर्पित।',
  badge1Text: 'RSFI Affiliated',
  badge2Text: 'UPOA Recognized',
  skatingDisciplines: [
    'Speed Inline Skating (100m - 10,000m)',
    'Speed Quad Skating',
    'Roller Hockey & Inline Hockey',
    'Inline Freestyle Slalom',
    'Artistic Roller Skating',
    'Skateboarding & Downhill'
  ],
  secretariatTitleEn: 'Central Secretariat',
  secretariatTitleHi: 'केंद्रीय सचिवालय',
  footerTaglineEn: 'Bilingual Sports Portal for Uttar Pradesh Roller Sports Association',
  footerTaglineHi: 'उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन हेतु द्विभाषी खेल पोर्टल',
  googleMapUrl: 'https://maps.google.com/?q=KD+Singh+Babu+Stadium+Lucknow',
  officeHoursEn: 'Mon - Sat: 09:30 AM - 06:00 PM',
  officeHoursHi: 'सोम - शनि: सुबह 09:30 से शाम 06:00 तक',
  liveMatchUrl: 'https://youtube.com/@uprsa_official/live',
  liveMatchTitleEn: 'Live Match',
  liveMatchTitleHi: 'लाइव मैच',
  isLiveMatchActive: true
};

const defaultEmailTemplates: EmailTemplate[] = [
  {
    id: 'tpl-1',
    key: 'registration_received',
    nameEn: 'Registration Received (पंजीकरण प्राप्त हुआ)',
    nameHi: 'पंजीकरण प्राप्त हुआ',
    subjectEn: 'UPRSA Skater Registration Received – {{application_number}}',
    subjectHi: 'UPRSA स्केटर पंजीकरण आवेदन प्राप्त हुआ – {{application_number}}',
    bodyEn: `Dear {{skater_name}},

Your skater registration application has been successfully received by Uttar Pradesh Roller Sports Association (UPRSA).

Application Number: {{application_number}}
Skater Name: {{skater_name}}
District: {{district}}
Club / Academy: {{club}}
Discipline: {{discipline}}
Current Status: PENDING VERIFICATION

Your registration is subject to document verification and approval by UPRSA. You can track your application status anytime at: {{portal_url}}

Regards,
Uttar Pradesh Roller Sports Association (UPRSA)`,
    bodyHi: `प्रिय {{skater_name}},

उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन (UPRSA) द्वारा आपका स्केटर पंजीकरण आवेदन सफलतापूर्वक प्राप्त कर लिया गया है।

आवेदन संख्या: {{application_number}}
स्केटर का नाम: {{skater_name}}
जिला: {{district}}
क्लब: {{club}}
अनुशासन: {{discipline}}
वर्तमान स्थिति: सत्यापन हेतु लंबित (PENDING VERIFICATION)

आपका आवेदन UPRSA द्वारा दस्तावेजों के सत्यापन के अधीन है। आप अपना आवेदन स्थिति यहाँ ट्रैक कर सकते हैं: {{portal_url}}

सादर,
उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन`,
    variables: ['skater_name', 'application_number', 'district', 'club', 'discipline', 'status', 'portal_url']
  },
  {
    id: 'tpl-2',
    key: 'registration_under_review',
    nameEn: 'Registration Under Review (पंजीकरण समीक्षाधीन)',
    nameHi: 'पंजीकरण समीक्षाधीन',
    subjectEn: 'UPRSA Registration Under Verification – {{application_number}}',
    subjectHi: 'UPRSA स्केटर पंजीकरण सत्यापन प्रक्रियाधीन – {{application_number}}',
    bodyEn: `Dear {{skater_name}},

Your UPRSA registration application {{application_number}} is currently under verification by officials.

District: {{district}}
Club: {{club}}

You will receive a notification once verification is complete.

Regards,
UPRSA State Association`,
    bodyHi: `प्रिय {{skater_name}},

आपका UPRSA पंजीकरण आवेदन {{application_number}} इस समय अधिकारियों द्वारा सत्यापन प्रक्रिया में है।

जिला: {{district}}
क्लब: {{club}}

सत्यापन पूर्ण होते ही आपको ईमेल द्वारा सूचित कर दिया जाएगा।

सादर,
UPRSA राज्य एसोसिएशन`,
    variables: ['skater_name', 'application_number', 'district', 'club', 'portal_url']
  },
  {
    id: 'tpl-3',
    key: 'registration_approved',
    nameEn: 'Registration Approved & Account Activation (पंजीकरण स्वीकृत एवं खाता सक्रियण)',
    nameHi: 'पंजीकरण स्वीकृत एवं खाता सक्रियण',
    subjectEn: 'UPRSA Registration Approved & Account Activation – {{registration_number}}',
    subjectHi: 'UPRSA स्केटर पंजीकरण स्वीकृत एवं खाता सक्रियण – {{registration_number}}',
    bodyEn: `Dear {{skater_name}},

Congratulations! Your registration with the Uttar Pradesh Roller Sports Association (UPRSA) has been APPROVED.

Registration Number: {{registration_number}}
Application Number: {{application_number}}
District: {{district}}
Club / Academy: {{club}}
Discipline: {{discipline}}
Status: APPROVED

ACCOUNT ACTIVATION:
To activate your Skater Portal account and set your own secure password, please click the link below:
{{activation_link}}

Once your password is set, you can log in to access your official Registration PDF, Digital ID Card, tournament entries, and certificates.

Regards,
Uttar Pradesh Roller Sports Association (UPRSA)`,
    bodyHi: `प्रिय {{skater_name}},

बधाई हो! उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन (UPRSA) द्वारा आपका स्केटर पंजीकरण स्वीकृत कर दिया गया है।

पंजीकरण संख्या: {{registration_number}}
आवेदन संख्या: {{application_number}}
जिला: {{district}}
क्लब / अकादमी: {{club}}
अनुशासन: {{discipline}}
स्थिति: स्वीकृत (APPROVED)

खाता सक्रियण:
अपने स्केटर पोर्टल खाते को सक्रिय करने और अपना सुरक्षित पासवर्ड सेट करने के लिए, कृपया नीचे दिए गए लिंक पर क्लिक करें:
{{activation_link}}

पासवर्ड सेट होने के बाद, आप अपना पंजीकरण पीडीएफ, डिजिटल आईडी कार्ड और प्रतियोगिता परिणाम देखने के लिए लॉगिन कर सकते हैं।

सादर,
उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन (UPRSA)`,
    variables: ['skater_name', 'registration_number', 'application_number', 'district', 'club', 'discipline', 'activation_link', 'portal_url']
  },
  {
    id: 'tpl-4',
    key: 'registration_rejected',
    nameEn: 'Registration Rejected (पंजीकरण निरस्त)',
    nameHi: 'पंजीकरण निरस्त',
    subjectEn: 'UPRSA Registration Application Update – {{application_number}}',
    subjectHi: 'UPRSA स्केटर आवेदन स्थिति अपडेट – {{application_number}}',
    bodyEn: `Dear {{skater_name}},

Your skater registration application {{application_number}} has been reviewed by UPRSA officials and could not be approved at this time.

Reason for Rejection:
{{rejection_reason}}

Please contact your District Association Secretary or log in to submit corrected documents.

Regards,
Uttar Pradesh Roller Sports Association`,
    bodyHi: `प्रिय {{skater_name}},

आपके स्केटर पंजीकरण आवेदन {{application_number}} की UPRSA अधिकारियों द्वारा समीक्षा की गई है और वर्तमान में इसे स्वीकृत नहीं किया जा सका है।

अस्वीकृति का कारण:
{{rejection_reason}}

कृपया सुधार करने के लिए अपने जिला एसोसिएशन सचिव से संपर्क करें अथवा सही दस्तावेज पुनः अपलोड करें।

सादर,
उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन`,
    variables: ['skater_name', 'application_number', 'rejection_reason', 'district', 'portal_url']
  },
  {
    id: 'tpl-5',
    key: 'password_reset',
    nameEn: 'Password Reset (पासवर्ड रीसेट)',
    nameHi: 'पासवर्ड रीसेट',
    subjectEn: 'UPRSA Skater Portal Password Reset',
    subjectHi: 'UPRSA स्केटर पोर्टल पासवर्ड रीसेट',
    bodyEn: `Dear {{skater_name}},

A password reset was requested for your UPRSA Skater Portal account.

Login ID: {{login_id}}
New Temporary Password: {{temp_password}}

Please log in at {{portal_url}} and update your password immediately.

Regards,
UPRSA Support`,
    bodyHi: `प्रिय {{skater_name}},

आपके UPRSA स्केटर पोर्टल खाते के लिए पासवर्ड रीसेट का अनुरोध किया गया था।

लॉगिन आईडी: {{login_id}}
नया अस्थायी पासवर्ड: {{temp_password}}

कृपया {{portal_url}} पर लॉगिन करें और तुरंत अपना पासवर्ड बदलें।

सादर,
UPRSA सपोर्ट`,
    variables: ['skater_name', 'login_id', 'temp_password', 'portal_url']
  }
];

const defaultEmailLogs: EmailLog[] = [
  {
    id: 'log-sample-1',
    recipient: 'aarav.sharma@gmail.com',
    emailType: 'registration_approved',
    subject: 'UPRSA Registration Approved – UPRSA/2026/01001',
    sentAt: '2026-08-10T01:00:00Z',
    status: 'SENT',
    skaterId: 'skater-1',
    applicationNumber: 'UPRSA-APP-2026-000001'
  }
];

const defaultPaymentSettings: PaymentSettings = {
  id: 'pay-settings-1',
  upiId: 'uprsa@upi',
  upiDisplayName: 'Uttar Pradesh Roller Sports Association',
  qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=uprsa@upi%26pn=Uttar%20Pradesh%20Roller%20Sports%20Association%26cu=INR',
  paymentInstructions: '1. Scan QR Code using any UPI App (Google Pay, PhonePe, Paytm, BHIM).\n2. Pay exact registration amount.\n3. Note down UTR / Transaction ID.\n4. Upload payment screenshot (compressed under 15 KB).\n5. Submit for manual verification by UPRSA Admin.',
  supportPhone: '+91 94150 11223',
  supportEmail: 'payments@uprsa.org',
  paymentEnabled: true,
  defaultTournamentFee: 500,
  updatedAt: new Date().toISOString()
};

const defaultTournamentPayments: TournamentPayment[] = [
  {
    id: 'pay-sample-1',
    registrationId: 'reg-1',
    skaterId: 'skater-1',
    skaterName: 'Aarav Sharma',
    registrationNumber: 'UPRSA/2026/01001',
    districtName: 'Lucknow',
    clubName: 'Lucknow Roller Skating Academy',
    tournamentId: 'tour-1',
    tournamentName: '37th UP State Roller Skating Championship 2026',
    amount: 500,
    currency: 'INR',
    paymentMethod: 'UPI_QR',
    upiId: 'uprsa@upi',
    utrNumber: '422158901234',
    transactionDate: '2026-08-11T10:30:00Z',
    screenshotStoragePath: 'payment-proofs/skater-1/pay-sample-1.webp',
    status: 'VERIFIED',
    submittedAt: '2026-08-11T10:35:00Z',
    verifiedAt: '2026-08-11T11:00:00Z',
    verifiedBy: 'admin-1',
    createdAt: '2026-08-11T10:35:00Z'
  }
];

const defaultCommunityPosts: CommunityChatPost[] = [
  {
    id: 'post-1',
    authorName: 'UPRSA हेल्पडेस्क (Official Desk)',
    authorRole: 'official',
    district: 'Lucknow',
    clubName: 'UP State Association',
    message: 'उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन के लाइव चैट व कम्युनिटी बोर्ड में आपका स्वागत है! यहां खिलाड़ी, कोच व अभिभावक खेल नियम, प्रतियोगिता शेड्यूल व टिप्स पर चर्चा कर सकते हैं।',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    likes: 24,
    category: 'general',
    isPinned: true,
    isOfficial: true,
    isVerified: true
  },
  {
    id: 'post-2',
    authorName: 'Coach Rajat Verma',
    authorRole: 'coach',
    district: 'Gautam Buddha Nagar (Noida)',
    clubName: 'Noida Speed Skaters Club',
    message: 'सभी स्पीड इनलाइन और क्वाड स्केटर्स ध्यान दें: आगामी राज्य स्तरीय चैंपियनशिप के लिए रोजाना ट्रैक वॉर्म-अप और लैप टाइमिंग पर विशेष ध्यान दें। बेस्ट ऑफ लक!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    likes: 19,
    category: 'training',
    isVerified: true
  },
  {
    id: 'post-3',
    authorName: 'Pooja Srivastava (Parent)',
    authorRole: 'parent',
    district: 'Kanpur Nagar',
    message: 'ऑनलाइन रजिस्ट्रेशन बहुत आसान और तेज़ है। फोटो और आधार अपलोड करने के तुरंत बाद डिजिटल आईडी कार्ड जनरेट हो गया। UPRSA टीम का धन्यवाद!',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    likes: 14,
    category: 'general'
  },
  {
    id: 'post-4',
    authorName: 'Aarav Sharma (Skater #101)',
    authorRole: 'skater',
    district: 'Lucknow',
    clubName: 'Lucknow Roller Skating Academy',
    message: 'के.डी. सिंह बाबू स्टेडियम में होने वाले 1000m और 3000m रिंक रेस के लिए पूरी तैयारी है। क्या वाराणसी और गाजियाबाद के स्केटर्स आ रहे हैं?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    likes: 18,
    category: 'tournament'
  }
];

export const defaultChatBoardSettings: ChatBoardSettings = {
  welcomeMessageEn: 'Welcome to the Official UPRSA AI Skating Support Desk! ⛸️\n\nAsk any question regarding skater registration, age categories, upcoming championships, Speed Inline/Quad rules, or results & certificates.',
  welcomeMessageHi: 'नमस्ते! उत्तर प्रदेश रोलर स्पोर्ट्स संघ (UPRSA) के आधिकारिक AI चैट डेस्क में आपका स्वागत है। ⛸️\n\nआप स्केटिंग पंजीकरण, जन्मतिथि से आयु वर्ग (Age Category), आगामी प्रतियोगिताएं, स्पीड इनलाइन/क्वाड नियम या रिजल्ट के बारे में कोई भी प्रश्न पूछ सकते हैं।',
  quickQuestionsEn: [
    'How to register as a skater?',
    'What are the Age Category cut-offs?',
    'Difference between Speed Inline & Speed Quad?',
    'How to pay tournament fee online?',
    'How to download digital merit certificate?'
  ],
  quickQuestionsHi: [
    'रजिस्ट्रेशन कैसे करें?',
    'Age Category के क्या नियम हैं?',
    'स्पीड इनलाइन व क्वाड में क्या अंतर है?',
    'प्रतियोगिता फीस कैसे जमा करें?',
    'डिजिटल सर्टिफिकेट कैसे डाउनलोड करें?'
  ],
  whatsappSupportNumber: '+919415011223',
  supportPhone: '+91 94150 11223',
  supportPhone2: '+91 94150 11224',
  supportEmail: 'uprsa.official@gmail.com',
  supportHoursEn: 'Monday - Saturday: 9:00 AM to 6:00 PM IST',
  supportHoursHi: 'सोमवार से शनिवार: प्रातः 9:00 से सायं 6:00 बजे तक',
  aiBotEnabled: true,
  communityBoardEnabled: true,
  allowGuestPosts: true,
  pinnedAnnouncementEn: 'UP State Roller Skating Championship 2026 registration is live! Check Tournaments tab for event schedule.',
  pinnedAnnouncementHi: 'यूपी राज्य स्तरीय रोलर स्केटिंग चैंपियनशिप 2026 पंजीकरण प्रारंभ! इवेंट शेड्यूल हेतु टूर्नामेंट टैब देखें।',

  // Helpdesk Info Defaults
  helpdeskSecretariatTitle: 'उत्तर प्रदेश रोलर स्पोर्ट्स एसोसिएशन (UPRSA) सचिवालय',
  helpdeskSecretariatDesc: 'उत्तर प्रदेश में रोलर स्केटिंग, स्पीड, इनलाइन, क्वाड और हॉकी का आधिकारिक राज्य नियामक संघ (Affiliated to Roller Skating Federation of India & Recognized by UP Olympic Association).',
  helpdeskWhatsappTitle: 'आधिकारिक व्हाट्सएप हेल्पडेस्क',
  helpdeskWhatsappDesc: 'पंजीकरण, आईडी कार्ड या परिणाम संबंधित तुरंत सहायता के लिए व्हाट्सएप पर संदेश भेजें।',
  helpdeskLucknowTitle: 'राज्य मुख्यालय (Lucknow)',
  helpdeskLucknowAddress: 'के.डी. सिंह बाबू स्टेडियम स्केटिंग कॉम्प्लेक्स, हज़रतगंज, लखनऊ, उत्तर प्रदेश - 226001',
  helpdeskLucknowPhones: '+91 94150 11223 / +91 94150 11224',
  helpdeskWesternTitle: 'वेस्टर्न यूपी केंद्र (Noida)',
  helpdeskWesternAddress: 'सेक्टर 21-A नोएडा स्पोर्ट्स कॉम्प्लेक्स, स्टेडियम रोड, नोएडा, उत्तर प्रदेश - 201301',
  helpdeskWesternPhone: '+91 98110 33445',
  helpdeskEmailTitle: 'ईमेल सहायता',
  helpdeskEmailDesc: 'आधिकारिक पत्राचार और क्लब मान्यता हेतु ईमेल भेजें।',

  updatedAt: new Date().toISOString()
};

class UPRSAStore {
  private districts: District[] = getLocal('districts', defaultDistricts);
  private clubs: Club[] = getLocal('clubs', defaultClubs);
  private skaters: Skater[] = getLocal('skaters', defaultSkaters);
  private ageGroupRules: AgeGroupRule[] = getLocal('ageGroupRules', defaultAgeGroupRules);
  private skaterDocuments: SkaterDocument[] = getLocal('skaterDocuments', []);
  private tournaments: Tournament[] = getLocal('tournaments', defaultTournaments);
  private events: TournamentEvent[] = getLocal('events', defaultEvents);
  private registrations: TournamentRegistration[] = getLocal('registrations', defaultRegistrations);
  private results: TournamentResult[] = getLocal('results', defaultResults);
  private pointRules: PointRule[] = getLocal('pointRules', defaultPointRules);
  private certificates: Certificate[] = getLocal('certificates', defaultCertificates);
  private certificateTemplate: CertificateTemplate = getLocal('certificateTemplate', defaultCertificateTemplate);
  private announcements: Announcement[] = getLocal('announcements', defaultAnnouncements);
  private gallery: GalleryItem[] = getLocal('gallery', defaultGallery);
  private heroSlides: HeroSlide[] = getLocal('heroSlides', defaultHeroSlides);
  private homeSections: HomeSection[] = getLocal('homeSections', defaultHomeSections);
  private websiteContent: WebsiteContent[] = getLocal('websiteContent', defaultWebsiteContent);
  private mediaLibrary: MediaItem[] = getLocal('mediaLibrary', defaultMediaLibrary);
  private councilMembers: CouncilMember[] = getLocal('councilMembers', defaultCouncilMembers);
  private disciplines: DisciplineItem[] = getLocal('disciplines', defaultDisciplines);
  private websiteSettings: WebsiteSettings = getLocal('websiteSettings', defaultWebsiteSettings);
  private races: Race[] = getLocal('races', defaultRaces);
  private raceParticipants: RaceParticipant[] = getLocal('raceParticipants', defaultRaceParticipants);
  private raceResults: RaceResult[] = getLocal('raceResults', defaultRaceResults);
  private scoreboardState: ScoreboardState = getLocal('scoreboardState', defaultScoreboardState);
  private emailTemplates: EmailTemplate[] = getLocal('emailTemplates', defaultEmailTemplates);
  private emailLogs: EmailLog[] = getLocal('emailLogs', defaultEmailLogs);
  private paymentSettings: PaymentSettings = getLocal('paymentSettings', defaultPaymentSettings);
  private tournamentPayments: TournamentPayment[] = getLocal('tournamentPayments', defaultTournamentPayments);
  private communityPosts: CommunityChatPost[] = getLocal('communityPosts', defaultCommunityPosts);
  private chatBoardSettings: ChatBoardSettings = getLocal('chatBoardSettings', defaultChatBoardSettings);
  private adminCredentials: AdminCredentials = getLocal<AdminCredentials>('adminCredentials', {
    username: 'admin',
    email: 'uprsa.official@gmail.com',
    password: 'admin',
    updatedAt: new Date().toISOString()
  });

  private listeners: (() => void)[] = [];

  constructor() {
    // 1. Clean up any oversized/legacy localStorage keys immediately
    cleanupLegacyAndOversizeLocalStorage();

    if (!this.adminCredentials?.email || this.adminCredentials.email === 'admin@uprsa.org') {
      this.adminCredentials.email = 'uprsa.official@gmail.com';
    }
    if (!this.websiteSettings?.primaryEmail || this.websiteSettings.primaryEmail === 'info@uprsa.org') {
      this.websiteSettings.primaryEmail = 'uprsa.official@gmail.com';
    }
    this.ensureAllSkatersHaveBibNumber();
    this.ensureAaravSharmaFourRacesData();
    this.ensureAnanyaVermaThreeRacesData();
    this.refreshCountsAndPoints();

    // 2. Asynchronously hydrate from IndexedDB if stored data exists
    this.hydrateFromIndexedDB();
  }

  private async hydrateFromIndexedDB(): Promise<void> {
    try {
      const [
        heroSlides,
        gallery,
        websiteContent,
        skaterDocuments,
        races,
        raceResults,
        scoreboardState
      ] = await Promise.all([
        getIdbItem<HeroSlide[] | null>('heroSlides', null),
        getIdbItem<GalleryItem[] | null>('gallery', null),
        getIdbItem<WebsiteContent[] | null>('websiteContent', null),
        getIdbItem<SkaterDocument[] | null>('skaterDocuments', null),
        getIdbItem<Race[] | null>('races', null),
        getIdbItem<RaceResult[] | null>('raceResults', null),
        getIdbItem<ScoreboardState | null>('scoreboardState', null)
      ]);

      let hasUpdated = false;
      if (heroSlides && heroSlides.length > 0) {
        this.heroSlides = heroSlides;
        hasUpdated = true;
      }
      if (gallery && gallery.length > 0) {
        this.gallery = gallery;
        hasUpdated = true;
      }
      if (websiteContent && websiteContent.length > 0) {
        this.websiteContent = websiteContent;
        hasUpdated = true;
      }
      if (skaterDocuments && skaterDocuments.length > 0) {
        this.skaterDocuments = skaterDocuments;
        hasUpdated = true;
      }
      if (races && races.length > 0) {
        this.races = races;
        hasUpdated = true;
      }
      if (raceResults && raceResults.length > 0) {
        this.raceResults = raceResults;
        hasUpdated = true;
      }
      if (scoreboardState) {
        this.scoreboardState = scoreboardState;
        hasUpdated = true;
      }

      if (hasUpdated) {
        this.notify();
      }
    } catch (err) {
      // Non-fatal fallback
    }
  }

  private ensureAaravSharmaFourRacesData(): void {
    const aaravTour1RaceResults = this.raceResults.filter(
      r => (r.skaterId === 'skater-1' || r.skaterName?.toLowerCase().includes('aarav sharma')) && r.tournamentId === 'tour-1'
    );
    if (aaravTour1RaceResults.length < 4) {
      const aaravRace4Data: RaceResult[] = [
        {
          id: 'rres-aarav-1',
          tournamentId: 'tour-1',
          eventId: 'event-1',
          raceId: 'race-1',
          participantId: 'part-1',
          skaterId: 'skater-1',
          skaterName: 'Aarav Sharma',
          registrationNumber: 'UPRSA/2026/01001',
          districtName: 'Lucknow',
          clubName: 'Lucknow Roller Skating Academy',
          bibNumber: '101',
          discipline: 'Speed Inline',
          ageGroup: 'Sub-Junior (12-15 Years)',
          gender: 'Male',
          rawTiming: '00:42.18',
          penaltySeconds: 0,
          finalTiming: '00:42.18',
          score: 0,
          position: 1,
          points: 5,
          medal: 'Gold',
          status: 'VALID',
          approvalStatus: 'Published',
          remarks: '500m Rink Race - Gold Medal',
          createdAt: '2026-08-10T10:30:00Z',
          updatedAt: '2026-08-10T10:30:00Z'
        },
        {
          id: 'rres-aarav-2',
          tournamentId: 'tour-1',
          eventId: 'event-aarav-1000',
          raceId: 'race-1000m',
          participantId: 'part-aarav-2',
          skaterId: 'skater-1',
          skaterName: 'Aarav Sharma',
          registrationNumber: 'UPRSA/2026/01001',
          districtName: 'Lucknow',
          clubName: 'Lucknow Roller Skating Academy',
          bibNumber: '101',
          discipline: 'Speed Inline',
          ageGroup: 'Sub-Junior (12-15 Years)',
          gender: 'Male',
          rawTiming: '01:28.45',
          penaltySeconds: 0,
          finalTiming: '01:28.45',
          score: 0,
          position: 1,
          points: 5,
          medal: 'Gold',
          status: 'VALID',
          approvalStatus: 'Published',
          remarks: '1000m Lap Race - Gold Medal',
          createdAt: '2026-08-10T11:15:00Z',
          updatedAt: '2026-08-10T11:15:00Z'
        },
        {
          id: 'rres-aarav-3',
          tournamentId: 'tour-1',
          eventId: 'event-aarav-1500',
          raceId: 'race-1500m',
          participantId: 'part-aarav-3',
          skaterId: 'skater-1',
          skaterName: 'Aarav Sharma',
          registrationNumber: 'UPRSA/2026/01001',
          districtName: 'Lucknow',
          clubName: 'Lucknow Roller Skating Academy',
          bibNumber: '101',
          discipline: 'Speed Inline',
          ageGroup: 'Sub-Junior (12-15 Years)',
          gender: 'Male',
          rawTiming: '02:15.10',
          penaltySeconds: 0,
          finalTiming: '02:15.10',
          score: 0,
          position: 2,
          points: 3,
          medal: 'Silver',
          status: 'VALID',
          approvalStatus: 'Published',
          remarks: '1500m Road Race - Silver Medal',
          createdAt: '2026-08-10T12:00:00Z',
          updatedAt: '2026-08-10T12:00:00Z'
        },
        {
          id: 'rres-aarav-4',
          tournamentId: 'tour-1',
          eventId: 'event-aarav-3000',
          raceId: 'race-3000m',
          participantId: 'part-aarav-4',
          skaterId: 'skater-1',
          skaterName: 'Aarav Sharma',
          registrationNumber: 'UPRSA/2026/01001',
          districtName: 'Lucknow',
          clubName: 'Lucknow Roller Skating Academy',
          bibNumber: '101',
          discipline: 'Speed Inline',
          ageGroup: 'Sub-Junior (12-15 Years)',
          gender: 'Male',
          rawTiming: '04:50.00',
          penaltySeconds: 0,
          finalTiming: '04:50.00',
          score: 0,
          position: 1,
          points: 5,
          medal: 'Gold',
          status: 'VALID',
          approvalStatus: 'Published',
          remarks: '3000m Point-to-Point - Gold Medal',
          createdAt: '2026-08-10T12:45:00Z',
          updatedAt: '2026-08-10T12:45:00Z'
        }
      ];

      this.raceResults = this.raceResults.filter(
        r => !(r.tournamentId === 'tour-1' && (r.skaterId === 'skater-1' || r.skaterName?.toLowerCase().includes('aarav sharma')))
      );
      this.raceResults.push(...aaravRace4Data);

      this.results = this.results.filter(
        r => !(r.tournamentId === 'tour-1' && (r.skaterId === 'skater-1' || r.skaterName?.toLowerCase().includes('aarav sharma')))
      );
      aaravRace4Data.forEach(r => this.syncPublishedResultToGlobal(r));

      this.persistAll();
    }
  }

  private ensureAnanyaVermaThreeRacesData(): void {
    const ananyaTour1RaceResults = this.raceResults.filter(
      r => (r.skaterId === 'skater-2' || r.skaterName?.toLowerCase().includes('ananya verma')) && r.tournamentId === 'tour-1'
    );
    if (ananyaTour1RaceResults.length < 3) {
      const ananyaRace3Data: RaceResult[] = [
        {
          id: 'rres-ananya-1',
          tournamentId: 'tour-1',
          eventId: 'event-ananya-500',
          raceId: 'race-ananya-500m',
          participantId: 'part-ananya-1',
          skaterId: 'skater-2',
          skaterName: 'Ananya Verma',
          registrationNumber: 'UPRSA/2026/01002',
          districtName: 'Gautam Buddha Nagar (Noida)',
          clubName: 'Noida Speed Skaters Club',
          bibNumber: '202',
          discipline: 'Speed Quad',
          ageGroup: 'Junior (15-18 Years)',
          gender: 'Female',
          rawTiming: '00:52.00',
          penaltySeconds: 0,
          finalTiming: '00:52.00',
          score: 0,
          position: 1,
          points: 5,
          medal: 'Gold',
          status: 'VALID',
          approvalStatus: 'Published',
          remarks: '500m Quad Race - Gold Medal',
          createdAt: '2026-08-10T10:30:00Z',
          updatedAt: '2026-08-10T10:30:00Z'
        },
        {
          id: 'rres-ananya-2',
          tournamentId: 'tour-1',
          eventId: 'event-2',
          raceId: 'race-qd-1000m',
          participantId: 'part-ananya-2',
          skaterId: 'skater-2',
          skaterName: 'Ananya Verma',
          registrationNumber: 'UPRSA/2026/01002',
          districtName: 'Gautam Buddha Nagar (Noida)',
          clubName: 'Noida Speed Skaters Club',
          bibNumber: '202',
          discipline: 'Speed Quad',
          ageGroup: 'Junior (15-18 Years)',
          gender: 'Female',
          rawTiming: '01:38.45',
          penaltySeconds: 0,
          finalTiming: '01:38.45',
          score: 0,
          position: 1,
          points: 5,
          medal: 'Gold',
          status: 'VALID',
          approvalStatus: 'Published',
          remarks: '1000m Quad Lap Race - Gold Medal',
          createdAt: '2026-08-10T11:15:00Z',
          updatedAt: '2026-08-10T11:15:00Z'
        },
        {
          id: 'rres-ananya-3',
          tournamentId: 'tour-1',
          eventId: 'event-ananya-1500',
          raceId: 'race-ananya-1500m',
          participantId: 'part-ananya-3',
          skaterId: 'skater-2',
          skaterName: 'Ananya Verma',
          registrationNumber: 'UPRSA/2026/01002',
          districtName: 'Gautam Buddha Nagar (Noida)',
          clubName: 'Noida Speed Skaters Club',
          bibNumber: '202',
          discipline: 'Speed Quad',
          ageGroup: 'Junior (15-18 Years)',
          gender: 'Female',
          rawTiming: '02:22.10',
          penaltySeconds: 0,
          finalTiming: '02:22.10',
          score: 0,
          position: 2,
          points: 3,
          medal: 'Silver',
          status: 'VALID',
          approvalStatus: 'Published',
          remarks: '1500m Quad Road Race - Silver Medal',
          createdAt: '2026-08-10T12:00:00Z',
          updatedAt: '2026-08-10T12:00:00Z'
        }
      ];

      this.raceResults = this.raceResults.filter(
        r => !(r.tournamentId === 'tour-1' && (r.skaterId === 'skater-2' || r.skaterName?.toLowerCase().includes('ananya verma')))
      );
      this.raceResults.push(...ananyaRace3Data);

      this.results = this.results.filter(
        r => !(r.tournamentId === 'tour-1' && (r.skaterId === 'skater-2' || r.skaterName?.toLowerCase().includes('ananya verma')))
      );
      ananyaRace3Data.forEach(r => this.syncPublishedResultToGlobal(r));

      this.persistAll();
    }
  }

  public getOrAssignSkaterBibNumber(skaterOrId: string | Skater): string {
    let skater: Skater | undefined;
    if (typeof skaterOrId === 'string') {
      skater = this.skaters.find(s => s.id === skaterOrId || s.registrationNumber === skaterOrId || s.applicationNumber === skaterOrId);
    } else {
      skater = skaterOrId;
    }

    if (!skater) return '101';

    // 1. Return existing assigned BIB if present
    if (skater.bibNumber && skater.bibNumber.trim() !== '') {
      return skater.bibNumber.trim();
    }

    // 2. Check existing registrations for this skater ID
    const existingReg = this.registrations.find(r => r.skaterId === skater?.id && r.bibNumber && r.bibNumber.trim() !== '');
    if (existingReg && existingReg.bibNumber) {
      skater.bibNumber = existingReg.bibNumber;
      this.persistAll();
      return skater.bibNumber;
    }

    // 3. Generate unique fixed BIB number based on registration number digits or auto-increment
    const usedBibs = new Set(
      this.skaters
        .map(s => s.bibNumber)
        .filter((b): b is string => Boolean(b && b.trim() !== ''))
    );

    let assignedBib = '';
    if (skater.registrationNumber) {
      const matches = skater.registrationNumber.match(/\d+/g);
      if (matches && matches.length > 0) {
        const lastDigits = matches[matches.length - 1];
        const numVal = parseInt(lastDigits, 10);
        if (!isNaN(numVal) && numVal > 0) {
          const candidate = String(numVal);
          if (!usedBibs.has(candidate)) {
            assignedBib = candidate;
          }
        }
      }
    }

    if (!assignedBib) {
      let candidateNum = 101;
      while (usedBibs.has(String(candidateNum))) {
        candidateNum++;
      }
      assignedBib = String(candidateNum);
    }

    skater.bibNumber = assignedBib;
    const idx = this.skaters.findIndex(s => s.id === skater?.id);
    if (idx !== -1) {
      this.skaters[idx].bibNumber = assignedBib;
    }

    this.persistAll();
    return assignedBib;
  }

  private ensureAllSkatersHaveBibNumber() {
    let changed = false;
    const usedBibs = new Set<string>();

    // First pass: collect existing bibNumbers
    this.skaters.forEach(s => {
      if (s.bibNumber && s.bibNumber.trim() !== '') {
        usedBibs.add(s.bibNumber.trim());
      }
    });

    // Second pass: assign bibNumbers to skaters who lack one
    this.skaters = this.skaters.map(s => {
      if (!s.bibNumber || s.bibNumber.trim() === '') {
        changed = true;
        let bib = '';

        // Check if any existing registration has a bibNumber
        const reg = this.registrations.find(r => r.skaterId === s.id && r.bibNumber && r.bibNumber.trim() !== '');
        if (reg?.bibNumber && !usedBibs.has(reg.bibNumber)) {
          bib = reg.bibNumber;
        }

        if (!bib && s.registrationNumber) {
          const matches = s.registrationNumber.match(/\d+/g);
          if (matches && matches.length > 0) {
            const numVal = parseInt(matches[matches.length - 1], 10);
            if (!isNaN(numVal) && numVal > 0 && !usedBibs.has(String(numVal))) {
              bib = String(numVal);
            }
          }
        }

        if (!bib) {
          let nextNum = 101;
          while (usedBibs.has(String(nextNum))) {
            nextNum++;
          }
          bib = String(nextNum);
        }

        usedBibs.add(bib);
        return { ...s, bibNumber: bib };
      }
      return s;
    });

    // Synchronize registrations, race participants, and race results to match skater bibNumber
    this.skaters.forEach(s => {
      if (s.bibNumber) {
        this.registrations.forEach(r => {
          if (r.skaterId === s.id && r.bibNumber !== s.bibNumber) {
            r.bibNumber = s.bibNumber;
            changed = true;
          }
        });
        this.raceParticipants.forEach(p => {
          if (p.skaterId === s.id && p.bibNumber !== s.bibNumber) {
            p.bibNumber = s.bibNumber;
            changed = true;
          }
        });
        this.raceResults.forEach(res => {
          if (res.skaterId === s.id && res.bibNumber !== s.bibNumber) {
            res.bibNumber = s.bibNumber;
            changed = true;
          }
        });
        this.results.forEach(res => {
          if (res.skaterId === s.id && res.bibNumber !== s.bibNumber) {
            res.bibNumber = s.bibNumber;
            changed = true;
          }
        });
      }
    });

    if (changed) {
      this.persistAll();
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  private persistAll() {
    setLocal('districts', this.districts);
    setLocal('clubs', this.clubs);
    setLocal('skaters', this.skaters);
    setLocal('ageGroupRules', this.ageGroupRules);
    setLocal('skaterDocuments', this.skaterDocuments);
    setLocal('tournaments', this.tournaments);
    setLocal('events', this.events);
    setLocal('registrations', this.registrations);
    setLocal('results', this.results);
    setLocal('pointRules', this.pointRules);
    setLocal('certificates', this.certificates);
    setLocal('certificateTemplate', this.certificateTemplate);
    setLocal('announcements', this.announcements);
    setLocal('gallery', this.gallery);
    setLocal('heroSlides', this.heroSlides);
    setLocal('homeSections', this.homeSections);
    setLocal('websiteContent', this.websiteContent);
    setLocal('mediaLibrary', this.mediaLibrary);
    setLocal('councilMembers', this.councilMembers);
    setLocal('disciplines', this.disciplines);
    setLocal('websiteSettings', this.websiteSettings);
    setLocal('races', this.races);
    setLocal('raceParticipants', this.raceParticipants);
    setLocal('raceResults', this.raceResults);
    setLocal('scoreboardState', this.scoreboardState);
    setLocal('emailTemplates', this.emailTemplates);
    setLocal('emailLogs', this.emailLogs);
    setLocal('paymentSettings', this.paymentSettings);
    setLocal('tournamentPayments', this.tournamentPayments);
    setLocal('communityPosts', this.communityPosts);
    setLocal('adminCredentials', this.adminCredentials);
    this.notify();
  }

  private refreshCountsAndPoints() {
    // Update skater count per district and club
    this.districts = this.districts.map(d => {
      const count = this.skaters.filter(s => s.districtName === d.nameEn || s.districtId === d.id).length;
      return { ...d, skaterCount: count };
    });

    this.clubs = this.clubs.map(c => {
      const clubSkaters = this.skaters.filter(s => s.clubName === c.nameEn || s.clubId === c.id);
      const skaterIds = new Set(clubSkaters.map(s => s.id));
      const clubResults = this.results.filter(r => skaterIds.has(r.skaterId) || r.clubName === c.nameEn);
      const gold = clubResults.filter(r => r.medal === 'Gold' || r.position === 1).length;
      const silver = clubResults.filter(r => r.medal === 'Silver' || r.position === 2).length;
      const bronze = clubResults.filter(r => r.medal === 'Bronze' || r.position === 3).length;
      const totalPoints = (gold * 5) + (silver * 3) + (bronze * 1);
      return { ...c, skaterCount: clubSkaters.length, totalPoints };
    });
  }

  // --- DISTRICTS ---
  public getDistricts(): District[] { return this.districts; }
  public addDistrict(district: Omit<District, 'id'>): District {
    const newDistrict: District = { ...district, id: 'dist-' + Date.now() };
    this.districts.push(newDistrict);
    this.refreshCountsAndPoints();
    this.persistAll();
    return newDistrict;
  }
  public updateDistrict(id: string, updates: Partial<District>) {
    this.districts = this.districts.map(d => d.id === id ? { ...d, ...updates } : d);
    this.persistAll();
  }

  // --- CLUBS ---
  public getClubs(): Club[] { return this.clubs; }
  public addClub(club: Omit<Club, 'id' | 'skaterCount' | 'totalPoints'>): Club {
    const newClub: Club = { ...club, id: 'club-' + Date.now(), skaterCount: 0, totalPoints: 0 };
    this.clubs.push(newClub);
    this.refreshCountsAndPoints();
    this.persistAll();
    return newClub;
  }
  public updateClub(id: string, updates: Partial<Club>) {
    this.clubs = this.clubs.map(c => c.id === id ? { ...c, ...updates } : c);
    this.persistAll();
  }
  public updateClubStatus(id: string, status: 'approved' | 'rejected') {
    this.clubs = this.clubs.map(c => c.id === id ? { ...c, status } : c);
    this.persistAll();
  }

  // --- AGE GROUP RULES ---
  public getAgeGroupRules(): AgeGroupRule[] {
    return this.ageGroupRules;
  }
  public updateAgeGroupRules(rules: AgeGroupRule[]): AgeGroupRule[] {
    this.ageGroupRules = rules;
    this.persistAll();
    return this.ageGroupRules;
  }

  // --- SKATER DOCUMENTS ---
  public getSkaterDocuments(skaterId: string): SkaterDocument[] {
    const existing = this.skaterDocuments.filter(d => d.skaterId === skaterId);
    if (existing.length > 0) return existing;

    const skater = this.skaters.find(s => s.id === skaterId);
    if (!skater) return [];

    const defaultDocs: SkaterDocument[] = [
      {
        id: `doc-${skaterId}-aadhaar`,
        skaterId,
        documentType: 'Aadhaar Card',
        documentNumber: `9876-${skater.registrationNumber ? skater.registrationNumber.slice(-4) : '1001'}-5432`,
        documentUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80',
        verificationStatus: skater.status === 'rejected' ? 'rejected' : 'verified',
        uploadedAt: skater.createdAt || new Date().toISOString()
      },
      {
        id: `doc-${skaterId}-birthcert`,
        skaterId,
        documentType: 'Birth Certificate',
        documentNumber: `BC/UP/${skater.dob ? skater.dob.slice(0, 4) : '2015'}/${skater.registrationNumber ? skater.registrationNumber.slice(-4) : '0001'}`,
        documentUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80',
        verificationStatus: skater.status === 'rejected' ? 'rejected' : 'verified',
        uploadedAt: skater.createdAt || new Date().toISOString()
      }
    ];

    return defaultDocs;
  }
  public addSkaterDocument(doc: Omit<SkaterDocument, 'id' | 'uploadedAt'>): SkaterDocument {
    const newDoc: SkaterDocument = {
      ...doc,
      id: 'doc-' + Date.now(),
      uploadedAt: new Date().toISOString()
    };
    this.skaterDocuments.push(newDoc);
    this.persistAll();
    return newDoc;
  }
  public verifySkaterDocument(docId: string, status: 'verified' | 'rejected') {
    const existingIndex = this.skaterDocuments.findIndex(d => d.id === docId);
    if (existingIndex >= 0) {
      this.skaterDocuments[existingIndex].verificationStatus = status;
    } else {
      // If updating a generated fallback doc, push it explicitly
      const skaterId = docId.split('-')[1];
      if (skaterId) {
        this.skaterDocuments.push({
          id: docId,
          skaterId,
          documentType: docId.includes('aadhaar') ? 'Aadhaar Card' : 'Birth Certificate',
          documentNumber: 'DOC-' + docId,
          documentUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80',
          verificationStatus: status,
          uploadedAt: new Date().toISOString()
        });
      }
    }
    this.persistAll();
  }

  // --- SKATERS ---
  public getSkaters(role?: UserRole): Skater[] { 
    const mapped = this.skaters.map(s => {
      // Ensure dynamic age calculation
      const calculatedAge = calculateAge(s.dob);
      return {
        ...s,
        age: calculatedAge,
        idCardActive: s.idCardActive ?? (s.status === 'active' || s.status === 'approved')
      };
    }); 

    if (role === 'operator') {
      return maskSkatersForOperator(mapped);
    }

    return mapped;
  }

  public getSkatersForRole(role?: UserRole): Skater[] {
    return this.getSkaters(role);
  }

  public getSkaterByRegNumber(regNum: string): Skater | undefined {
    if (!regNum) return undefined;
    const clean = regNum.trim().toUpperCase();
    const found = this.skaters.find(s => 
      (s.registrationNumber && s.registrationNumber.trim().toUpperCase() === clean) ||
      (s.applicationNumber && s.applicationNumber.trim().toUpperCase() === clean) ||
      (s.loginId && s.loginId.trim().toUpperCase() === clean) ||
      (s.email && s.email.trim().toUpperCase() === clean) ||
      (s.id && s.id.toUpperCase() === clean)
    );
    if (!found) return undefined;
    return {
      ...found,
      age: calculateAge(found.dob),
      idCardActive: found.idCardActive ?? (found.status === 'active' || found.status === 'approved')
    };
  }

  public getSkaterById(id: string): Skater | undefined {
    if (!id) return undefined;
    const found = this.skaters.find(s => s.id === id);
    if (!found) return undefined;
    return {
      ...found,
      age: calculateAge(found.dob),
      idCardActive: found.idCardActive ?? (found.status === 'active' || found.status === 'approved')
    };
  }

  public getSkaterByEmail(email: string): Skater | undefined {
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    const found = this.skaters.find(s => s.email && s.email.trim().toLowerCase() === clean);
    if (!found) return undefined;
    return {
      ...found,
      age: calculateAge(found.dob),
      idCardActive: found.idCardActive ?? (found.status === 'active' || found.status === 'approved')
    };
  }

  public registerSkater(skaterInput: Partial<Skater> & Omit<Skater, 'id' | 'registrationNumber' | 'createdAt'>): Skater {
    const districtName = skaterInput.districtName || 'Lucknow';
    const appNum = skaterInput.applicationNumber || generateApplicationNumber(this.skaters);
    const regNum = skaterInput.registrationNumber || generateRegistrationNumber(districtName, this.skaters);

    const calculatedAge = calculateAge(skaterInput.dob);
    const suggestedAgeGroup = getAgeGroupForDob(skaterInput.dob, this.ageGroupRules).ageGroup;

    const newSkater: Skater = {
      id: 'skater-' + Date.now(),
      applicationNumber: appNum,
      registrationNumber: regNum,
      bibNumber: skaterInput.bibNumber,
      name: skaterInput.name,
      fatherName: skaterInput.fatherName || '',
      motherName: skaterInput.motherName || '',
      fatherMotherName: skaterInput.fatherMotherName || skaterInput.fatherName || skaterInput.motherName || 'Parent',
      dob: skaterInput.dob,
      age: calculatedAge,
      gender: skaterInput.gender,
      ageGroup: skaterInput.ageGroup || suggestedAgeGroup,
      mobile: skaterInput.mobile,
      email: skaterInput.email,
      address: skaterInput.address,
      districtId: skaterInput.districtId || 'dist-1',
      districtName: skaterInput.districtName || 'Lucknow',
      clubId: skaterInput.clubId || 'club-1',
      clubName: skaterInput.clubName || 'Lucknow Roller Skating Academy',
      coachName: skaterInput.coachName || '',
      discipline: skaterInput.discipline,
      category: skaterInput.category || 'Amateur',
      bloodGroup: skaterInput.bloodGroup || 'O+',
      photoUrl: skaterInput.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      emergencyContactName: skaterInput.emergencyContactName || skaterInput.fatherMotherName || 'Emergency Contact',
      emergencyContactPhone: skaterInput.emergencyContactPhone || skaterInput.mobile,
      validityUntil: skaterInput.validityUntil || '2027-03-31',
      status: skaterInput.status || 'pending',
      pdfVersion: 1,
      pdfGeneratedAt: new Date().toISOString(),
      idCardActive: skaterInput.idCardActive ?? true,
      idCardGeneratedAt: new Date().toISOString(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    this.skaters.push(newSkater);
    this.getOrAssignSkaterBibNumber(newSkater);
    this.refreshCountsAndPoints();
    this.persistAll();
    return newSkater;
  }

  public updateSkater(id: string, updates: Partial<Skater>): Skater | undefined {
    let updatedSkater: Skater | undefined;
    const newBib = updates.bibNumber?.trim();

    this.skaters = this.skaters.map(s => {
      if (s.id === id) {
        const nextDob = updates.dob || s.dob;
        const calcAge = calculateAge(nextDob);
        updatedSkater = {
          ...s,
          ...updates,
          bibNumber: newBib !== undefined ? newBib : s.bibNumber,
          age: calcAge
        };
        return updatedSkater;
      }
      return s;
    });

    if (newBib && updatedSkater) {
      this.registrations = this.registrations.map(r => r.skaterId === id ? { ...r, bibNumber: newBib } : r);
      this.raceParticipants = this.raceParticipants.map(p => p.skaterId === id ? { ...p, bibNumber: newBib } : p);
      this.raceResults = this.raceResults.map(r => r.skaterId === id ? { ...r, bibNumber: newBib } : r);
      this.results = this.results.map(r => r.skaterId === id ? { ...r, bibNumber: newBib } : r);
    }

    this.refreshCountsAndPoints();
    this.persistAll();
    return updatedSkater;
  }

  public approveSkater(id: string, adminName: string = 'UPRSA State Admin'): Skater | undefined {
    let approvedSkater: Skater | undefined;
    this.skaters = this.skaters.map(s => {
      if (s.id === id) {
        // Idempotency check: if already approved, keep existing numbers and credentials
        const isAlreadyApproved = s.status === 'approved' || s.status === 'active';
        
        const districtCodeName = s.districtName || 'Lucknow';
        const finalRegNumber = (s.registrationNumber && !s.registrationNumber.includes('APP'))
          ? s.registrationNumber
          : generateRegistrationNumber(districtCodeName, this.skaters);

        const loginId = finalRegNumber;
        const tempPassword = s.tempPassword || 'UPRSA@' + Math.floor(1000 + Math.random() * 9000);

        approvedSkater = {
          ...s,
          registrationNumber: finalRegNumber,
          status: 'approved',
          approvedAt: isAlreadyApproved ? s.approvedAt : new Date().toISOString(),
          approvedBy: isAlreadyApproved ? s.approvedBy : adminName,
          loginId,
          tempPassword,
          mustChangePassword: s.mustChangePassword ?? true,
          idCardActive: true,
          idCardGeneratedAt: s.idCardGeneratedAt || new Date().toISOString(),
          pdfVersion: (s.pdfVersion || 1) + (isAlreadyApproved ? 0 : 1),
          pdfGeneratedAt: new Date().toISOString()
        };
        return approvedSkater;
      }
      return s;
    });

    if (approvedSkater) {
      this.refreshCountsAndPoints();
      this.persistAll();
    }
    return approvedSkater;
  }

  public rejectSkater(id: string, reason: string, adminName: string = 'UPRSA State Admin'): Skater | undefined {
    let rejectedSkater: Skater | undefined;
    this.skaters = this.skaters.map(s => {
      if (s.id === id) {
        rejectedSkater = {
          ...s,
          status: 'rejected',
          rejectionReason: reason,
          rejectedAt: new Date().toISOString(),
          rejectedBy: adminName,
          idCardActive: false
        };
        return rejectedSkater;
      }
      return s;
    });

    if (rejectedSkater) {
      this.refreshCountsAndPoints();
      this.persistAll();
    }
    return rejectedSkater;
  }

  public updateSkaterStatus(id: string, status: RegistrationStatus, rejectionReason?: string) {
    if (status === 'approved' || status === 'active') {
      this.approveSkater(id);
    } else if (status === 'rejected') {
      this.rejectSkater(id, rejectionReason || 'Documents verification failed');
    } else {
      this.skaters = this.skaters.map(s => s.id === id ? { ...s, status } : s);
      this.persistAll();
    }
  }

  // --- EMAIL TEMPLATES & LOGS ---
  public getEmailTemplates(): EmailTemplate[] {
    return this.emailTemplates;
  }

  public updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): EmailTemplate | undefined {
    let updated: EmailTemplate | undefined;
    this.emailTemplates = this.emailTemplates.map(t => {
      if (t.id === id) {
        updated = { ...t, ...updates };
        return updated;
      }
      return t;
    });
    this.persistAll();
    return updated;
  }

  public getEmailLogs(): EmailLog[] {
    return this.emailLogs;
  }

  public addEmailLog(log: Omit<EmailLog, 'id' | 'sentAt'>): EmailLog {
    const newLog: EmailLog = {
      ...log,
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      sentAt: new Date().toISOString()
    };
    this.emailLogs.unshift(newLog);
    this.persistAll();
    return newLog;
  }

  public deactivateIDCard(id: string, reason?: string) {
    this.skaters = this.skaters.map(s => {
      if (s.id === id) {
        return {
          ...s,
          idCardActive: false,
          rejectionReason: reason ? `ID Card Deactivated: ${reason}` : s.rejectionReason
        };
      }
      return s;
    });
    this.persistAll();
  }

  public renewIDCard(id: string, newValidityUntil: string) {
    this.skaters = this.skaters.map(s => {
      if (s.id === id) {
        return {
          ...s,
          validityUntil: newValidityUntil,
          idCardActive: true,
          status: 'approved'
        };
      }
      return s;
    });
    this.persistAll();
  }

  public deleteSkater(id: string) {
    this.skaters = this.skaters.filter(s => s.id !== id);
    this.refreshCountsAndPoints();
    this.persistAll();
  }

  public bulkImportSkaters(skaterList: Partial<Skater>[]): Skater[] {
    const created: Skater[] = [];
    skaterList.forEach(s => {
      const sk = this.registerSkater(s as any);
      created.push(sk);
    });
    return created;
  }

  // --- TOURNAMENTS & EVENTS ---
  public getTournaments(): Tournament[] { return this.tournaments; }
  public addTournament(tournament: Omit<Tournament, 'id'>): Tournament {
    const newTour: Tournament = { ...tournament, id: 'tour-' + Date.now() };
    this.tournaments.push(newTour);
    this.persistAll();
    return newTour;
  }
  public updateTournament(id: string, updated: Partial<Tournament>): Tournament | null {
    const idx = this.tournaments.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.tournaments[idx] = { ...this.tournaments[idx], ...updated };
      this.persistAll();
      return this.tournaments[idx];
    }
    return null;
  }
  public getEvents(tournamentId?: string): TournamentEvent[] {
    if (tournamentId) return this.events.filter(e => e.tournamentId === tournamentId);
    return this.events;
  }
  public updateEvent(id: string, updatedFields: Partial<TournamentEvent>): TournamentEvent | null {
    let updated: TournamentEvent | null = null;
    this.events = this.events.map(e => {
      if (e.id === id) {
        updated = { ...e, ...updatedFields };
        return updated;
      }
      return e;
    });
    if (updated) this.persistAll();
    return updated;
  }

  public deleteEvent(id: string): boolean {
    const prevLen = this.events.length;
    this.events = this.events.filter(e => e.id !== id);
    this.registrations = this.registrations.filter(r => r.eventId !== id);
    if (this.events.length !== prevLen) {
      this.persistAll();
      return true;
    }
    return false;
  }

  public addEvent(event: Omit<TournamentEvent, 'id'>): TournamentEvent {
    const newEvent: TournamentEvent = { ...event, id: 'event-' + Date.now() };
    this.events.push(newEvent);
    this.persistAll();
    return newEvent;
  }

  // --- TOURNAMENT REGISTRATIONS ---
  public getRegistrations(tournamentId?: string, eventId?: string): TournamentRegistration[] {
    return this.registrations.filter(r => {
      const matchTour = !tournamentId || r.tournamentId === tournamentId;
      const matchEvent = !eventId || r.eventId === eventId;
      return matchTour && matchEvent;
    });
  }

  public setSkaterTournamentRegistrations(skater: Skater, tournamentId: string, selectedEventIds: string[]): TournamentRegistration[] {
    // Remove existing registrations for this skater in this tournament
    this.registrations = this.registrations.filter(r => !(r.skaterId === skater.id && r.tournamentId === tournamentId));
    
    // Always use skater's permanent single BIB number
    const bib = this.getOrAssignSkaterBibNumber(skater);

    const createdRegs: TournamentRegistration[] = [];
    for (const eventId of selectedEventIds) {
      const event = this.events.find(e => e.id === eventId);
      if (!event) continue;
      
      const newReg: TournamentRegistration = {
        id: 'reg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        tournamentId,
        eventId,
        skaterId: skater.id,
        skaterName: skater.name,
        registrationNumber: skater.registrationNumber || skater.applicationNumber || skater.id,
        districtName: skater.districtName,
        clubName: skater.clubName,
        discipline: event.discipline,
        ageGroup: event.ageGroup,
        gender: event.gender,
        distance: event.distance,
        bibNumber: bib,
        heatNumber: 1,
        status: 'approved',
        registeredAt: new Date().toISOString().split('T')[0]
      };
      this.registrations.push(newReg);
      createdRegs.push(newReg);
    }
    
    this.persistAll();
    return createdRegs;
  }

  public seedStandardEventsForTournament(tournamentId: string): TournamentEvent[] {
    const existing = this.getEvents(tournamentId);
    if (existing.length >= 6) return existing;

    const standardEvents: Omit<TournamentEvent, 'id'>[] = [
      // Speed Quad Competitions
      { tournamentId, discipline: 'Speed Quad', ageGroup: 'Sub-Junior (12-15 Years)', gender: 'Male', distance: '500 Meter Rink Race (Quad)', raceNumber: 'QD-500M-M', heatCount: 2, maxParticipants: 30 },
      { tournamentId, discipline: 'Speed Quad', ageGroup: 'Sub-Junior (12-15 Years)', gender: 'Male', distance: '1000 Meter Lap Race (Quad)', raceNumber: 'QD-1000M-M', heatCount: 2, maxParticipants: 30 },
      { tournamentId, discipline: 'Speed Quad', ageGroup: 'Sub-Junior (12-15 Years)', gender: 'Female', distance: '500 Meter Rink Race (Quad)', raceNumber: 'QD-500M-F', heatCount: 2, maxParticipants: 30 },
      { tournamentId, discipline: 'Speed Quad', ageGroup: 'Sub-Junior (12-15 Years)', gender: 'Female', distance: '1000 Meter Lap Race (Quad)', raceNumber: 'QD-1000M-F', heatCount: 2, maxParticipants: 30 },
      { tournamentId, discipline: 'Speed Quad', ageGroup: 'Junior (15-18 Years)', gender: 'Male', distance: '1500 Meter Points Race (Quad)', raceNumber: 'QD-JR-1500M-M', heatCount: 1, maxParticipants: 30 },
      { tournamentId, discipline: 'Speed Quad', ageGroup: 'Senior (18+ Years)', gender: 'Male', distance: '3000 Meter Elimination Race (Quad)', raceNumber: 'QD-SR-3000M-M', heatCount: 1, maxParticipants: 30 },

      // Speed Inline Competitions
      { tournamentId, discipline: 'Speed Inline', ageGroup: '10-12 Years', gender: 'Male', distance: '500 Meter', raceNumber: 'IN-500M-10-12', heatCount: 1, maxParticipants: 30 },
      { tournamentId, discipline: 'Speed Inline', ageGroup: '10-12 Years', gender: 'Male', distance: '1000 Meter', raceNumber: 'IN-1000M-10-12', heatCount: 1, maxParticipants: 30 },
      { tournamentId, discipline: 'Speed Inline', ageGroup: 'Sub-Junior (12-15 Years)', gender: 'Male', distance: '500 Meter Rink Race (Inline)', raceNumber: 'IN-500M-M', heatCount: 2, maxParticipants: 30 },
      { tournamentId, discipline: 'Speed Inline', ageGroup: 'Sub-Junior (12-15 Years)', gender: 'Male', distance: '1000 Meter Lap Race (Inline)', raceNumber: 'IN-1000M-M', heatCount: 2, maxParticipants: 30 },
      { tournamentId, discipline: 'Speed Inline', ageGroup: 'Sub-Junior (12-15 Years)', gender: 'Female', distance: '500 Meter Rink Race (Inline)', raceNumber: 'IN-500M-F', heatCount: 2, maxParticipants: 30 },
      { tournamentId, discipline: 'Speed Inline', ageGroup: 'Sub-Junior (12-15 Years)', gender: 'Female', distance: '1000 Meter Lap Race (Inline)', raceNumber: 'IN-1000M-F', heatCount: 2, maxParticipants: 30 },
      { tournamentId, discipline: 'Speed Inline', ageGroup: 'Junior (15-18 Years)', gender: 'Male', distance: '3000 Meter Point-to-Point (Inline)', raceNumber: 'IN-JR-3000M-M', heatCount: 1, maxParticipants: 30 },
      { tournamentId, discipline: 'Speed Inline', ageGroup: 'Senior (18+ Years)', gender: 'Male', distance: '5000 Meter Elimination (Inline)', raceNumber: 'IN-SR-5000M-M', heatCount: 1, maxParticipants: 30 },

      // Speed Adjustable Competitions
      { tournamentId, discipline: 'Speed Adjustable', ageGroup: 'Cadet (8-10 Years)', gender: 'Male', distance: '200 Meter Rink Race (Adjustable)', raceNumber: 'ADJ-200M-M', heatCount: 2, maxParticipants: 25 },
      { tournamentId, discipline: 'Speed Adjustable', ageGroup: 'Cadet (8-10 Years)', gender: 'Female', distance: '200 Meter Rink Race (Adjustable)', raceNumber: 'ADJ-200M-F', heatCount: 2, maxParticipants: 25 },

      // Artistic & Freestyle
      { tournamentId, discipline: 'Artistic', ageGroup: 'Sub-Junior (12-15 Years)', gender: 'Male', distance: 'Solo Free Skating Routine', raceNumber: 'ART-SOLO-M', heatCount: 1, maxParticipants: 20 },
      { tournamentId, discipline: 'Freestyle', ageGroup: 'Sub-Junior (12-15 Years)', gender: 'Male', distance: 'Classic Slalom Competition', raceNumber: 'FREE-SLALOM-M', heatCount: 1, maxParticipants: 20 }
    ];

    const newCreated: TournamentEvent[] = [];
    for (const item of standardEvents) {
      const added = this.addEvent(item);
      newCreated.push(added);
    }
    return this.getEvents(tournamentId);
  }
  public registerForTournament(reg: Omit<TournamentRegistration, 'id' | 'registeredAt'>): TournamentRegistration {
    const bib = reg.bibNumber || this.getOrAssignSkaterBibNumber(reg.skaterId);
    const newReg: TournamentRegistration = {
      ...reg,
      bibNumber: bib,
      id: 'reg-' + Date.now(),
      registeredAt: new Date().toISOString().split('T')[0]
    };
    this.registrations.push(newReg);
    this.persistAll();
    return newReg;
  }
  public updateRegistrationStatus(id: string, status: 'approved' | 'rejected', bibNumber?: string, heatNumber?: number) {
    this.registrations = this.registrations.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status,
          bibNumber: bibNumber ?? r.bibNumber,
          heatNumber: heatNumber ?? r.heatNumber
        };
      }
      return r;
    });
    this.persistAll();
  }

  // --- RESULTS & LIVE SCORING ---
  public getResults(tournamentId?: string): TournamentResult[] {
    if (tournamentId) return this.results.filter(r => r.tournamentId === tournamentId);
    return this.results;
  }
  public addOrUpdateResult(res: Omit<TournamentResult, 'id' | 'createdAt'>): TournamentResult {
    // Auto calculate points from point rules if not specified
    const rule = this.pointRules.find(p => p.position === res.position);
    const calculatedPoints = res.points ?? (rule ? rule.points : (res.position <= 5 ? 1 : 0));
    
    let medal: 'Gold' | 'Silver' | 'Bronze' | 'None' = 'None';
    if (res.position === 1) medal = 'Gold';
    else if (res.position === 2) medal = 'Silver';
    else if (res.position === 3) medal = 'Bronze';

    const existingIdx = this.results.findIndex(r => r.tournamentId === res.tournamentId && r.eventId === res.eventId && r.skaterId === res.skaterId);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    let finalRes: TournamentResult;
    if (existingIdx >= 0) {
      finalRes = { ...this.results[existingIdx], ...res, points: calculatedPoints, medal, createdAt: nowStr };
      this.results[existingIdx] = finalRes;
    } else {
      finalRes = {
        ...res,
        id: 'res-' + Date.now(),
        points: calculatedPoints,
        medal,
        createdAt: nowStr
      };
      this.results.push(finalRes);
    }
    this.refreshCountsAndPoints();
    this.persistAll();
    return finalRes;
  }

  // --- POINT RULES ---
  public getPointRules(): PointRule[] { return this.pointRules; }
  public setPointRules(rules: PointRule[]) {
    this.pointRules = rules;
    this.persistAll();
  }

  // --- RANKINGS ---
  public getIndividualRankings(tournamentId?: string): IndividualRank[] {
    const skaterMap: Record<string, {
      skaterId: string;
      skaterName: string;
      registrationNumber: string;
      districtName: string;
      clubName: string;
      discipline: string;
      goldMedals: number;
      silverMedals: number;
      bronzeMedals: number;
      tournamentsPlayed: Set<string>;
      totalPoints: number;
    }> = {};

    const allResList = this.getTournamentResults(tournamentId && tournamentId !== 'ALL' ? tournamentId : undefined);

    allResList.forEach(res => {
      const key = (res.skaterId && res.skaterId !== 'skater-0')
        ? res.skaterId
        : `${res.skaterName?.trim().toLowerCase()}-${res.districtName?.trim().toLowerCase()}`;

      if (!skaterMap[key]) {
        skaterMap[key] = {
          skaterId: res.skaterId || key,
          skaterName: res.skaterName || 'Unknown Skater',
          registrationNumber: res.registrationNumber || '',
          districtName: res.districtName || '',
          clubName: res.clubName || '',
          discipline: res.discipline || '',
          goldMedals: 0,
          silverMedals: 0,
          bronzeMedals: 0,
          tournamentsPlayed: new Set(),
          totalPoints: 0
        };
      }

      const item = skaterMap[key];
      if (res.tournamentId) item.tournamentsPlayed.add(res.tournamentId);

      const isGold = res.medal === 'Gold' || res.position === 1;
      const isSilver = res.medal === 'Silver' || res.position === 2;
      const isBronze = res.medal === 'Bronze' || res.position === 3;

      if (isGold) item.goldMedals++;
      else if (isSilver) item.silverMedals++;
      else if (isBronze) item.bronzeMedals++;

      const pts = res.points !== undefined 
        ? res.points 
        : (isGold ? 5 : isSilver ? 3 : isBronze ? 1 : 0);
      item.totalPoints += pts;
    });

    const list: IndividualRank[] = Object.values(skaterMap).map(item => {
      const sk = this.skaters.find(s => s.id === item.skaterId || s.name?.toLowerCase() === item.skaterName?.toLowerCase());
      return {
        rank: 0,
        skaterId: item.skaterId,
        skaterName: item.skaterName,
        registrationNumber: item.registrationNumber || sk?.registrationNumber || 'UPRSA/2026/00000',
        districtName: item.districtName || sk?.districtName || 'Lucknow',
        clubName: item.clubName || sk?.clubName || 'Affiliated Club',
        discipline: (item.discipline || sk?.discipline || 'Speed Inline') as any,
        totalPoints: item.totalPoints,
        goldMedals: item.goldMedals,
        silverMedals: item.silverMedals,
        bronzeMedals: item.bronzeMedals,
        tournamentsPlayed: Math.max(1, item.tournamentsPlayed.size)
      };
    });

    list.sort((a, b) => b.totalPoints - a.totalPoints || b.goldMedals - a.goldMedals || b.silverMedals - a.silverMedals);
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }

  public getDistrictRankings(tournamentId?: string): EntityRank[] {
    const distMap: Record<string, {
      id: string;
      name: string;
      goldMedals: number;
      silverMedals: number;
      bronzeMedals: number;
    }> = {};

    this.districts.forEach(d => {
      distMap[d.nameEn] = {
        id: d.id,
        name: d.nameEn,
        goldMedals: 0,
        silverMedals: 0,
        bronzeMedals: 0
      };
    });

    const filteredResults = tournamentId 
      ? this.results.filter(r => r.tournamentId === tournamentId)
      : this.results;

    filteredResults.forEach(res => {
      if (!distMap[res.districtName]) {
        distMap[res.districtName] = {
          id: res.districtName,
          name: res.districtName,
          goldMedals: 0,
          silverMedals: 0,
          bronzeMedals: 0
        };
      }
      const item = distMap[res.districtName];
      if (res.medal === 'Gold' || res.position === 1) item.goldMedals++;
      else if (res.medal === 'Silver' || res.position === 2) item.silverMedals++;
      else if (res.medal === 'Bronze' || res.position === 3) item.bronzeMedals++;
    });

    const list: EntityRank[] = Object.values(distMap).map(item => {
      const count = this.skaters.filter(s => s.districtName === item.name).length;
      const totalPoints = (item.goldMedals * 5) + (item.silverMedals * 3) + (item.bronzeMedals * 1);
      return {
        rank: 0,
        id: item.id,
        name: item.name,
        totalPoints,
        goldMedals: item.goldMedals,
        silverMedals: item.silverMedals,
        bronzeMedals: item.bronzeMedals,
        skaterCount: count
      };
    });

    list.sort((a, b) => b.totalPoints - a.totalPoints || b.goldMedals - a.goldMedals);
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }

  public getClubRankings(tournamentId?: string): EntityRank[] {
    const clubMap: Record<string, {
      id: string;
      name: string;
      districtName: string;
      goldMedals: number;
      silverMedals: number;
      bronzeMedals: number;
    }> = {};

    this.clubs.forEach(c => {
      clubMap[c.nameEn] = {
        id: c.id,
        name: c.nameEn,
        districtName: c.districtName,
        goldMedals: 0,
        silverMedals: 0,
        bronzeMedals: 0
      };
    });

    const filteredResults = tournamentId 
      ? this.results.filter(r => r.tournamentId === tournamentId)
      : this.results;

    filteredResults.forEach(res => {
      if (!clubMap[res.clubName]) {
        clubMap[res.clubName] = {
          id: res.clubName,
          name: res.clubName,
          districtName: res.districtName,
          goldMedals: 0,
          silverMedals: 0,
          bronzeMedals: 0
        };
      }
      const item = clubMap[res.clubName];
      if (res.medal === 'Gold' || res.position === 1) item.goldMedals++;
      else if (res.medal === 'Silver' || res.position === 2) item.silverMedals++;
      else if (res.medal === 'Bronze' || res.position === 3) item.bronzeMedals++;
    });

    const list: EntityRank[] = Object.values(clubMap).map(item => {
      const count = this.skaters.filter(s => s.clubName === item.name).length;
      const totalPoints = (item.goldMedals * 5) + (item.silverMedals * 3) + (item.bronzeMedals * 1);
      return {
        rank: 0,
        id: item.id,
        name: item.name,
        districtName: item.districtName,
        totalPoints,
        goldMedals: item.goldMedals,
        silverMedals: item.silverMedals,
        bronzeMedals: item.bronzeMedals,
        skaterCount: count
      };
    });

    list.sort((a, b) => b.totalPoints - a.totalPoints || b.goldMedals - a.goldMedals);
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }

  // --- CERTIFICATES & TEMPLATES ---
  public getCertificates(): Certificate[] { return this.certificates; }
  public getCertificateById(id: string): Certificate | undefined {
    return this.certificates.find(c => c.id === id);
  }
  public getCertificateByNumber(num: string): Certificate | undefined {
    if (!num) return undefined;
    const clean = num.trim().toUpperCase();
    return this.certificates.find(c => 
      c.certificateNumber.trim().toUpperCase() === clean || 
      (c.verificationCode && c.verificationCode.trim().toUpperCase() === clean)
    );
  }
  public getCertificateTemplate(): CertificateTemplate {
    return this.certificateTemplate || defaultCertificateTemplate;
  }
  public saveCertificateTemplate(template: CertificateTemplate): CertificateTemplate {
    this.certificateTemplate = { ...template, updatedAt: new Date().toISOString() };
    this.persistAll();
    return this.certificateTemplate;
  }
  public addCertificate(certInput: Partial<Certificate>): Certificate {
    const template = this.getCertificateTemplate();
    const prefix = template.numberPrefix || 'UPRSA-CERT-2026-';
    
    let certNum = certInput.certificateNumber;
    if (!certNum || this.certificates.some(c => c.certificateNumber === certNum)) {
      const nextCount = this.certificates.length + 1;
      certNum = `${prefix}${String(nextCount).padStart(6, '0')}`;
    }

    const newCert: Certificate = {
      id: certInput.id || 'cert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      certificateNumber: certNum,
      skaterId: certInput.skaterId || 'skater-0',
      skaterName: certInput.skaterName || 'Skater Name',
      registrationNumber: certInput.registrationNumber || 'UPRSA/2026/00000',
      fatherMotherName: certInput.fatherMotherName || 'Parent Name',
      tournamentId: certInput.tournamentId,
      tournamentName: certInput.tournamentName || '38th UPRSA State Championship 2026',
      tournamentNumber: certInput.tournamentNumber || 'UPRSA-TR-2026-01',
      eventId: certInput.eventId,
      eventName: certInput.eventName || 'Speed Skating Race',
      discipline: certInput.discipline || 'Speed Inline',
      ageGroup: certInput.ageGroup || 'Sub-Junior (12-15 Years)',
      gender: certInput.gender || 'Male',
      position: certInput.position || 'Participation',
      score: certInput.score,
      timing: certInput.timing,
      clubName: certInput.clubName || 'Affiliated Club',
      districtName: certInput.districtName || 'Lucknow',
      certificateDate: certInput.certificateDate || new Date().toISOString().split('T')[0],
      issueDate: certInput.issueDate || new Date().toISOString().split('T')[0],
      status: certInput.status || 'Issued',
      verificationCode: certNum,
      certificateType: certInput.certificateType || 'Merit',
      pdfUrl: certInput.pdfUrl,
      createdAt: certInput.createdAt || new Date().toISOString()
    };

    this.certificates.push(newCert);
    this.persistAll();
    return newCert;
  }
  public updateCertificate(id: string, updates: Partial<Certificate>): Certificate | undefined {
    const idx = this.certificates.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    
    this.certificates[idx] = {
      ...this.certificates[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persistAll();
    return this.certificates[idx];
  }
  public revokeCertificate(id: string, reason?: string): Certificate | undefined {
    const cert = this.certificates.find(c => c.id === id);
    if (!cert) return undefined;

    cert.status = 'Revoked';
    cert.revokedReason = reason || 'Revoked by UPRSA Secretariat';
    cert.revokedAt = new Date().toISOString();
    cert.updatedAt = new Date().toISOString();

    this.persistAll();
    return cert;
  }
  public regenerateCertificate(id: string): Certificate | undefined {
    const cert = this.certificates.find(c => c.id === id);
    if (!cert) return undefined;

    cert.issueDate = new Date().toISOString().split('T')[0];
    if (cert.status === 'Revoked') {
      cert.status = 'Issued';
      delete cert.revokedReason;
      delete cert.revokedAt;
    }
    cert.updatedAt = new Date().toISOString();

    this.persistAll();
    return cert;
  }
  public deleteCertificate(id: string): boolean {
    const initialLen = this.certificates.length;
    this.certificates = this.certificates.filter(c => c.id !== id);
    if (this.certificates.length !== initialLen) {
      this.persistAll();
      return true;
    }
    return false;
  }
  public bulkCreateCertificates(certsInput: Partial<Certificate>[]): Certificate[] {
    const template = this.getCertificateTemplate();
    const prefix = template.numberPrefix || 'UPRSA-CERT-2026-';
    let currentCount = this.certificates.length;

    const created: Certificate[] = certsInput.map((input) => {
      currentCount++;
      const certNum = input.certificateNumber || `${prefix}${String(currentCount).padStart(6, '0')}`;

      return {
        id: input.id || 'cert-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        certificateNumber: certNum,
        skaterId: input.skaterId || 'skater-0',
        skaterName: input.skaterName || 'Skater Name',
        registrationNumber: input.registrationNumber || 'UPRSA/2026/00000',
        fatherMotherName: input.fatherMotherName || 'Parent Name',
        tournamentId: input.tournamentId,
        tournamentName: input.tournamentName || '38th UPRSA State Championship 2026',
        tournamentNumber: input.tournamentNumber || 'UPRSA-TR-2026-01',
        eventId: input.eventId,
        eventName: input.eventName || 'Speed Skating Race',
        discipline: input.discipline || 'Speed Inline',
        ageGroup: input.ageGroup || 'Sub-Junior (12-15 Years)',
        gender: input.gender || 'Male',
        position: input.position || 'Participation',
        score: input.score,
        timing: input.timing,
        clubName: input.clubName || 'Affiliated Club',
        districtName: input.districtName || 'Lucknow',
        certificateDate: input.certificateDate || new Date().toISOString().split('T')[0],
        issueDate: input.issueDate || new Date().toISOString().split('T')[0],
        status: input.status || 'Issued',
        verificationCode: certNum,
        certificateType: input.certificateType || 'Merit',
        createdAt: new Date().toISOString()
      };
    });

    this.certificates.push(...created);
    this.persistAll();
    return created;
  }

  // --- RACES MANAGEMENT ---
  public getRaces(tournamentId?: string, eventId?: string): Race[] {
    return this.races.filter(r => {
      const matchTour = !tournamentId || r.tournamentId === tournamentId;
      const matchEvent = !eventId || r.eventId === eventId;
      return matchTour && matchEvent;
    });
  }

  public getRaceById(id: string): Race | undefined {
    return this.races.find(r => r.id === id);
  }

  public addRace(raceInput: Partial<Race>): Race {
    const event = this.events.find(e => e.id === raceInput.eventId);
    const tourId = raceInput.tournamentId || event?.tournamentId || 'tour-1';

    const newRace: Race = {
      id: raceInput.id || 'race-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      tournamentId: tourId,
      eventId: raceInput.eventId || 'event-1',
      raceNumber: raceInput.raceNumber || `R-${this.races.length + 101}`,
      heatNumber: raceInput.heatNumber || 1,
      discipline: raceInput.discipline || event?.discipline || 'Speed Inline',
      ageGroup: raceInput.ageGroup || event?.ageGroup || 'Sub-Junior (12-15 Years)',
      gender: raceInput.gender || event?.gender || 'Male',
      distance: raceInput.distance || event?.distance || '500m Rink',
      maxParticipants: raceInput.maxParticipants || event?.maxParticipants || 8,
      scheduledStartTime: raceInput.scheduledStartTime || '10:00 AM',
      status: raceInput.status || 'Scheduled',
      scoringMethod: raceInput.scoringMethod || 'TIMING',
      createdAt: new Date().toISOString()
    };

    this.races.push(newRace);
    this.persistAll();
    return newRace;
  }

  public updateRace(id: string, raceInput: Partial<Race>): Race | undefined {
    const idx = this.races.findIndex(r => r.id === id);
    if (idx === -1) return undefined;

    this.races[idx] = { ...this.races[idx], ...raceInput };
    this.persistAll();
    return this.races[idx];
  }

  public deleteRace(id: string): void {
    this.races = this.races.filter(r => r.id !== id);
    this.raceParticipants = this.raceParticipants.filter(p => p.raceId !== id);
    this.raceResults = this.raceResults.filter(r => r.raceId !== id);
    this.persistAll();
  }

  // --- START LIST & RACE PARTICIPANTS ---
  public getRaceParticipants(raceId: string): RaceParticipant[] {
    return this.raceParticipants
      .filter(p => p.raceId === raceId)
      .sort((a, b) => (a.laneNumber || 0) - (b.laneNumber || 0));
  }

  public addRaceParticipant(input: Partial<RaceParticipant>): RaceParticipant {
    const race = this.getRaceById(input.raceId || '');
    const currentCount = this.getRaceParticipants(input.raceId || '').length;

    const skaterBib = input.bibNumber || (input.skaterId ? this.getOrAssignSkaterBibNumber(input.skaterId) : String(101 + currentCount));

    const newParticipant: RaceParticipant = {
      id: input.id || 'part-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      raceId: input.raceId || '',
      tournamentId: input.tournamentId || race?.tournamentId || 'tour-1',
      eventId: input.eventId || race?.eventId || 'event-1',
      skaterId: input.skaterId || 'skater-0',
      skaterName: input.skaterName || 'Skater Name',
      registrationNumber: input.registrationNumber || 'UPRSA/2026/00000',
      bibNumber: skaterBib,
      gender: input.gender || race?.gender || 'Male',
      ageGroup: input.ageGroup || race?.ageGroup || 'Sub-Junior (12-15 Years)',
      clubName: input.clubName || 'Affiliated Club',
      districtName: input.districtName || 'Lucknow',
      laneNumber: input.laneNumber || (currentCount + 1),
      heatNumber: input.heatNumber || race?.heatNumber || 1,
      status: input.status || 'VALID'
    };

    this.raceParticipants.push(newParticipant);
    this.persistAll();
    return newParticipant;
  }

  public updateRaceParticipant(id: string, input: Partial<RaceParticipant>): RaceParticipant | undefined {
    const idx = this.raceParticipants.findIndex(p => p.id === id);
    if (idx === -1) return undefined;

    this.raceParticipants[idx] = { ...this.raceParticipants[idx], ...input };
    this.persistAll();
    return this.raceParticipants[idx];
  }

  public removeRaceParticipant(id: string): void {
    this.raceParticipants = this.raceParticipants.filter(p => p.id !== id);
    this.persistAll();
  }

  public reorderRaceParticipants(raceId: string, participantIdsInOrder: string[]): RaceParticipant[] {
    participantIdsInOrder.forEach((pId, index) => {
      const idx = this.raceParticipants.findIndex(p => p.id === pId);
      if (idx !== -1) {
        this.raceParticipants[idx].laneNumber = index + 1;
      }
    });
    this.persistAll();
    return this.getRaceParticipants(raceId);
  }

  public generateStartListFromRegistrations(tournamentId: string, eventId: string, raceId: string): RaceParticipant[] {
    const race = this.getRaceById(raceId);
    if (!race) return [];

    const approvedRegs = this.registrations.filter(r => 
      r.tournamentId === tournamentId && 
      r.eventId === eventId && 
      (r.status === 'approved' || r.status === 'pending')
    );

    // Remove existing race participants for this race
    this.raceParticipants = this.raceParticipants.filter(p => p.raceId !== raceId);

    const generated: RaceParticipant[] = approvedRegs.map((reg, index) => {
      const skaterBib = this.getOrAssignSkaterBibNumber(reg.skaterId) || reg.bibNumber || String(101 + index);
      return {
        id: 'part-' + Date.now() + '-' + index + '-' + Math.random().toString(36).substring(2, 4),
        raceId,
        tournamentId,
        eventId,
        skaterId: reg.skaterId,
        skaterName: reg.skaterName,
        registrationNumber: reg.registrationNumber,
        bibNumber: skaterBib,
        gender: reg.gender || race.gender,
        ageGroup: reg.ageGroup || race.ageGroup,
        clubName: reg.clubName,
        districtName: reg.districtName,
        laneNumber: reg.laneNumber || (index + 1),
        heatNumber: reg.heatNumber || race.heatNumber || 1,
        status: 'VALID'
      };
    });

    this.raceParticipants.push(...generated);
    this.persistAll();
    return generated;
  }

  // --- RACE RESULTS & LIVE SCORING ---
  public getRaceResults(raceId?: string, eventId?: string, tournamentId?: string): RaceResult[] {
    return this.raceResults.filter(r => {
      const matchRace = !raceId || r.raceId === raceId;
      const matchEvent = !eventId || r.eventId === eventId;
      const matchTour = !tournamentId || r.tournamentId === tournamentId;
      return matchRace && matchEvent && matchTour;
    }).sort((a, b) => a.position - b.position);
  }

  public getTournamentResults(tournamentId?: string): RaceResult[] {
    const fromRaceRes = this.raceResults.filter(r => !tournamentId || tournamentId === 'ALL' || r.tournamentId === tournamentId);
    const existingIds = new Set(fromRaceRes.map(r => r.id));
    const compositeKeys = new Set(fromRaceRes.map(r => `${r.tournamentId}_${r.skaterName}_${r.discipline}_${r.bibNumber}_${r.position}_${r.finalTiming}`));

    const fromGlobal: RaceResult[] = [];
    this.results.forEach(r => {
      if (tournamentId && tournamentId !== 'ALL' && r.tournamentId !== tournamentId) return;
      if (existingIds.has(r.id)) return;
      const key = `${r.tournamentId}_${r.skaterName}_${r.discipline}_${r.bibNumber}_${r.position}_${r.timing}`;
      if (compositeKeys.has(key)) return;

      fromGlobal.push({
        id: r.id,
        tournamentId: r.tournamentId,
        eventId: r.eventId,
        raceId: r.raceId || `race-${r.tournamentId}`,
        skaterId: r.skaterId,
        skaterName: r.skaterName,
        registrationNumber: r.registrationNumber,
        districtName: r.districtName,
        clubName: r.clubName,
        bibNumber: r.bibNumber || '101',
        discipline: (r.discipline || 'Speed Inline') as any,
        ageGroup: (r.ageGroup || 'Sub-Junior (12-15 Years)') as any,
        gender: (r.gender || 'Male') as any,
        rawTiming: r.rawTiming || r.timing,
        penaltySeconds: r.penaltySeconds || 0,
        finalTiming: r.timing,
        score: r.score || 0,
        position: r.position,
        points: r.points,
        medal: r.medal,
        status: r.status || 'VALID',
        approvalStatus: r.approvalStatus || 'Published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    return [...fromRaceRes, ...fromGlobal].sort((a, b) => a.position - b.position);
  }

  public deleteRaceResult(resultId: string): void {
    const targetRace = this.raceResults.find(r => r.id === resultId);
    const targetGlobal = this.results.find(r => r.id === resultId);
    const target = targetRace || targetGlobal;

    const targetTourId = target?.tournamentId;
    const targetSkaterName = target?.skaterName?.trim().toLowerCase();
    const targetBib = target?.bibNumber?.toString().trim();
    const targetPos = target?.position;
    const targetDiscipline = target?.discipline?.trim().toLowerCase();

    this.raceResults = this.raceResults.filter(r => {
      if (r.id === resultId) return false;
      if (targetRace && r.id === targetRace.id) return false;
      if (targetGlobal && r.id === targetGlobal.id) return false;

      if (targetTourId && r.tournamentId === targetTourId && targetPos !== undefined && r.position === targetPos) {
        const nameMatch = targetSkaterName && r.skaterName?.trim().toLowerCase() === targetSkaterName;
        const bibMatch = targetBib && r.bibNumber?.toString().trim() === targetBib;
        const discMatch = !targetDiscipline || r.discipline?.trim().toLowerCase() === targetDiscipline;
        if ((nameMatch || bibMatch) && discMatch) return false;
      }
      return true;
    });

    this.results = this.results.filter(r => {
      if (r.id === resultId) return false;
      if (targetRace && r.id === targetRace.id) return false;
      if (targetGlobal && r.id === targetGlobal.id) return false;

      if (targetTourId && r.tournamentId === targetTourId && targetPos !== undefined && r.position === targetPos) {
        const nameMatch = targetSkaterName && r.skaterName?.trim().toLowerCase() === targetSkaterName;
        const bibMatch = targetBib && r.bibNumber?.toString().trim() === targetBib;
        const discMatch = !targetDiscipline || r.discipline?.trim().toLowerCase() === targetDiscipline;
        if ((nameMatch || bibMatch) && discMatch) return false;
      }
      return true;
    });

    this.refreshCountsAndPoints();
    this.persistAll();
    this.notify();
  }

  public addOrUpdateRaceResult(resultInput: Partial<RaceResult>): RaceResult {
    const existingIdx = this.raceResults.findIndex(r => 
      (r.id && r.id === resultInput.id) || 
      (r.raceId === resultInput.raceId && r.skaterId === resultInput.skaterId)
    );

    const race = this.getRaceById(resultInput.raceId || '');
    const tourId = resultInput.tournamentId || race?.tournamentId || 'tour-1';
    const eventId = resultInput.eventId || race?.eventId || 'event-1';

    const rawTime = resultInput.rawTiming || '00:00.00';
    const penalty = resultInput.penaltySeconds || 0;
    
    // Calculate final timing with penalty if applicable
    let finalTime = resultInput.finalTiming || rawTime;
    if (penalty > 0 && rawTime !== '00:00.00') {
      const rawMs = parseTimingToMs(rawTime);
      if (rawMs !== Infinity) {
        finalTime = formatMsToTiming(rawMs + (penalty * 1000));
      }
    }

    const pos = resultInput.position || 1;
    let medal = resultInput.medal || (pos === 1 ? 'Gold' : pos === 2 ? 'Silver' : pos === 3 ? 'Bronze' : 'None');
    let points = resultInput.points !== undefined 
      ? resultInput.points 
      : (pos === 1 ? 5 : pos === 2 ? 3 : pos === 3 ? 1 : 0);

    const status = resultInput.status || 'VALID';
    if (status === 'DSQ' || status === 'DNS' || status === 'DNF') {
      medal = 'None';
      points = 0;
    }

    const newResult: RaceResult = {
      id: existingIdx !== -1 ? this.raceResults[existingIdx].id : ('rres-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
      tournamentId: tourId,
      eventId: eventId,
      raceId: resultInput.raceId || '',
      participantId: resultInput.participantId,
      skaterId: resultInput.skaterId || 'skater-0',
      skaterName: resultInput.skaterName || 'Skater Name',
      registrationNumber: resultInput.registrationNumber || 'UPRSA/2026/00000',
      districtName: resultInput.districtName || 'Lucknow',
      clubName: resultInput.clubName || 'Affiliated Club',
      bibNumber: resultInput.bibNumber || '101',
      discipline: resultInput.discipline || '',
      ageGroup: resultInput.ageGroup || '',
      gender: resultInput.gender || '',
      rawTiming: rawTime,
      penaltySeconds: penalty,
      finalTiming: finalTime,
      score: resultInput.score || 0,
      position: pos,
      points: points,
      medal: medal,
      status: status,
      approvalStatus: resultInput.approvalStatus || 'Draft',
      remarks: resultInput.remarks || '',
      createdAt: existingIdx !== -1 ? this.raceResults[existingIdx].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      this.raceResults[existingIdx] = newResult;
    } else {
      this.raceResults.push(newResult);
    }

    // Sync published results with global TournamentResult[]
    if (newResult.approvalStatus === 'Published') {
      this.syncPublishedResultToGlobal(newResult);
    } else {
      // If result is NOT published (Draft, Submitted, etc.), remove from global published results list
      this.results = this.results.filter(r => !(r.skaterId === newResult.skaterId && r.eventId === newResult.eventId));
      this.refreshCountsAndPoints();
    }

    this.persistAll();
    return newResult;
  }

  private syncPublishedResultToGlobal(rResult: RaceResult): void {
    const globalIdx = this.results.findIndex(r => 
      r.id === rResult.id || 
      (r.skaterId === rResult.skaterId && r.raceId && rResult.raceId && r.raceId === rResult.raceId) ||
      (r.skaterId === rResult.skaterId && r.eventId === rResult.eventId && r.remarks && r.remarks === rResult.remarks)
    );
    const tourResult: TournamentResult = {
      id: globalIdx !== -1 ? this.results[globalIdx].id : rResult.id,
      tournamentId: rResult.tournamentId,
      eventId: rResult.eventId,
      raceId: rResult.raceId,
      skaterId: rResult.skaterId,
      skaterName: rResult.skaterName,
      registrationNumber: rResult.registrationNumber,
      districtName: rResult.districtName,
      clubName: rResult.clubName,
      bibNumber: rResult.bibNumber,
      discipline: rResult.discipline,
      ageGroup: rResult.ageGroup,
      gender: rResult.gender,
      timing: rResult.finalTiming,
      rawTiming: rResult.rawTiming,
      penaltySeconds: rResult.penaltySeconds,
      score: rResult.score,
      position: rResult.position,
      points: rResult.points,
      medal: rResult.medal,
      status: rResult.status,
      approvalStatus: rResult.approvalStatus,
      remarks: rResult.remarks,
      createdAt: rResult.createdAt,
      updatedAt: rResult.updatedAt
    };

    if (globalIdx !== -1) {
      this.results[globalIdx] = tourResult;
    } else {
      this.results.push(tourResult);
    }
    this.refreshCountsAndPoints();
  }

  public publishRaceResults(raceId: string): RaceResult[] {
    const raceResults = this.raceResults.filter(r => r.raceId === raceId);
    raceResults.forEach(r => {
      r.approvalStatus = 'Published';
      r.updatedAt = new Date().toISOString();
      this.syncPublishedResultToGlobal(r);
    });

    const race = this.getRaceById(raceId);
    if (race) {
      race.status = 'Finished';
    }

    this.persistAll();
    return raceResults;
  }

  public reopenRaceResults(raceId: string): RaceResult[] {
    const raceResults = this.raceResults.filter(r => r.raceId === raceId);
    raceResults.forEach(r => {
      r.approvalStatus = 'Draft';
      r.updatedAt = new Date().toISOString();
    });

    // Remove these race results from global published results list
    this.results = this.results.filter(r => r.raceId !== raceId);

    const race = this.getRaceById(raceId);
    if (race) {
      race.status = 'Ready';
    }

    this.refreshCountsAndPoints();
    this.persistAll();
    return raceResults;
  }

  // --- SCOREBOARD STATE ---
  public getScoreboardState(): ScoreboardState {
    return this.scoreboardState;
  }

  public updateScoreboardState(stateInput: Partial<ScoreboardState>): ScoreboardState {
    this.scoreboardState = {
      ...this.scoreboardState,
      ...stateInput,
      updatedAt: new Date().toISOString()
    };
    this.persistAll();
    return this.scoreboardState;
  }

  // --- AUTOMATED CERTIFICATE GENERATION ---
  public generateCertificatesForTournament(tournamentId: string): Certificate[] {
    const tour = this.tournaments.find(t => t.id === tournamentId);
    const tourName = tour?.nameEn || '38th UPRSA UP State Championship 2026';
    const tourNum = tour?.tournamentNumber || 'UPRSA-TR-2026-01';

    const publishedResults = this.results.filter(r => r.tournamentId === tournamentId);
    const existingCerts = this.certificates.filter(c => c.tournamentId === tournamentId);
    const certSkaterEventSet = new Set(existingCerts.map(c => `${c.skaterId}-${c.eventId}`));

    const newCertsInput: Partial<Certificate>[] = [];

    publishedResults.forEach(r => {
      if (!certSkaterEventSet.has(`${r.skaterId}-${r.eventId}`)) {
        const skater = this.skaters.find(s => s.id === r.skaterId);
        const event = this.events.find(e => e.id === r.eventId);

        const posText = r.position === 1 ? '1st Position (Gold Medal)' :
                        r.position === 2 ? '2nd Position (Silver Medal)' :
                        r.position === 3 ? '3rd Position (Bronze Medal)' :
                        `${r.position}th Position`;

        newCertsInput.push({
          skaterId: r.skaterId,
          skaterName: r.skaterName,
          registrationNumber: r.registrationNumber,
          fatherMotherName: skater?.fatherMotherName || 'Parent Name',
          tournamentId,
          tournamentName: tourName,
          tournamentNumber: tourNum,
          eventId: r.eventId,
          eventName: event ? `${event.discipline} ${event.distance} (${event.ageGroup})` : 'Speed Skating Event',
          discipline: r.clubName?.includes('Quad') ? 'Speed Quad' : 'Speed Inline',
          ageGroup: event?.ageGroup || 'Sub-Junior (12-15 Years)',
          gender: event?.gender || 'Male',
          position: posText,
          score: r.medal !== 'None' ? `${r.medal} Medalist` : 'Participant',
          timing: r.timing,
          clubName: r.clubName,
          districtName: r.districtName,
          certificateDate: new Date().toISOString().split('T')[0],
          issueDate: new Date().toISOString().split('T')[0],
          status: 'Issued',
          certificateType: r.medal !== 'None' ? 'Merit' : 'Participation'
        });
      }
    });

    if (newCertsInput.length > 0) {
      return this.bulkCreateCertificates(newCertsInput);
    }
    return [];
  }

  // --- ANNOUNCEMENTS & GALLERY & WEBSITE MANAGEMENT ---
  public getAnnouncements(): Announcement[] {
    return [...this.announcements].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  public addAnnouncement(annInput: Omit<Announcement, 'id'>): Announcement {
    const newAnn: Announcement = {
      ...annInput,
      id: 'ann-' + Date.now(),
      isPublished: annInput.isPublished !== undefined ? annInput.isPublished : true
    };
    this.announcements.push(newAnn);
    this.persistAll();
    return newAnn;
  }

  public updateAnnouncement(id: string, annInput: Partial<Announcement>): Announcement | undefined {
    const idx = this.announcements.findIndex(a => a.id === id);
    if (idx === -1) return undefined;
    this.announcements[idx] = { ...this.announcements[idx], ...annInput };
    this.persistAll();
    return this.announcements[idx];
  }

  public deleteAnnouncement(id: string): void {
    this.announcements = this.announcements.filter(a => a.id !== id);
    this.persistAll();
  }

  public getGallery(): GalleryItem[] {
    return [...this.gallery].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public addGalleryItem(itemInput: Omit<GalleryItem, 'id'>): GalleryItem {
    const newItem: GalleryItem = {
      ...itemInput,
      id: 'gal-' + Date.now(),
      isPublished: itemInput.isPublished !== undefined ? itemInput.isPublished : true
    };
    this.gallery.push(newItem);
    this.persistAll();
    return newItem;
  }

  public updateGalleryItem(id: string, itemInput: Partial<GalleryItem>): GalleryItem | undefined {
    const idx = this.gallery.findIndex(g => g.id === id);
    if (idx === -1) return undefined;
    this.gallery[idx] = { ...this.gallery[idx], ...itemInput };
    this.persistAll();
    return this.gallery[idx];
  }

  public deleteGalleryItem(id: string): void {
    this.gallery = this.gallery.filter(g => g.id !== id);
    this.persistAll();
  }

  // --- HERO SLIDES ---
  public getHeroSlides(): HeroSlide[] {
    return [...this.heroSlides].sort((a, b) => a.order - b.order);
  }

  public addHeroSlide(slideInput: Omit<HeroSlide, 'id'>): HeroSlide {
    const newSlide: HeroSlide = {
      ...slideInput,
      id: 'slide-' + Date.now(),
      order: slideInput.order || this.heroSlides.length + 1
    };
    this.heroSlides.push(newSlide);
    this.persistAll();
    return newSlide;
  }

  public updateHeroSlide(id: string, slideInput: Partial<HeroSlide>): HeroSlide | undefined {
    const idx = this.heroSlides.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    this.heroSlides[idx] = { ...this.heroSlides[idx], ...slideInput };
    this.persistAll();
    return this.heroSlides[idx];
  }

  public deleteHeroSlide(id: string): void {
    this.heroSlides = this.heroSlides.filter(s => s.id !== id);
    this.persistAll();
  }

  public reorderHeroSlides(orderedSlides: HeroSlide[]): HeroSlide[] {
    this.heroSlides = orderedSlides.map((s, idx) => ({ ...s, order: idx + 1 }));
    this.persistAll();
    return this.heroSlides;
  }

  // --- HOME SECTIONS ---
  public getHomeSections(): HomeSection[] {
    return [...this.homeSections].sort((a, b) => a.order - b.order);
  }

  public updateHomeSections(sections: HomeSection[]): HomeSection[] {
    this.homeSections = sections.map((s, idx) => ({ ...s, order: idx + 1 }));
    this.persistAll();
    return this.homeSections;
  }

  // --- WEBSITE CONTENT ---
  public getAllWebsiteContent(): WebsiteContent[] {
    return this.websiteContent;
  }

  public getWebsiteContent(key: string): WebsiteContent | undefined {
    return this.websiteContent.find(c => c.key === key);
  }

  public updateWebsiteContent(key: string, contentData: Partial<WebsiteContent>): WebsiteContent {
    const idx = this.websiteContent.findIndex(c => c.key === key);
    if (idx !== -1) {
      this.websiteContent[idx] = { ...this.websiteContent[idx], ...contentData, updatedAt: new Date().toISOString() };
      this.persistAll();
      return this.websiteContent[idx];
    } else {
      const newContent: WebsiteContent = {
        id: 'content-' + Date.now(),
        key,
        section: contentData.section || 'general',
        titleEn: contentData.titleEn || '',
        titleHi: contentData.titleHi || '',
        contentEn: contentData.contentEn || '',
        contentHi: contentData.contentHi || '',
        imageUrl: contentData.imageUrl,
        updatedAt: new Date().toISOString()
      };
      this.websiteContent.push(newContent);
      this.persistAll();
      return newContent;
    }
  }

  // --- MEDIA LIBRARY ---
  public getMediaLibrary(): MediaItem[] {
    return [...this.mediaLibrary].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  public addMediaItem(itemInput: Omit<MediaItem, 'id' | 'uploadedAt'>): MediaItem {
    const newItem: MediaItem = {
      ...itemInput,
      id: 'media-' + Date.now(),
      uploadedAt: new Date().toISOString()
    };
    this.mediaLibrary.unshift(newItem);
    this.persistAll();
    return newItem;
  }

  public deleteMediaItem(id: string): void {
    this.mediaLibrary = this.mediaLibrary.filter(m => m.id !== id);
    this.persistAll();
  }

  // --- COUNCIL MEMBERS ---
  public getCouncilMembers(): CouncilMember[] {
    return [...this.councilMembers].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public getActiveCouncilMembers(): CouncilMember[] {
    return this.getCouncilMembers().filter(m => m.isActive);
  }

  public addCouncilMember(memberInput: Omit<CouncilMember, 'id'>): CouncilMember {
    const newMember: CouncilMember = {
      ...memberInput,
      id: 'council-' + Date.now(),
      displayOrder: memberInput.displayOrder || this.councilMembers.length + 1
    };
    this.councilMembers.push(newMember);
    this.persistAll();
    return newMember;
  }

  public updateCouncilMember(id: string, memberInput: Partial<CouncilMember>): CouncilMember | undefined {
    const idx = this.councilMembers.findIndex(m => m.id === id);
    if (idx === -1) return undefined;
    this.councilMembers[idx] = { ...this.councilMembers[idx], ...memberInput };
    this.persistAll();
    return this.councilMembers[idx];
  }

  public deleteCouncilMember(id: string): void {
    this.councilMembers = this.councilMembers.filter(m => m.id !== id);
    this.persistAll();
  }

  public reorderCouncilMembers(orderedMembers: CouncilMember[]): CouncilMember[] {
    this.councilMembers = orderedMembers.map((m, idx) => ({ ...m, displayOrder: idx + 1 }));
    this.persistAll();
    return this.councilMembers;
  }

  // --- DISCIPLINES / ACTIVITIES ---
  public getDisciplines(): DisciplineItem[] {
    return this.disciplines.filter(d => d.isActive !== false).sort((a,b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  public getAllDisciplines(): DisciplineItem[] {
    return [...this.disciplines].sort((a,b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  public addDiscipline(itemInput: Omit<DisciplineItem, 'id'>): DisciplineItem {
    const newItem: DisciplineItem = {
      ...itemInput,
      id: 'disc-' + Date.now(),
      displayOrder: itemInput.displayOrder || this.disciplines.length + 1
    };
    this.disciplines.push(newItem);
    this.persistAll();
    return newItem;
  }

  public updateDiscipline(id: string, updates: Partial<DisciplineItem>): DisciplineItem | undefined {
    const idx = this.disciplines.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    this.disciplines[idx] = { ...this.disciplines[idx], ...updates };
    this.persistAll();
    return this.disciplines[idx];
  }

  public deleteDiscipline(id: string): void {
    this.disciplines = this.disciplines.filter(d => d.id !== id);
    this.persistAll();
  }

  public reorderDisciplines(orderedDisciplines: DisciplineItem[]): DisciplineItem[] {
    this.disciplines = orderedDisciplines.map((d, idx) => ({ ...d, displayOrder: idx + 1 }));
    this.persistAll();
    return this.disciplines;
  }

  // --- WEBSITE SETTINGS ---
  public getWebsiteSettings(): WebsiteSettings {
    return this.websiteSettings || defaultWebsiteSettings;
  }

  public updateWebsiteSettings(settingsInput: Partial<WebsiteSettings>): WebsiteSettings {
    this.websiteSettings = { ...this.websiteSettings, ...settingsInput };
    this.persistAll();
    return this.websiteSettings;
  }

  // --- ADMIN CREDENTIALS & SECURITY ---
  public getAdminCredentials(): AdminCredentials {
    return this.adminCredentials || {
      username: 'admin',
      email: 'uprsa.official@gmail.com',
      password: 'admin',
      updatedAt: new Date().toISOString()
    };
  }

  public updateAdminCredentials(creds: Partial<AdminCredentials>): AdminCredentials {
    this.adminCredentials = {
      ...this.adminCredentials,
      ...creds,
      updatedAt: new Date().toISOString()
    };
    this.persistAll();
    return this.adminCredentials;
  }

  public verifyAdminLogin(usernameInput: string, passwordInput: string): boolean {
    const current = this.getAdminCredentials();
    return (
      usernameInput.trim().toLowerCase() === current.username.trim().toLowerCase() &&
      passwordInput.trim() === current.password.trim()
    );
  }

  // --- Phase 5: QR-Based Tournament Payment System Methods ---
  public getTournamentById(id: string): Tournament | undefined {
    return this.tournaments.find(t => t.id === id);
  }

  public getPaymentSettings(): PaymentSettings {
    return this.paymentSettings;
  }

  public updatePaymentSettings(updates: Partial<PaymentSettings>): PaymentSettings {
    this.paymentSettings = {
      ...this.paymentSettings,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persistAll();
    return this.paymentSettings;
  }

  public getPayments(tournamentId?: string, skaterId?: string, status?: PaymentStatus): TournamentPayment[] {
    let list = [...this.tournamentPayments];
    if (tournamentId) {
      list = list.filter(p => p.tournamentId === tournamentId);
    }
    if (skaterId) {
      list = list.filter(p => p.skaterId === skaterId);
    }
    if (status) {
      list = list.filter(p => p.status === status);
    }
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  public getPaymentById(id: string): TournamentPayment | undefined {
    return this.tournamentPayments.find(p => p.id === id);
  }

  public getPaymentByRegistrationId(registrationId: string): TournamentPayment | undefined {
    return this.tournamentPayments.find(p => p.registrationId === registrationId);
  }

  public checkDuplicateUTR(utrNumber: string, excludePaymentId?: string): boolean {
    if (!utrNumber) return false;
    const cleanUTR = utrNumber.trim().toLowerCase();
    return this.tournamentPayments.some(p => 
      p.id !== excludePaymentId &&
      (p.status === 'PENDING' || p.status === 'VERIFIED') &&
      p.utrNumber.trim().toLowerCase() === cleanUTR
    );
  }

  public submitTournamentPayment(input: {
    registrationId?: string;
    skaterId: string;
    tournamentId: string;
    amount: number;
    utrNumber: string;
    screenshotStoragePath?: string;
    screenshotUrl?: string;
    paymentMethod?: string;
  }): { success: boolean; payment?: TournamentPayment; error?: string } {
    const cleanUTR = (input.utrNumber || '').trim();
    if (!cleanUTR) {
      return { success: false, error: 'कृपया UTR / Transaction ID दर्ज करें।' };
    }
    if (cleanUTR.length < 8 || cleanUTR.length > 25) {
      return { success: false, error: 'अमान्य UTR / Transaction ID. UTR 8 से 25 वर्णों का होना चाहिए।' };
    }

    if (this.checkDuplicateUTR(cleanUTR)) {
      return { success: false, error: 'यह UTR / Transaction ID पहले से एक अन्य भुगतान के लिए प्रस्तुत किया जा चुका है।' };
    }

    const skater = this.getSkaterById(input.skaterId);
    const tournament = this.getTournamentById(input.tournamentId);

    // Check if skater already has pending or verified payment for this tournament
    const existing = this.tournamentPayments.find(p => 
      p.skaterId === input.skaterId && 
      p.tournamentId === input.tournamentId && 
      (p.status === 'PENDING' || p.status === 'VERIFIED')
    );
    if (existing) {
      if (existing.status === 'VERIFIED') {
        return { success: false, error: 'इस टूर्नामेंट का भुगतान पहले ही सत्यापित हो चुका है।' };
      } else {
        return { success: false, error: 'इस टूर्नामेंट के लिए भुगतान सत्यापन पहले से लंबित (Pending) है।' };
      }
    }

    const paymentId = `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowIso = new Date().toISOString();

    const newPayment: TournamentPayment = {
      id: paymentId,
      registrationId: input.registrationId || `reg-group-${input.skaterId}-${input.tournamentId}`,
      skaterId: input.skaterId,
      skaterName: skater?.name || 'Skater',
      registrationNumber: skater?.registrationNumber || skater?.applicationNumber || 'PENDING',
      districtName: skater?.districtName || 'Uttar Pradesh',
      clubName: skater?.clubName || 'Affiliated Club',
      tournamentId: input.tournamentId,
      tournamentName: tournament?.nameEn || 'Tournament',
      amount: input.amount || this.paymentSettings.defaultTournamentFee || 500,
      currency: 'INR',
      paymentMethod: input.paymentMethod || 'UPI_QR',
      upiId: this.paymentSettings.upiId || 'uprsa@upi',
      utrNumber: cleanUTR,
      transactionDate: nowIso,
      screenshotStoragePath: input.screenshotStoragePath,
      screenshotUrl: input.screenshotUrl,
      status: 'PENDING',
      submittedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.tournamentPayments.unshift(newPayment);

    // Update registration payment status
    if (input.registrationId) {
      this.registrations = this.registrations.map(r => {
        if (r.id === input.registrationId) {
          return { ...r, paymentStatus: 'PENDING', feeAmount: newPayment.amount };
        }
        return r;
      });
    } else {
      // Update all registrations for this skater & tournament
      this.registrations = this.registrations.map(r => {
        if (r.skaterId === input.skaterId && r.tournamentId === input.tournamentId) {
          return { ...r, paymentStatus: 'PENDING', feeAmount: newPayment.amount };
        }
        return r;
      });
    }

    this.persistAll();
    return { success: true, payment: newPayment };
  }

  public verifyTournamentPayment(paymentId: string, verifiedBy: string): { success: boolean; payment?: TournamentPayment; error?: string } {
    const pIndex = this.tournamentPayments.findIndex(p => p.id === paymentId);
    if (pIndex === -1) {
      return { success: false, error: 'भुगतान रिकॉर्ड नहीं मिला।' };
    }

    const payment = this.tournamentPayments[pIndex];
    const nowIso = new Date().toISOString();

    const updatedPayment: TournamentPayment = {
      ...payment,
      status: 'VERIFIED',
      verifiedAt: nowIso,
      verifiedBy,
      updatedAt: nowIso
    };

    this.tournamentPayments[pIndex] = updatedPayment;

    // Update matching registrations to PAID
    this.registrations = this.registrations.map(r => {
      if (
        r.id === payment.registrationId || 
        (r.skaterId === payment.skaterId && r.tournamentId === payment.tournamentId)
      ) {
        return { ...r, paymentStatus: 'PAID' };
      }
      return r;
    });

    this.persistAll();
    return { success: true, payment: updatedPayment };
  }

  public rejectTournamentPayment(paymentId: string, rejectionReason: string, rejectedBy: string): { success: boolean; payment?: TournamentPayment; error?: string } {
    const pIndex = this.tournamentPayments.findIndex(p => p.id === paymentId);
    if (pIndex === -1) {
      return { success: false, error: 'भुगतान रिकॉर्ड नहीं मिला।' };
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      return { success: false, error: 'अस्वीकृति का कारण (Rejection Reason) दर्ज करना अनिवार्य है।' };
    }

    const payment = this.tournamentPayments[pIndex];
    const nowIso = new Date().toISOString();

    const updatedPayment: TournamentPayment = {
      ...payment,
      status: 'REJECTED',
      rejectionReason: rejectionReason.trim(),
      updatedAt: nowIso
    };

    this.tournamentPayments[pIndex] = updatedPayment;

    // Update matching registrations to REJECTED paymentStatus
    this.registrations = this.registrations.map(r => {
      if (
        r.id === payment.registrationId || 
        (r.skaterId === payment.skaterId && r.tournamentId === payment.tournamentId)
      ) {
        return { ...r, paymentStatus: 'REJECTED' };
      }
      return r;
    });

    this.persistAll();
    return { success: true, payment: updatedPayment };
  }

  // ==========================================
  // Community Chat Board Methods (कम्युनिटी चैट बोर्ड)
  // ==========================================
  public getChatBoardSettings(): ChatBoardSettings {
    return this.chatBoardSettings || defaultChatBoardSettings;
  }

  public saveChatBoardSettings(settings: Partial<ChatBoardSettings>): ChatBoardSettings {
    this.chatBoardSettings = {
      ...defaultChatBoardSettings,
      ...this.chatBoardSettings,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    this.persistAll();
    return this.chatBoardSettings;
  }

  public getCommunityPosts(): CommunityChatPost[] {
    // Pinned posts come first, then latest by timestamp
    return [...this.communityPosts].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  public addCommunityPost(postData: Omit<CommunityChatPost, 'id' | 'timestamp' | 'likes'>): CommunityChatPost {
    const newPost: CommunityChatPost = {
      ...postData,
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      likes: 0,
      userLiked: false,
      repliesCount: 0
    };

    if (newPost.isPinned) {
      this.communityPosts.unshift(newPost);
    } else {
      // insert after pinned items
      const firstUnpinnedIndex = this.communityPosts.findIndex(p => !p.isPinned);
      if (firstUnpinnedIndex === -1) {
        this.communityPosts.push(newPost);
      } else {
        this.communityPosts.splice(firstUnpinnedIndex, 0, newPost);
      }
    }

    this.persistAll();
    return newPost;
  }

  public updateCommunityPost(postId: string, updates: Partial<CommunityChatPost>): CommunityChatPost | null {
    const post = this.communityPosts.find(p => p.id === postId);
    if (!post) return null;

    Object.assign(post, updates);
    this.persistAll();
    return post;
  }

  public pinCommunityPost(postId: string, pinned: boolean): boolean {
    const post = this.communityPosts.find(p => p.id === postId);
    if (!post) return false;

    post.isPinned = pinned;
    this.persistAll();
    return true;
  }

  public likeCommunityPost(postId: string): { success: boolean; likes: number; userLiked: boolean } {
    const post = this.communityPosts.find(p => p.id === postId);
    if (!post) return { success: false, likes: 0, userLiked: false };

    if (post.userLiked) {
      post.likes = Math.max(0, post.likes - 1);
      post.userLiked = false;
    } else {
      post.likes += 1;
      post.userLiked = true;
    }

    this.persistAll();
    return { success: true, likes: post.likes, userLiked: !!post.userLiked };
  }

  public deleteCommunityPost(postId: string): boolean {
    const prevLen = this.communityPosts.length;
    this.communityPosts = this.communityPosts.filter(p => p.id !== postId);
    if (this.communityPosts.length !== prevLen) {
      this.persistAll();
      return true;
    }
    return false;
  }
}

export function parseTimingToMs(timingStr: string): number {
  if (!timingStr || timingStr.trim() === '') return Infinity;
  const clean = timingStr.trim();
  const parts = clean.split(':');
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]);
    const secs = parseFloat(parts[1]);
    if (isNaN(mins) || isNaN(secs)) return Infinity;
    return Math.round((mins * 60 + secs) * 1000);
  } else if (parts.length === 1) {
    const secs = parseFloat(parts[0]);
    if (isNaN(secs)) return Infinity;
    return Math.round(secs * 1000);
  }
  return Infinity;
}

export function formatMsToTiming(ms: number): string {
  if (ms === Infinity || isNaN(ms) || ms < 0) return '00:00.00';
  const totalSecs = ms / 1000;
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const minsStr = String(mins).padStart(2, '0');
  const secsStr = secs.toFixed(2).padStart(5, '0');
  return `${minsStr}:${secsStr}`;
}

export const dbStore = new UPRSAStore();
