import type { SparklesData } from '../types/game';

export const SPARKLES_PER_FAST_CORRECT = 1;

export function awardSparkles(current: SparklesData, earned: number): SparklesData {
    return {
        total: current.total + earned,
        earnedThisSession: current.earnedThisSession + earned,
    };
}
