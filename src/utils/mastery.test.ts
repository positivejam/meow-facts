import { describe, it, expect } from 'vitest';
import type { MathFactCard } from '../types/game';
import { describeNextTest, getMasteryColor, isMastered } from './mastery';

function card(interval: number, totalAttempts = 3): MathFactCard {
    return {
        problem: { id: 'addition-1-2', operand1: 1, operand2: 2, operation: 'addition', correctAnswer: 3 },
        easeFactor: 2.5,
        interval,
        repetitions: 0,
        nextReview: 0,
        totalAttempts,
        correctAttempts: 0,
        averageResponseTime: 0,
    };
}

describe('getMasteryColor', () => {
    it('is grey when never attempted', () => {
        expect(getMasteryColor(card(0, 0))).toBe('grey');
    });

    it('goes red → yellow → green → blue as the review interval grows', () => {
        expect(getMasteryColor(card(0))).toBe('red');
        expect(getMasteryColor(card(1))).toBe('yellow');
        expect(getMasteryColor(card(5))).toBe('yellow');
        expect(getMasteryColor(card(6))).toBe('green');
        expect(getMasteryColor(card(13))).toBe('green');
        expect(getMasteryColor(card(14))).toBe('blue');
    });

    it('treats only blue as mastered', () => {
        expect(isMastered(card(13))).toBe(false);
        expect(isMastered(card(14))).toBe(true);
    });
});

describe('describeNextTest', () => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const NOW = 1_000_000_000_000;
    const dueIn = (days: number, totalAttempts = 3) =>
        describeNextTest({ ...card(6, totalAttempts), nextReview: NOW + days * DAY_MS }, NOW);

    it('is null for a fact that has never been tried', () => {
        expect(dueIn(0, 0)).toBeNull();
    });

    it('says a due or overdue fact is ready now', () => {
        expect(dueIn(0)).toBe('ready to test now');
        expect(dueIn(-3)).toBe('ready to test now');
    });

    it('says less than a day when the test is hours away', () => {
        expect(dueIn(0.25)).toBe('next test in less than a day');
    });

    it('counts the days until the next test', () => {
        expect(dueIn(1)).toBe('next test in 1 day');
        expect(dueIn(0.999)).toBe('next test in 1 day');
        expect(dueIn(11.8)).toBe('next test in 12 days');
        expect(dueIn(180)).toBe('next test in 180 days');
    });
});
