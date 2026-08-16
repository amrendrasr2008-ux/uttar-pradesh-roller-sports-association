import { Race, RaceParticipant, RaceResult, ParticipantStatus, QualificationSource, QualificationFormat } from '../types';
import { parseTimingToMs, formatMsToTiming } from './db';

export interface QualifierCandidate {
  skaterId: string;
  skaterName: string;
  registrationNumber: string;
  bibNumber: string;
  clubName: string;
  districtName: string;
  rawTiming: string;
  penaltySeconds: number;
  finalTiming: string;
  status: ParticipantStatus;
  heatNumber: number;
  heatPosition: number;
  qualificationSource: QualificationSource;
  qualificationLabel: string;
}

export interface FinalASeed {
  boxNumber: number;
  skaterId: string;
  skaterName: string;
  registrationNumber: string;
  bibNumber: string;
  clubName: string;
  districtName: string;
  qualificationSource: QualificationSource;
  qualificationLabel: string;
  seedTiming: string;
}

/**
 * 1. AUTOMATIC HEAT GENERATOR
 * Splits participants into heats, maximum maxPerHeat per heat.
 * Assigns box/lane numbers 1..N per heat.
 */
export function generateHeats<T extends { skaterId: string; skaterName?: string; bibNumber?: string }>(
  participants: T[],
  maxPerHeat: number = 8
): T[][] {
  const uniqueParticipants = preventDuplicateQualifiers(participants);
  const heatCount = Math.max(1, Math.ceil(uniqueParticipants.length / maxPerHeat));
  const heats: T[][] = Array.from({ length: heatCount }, () => []);

  // Distribute sequentially or serpentine
  uniqueParticipants.forEach((p, idx) => {
    const heatIndex = idx % heatCount;
    heats[heatIndex].push(p);
  });

  return heats;
}

/**
 * 2. CALCULATE HEAT RESULTS
 * Ranks participants by valid final timing (lowest time first).
 * Excludes or ranks DNS, DNF, DSQ appropriately. Detects ties for valid timings.
 */
export function calculateHeatResults(results: RaceResult[]): RaceResult[] {
  const validResults = results
    .filter(r => r.status === 'VALID' || !r.status)
    .sort((a, b) => {
      const msA = parseTimingToMs(a.finalTiming || '99:99.99');
      const msB = parseTimingToMs(b.finalTiming || '99:99.99');
      return msA - msB;
    });

  const dnfResults = results.filter(r => r.status === 'DNF');
  const dsqResults = results.filter(r => r.status === 'DSQ');
  const dnsResults = results.filter(r => r.status === 'DNS');

  const ordered = [...validResults, ...dnfResults, ...dsqResults, ...dnsResults];

  // Assign position and detect ties
  let currentPosition = 1;
  return ordered.map((res, index) => {
    if (res.status && res.status !== 'VALID') {
      return {
        ...res,
        position: validResults.length + index + 1,
        tieStatus: false
      };
    }

    const prevRes = index > 0 ? ordered[index - 1] : null;
    const isTie = prevRes && 
      (prevRes.status === 'VALID' || !prevRes.status) &&
      parseTimingToMs(prevRes.finalTiming || '') === parseTimingToMs(res.finalTiming || '');

    if (index > 0 && !isTie) {
      currentPosition = index + 1;
    }

    return {
      ...res,
      position: currentPosition,
      tieStatus: isTie || (index < ordered.length - 1 && parseTimingToMs(res.finalTiming || '') === parseTimingToMs(ordered[index + 1].finalTiming || ''))
    };
  });
}

/**
 * 3. GET HEAT WINNERS
 * Gets 1st position winner for each heat if status is VALID.
 */
export function getHeatWinners(heatResultsMap: Record<number, RaceResult[]>): QualifierCandidate[] {
  const winners: QualifierCandidate[] = [];

  Object.entries(heatResultsMap).forEach(([heatNumStr, results]) => {
    const heatNum = Number(heatNumStr);
    const sorted = calculateHeatResults(results);
    const winner = sorted.find(r => (r.status === 'VALID' || !r.status) && r.position === 1);

    if (winner && validateQualification(winner.status)) {
      winners.push({
        skaterId: winner.skaterId,
        skaterName: winner.skaterName,
        registrationNumber: winner.registrationNumber,
        bibNumber: winner.bibNumber,
        clubName: winner.clubName,
        districtName: winner.districtName,
        rawTiming: winner.rawTiming,
        penaltySeconds: winner.penaltySeconds || 0,
        finalTiming: winner.finalTiming,
        status: winner.status,
        heatNumber: heatNum,
        heatPosition: 1,
        qualificationSource: 'HEAT_WINNER',
        qualificationLabel: `WT${heatNum}`
      });
    }
  });

  return winners;
}

