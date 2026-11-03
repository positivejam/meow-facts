import { MASTERY_INTERVAL_DAYS } from '../constants';
import type { MathFactCard } from '../types/game';

export type MasteryColor = 'grey' | 'red' | 'yellow' | 'green' | 'blue';

/** Colors from least to most mastered, with labels for the Progress page key. */
export const MASTERY_LEVELS: { color: MasteryColor; label: string }[] = [
    { color: 'grey', label: 'Not tried yet' },
    { color: 'red', label: 'Learning' },
    { color: 'yellow', label: 'Getting there' },
    { color: 'green', label: 'Almost' },
    { color: 'blue', label: 'Mastered' },
];

/**
 * A fact's mastery color, based on its current review interval (not how soon it's due,
 * so a mastered fact stays blue while it waits for its next review).
 */
export function getMasteryColor(card: MathFactCard): MasteryColor {
    if (card.totalAttempts === 0) return 'grey';
    if (card.interval < MASTERY_INTERVAL_DAYS.yellow) return 'red';
    if (card.interval < MASTERY_INTERVAL_DAYS.green) return 'yellow';
    if (card.interval < MASTERY_INTERVAL_DAYS.blue) return 'green';
    return 'blue';
}

export function isMastered(card: MathFactCard): boolean {
    return getMasteryColor(card) === 'blue';
}
