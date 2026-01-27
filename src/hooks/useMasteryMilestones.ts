import { useRef, useCallback } from 'react';
import type { MathFactCard } from '../types/game';
import { calculateOverallProgress } from '../utils/levelProgress';
import { MAX_LEVEL } from '../constants';

export type MilestoneType = 'orange' | 'green' | 'blue' | 'mastered';

export interface MasteryMilestone {
  level: number;
  milestone: MilestoneType;
  newPercent: number;
}

const THRESHOLDS: { percent: number; milestone: MilestoneType }[] = [
  { percent: 100, milestone: 'mastered' },
  { percent: 75, milestone: 'blue' },
  { percent: 50, milestone: 'green' },
  { percent: 25, milestone: 'orange' },
];

/**
 * Hook for tracking mastery milestones between mission start and completion.
 *
 * Usage:
 * 1. Call capturePreMissionState(cards) before mission starts
 * 2. Call getMilestonesAchieved(cards) when mission completes
 * 3. Display any returned milestones as celebrations
 */
export function useMasteryMilestones() {
  // Store pre-mission mastery for all levels
  const preMissionMastery = useRef<Map<number, number>>(new Map());

  // Call this before mission starts
  const capturePreMissionState = useCallback((cards: MathFactCard[]) => {
    const progress = calculateOverallProgress(cards, MAX_LEVEL);
    preMissionMastery.current.clear();
    for (const levelProgress of progress.allLevelProgress) {
      preMissionMastery.current.set(levelProgress.level, levelProgress.masteryPercent);
    }
  }, []);

  // Call this when mission completes - returns milestones achieved
  // Pass previouslyMasteredLevels to suppress repeated 100% celebrations
  const getMilestonesAchieved = useCallback((
    cards: MathFactCard[],
    previouslyMasteredLevels?: Set<number>
  ): MasteryMilestone[] => {
    const progress = calculateOverallProgress(cards, MAX_LEVEL);
    const milestones: MasteryMilestone[] = [];

    for (const levelProgress of progress.allLevelProgress) {
      const preMastery = preMissionMastery.current.get(levelProgress.level) ?? 0;
      const postMastery = levelProgress.masteryPercent;

      // Check each threshold from highest to lowest
      for (const { percent, milestone } of THRESHOLDS) {
        // Skip mastery (100%) celebration if level was previously mastered
        if (milestone === 'mastered' && previouslyMasteredLevels?.has(levelProgress.level)) {
          continue;
        }

        if (preMastery < percent && postMastery >= percent) {
          milestones.push({
            level: levelProgress.level,
            milestone,
            newPercent: postMastery,
          });
          break; // Only report the highest milestone crossed for each level
        }
      }
    }

    return milestones;
  }, []);

  return { capturePreMissionState, getMilestonesAchieved };
}