/**
 * 4. GET QUALIFIED TIMES (BEST TIMES NON-WINNERS)
 * Ranks non-winner valid candidates by fastest final time.
 */
export function getQualifiedTimes(
  heatResultsMap: Record<number, RaceResult[]>,
  alreadyQualifiedSkaterIds: string[],
  count: number
): QualifierCandidate[] {
  const nonWinners: QualifierCandidate[] = [];

  Object.entries(heatResultsMap).forEach(([heatNumStr, results]) => {
    const heatNum = Number(heatNumStr);
    const sorted = calculateHeatResults(results);

    sorted.forEach(res => {
      if (
        validateQualification(res.status) &&
        !alreadyQualifiedSkaterIds.includes(res.skaterId)
      ) {
        nonWinners.push({
          skaterId: res.skaterId,
          skaterName: res.skaterName,
          registrationNumber: res.registrationNumber,
          bibNumber: res.bibNumber,
          clubName: res.clubName,
          districtName: res.districtName,
          rawTiming: res.rawTiming,
          penaltySeconds: res.penaltySeconds || 0,
          finalTiming: res.finalTiming,
          status: res.status,
          heatNumber: heatNum,
          heatPosition: res.position,
          qualificationSource: 'QUALIFIED_TIME',
          qualificationLabel: ''
        });
      }
    });
  });

  nonWinners.sort((a, b) => parseTimingToMs(a.finalTiming) - parseTimingToMs(b.finalTiming));

  return nonWinners.slice(0, count).map((item, idx) => ({
    ...item,
    qualificationLabel: `QT${idx + 1}`
  }));
}

/**
 * 5. 500M QUALIFICATION ENGINE
 * Handles Direct Final (<= 8 skaters) and Heats -> Final A / Heats -> Semi -> Final A.
 */
export function generate500mFinalAFromHeats(
  heatResultsMap: Record<number, RaceResult[]>,
  finalBoxes: number = 8,
  directQualifiersPerHeat: number = 1
): FinalASeed[] {
  const heatNumbers = Object.keys(heatResultsMap).map(Number).sort((a, b) => a - b);
  if (heatNumbers.length === 0) return [];

  // If only 1 heat, it is direct final A
  if (heatNumbers.length === 1) {
    const sorted = calculateHeatResults(heatResultsMap[heatNumbers[0]]);
    return sorted
      .filter(r => validateQualification(r.status))
      .slice(0, finalBoxes)
      .map((r, idx) => ({
        boxNumber: idx + 1,
        skaterId: r.skaterId,
        skaterName: r.skaterName,
        registrationNumber: r.registrationNumber,
        bibNumber: r.bibNumber,
        clubName: r.clubName,
        districtName: r.districtName,
        qualificationSource: 'HEAT_WINNER',
        qualificationLabel: `WT${idx + 1}`,
        seedTiming: r.finalTiming
      }));
  }

  // Multi-heat 500M qualification
  const qualifiers: FinalASeed[] = [];
  const qualifiedSkaterIds: string[] = [];

  // Top directQualifiersPerHeat from each heat
  heatNumbers.forEach((heatNum) => {
    const sorted = calculateHeatResults(heatResultsMap[heatNum]);
    const topInHeat = sorted
      .filter(r => validateQualification(r.status))
      .slice(0, directQualifiersPerHeat);

    topInHeat.forEach((res, posIdx) => {
      if (!qualifiedSkaterIds.includes(res.skaterId) && qualifiers.length < finalBoxes) {
        qualifiedSkaterIds.push(res.skaterId);
        qualifiers.push({
          boxNumber: qualifiers.length + 1,
          skaterId: res.skaterId,
          skaterName: res.skaterName,
          registrationNumber: res.registrationNumber,
          bibNumber: res.bibNumber,
          clubName: res.clubName,
          districtName: res.districtName,
          qualificationSource: 'HEAT_WINNER',
          qualificationLabel: `H${heatNum}-P${posIdx + 1}`,
          seedTiming: res.finalTiming
        });
      }
    });
  });

  // Fill remaining boxes with Best Times (QT)
  const neededBestTimes = finalBoxes - qualifiers.length;
  if (neededBestTimes > 0) {
    const bestTimes = getQualifiedTimes(heatResultsMap, qualifiedSkaterIds, neededBestTimes);
    bestTimes.forEach((bt) => {
      if (qualifiers.length < finalBoxes) {
        qualifiedSkaterIds.push(bt.skaterId);
        qualifiers.push({
          boxNumber: qualifiers.length + 1,
          skaterId: bt.skaterId,
          skaterName: bt.skaterName,
          registrationNumber: bt.registrationNumber,
          bibNumber: bt.bibNumber,
          clubName: bt.clubName,
          districtName: bt.districtName,
          qualificationSource: 'QUALIFIED_TIME',
          qualificationLabel: bt.qualificationLabel,
          seedTiming: bt.finalTiming
        });
      }
    });
  }

  return qualifiers;
}

