import {
  generateHeats,
  calculateHeatResults,
  getHeatWinners,
  getQualifiedTimes,
  generate500mFinalAFromHeats,
  generate1000mFinalAFromHeats,
  generateSemiFinals,
  validateQualification,
  preventDuplicateQualifiers
} from './qualificationEngine';
import { RaceResult } from '../types';

export interface TestResultReport {
  testName: string;
  passed: boolean;
  details: string;
}

export function runQualificationTestSuite(): TestResultReport[] {
  const reports: TestResultReport[] = [];

  const createDummyResult = (
    skaterId: string,
    skaterName: string,
    finalTiming: string,
    heatNumber: number,
    status: 'VALID' | 'DNS' | 'DNF' | 'DSQ' = 'VALID',
    penaltySeconds: number = 0
  ): RaceResult => ({
    id: `res-${skaterId}`,
    tournamentId: 'tour-1',
    eventId: 'event-1',
    raceId: `race-h${heatNumber}`,
    skaterId,
    skaterName,
    registrationNumber: `REG-${skaterId}`,
    districtName: 'Lucknow',
    clubName: 'UP Club',
    bibNumber: `BIB-${skaterId}`,
    rawTiming: finalTiming,
    penaltySeconds,
    finalTiming,
    score: 0,
    position: 1,
    points: 0,
    medal: 'None',
    status,
    approvalStatus: 'Draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Test 1: Duplicate skater prevention
  try {
    const list = [
      { skaterId: 's1', skaterName: 'Aarav' },
      { skaterId: 's1', skaterName: 'Aarav Duplicate' },
      { skaterId: 's2', skaterName: 'Vivaan' }
    ];
    const dedup = preventDuplicateQualifiers(list);
    reports.push({
      testName: 'Duplicate Skater Prevention',
      passed: dedup.length === 2 && dedup[0].skaterName === 'Aarav',
      details: `Filtered ${list.length} entries to ${dedup.length} unique skaters.`
    });
  } catch (err: any) {
    reports.push({ testName: 'Duplicate Skater Prevention', passed: false, details: err.message });
  }

  // Test 2: DNS / DSQ / DNF Qualification validation
  try {
    const isDnsValid = validateQualification('DNS');
    const isDsqValid = validateQualification('DSQ');
    const isDnfValidNoOverride = validateQualification('DNF', false);
    const isDnfValidOverride = validateQualification('DNF', true);
    const isValidValid = validateQualification('VALID');

    const passed = !isDnsValid && !isDsqValid && !isDnfValidNoOverride && isDnfValidOverride && isValidValid;
    reports.push({
      testName: 'DNS / DSQ / DNF Qualification Rules',
      passed,
      details: 'DNS and DSQ blocked, DNF blocked unless overridden by admin.'
    });
  } catch (err: any) {
    reports.push({ testName: 'DNS / DSQ / DNF Rules', passed: false, details: err.message });
  }

  // Test 3: 500M - 4 Skaters (Direct Final A)
  try {
    const participants = Array.from({ length: 4 }, (_, i) => ({
      skaterId: `s-${i + 1}`,
      skaterName: `Skater ${i + 1}`,
      bibNumber: `${101 + i}`
    }));
    const heats = generateHeats(participants, 8);
    reports.push({
      testName: '500M - 4 Skaters (Direct Final)',
      passed: heats.length === 1 && heats[0].length === 4,
      details: `Generated ${heats.length} heat with ${heats[0].length} participants.`
    });
  } catch (err: any) {
    reports.push({ testName: '500M - 4 Skaters', passed: false, details: err.message });
  }

  // Test 4: 500M - 16 Skaters (2 Heats of 8 -> Final A max 8)
  try {
    const heatMap: Record<number, RaceResult[]> = {
      1: Array.from({ length: 8 }, (_, i) =>
        createDummyResult(`s1-${i + 1}`, `Heat1 Skater ${i + 1}`, `00:${40 + i}.00`, 1)
      ),
      2: Array.from({ length: 8 }, (_, i) =>
        createDummyResult(`s2-${i + 1}`, `Heat2 Skater ${i + 1}`, `00:${41 + i}.00`, 2)
      )
    };
    const finalA = generate500mFinalAFromHeats(heatMap, 8, 2); // Top 2 per heat + 4 best times
    reports.push({
      testName: '500M - 16 Skaters (Heats -> Final A)',
      passed: finalA.length === 8 && new Set(finalA.map(f => f.skaterId)).size === 8,
      details: `Final A generated with ${finalA.length} distinct skaters.`
    });
  } catch (err: any) {
    reports.push({ testName: '500M - 16 Skaters', passed: false, details: err.message });
  }

  // Test 5: 1000M - 24 Skaters (3 Heats -> Final A max 8 with WT1, WT2, WT3, QT1...QT5)
  try {
    const heatMap: Record<number, RaceResult[]> = {
      1: [
        createDummyResult('sk-1-1', 'Winner H1', '01:30.10', 1),
        createDummyResult('sk-1-2', 'Runner H1', '01:31.50', 1),
        createDummyResult('sk-1-3', 'Third H1', '01:32.00', 1)
      ],
      2: [
        createDummyResult('sk-2-1', 'Winner H2', '01:29.80', 2),
        createDummyResult('sk-2-2', 'Runner H2', '01:30.50', 2),
        createDummyResult('sk-2-3', 'Third H2', '01:33.00', 2)
      ],
      3: [
        createDummyResult('sk-3-1', 'Winner H3', '01:31.00', 3),
        createDummyResult('sk-3-2', 'Runner H3', '01:31.20', 3),
        createDummyResult('sk-3-3', 'Third H3', '01:34.00', 3)
      ]
    };

    const final1000m = generate1000mFinalAFromHeats(heatMap, 8);
    const box1 = final1000m.find(b => b.boxNumber === 1);
    const box2 = final1000m.find(b => b.boxNumber === 2);
    const box3 = final1000m.find(b => b.boxNumber === 3);

    const isBox1H1Winner = box1?.skaterId === 'sk-1-1';
    const isBox2H2Winner = box2?.skaterId === 'sk-2-1';
    const isBox3H3Winner = box3?.skaterId === 'sk-3-1';

    const passed = final1000m.length === 8 && isBox1H1Winner && isBox2H2Winner && isBox3H3Winner;
    reports.push({
      testName: '1000M - Heat Winners Order (Box 1=H1, Box 2=H2, Box 3=H3)',
      passed,
      details: `Generated 8 Finalists. Heat 1 Winner in Box 1 (${box1?.skaterName}), Heat 2 Winner in Box 2 (${box2?.skaterName}), Heat 3 Winner in Box 3 (${box3?.skaterName}).`
    });
  } catch (err: any) {
    reports.push({ testName: '1000M - Heat Winners Order', passed: false, details: err.message });
  }

  // Test 6: 1000M - 48 Skaters (Semi-Finals Serpentine Allocation)
  try {
    const qualifiers = Array.from({ length: 16 }, (_, i) => ({
      skaterId: `qual-${i + 1}`,
      skaterName: `Qualifier ${i + 1}`,
      seed: i + 1
    }));
    const { semi1, semi2 } = generateSemiFinals(qualifiers, 8);
    const passed = semi1.length === 8 && semi2.length === 8 && semi1[0].skaterId === 'qual-1' && semi2[0].skaterId === 'qual-2';
    reports.push({
      testName: '1000M - 48 Skaters (Semi-Final Serpentine Seeding)',
      passed,
      details: `Semi 1: ${semi1.length} skaters, Semi 2: ${semi2.length} skaters distributed in serpentine order.`
    });
  } catch (err: any) {
    reports.push({ testName: '1000M - Semi-Final Seeding', passed: false, details: err.message });
  }

  // Test 7: Tie Handling
  try {
    const results = [
      createDummyResult('s1', 'Aarav', '00:45.00', 1),
      createDummyResult('s2', 'Vivaan', '00:45.00', 1)
    ];
    const calculated = calculateHeatResults(results);
    const isTieDetected = calculated[0].tieStatus === true && calculated[1].tieStatus === true;
    reports.push({
      testName: 'Equal Timing Tie Detection',
      passed: isTieDetected,
      details: `Both skaters with 00:45.00 were flagged with tieStatus = true.`
    });
  } catch (err: any) {
    reports.push({ testName: 'Tie Detection', passed: false, details: err.message });
  }

  return reports;
}
