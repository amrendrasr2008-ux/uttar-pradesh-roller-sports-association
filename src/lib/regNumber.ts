const districtCodeMap: Record<string, string> = {
  'Lucknow': 'LKO',
  'Gautam Buddha Nagar (Noida)': 'GBN',
  'Gautam Buddha Nagar': 'GBN',
  'Noida': 'GBN',
  'Kanpur Nagar': 'KNP',
  'Kanpur': 'KNP',
  'Varanasi': 'VNS',
  'Ghaziabad': 'GZB',
  'Agra': 'AGR',
  'Prayagraj (Allahabad)': 'PRJ',
  'Prayagraj': 'PRJ',
  'Allahabad': 'PRJ',
  'Meerut': 'MRT',
  'Gorakhpur': 'GKP',
  'Bareilly': 'BLY',
  'Aligarh': 'ALG',
  'Ayodhya': 'AYD',
  'Moradabad': 'MBD',
  'Saharanpur': 'SRE',
  'Jhansi': 'JHS',
  'Mathura': 'MTR',
  'Muzaffarnagar': 'MZN'
};

export function getDistrictCode(districtName: string): string {
  if (!districtName) return 'UP';
  const clean = districtName.trim();
  if (districtCodeMap[clean]) return districtCodeMap[clean];

  // Try matching partial name or clean first 3 uppercase letters
  const simple = clean.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return simple.slice(0, 3) || 'UPR';
}

export function generateRegistrationNumber(
  districtName: string, 
  existingSkaters: { registrationNumber: string }[]
): string {
  const code = getDistrictCode(districtName);
  const currentYear = new Date().getFullYear();

  // Filter numbers matching this code or pattern
  let maxSeq = 0;

  existingSkaters.forEach(s => {
    if (!s.registrationNumber) return;
    
    // Check patterns like UPRSA-LKO-00001 or UPRSA/2026/01001 or UPRSA-LKO-101
    const parts = s.registrationNumber.split(/[-/]/);
    const lastPart = parts[parts.length - 1];
    const num = parseInt(lastPart, 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(5, '0');
  return `UPRSA-${code}-${nextSeq}`;
}

export function generateApplicationNumber(
  existingSkaters: { applicationNumber?: string }[]
): string {
  const currentYear = new Date().getFullYear();
  let maxSeq = 0;

  existingSkaters.forEach(s => {
    if (!s.applicationNumber) return;
    const parts = s.applicationNumber.split('-');
    const lastPart = parts[parts.length - 1];
    const num = parseInt(lastPart, 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(6, '0');
  return `UPRSA-APP-${currentYear}-${nextSeq}`;
}
