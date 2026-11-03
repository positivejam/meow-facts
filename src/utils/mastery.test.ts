import { describe, it, expect } from 'vitest';
import type { MathFactCard } from '../types/game';
import { getMasteryColor, isMastered } from './mastery';

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
