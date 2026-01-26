import { describe, it, expect } from 'vitest';
import type { MathFactCard } from '../types/game';
import {
  getFactsForLevel,
  calculateLevelMastery,
  calculateOverallProgress,
} from './levelProgress';

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Helper function to create test cards with minimal required fields.
 */
function createTestCard(
  operand1: number,
  operand2: number,
  nextReview: number
): MathFactCard {
  return {
    problem: {
      id: `addition-${operand1}-${operand2}`,
      operand1,
      operand2,
      operation: 'addition',
      correctAnswer: operand1 + operand2,
    },
    easeFactor: 2.5,
    interval: 14,
    repetitions: 3,
    nextReview,
    totalAttempts: 5,
    correctAttempts: 5,
    averageResponseTime: 3000,
  };
}

/**
 * Creates all possible facts for a level with maxNumber.
 * Total facts = 2*maxNumber + 1.
 * The first `masteredCount` facts will be mastered.
 */
function createAllFactsForLevel(
  level: number,
  maxNumber: number,
  masteredCount: number,
  twoWeeksFromNow: number,
  oneWeekFromNow: number
): MathFactCard[] {
  const cards: MathFactCard[] = [];
  let count = 0;

  // Create facts where level is operand1: level+0, level+1, ..., level+maxNumber
  for (let i = 0; i <= maxNumber; i++) {
    const isMastered = count < masteredCount;
    cards.push(createTestCard(level, i, isMastered ? twoWeeksFromNow : oneWeekFromNow));
    count++;
  }

  // Create facts where level is operand2: 0+level, 1+level, ..., maxNumber+level (excluding level+level)
  for (let i = 0; i <= maxNumber; i++) {
    if (i === level) continue; // Skip level+level, already added
    const isMastered = count < masteredCount;
    cards.push(createTestCard(i, level, isMastered ? twoWeeksFromNow : oneWeekFromNow));
    count++;
  }

  return cards;
}

describe('getFactsForLevel', () => {
  it('returns facts where level is operand1', () => {
    const cards = [
      createTestCard(5, 3, 0),
      createTestCard(5, 7, 0),
      createTestCard(2, 3, 0),
    ];

    const result = getFactsForLevel(cards, 5);

    expect(result).toHaveLength(2);
    expect(result.every(c => c.problem.operand1 === 5)).toBe(true);
  });

  it('returns facts where level is operand2', () => {
    const cards = [
      createTestCard(3, 5, 0),
      createTestCard(7, 5, 0),
      createTestCard(2, 3, 0),
    ];

    const result = getFactsForLevel(cards, 5);

    expect(result).toHaveLength(2);
    expect(result.every(c => c.problem.operand2 === 5)).toBe(true);
  });

  it('returns facts where level is either operand (no duplicates for symmetric facts)', () => {
    const cards = [
      createTestCard(5, 5, 0), // 5+5 - both operands are 5
      createTestCard(5, 3, 0),
      createTestCard(3, 5, 0),
      createTestCard(2, 3, 0),
    ];

    const result = getFactsForLevel(cards, 5);

    expect(result).toHaveLength(3); // 5+5, 5+3, 3+5
  });

  it('returns empty array when no matching facts', () => {
    const cards = [
      createTestCard(2, 3, 0),
      createTestCard(4, 6, 0),
    ];

    const result = getFactsForLevel(cards, 5);

    expect(result).toHaveLength(0);
  });
});

