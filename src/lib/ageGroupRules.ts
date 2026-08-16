import { AgeGroup, AgeGroupRule } from '../types';

export const ALL_OFFICIAL_AGE_GROUPS: string[] = [
  'Under 5 Years (Tiny Tots / नीचें 5 वर्ष)',
  'Tots / Cadet B: 6 to 8 years',
  'Minis: 8 to 10 years',
  'Cadet: 10 to 12 years',
  'Sub-Junior: 12 to 15 years',
  'Junior: 15 to 18 years',
  'Senior: Above 18 years',
  'Masters: 35 years and above'
];

export const defaultAgeGroupRules: AgeGroupRule[] = [
  {
    id: 'rule-1',
    code: 'UNDER_5',
    name: 'Under 5 Years (Tiny Tots / नीचें 5 वर्ष)',
    minAge: 0,
    maxAge: 5,
    description: 'Skaters aged under 5 years (0 to 5 years)'
  },
  {
    id: 'rule-2',
    code: 'TOTS_6_8',
    name: 'Tots / Cadet B: 6 to 8 years',
    minAge: 6,
    maxAge: 7,
    description: 'Skaters aged 6 to 8 years'
  },
  {
    id: 'rule-3',
    code: 'MINIS_8_10',
    name: 'Minis: 8 to 10 years',
    minAge: 8,
    maxAge: 9,
    description: 'Minis skaters aged 8 to 10 years'
  },
  {
    id: 'rule-4',
    code: 'CADET_10_12',
    name: 'Cadet: 10 to 12 years',
    minAge: 10,
    maxAge: 11,
    description: 'Cadet skaters aged 10 to 12 years'
  },
  {
    id: 'rule-5',
    code: 'SUB_JUNIOR_12_15',
    name: 'Sub-Junior: 12 to 15 years',
    minAge: 12,
    maxAge: 14,
    description: 'Sub-Junior skaters aged 12 to 15 years'
  },
  {
    id: 'rule-6',
    code: 'JUNIOR_15_18',
    name: 'Junior: 15 to 18 years',
    minAge: 15,
    maxAge: 17,
    description: 'Junior skaters aged 15 to 18 years'
  },
  {
    id: 'rule-7',
    code: 'SENIOR_ABOVE_18',
    name: 'Senior: Above 18 years',
    minAge: 18,
    maxAge: 34,
    description: 'Senior skaters aged above 18 years'
  },
  {
    id: 'rule-8',
    code: 'MASTERS_35_ABOVE',
    name: 'Masters: 35 years and above',
    minAge: 35,
    maxAge: 120,
    description: 'Masters skaters aged 35 years and above'
  }
];

export function calculateAge(dob: string, referenceDate: Date = new Date()): number {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 0;

  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }

  return Math.max(0, age);
}

export function getDetailedAge(dob: string, referenceDate: Date = new Date()): {
  years: number;
  months: number;
  days: number;
  formattedText: string;
  formattedTextHi: string;
} {
  if (!dob) {
    return { years: 0, months: 0, days: 0, formattedText: '0 Yrs', formattedTextHi: '0 वर्ष' };
  }
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) {
    return { years: 0, months: 0, days: 0, formattedText: '0 Yrs', formattedTextHi: '0 वर्ष' };
  }

  let years = referenceDate.getFullYear() - birthDate.getFullYear();
  let months = referenceDate.getMonth() - birthDate.getMonth();
  let days = referenceDate.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const prevMonthLastDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const validYears = Math.max(0, years);
  const validMonths = Math.max(0, months);
  const validDays = Math.max(0, days);

  const formattedText = `${validYears} Yrs${validMonths > 0 ? `, ${validMonths} Mo` : ''}`;
  const formattedTextHi = `${validYears} वर्ष${validMonths > 0 ? `, ${validMonths} माह` : ''}`;

  return {
    years: validYears,
    months: validMonths,
    days: validDays,
    formattedText,
    formattedTextHi
  };
}

export function getAgeGroupFromYears(
  age: number,
  customRules: AgeGroupRule[] = defaultAgeGroupRules
): { age: number; ageGroup: AgeGroup; rule?: AgeGroupRule } {
  const safeAge = Math.max(0, Math.floor(age || 0));
  const matchedRule = customRules.find(r => safeAge >= r.minAge && safeAge <= r.maxAge);

  if (matchedRule) {
    return { age: safeAge, ageGroup: matchedRule.name, rule: matchedRule };
  }

  if (safeAge >= 35) return { age: safeAge, ageGroup: 'Masters: 35 years and above' };
  if (safeAge >= 18) return { age: safeAge, ageGroup: 'Senior: Above 18 years' };
  if (safeAge >= 15) return { age: safeAge, ageGroup: 'Junior: 15 to 18 years' };
  if (safeAge >= 12) return { age: safeAge, ageGroup: 'Sub-Junior: 12 to 15 years' };
  if (safeAge >= 10) return { age: safeAge, ageGroup: 'Cadet: 10 to 12 years' };
  if (safeAge >= 8) return { age: safeAge, ageGroup: 'Minis: 8 to 10 years' };
  if (safeAge >= 6) return { age: safeAge, ageGroup: 'Tots / Cadet B: 6 to 8 years' };
  return { age: safeAge, ageGroup: 'Under 5 Years (Tiny Tots / नीचें 5 वर्ष)' };
}

export function getDobForAge(ageYears: number): string {
  const currentYear = new Date().getFullYear();
  const birthYear = Math.max(1940, currentYear - Math.max(0, ageYears));
  return `${birthYear}-06-15`;
}

export function normalizeAgeGroup(groupName: string): string {
  if (!groupName) return '';
  const g = groupName.toLowerCase().replace(/[\s\-_:]+/g, ' ');
  
  if (g.includes('under 5') || g.includes('tiny tots') || g.includes('below 5') || g.includes('0 to 5') || g.includes('0 5')) {
    return 'under-5';
  }
  if (g.includes('tot') || g.includes('cadet b') || g.includes('6 to 8') || g.includes('6 8') || g.includes('5 to 7')) {
    return 'tots-6-8';
  }
  if (g.includes('mini') || g.includes('8 to 10') || g.includes('8 10')) {
    return 'minis-8-10';
  }
  if (g.includes('cadet') || g.includes('10 to 12') || g.includes('10 12')) {
    return 'cadet-10-12';
  }
  if (g.includes('sub junior') || g.includes('sub-junior') || g.includes('12 to 15') || g.includes('12 15')) {
    return 'sub-junior-12-15';
  }
  if (g.includes('junior') || g.includes('15 to 18') || g.includes('15 18')) {
    return 'junior-15-18';
  }
  if (g.includes('senior') || g.includes('above 18') || g.includes('18+') || g.includes('18 to 35')) {
    return 'senior-above-18';
  }
  if (g.includes('master') || g.includes('35+') || g.includes('35 and above') || g.includes('above 35')) {
    return 'masters-35-plus';
  }
  return g;
}

export function matchAgeGroup(groupA: string, groupB: string): boolean {
  if (!groupA || !groupB) return false;
  const normA = normalizeAgeGroup(groupA);
  const normB = normalizeAgeGroup(groupB);
  if (normA === normB) return true;
  return groupA.trim().toLowerCase() === groupB.trim().toLowerCase();
}

export function getAgeGroupForDob(
  dob: string, 
  customRules: AgeGroupRule[] = defaultAgeGroupRules,
  referenceDate: Date = new Date()
): { age: number; ageGroup: AgeGroup; rule?: AgeGroupRule } {
  const age = calculateAge(dob, referenceDate);
  return getAgeGroupFromYears(age, customRules);
}
