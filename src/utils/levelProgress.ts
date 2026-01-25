import type { MathFactCard } from '../types/game';

export type MasteryColor = 'red' | 'orange' | 'green' | 'blue';

export interface LevelMasteryResult {
  level: number;
  totalFacts: number;
  masteredFacts: number; // facts with nextReview >= 2 weeks
  masteryPercent: number; // 0-100
  color: MasteryColor;
  isComplete: boolean; // true if 100% (level advances)
}

export interface OverallProgressResult {
  completedLevels: number[]; // levels at 100% (e.g., [0, 1, 2])
  currentLevel: number; // lowest incomplete level
  currentLevelProgress: LevelMasteryResult;
  allLevelProgress: LevelMasteryResult[];
}

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Returns all cards where the specified number appears as operand1 OR operand2.
 */
export function getFactsForLevel(
  cards: MathFactCard[],
  level: number
): MathFactCard[] {
  return cards.filter(
    card => card.problem.operand1 === level || card.problem.operand2 === level
  );
}

/**
 * Determines the color based on mastery percentage using true quartiles.
 */
function getColorForPercent(percent: number): MasteryColor {
  if (percent >= 75) return 'blue';
  if (percent >= 50) return 'green';
  if (percent >= 25) return 'orange';
  return 'red';
}

/**
 * Calculates mastery percentage for a single level.
 * A fact is considered "mastered" if its nextReview is >= 2 weeks in the future.
 */
export function calculateLevelMastery(
  cards: MathFactCard[],
  level: number,
  now: number = Date.now()
): LevelMasteryResult {
  const levelFacts = getFactsForLevel(cards, level);
  const totalFacts = levelFacts.length;

  if (totalFacts === 0) {
    return {
      level,
      totalFacts: 0,
      masteredFacts: 0,
      masteryPercent: 0,
      color: 'red',
      isComplete: false,
    };
  }

  const twoWeeksFromNow = now + TWO_WEEKS_MS;
  const masteredFacts = levelFacts.filter(
    card => card.nextReview >= twoWeeksFromNow
  ).length;

  const masteryPercent = (masteredFacts / totalFacts) * 100;
  const color = getColorForPercent(masteryPercent);
  const isComplete = masteryPercent === 100;

  return {
    level,
    totalFacts,
    masteredFacts,
    masteryPercent,
    color,
    isComplete,
  };
}

/**
 * Calculates progress across all levels.
 * Levels must be completed in order (0→1→2→...).
 */
export function calculateOverallProgress(
  cards: MathFactCard[],
  maxLevel: number = 12,
  now: number = Date.now()
): OverallProgressResult {
  const allLevelProgress: LevelMasteryResult[] = [];

  for (let level = 0; level <= maxLevel; level++) {
    allLevelProgress.push(calculateLevelMastery(cards, level, now));
  }

  // Find completed levels (must be sequential from 0)
  const completedLevels: number[] = [];
  for (let level = 0; level <= maxLevel; level++) {
    if (allLevelProgress[level].isComplete) {
      completedLevels.push(level);
    } else {
      break; // Stop at first incomplete level
    }
  }

  // Current level is the lowest incomplete level
  const currentLevel = completedLevels.length;
  const currentLevelProgress =
    currentLevel <= maxLevel
      ? allLevelProgress[currentLevel]
      : allLevelProgress[maxLevel]; // All complete, show last level

  return {
    completedLevels,
    currentLevel,
    currentLevelProgress,
    allLevelProgress,
  };
}
