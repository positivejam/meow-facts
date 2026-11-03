import { describe, it, expect } from 'vitest';
import { generateCards, formatProblem } from './cardGenerator';

describe('generateCards', () => {
    it('creates a fresh card for every chart fact', () => {
        const cards = generateCards('addition');
        expect(cards).toHaveLength(121);
        expect(cards[0]).toMatchObject({ interval: 0, repetitions: 0, totalAttempts: 0 });
    });

    it('creates only the enabled facts', () => {
        const cards = generateCards('subtraction', ['subtraction-13-4', 'subtraction-2-2']);
        expect(cards.map(card => card.problem.id)).toEqual(['subtraction-2-2', 'subtraction-13-4']);
        expect(cards[1].problem.correctAnswer).toBe(9);
    });

    it('creates no cards when nothing is enabled', () => {
        expect(generateCards('addition', [])).toEqual([]);
    });
});

describe('formatProblem', () => {
    it('formats addition problems with plus sign', () => {
        const result = formatProblem({
            id: 'addition-3-5',
            operand1: 3,
            operand2: 5,
            operation: 'addition',
            correctAnswer: 8,
        });
        expect(result).toBe('3 + 5');
    });

    it('formats subtraction problems with minus sign', () => {
        const result = formatProblem({
            id: 'subtraction-7-3',
            operand1: 7,
            operand2: 3,
            operation: 'subtraction',
            correctAnswer: 4,
        });
        expect(result).toBe('7 \u2212 3');
    });
});
