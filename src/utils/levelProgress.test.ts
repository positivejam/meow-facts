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
    const cards = [
      createTestCard(5, 0, twoWeeksFromNow),
      createTestCard(5, 1, twoWeeksFromNow),
      createTestCard(5, 2, twoWeeksFromNow),
      createTestCard(5, 3, twoWeeksFromNow),
    ];

    const result = calculateLevelMastery(cards, 5, now);

    expect(result.masteryPercent).toBe(100);
    expect(result.color).toBe('blue');
    expect(result.isComplete).toBe(true);
    expect(result.totalFacts).toBe(4);
    expect(result.masteredFacts).toBe(4);
  });

  it('returns red and isComplete: false when no facts are mastered (0%)', () => {
    const cards = [
      createTestCard(5, 0, oneWeekFromNow),
      createTestCard(5, 1, oneWeekFromNow),
      createTestCard(5, 2, oneWeekFromNow),
      createTestCard(5, 3, oneWeekFromNow),
    ];

    const result = calculateLevelMastery(cards, 5, now);

    expect(result.masteryPercent).toBe(0);
    expect(result.color).toBe('red');
    expect(result.isComplete).toBe(false);
    expect(result.masteredFacts).toBe(0);
  });

  it('returns green and isComplete: false for 50% mastery', () => {
    const cards = [
      createTestCard(5, 0, twoWeeksFromNow), // mastered
      createTestCard(5, 1, twoWeeksFromNow), // mastered
      createTestCard(5, 2, oneWeekFromNow), // not mastered
      createTestCard(5, 3, oneWeekFromNow), // not mastered
    ];

    const result = calculateLevelMastery(cards, 5, now);

    expect(result.masteryPercent).toBe(50);
    expect(result.color).toBe('green');
    expect(result.isComplete).toBe(false);
  });

  it('returns blue and isComplete: false for exactly 75%', () => {
    const cards = [
      createTestCard(5, 0, twoWeeksFromNow), // mastered
      createTestCard(5, 1, twoWeeksFromNow), // mastered
      createTestCard(5, 2, twoWeeksFromNow), // mastered
      createTestCard(5, 3, oneWeekFromNow), // not mastered
    ];

    const result = calculateLevelMastery(cards, 5, now);

    expect(result.masteryPercent).toBe(75);
    expect(result.color).toBe('blue');
    expect(result.isComplete).toBe(false);
  });

  it('returns green for exactly 74% (just under blue threshold)', () => {
    // Need 74% - use 100 cards, 74 mastered
    const cards: MathFactCard[] = [];
    for (let i = 0; i < 74; i++) {
      cards.push(createTestCard(5, i, twoWeeksFromNow)); // mastered
    }
    for (let i = 74; i < 100; i++) {
      cards.push(createTestCard(5, i, oneWeekFromNow)); // not mastered
    }

    const result = calculateLevelMastery(cards, 5, now);

    expect(result.masteryPercent).toBe(74);
    expect(result.color).toBe('green');
    expect(result.isComplete).toBe(false);
  });

  it('returns orange for exactly 25%', () => {
    const cards = [
      createTestCard(5, 0, twoWeeksFromNow), // mastered
      createTestCard(5, 1, oneWeekFromNow), // not mastered
      createTestCard(5, 2, oneWeekFromNow), // not mastered
      createTestCard(5, 3, oneWeekFromNow), // not mastered
    ];

    const result = calculateLevelMastery(cards, 5, now);

    expect(result.masteryPercent).toBe(25);
    expect(result.color).toBe('orange');
    expect(result.isComplete).toBe(false);
  });

  it('returns red for exactly 24% (just under orange threshold)', () => {
    // Need 24% - use 25 cards, 6 mastered = 24%
    const cards: MathFactCard[] = [];
    for (let i = 0; i < 6; i++) {
      cards.push(createTestCard(5, i, twoWeeksFromNow)); // mastered
    }
    for (let i = 6; i < 25; i++) {
      cards.push(createTestCard(5, i, oneWeekFromNow)); // not mastered
    }

    const result = calculateLevelMastery(cards, 5, now);

    expect(result.masteryPercent).toBe(24);
    expect(result.color).toBe('red');
    expect(result.isComplete).toBe(false);
  });

  it('handles empty level gracefully (0%, red, isComplete: false)', () => {
    const cards = [
      createTestCard(3, 4, twoWeeksFromNow),
      createTestCard(6, 7, twoWeeksFromNow),
    ];

    const result = calculateLevelMastery(cards, 5, now);

    expect(result.level).toBe(5);
    expect(result.totalFacts).toBe(0);
    expect(result.masteredFacts).toBe(0);
    expect(result.masteryPercent).toBe(0);
    expect(result.color).toBe('red');
    expect(result.isComplete).toBe(false);
  });

  it('correctly identifies mastery threshold at exactly 2 weeks', () => {
    const exactlyTwoWeeks = now + TWO_WEEKS_MS;
    const justUnderTwoWeeks = now + TWO_WEEKS_MS - 1;

    const cards = [
      createTestCard(5, 0, exactlyTwoWeeks), // exactly at threshold - mastered
      createTestCard(5, 1, justUnderTwoWeeks), // just under - not mastered
    ];

    const result = calculateLevelMastery(cards, 5, now);

    expect(result.masteredFacts).toBe(1);
    expect(result.masteryPercent).toBe(50);
  });
});