describe('calculateLevelMastery', () => {
  const now = Date.now();
  const twoWeeksFromNow = now + TWO_WEEKS_MS;
  const oneWeekFromNow = now + 7 * 24 * 60 * 60 * 1000;

  it('returns blue and isComplete: true when all facts are mastered (100%)', () => {
    // With maxNumber=2, totalFacts = 2*2+1 = 5
    // Level 1: facts are 1+0, 1+1, 1+2, 0+1, 2+1 = 5 facts
    const cards = createAllFactsForLevel(1, 2, 5, twoWeeksFromNow, oneWeekFromNow);

    const result = calculateLevelMastery(cards, 1, 2, now);

    expect(result.masteryPercent).toBe(100);
    expect(result.color).toBe('blue');
    expect(result.isComplete).toBe(true);
    expect(result.totalFacts).toBe(5);
    expect(result.masteredFacts).toBe(5);
  });

  it('returns red and isComplete: false when no facts are mastered (0%)', () => {
    // Create cards but none are mastered
    const cards = createAllFactsForLevel(1, 2, 0, twoWeeksFromNow, oneWeekFromNow);

    const result = calculateLevelMastery(cards, 1, 2, now);

    expect(result.masteryPercent).toBe(0);
    expect(result.color).toBe('red');
    expect(result.isComplete).toBe(false);
    expect(result.masteredFacts).toBe(0);
    expect(result.totalFacts).toBe(5);
  });

  it('returns green and isComplete: false for ~60% mastery (3/5)', () => {
    // With maxNumber=2, totalFacts = 5
    // 3 mastered = 60% -> green (50-74%)
    const cards = createAllFactsForLevel(1, 2, 3, twoWeeksFromNow, oneWeekFromNow);

    const result = calculateLevelMastery(cards, 1, 2, now);

    expect(result.masteryPercent).toBe(60);
    expect(result.color).toBe('green');
    expect(result.isComplete).toBe(false);
  });

  it('returns blue and isComplete: false for 80% mastery (4/5)', () => {
    // With maxNumber=2, totalFacts = 5
    // 4 mastered = 80% -> blue (>=75%)
    const cards = createAllFactsForLevel(1, 2, 4, twoWeeksFromNow, oneWeekFromNow);

    const result = calculateLevelMastery(cards, 1, 2, now);

    expect(result.masteryPercent).toBe(80);
    expect(result.color).toBe('blue');
    expect(result.isComplete).toBe(false);
  });

  it('returns green for 74% (just under blue threshold)', () => {
    // With maxNumber=49, totalFacts = 99
    // 74 mastered out of 99 = 74.747...% -> rounds to ~74.75%, still under 75
    // Actually let's use 73 mastered = 73.737...%
    // Use maxNumber=49 so totalFacts=99, then 74 mastered = 74.74...%
    const cards = createAllFactsForLevel(5, 49, 74, twoWeeksFromNow, oneWeekFromNow);

    const result = calculateLevelMastery(cards, 5, 49, now);

    expect(result.masteryPercent).toBeCloseTo(74.75, 1);
    expect(result.color).toBe('green'); // Under 75%
    expect(result.isComplete).toBe(false);
  });

  it('returns blue for 75% (at blue threshold)', () => {
    // With maxNumber=49, totalFacts = 99
    // 75 mastered = 75.757...% -> blue
    const cards = createAllFactsForLevel(5, 49, 75, twoWeeksFromNow, oneWeekFromNow);

    const result = calculateLevelMastery(cards, 5, 49, now);

    expect(result.masteryPercent).toBeCloseTo(75.76, 1);
    expect(result.color).toBe('blue');
    expect(result.isComplete).toBe(false);
  });

  it('returns orange for 40% mastery (2/5)', () => {
    // With maxNumber=2, totalFacts = 5
    // 2 mastered = 40% -> orange (25-49%)
    const cards = createAllFactsForLevel(1, 2, 2, twoWeeksFromNow, oneWeekFromNow);

    const result = calculateLevelMastery(cards, 1, 2, now);

    expect(result.masteryPercent).toBe(40);
    expect(result.color).toBe('orange');
    expect(result.isComplete).toBe(false);
  });

  it('returns red for 20% (just under orange threshold)', () => {
    // With maxNumber=2, totalFacts = 5
    // 1 mastered = 20% -> red (under 25%)
    const cards = createAllFactsForLevel(1, 2, 1, twoWeeksFromNow, oneWeekFromNow);

    const result = calculateLevelMastery(cards, 1, 2, now);

    expect(result.masteryPercent).toBe(20);
    expect(result.color).toBe('red');
    expect(result.isComplete).toBe(false);
  });

  it('returns totalFacts based on maxNumber even with no cards', () => {
    // Empty cards array - totalFacts should still be 2*maxNumber+1
    const cards: MathFactCard[] = [];

    const result = calculateLevelMastery(cards, 5, 12, now);

    expect(result.level).toBe(5);
    expect(result.totalFacts).toBe(25); // 2*12+1
    expect(result.masteredFacts).toBe(0);
    expect(result.masteryPercent).toBe(0);
    expect(result.color).toBe('red');
    expect(result.isComplete).toBe(false);
  });

  it('correctly identifies mastery threshold at exactly 2 weeks', () => {
    const exactlyTwoWeeks = now + TWO_WEEKS_MS;
    const justUnderTwoWeeks = now + TWO_WEEKS_MS - 1;

    // Create 2 cards for level 5
    const cards = [
      createTestCard(5, 100, exactlyTwoWeeks), // exactly at threshold - mastered
      createTestCard(5, 101, justUnderTwoWeeks), // just under - not mastered
    ];

    const result = calculateLevelMastery(cards, 5, 12, now);

    expect(result.masteredFacts).toBe(1);
    // 1 mastered out of 25 total = 4%
    expect(result.masteryPercent).toBe(4);
  });
});

