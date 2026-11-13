import { describe, it, expect } from 'vitest';
import type { MathFactCard } from '../types/game';
import { selectCards, updateCard } from './spacedRepetition';
import { MAX_INTERVAL_DAYS } from '../constants';

const DAY_MS = 24 * 60 * 60 * 1000;
const TARGET_TIME = 5000;
const FAST = 1000;

function card(operand1: number, operand2: number, progress: Partial<MathFactCard> = {}): MathFactCard {
    return {
        problem: {
            id: `addition-${operand1}-${operand2}`,
            operand1,
            operand2,
            operation: 'addition',
            correctAnswer: operand1 + operand2,
        },
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: 0,
        totalAttempts: 0,
        correctAttempts: 0,
        averageResponseTime: 0,
        ...progress,
    };
}

/** Practiced and not due for `daysAway` days. */
function notDue(operand1: number, operand2: number, daysAway: number): MathFactCard {
    return card(operand1, operand2, {
        interval: 30, repetitions: 4, totalAttempts: 4, correctAttempts: 4,
        nextReview: Date.now() + daysAway * DAY_MS, lastReviewed: Date.now() - DAY_MS,
    });
}

const ids = (cards: MathFactCard[]) => cards.map(c => c.problem.id).sort();

describe('selectCards', () => {
    it('tops up a session with only one due card to the full session size', () => {
        const due = card(9, 3, { totalAttempts: 3, interval: 0, nextReview: Date.now() - 1000 });
        const others = Array.from({ length: 20 }, (_, i) => notDue(1, i, i + 1));

        const selected = selectCards([due, ...others], 10);

        expect(selected).toHaveLength(10);
        expect(new Set(ids(selected)).size).toBe(10);
        expect(ids(selected)).toContain('addition-9-3');
    });

    it('fills the top-up with the soonest-due cards first', () => {
        const due = card(9, 3, { totalAttempts: 3, nextReview: Date.now() - 1000 });
        const soon = [notDue(2, 0, 1), notDue(2, 1, 2)];
        const later = Array.from({ length: 10 }, (_, i) => notDue(3, i, 100 + i));

        const selected = selectCards([due, ...later, ...soon], 5);

        expect(ids(selected)).toEqual(expect.arrayContaining(['addition-2-0', 'addition-2-1']));
    });

    it('returns no cards when nothing is due, so the player sees All Caught Up', () => {
        const cards = Array.from({ length: 5 }, (_, i) => notDue(1, i, i + 1));

        expect(selectCards(cards, 10)).toEqual([]);
    });

    it('uses every card when fewer exist than the session size', () => {
        const due = card(9, 3, { nextReview: Date.now() - 1000 });

        expect(ids(selectCards([due, notDue(1, 1, 3)], 10))).toEqual(['addition-1-1', 'addition-9-3']);
    });
});

describe('updateCard', () => {
    it('lengthens the interval on a correct first answer', () => {
        const updated = updateCard(card(3, 5, { repetitions: 2, interval: 6 }), true, FAST, TARGET_TIME);

        expect(updated.repetitions).toBe(3);
        expect(updated.interval).toBeGreaterThan(6);
    });

    it('leaves the schedule alone on a correct repeat, but records the attempt', () => {
        const before = card(3, 5, {
            repetitions: 1, interval: 1, easeFactor: 2.6, nextReview: Date.now() + DAY_MS,
            totalAttempts: 1, correctAttempts: 1, averageResponseTime: FAST,
        });

        const updated = updateCard(before, true, 3000, TARGET_TIME, false);

        expect(updated.repetitions).toBe(1);
        expect(updated.interval).toBe(1);
        expect(updated.easeFactor).toBe(2.6);
        expect(updated.nextReview).toBe(before.nextReview);
        expect(updated.totalAttempts).toBe(2);
        expect(updated.correctAttempts).toBe(2);
        expect(updated.averageResponseTime).toBe(2000);
    });

    it('still resets the card on an incorrect repeat', () => {
        const before = card(3, 5, { repetitions: 1, interval: 1, nextReview: Date.now() + DAY_MS });

        const updated = updateCard(before, false, FAST, TARGET_TIME, false);

        expect(updated.repetitions).toBe(0);
        expect(updated.interval).toBe(0);
    });

    it('does not cram a fact to mastery when answered many times in one mission', () => {
        let c = card(9, 3);
        for (let i = 0; i < 8; i++) {
            c = updateCard(c, true, FAST, TARGET_TIME, i === 0);
        }

        expect(c.repetitions).toBe(1);
        expect(c.interval).toBe(1);
    });

    it(`caps the interval at ${MAX_INTERVAL_DAYS} days`, () => {
        const updated = updateCard(card(3, 5, { repetitions: 6, interval: 150, easeFactor: 3 }), true, FAST, TARGET_TIME);

        expect(updated.interval).toBe(MAX_INTERVAL_DAYS);
        expect(updated.nextReview - Date.now()).toBeLessThanOrEqual(MAX_INTERVAL_DAYS * DAY_MS);
    });
});