describe('calculateOverallProgress', () => {
  const now = Date.now();
  const twoWeeksFromNow = now + TWO_WEEKS_MS;
  const oneWeekFromNow = now + 7 * 24 * 60 * 60 * 1000;

  /**
   * Helper to create cards for multiple levels.
   * Uses operand2 values >= 1000 to avoid any overlap with level numbers (0-12).
   */
  function createCardsForLevels(
    levelConfigs: Array<{ level: number; masteredCount: number; totalCount: number }>
  ): MathFactCard[] {
    const cards: MathFactCard[] = [];
    let operandCounter = 1000; // Start high to avoid overlap with levels 0-12
    for (const config of levelConfigs) {
      for (let i = 0; i < config.totalCount; i++) {
        const isMastered = i < config.masteredCount;
        cards.push(
          createTestCard(
            config.level,
            operandCounter++,
            isMastered ? twoWeeksFromNow : oneWeekFromNow
          )
        );
      }
    }
    return cards;
  }

  it('returns currentLevel 0 when no levels are completed', () => {
    const cards = createCardsForLevels([
      { level: 0, masteredCount: 2, totalCount: 4 }, // 50%
      { level: 1, masteredCount: 0, totalCount: 4 }, // 0%
    ]);

    const result = calculateOverallProgress(cards, 12, now);

    expect(result.completedLevels).toEqual([]);
    expect(result.currentLevel).toBe(0);
    expect(result.currentLevelProgress.level).toBe(0);
  });

  it('returns completedLevels [0] and currentLevel 1 when first level is completed', () => {
    const cards = createCardsForLevels([
      { level: 0, masteredCount: 4, totalCount: 4 }, // 100%
      { level: 1, masteredCount: 2, totalCount: 4 }, // 50%
    ]);

    const result = calculateOverallProgress(cards, 12, now);

    expect(result.completedLevels).toEqual([0]);
    expect(result.currentLevel).toBe(1);
    expect(result.currentLevelProgress.level).toBe(1);
  });

  it('returns correct sequence for multiple completed levels', () => {
    const cards = createCardsForLevels([
      { level: 0, masteredCount: 4, totalCount: 4 }, // 100%
      { level: 1, masteredCount: 4, totalCount: 4 }, // 100%
      { level: 2, masteredCount: 4, totalCount: 4 }, // 100%
      { level: 3, masteredCount: 2, totalCount: 4 }, // 50%
    ]);

    const result = calculateOverallProgress(cards, 12, now);

    expect(result.completedLevels).toEqual([0, 1, 2]);
    expect(result.currentLevel).toBe(3);
    expect(result.currentLevelProgress.level).toBe(3);
    expect(result.currentLevelProgress.masteryPercent).toBe(50);
  });

  it('handles all levels completed', () => {
    const cards = createCardsForLevels([
      { level: 0, masteredCount: 4, totalCount: 4 },
      { level: 1, masteredCount: 4, totalCount: 4 },
      { level: 2, masteredCount: 4, totalCount: 4 },
    ]);

    const result = calculateOverallProgress(cards, 2, now); // maxLevel = 2

    expect(result.completedLevels).toEqual([0, 1, 2]);
    expect(result.currentLevel).toBe(3); // Beyond maxLevel
    expect(result.currentLevelProgress.level).toBe(2); // Shows last level
  });

  it('enforces sequential completion (level 1 at 100% but level 0 not)', () => {
    const cards = createCardsForLevels([
      { level: 0, masteredCount: 2, totalCount: 4 }, // 50% - not complete
      { level: 1, masteredCount: 4, totalCount: 4 }, // 100% - complete but doesn't count
    ]);

    const result = calculateOverallProgress(cards, 12, now);

    expect(result.completedLevels).toEqual([]); // Level 1 doesn't count
    expect(result.currentLevel).toBe(0); // Still on level 0
  });

  it('returns blue color for level at 75% but excludes from completedLevels', () => {
    const cards = createCardsForLevels([
      { level: 0, masteredCount: 3, totalCount: 4 }, // 75% - blue but not complete
    ]);

    const result = calculateOverallProgress(cards, 12, now);

    expect(result.completedLevels).toEqual([]); // Not in completed
    expect(result.currentLevel).toBe(0);
    expect(result.currentLevelProgress.color).toBe('blue'); // But shows blue
    expect(result.currentLevelProgress.isComplete).toBe(false);
  });

  it('includes allLevelProgress for all levels up to maxLevel', () => {
    const cards = createCardsForLevels([
      { level: 0, masteredCount: 4, totalCount: 4 },
      { level: 1, masteredCount: 2, totalCount: 4 },
      { level: 2, masteredCount: 0, totalCount: 4 },
    ]);

    const result = calculateOverallProgress(cards, 2, now);

    expect(result.allLevelProgress).toHaveLength(3); // 0, 1, 2
    expect(result.allLevelProgress[0].level).toBe(0);
    expect(result.allLevelProgress[0].isComplete).toBe(true);
    expect(result.allLevelProgress[1].level).toBe(1);
    expect(result.allLevelProgress[1].masteryPercent).toBe(50);
    expect(result.allLevelProgress[2].level).toBe(2);
    expect(result.allLevelProgress[2].masteryPercent).toBe(0);
  });
});