describe('calculateOverallProgress', () => {
  const now = Date.now();
  const twoWeeksFromNow = now + TWO_WEEKS_MS;
  const oneWeekFromNow = now + 7 * 24 * 60 * 60 * 1000;

  /**
   * Creates ALL possible facts for a given maxNumber (all operand combinations).
   * Then sets mastery based on which levels should be complete.
   * masteredLevels: array of level numbers that should be 100% mastered
   * partialLevels: array of {level, masteredCount} for partial mastery
   */
  function createAllFacts(
    maxNumber: number,
    masteredLevels: number[],
    partialLevels: Array<{ level: number; masteredCount: number }> = []
  ): MathFactCard[] {
    const cards: MathFactCard[] = [];
    const masteredCards = new Set<string>();

    // First, mark all facts for fully mastered levels
    for (const level of masteredLevels) {
      for (let i = 0; i <= maxNumber; i++) {
        masteredCards.add(`${level}-${i}`);
        masteredCards.add(`${i}-${level}`);
      }
    }

    // For partial levels, mark specific number of facts as mastered
    for (const partial of partialLevels) {
      let count = 0;
      // Mark facts as mastered up to the count
      for (let i = 0; i <= maxNumber && count < partial.masteredCount; i++) {
        const key1 = `${partial.level}-${i}`;
        if (!masteredCards.has(key1)) {
          masteredCards.add(key1);
          count++;
        }
      }
      for (let i = 0; i <= maxNumber && count < partial.masteredCount; i++) {
        if (i === partial.level) continue;
        const key2 = `${i}-${partial.level}`;
        if (!masteredCards.has(key2)) {
          masteredCards.add(key2);
          count++;
        }
      }
    }

    // Create all possible cards
    for (let i = 0; i <= maxNumber; i++) {
      for (let j = 0; j <= maxNumber; j++) {
        const isMastered = masteredCards.has(`${i}-${j}`);
        cards.push(createTestCard(i, j, isMastered ? twoWeeksFromNow : oneWeekFromNow));
      }
    }

    return cards;
  }

  it('returns currentLevel 0 when no levels are completed', () => {
    // With maxNumber=2, each level has 5 total facts
    // No levels fully mastered
    const cards = createAllFacts(2, [], [{ level: 0, masteredCount: 2 }]);

    const result = calculateOverallProgress(cards, 2, now);

    expect(result.completedLevels).toEqual([]);
    expect(result.currentLevel).toBe(0);
    expect(result.currentLevelProgress.level).toBe(0);
  });

  it('returns completedLevels [0] and currentLevel 1 when first level is completed', () => {
    // Level 0: fully mastered (100%)
    // Level 1: partial (some facts mastered via level 0, but not all level 1 facts)
    const cards = createAllFacts(2, [0], []);

    const result = calculateOverallProgress(cards, 2, now);

    expect(result.completedLevels).toEqual([0]);
    expect(result.currentLevel).toBe(1);
    expect(result.currentLevelProgress.level).toBe(1);
  });

  it('returns correct sequence for multiple completed levels', () => {
    // Levels 0, 1, 2: all mastered (100%)
    // Level 3: not complete
    const cards = createAllFacts(3, [0, 1, 2], []);

    const result = calculateOverallProgress(cards, 3, now);

    expect(result.completedLevels).toEqual([0, 1, 2]);
    expect(result.currentLevel).toBe(3);
    expect(result.currentLevelProgress.level).toBe(3);
  });

  it('handles all levels completed', () => {
    // All levels 0-2 at 100%
    const cards = createAllFacts(2, [0, 1, 2], []);

    const result = calculateOverallProgress(cards, 2, now);

    expect(result.completedLevels).toEqual([0, 1, 2]);
    expect(result.currentLevel).toBe(3); // Beyond maxLevel
    expect(result.currentLevelProgress.level).toBe(2); // Shows last level
  });

  it('enforces sequential completion (level 1 at 100% but level 0 not)', () => {
    // Level 1: fully mastered, but level 0 is not
    const cards = createAllFacts(2, [1], [{ level: 0, masteredCount: 2 }]);

    const result = calculateOverallProgress(cards, 2, now);

    expect(result.completedLevels).toEqual([]); // Level 1 doesn't count
    expect(result.currentLevel).toBe(0); // Still on level 0
  });

  it('returns blue color for level at 80% but excludes from completedLevels', () => {
    // Level 0: 4 mastered out of 5 = 80% (blue, but not complete)
    const cards = createAllFacts(2, [], [{ level: 0, masteredCount: 4 }]);

    const result = calculateOverallProgress(cards, 2, now);

    expect(result.completedLevels).toEqual([]); // Not in completed
    expect(result.currentLevel).toBe(0);
    expect(result.currentLevelProgress.color).toBe('blue'); // But shows blue
    expect(result.currentLevelProgress.isComplete).toBe(false);
  });

  it('includes allLevelProgress for all levels up to maxLevel', () => {
    // Level 0: 100%
    // Other levels: partially mastered from level 0's cards
    const cards = createAllFacts(2, [0], []);

    const result = calculateOverallProgress(cards, 2, now);

    expect(result.allLevelProgress).toHaveLength(3); // 0, 1, 2
    expect(result.allLevelProgress[0].level).toBe(0);
    expect(result.allLevelProgress[0].isComplete).toBe(true);
    expect(result.allLevelProgress[1].level).toBe(1);
    // Level 1 gets some mastery from level 0's facts (0+1, 1+0)
    expect(result.allLevelProgress[1].masteredFacts).toBeGreaterThan(0);
    expect(result.allLevelProgress[2].level).toBe(2);
  });
});
