import type { SparklesData } from '../types/game';

const SPARKLES_STORAGE_KEY = 'meow-facts-sparkles';

export const SPARKLES_PER_FAST_CORRECT = 1;

export function loadSparkles(): SparklesData {
    try {
        const stored = localStorage.getItem(SPARKLES_STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            return { total: data.total || 0, earnedThisSession: 0 };
        }
    } catch (error) {
        console.error('Failed to load sparkles:', error);
    }
    return { total: 0, earnedThisSession: 0 };
}

export function saveSparkles(sparkles: SparklesData): void {
    try {
        localStorage.setItem(
            SPARKLES_STORAGE_KEY,
            JSON.stringify({
                total: sparkles.total,
                lastUpdated: Date.now(),
            })
        );
    } catch (error) {
        console.error('Failed to save sparkles:', error);
    }
}

export function awardSparkles(current: SparklesData, earned: number): SparklesData {
    return {
        total: current.total + earned,
        earnedThisSession: current.earnedThisSession + earned,
    };
}