/**
 * 6. 1000M QUALIFICATION ENGINE
 * UPRSA 1000M Logic:
 * - Heat winners initially remain in heat order: Heat 1 Winner -> Box 1, Heat 2 Winner -> Box 2 ...
 * - Non-winners ranked by valid final timing (QT1, QT2, QT3...)
 * - Max 8 participants in Final A.
 */
export function generate1000mFinalAFromHeats(
  heatResultsMap: Record<number, RaceResult[]>,
  finalBoxes: number = 8
): FinalASeed[] {
  const heatNumbers = Object.keys(heatResultsMap).map(Number).sort((a, b) => a - b);
  if (heatNumbers.length === 0) return [];

  const winners = getHeatWinners(heatResultsMap);
  const qualifiedSkaterIds = winners.map(w => w.skaterId);

  const finalSeeds: FinalASeed[] = [];

  // Assign Heat Winners in heat order (WT1 -> Box 1, WT2 -> Box 2...)
  winners.forEach((w) => {
    if (finalSeeds.length < finalBoxes) {
      finalSeeds.push({
        boxNumber: finalSeeds.length + 1,
        skaterId: w.skaterId,
        skaterName: w.skaterName,
        registrationNumber: w.registrationNumber,
        bibNumber: w.bibNumber,
        clubName: w.clubName,
        districtName: w.districtName,
        qualificationSource: 'HEAT_WINNER',
        qualificationLabel: w.qualificationLabel,
        seedTiming: w.finalTiming
      });
    }
  });

  // Remaining boxes filled by Best Valid Non-Winner Times (QT1, QT2...)
  const remainingCount = finalBoxes - finalSeeds.length;
  if (remainingCount > 0) {
    const bestTimes = getQualifiedTimes(heatResultsMap, qualifiedSkaterIds, remainingCount);
    bestTimes.forEach((bt) => {
      if (finalSeeds.length < finalBoxes && !finalSeeds.some(s => s.skaterId === bt.skaterId)) {
        finalSeeds.push({
          boxNumber: finalSeeds.length + 1,
          skaterId: bt.skaterId,
          skaterName: bt.skaterName,
          registrationNumber: bt.registrationNumber,
          bibNumber: bt.bibNumber,
          clubName: bt.clubName,
          districtName: bt.districtName,
          qualificationSource: 'QUALIFIED_TIME',
          qualificationLabel: bt.qualificationLabel,
          seedTiming: bt.finalTiming
        });
      }
    });
  }

  return finalSeeds;
}

/**
 * 7. GENERATE SEMI-FINALS (SERPENTINE SEEDING)
 * Distributes top qualifiers fairly into Semi-Final 1 and Semi-Final 2.
 */
export function generateSemiFinals<T extends { skaterId: string }>(
  qualifiers: T[],
  maxPerSemi: number = 8
): { semi1: T[]; semi2: T[] } {
  const uniqueQualifiers = preventDuplicateQualifiers(qualifiers);
  const semi1: T[] = [];
  const semi2: T[] = [];

  // Serpentine order: 1->SF1, 2->SF2, 3->SF2, 4->SF1, 5->SF1, 6->SF2, ...
  uniqueQualifiers.forEach((q, idx) => {
    const cycle = Math.floor(idx / 2);
    if (cycle % 2 === 0) {
      if (idx % 2 === 0) semi1.push(q);
      else semi2.push(q);
    } else {
      if (idx % 2 === 0) semi2.push(q);
      else semi1.push(q);
    }
  });

  return {
    semi1: semi1.slice(0, maxPerSemi),
    semi2: semi2.slice(0, maxPerSemi)
  };
}

/**
 * 8. VALIDATE QUALIFICATION ELIGIBILITY
 * Returns false for DNS, DSQ, or DNF (unless explicitly overridden).
 */
export function validateQualification(status?: ParticipantStatus, allowDnfOverride: boolean = false): boolean {
  if (!status || status === 'VALID') return true;
  if (status === 'DNS' || status === 'DSQ') return false;
  if (status === 'DNF') return allowDnfOverride;
  return false;
}

/**
 * 9. PREVENT DUPLICATE QUALIFIERS / PARTICIPANTS
 */
export function preventDuplicateQualifiers<T extends { skaterId: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  list.forEach(item => {
    if (item.skaterId && !seen.has(item.skaterId)) {
      seen.add(item.skaterId);
      result.push(item);
    }
  });

  return result;
}
