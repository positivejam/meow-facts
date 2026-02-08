import { describe, it, expect } from 'vitest';
import { generateAllFacts, formatProblem } from './cardGenerator';

describe('generateAllFacts', () => {
    describe('addition', () => {
        it('generates all addition facts for given maxNumber', () => {
            const cards = generateAllFacts('addition', 2);
            // 3x3 = 9 facts: 0+0, 0+1, 0+2, 1+0, 1+1, 1+2, 2+0, 2+1, 2+2
            expect(cards).toHaveLength(9);
        });

        it('generates addition facts with enabled numbers filter', () => {
            const cards = generateAllFacts('addition', 2, [0, 1]);
            // Enabled: 0, 1. Max: 2.
            // Facts where at least one operand is 0 or 1:
            // 0+0, 0+1, 0+2, 1+0, 1+1, 1+2, 2+0, 2+1 = 8 facts
            expect(cards).toHaveLength(8);
        });
    });

    describe('subtraction', () => {
        it('generates only non-negative subtraction facts', () => {
            const cards = generateAllFacts('subtraction', 3);

            // Verify no negative answers
            for (const card of cards) {
                expect(card.problem.correctAnswer).toBeGreaterThanOrEqual(0);
            }
        });

        it('ensures operand1 >= operand2 for all subtraction facts', () => {
            const cards = generateAllFacts('subtraction', 5);

            for (const card of cards) {
                expect(card.problem.operand1).toBeGreaterThanOrEqual(card.problem.operand2);
            }
        });

        it('generates correct count of subtraction facts', () => {
            // For maxNumber=3, valid pairs where a >= b:
            // 0-0, 1-0, 1-1, 2-0, 2-1, 2-2, 3-0, 3-1, 3-2, 3-3 = 10 facts
            // Formula: (n+1)(n+2)/2 = (3+1)(3+2)/2 = 10
            const cards = generateAllFacts('subtraction', 3);
            expect(cards).toHaveLength(10);
        });

        it('generates correct answers for subtraction', () => {
            const cards = generateAllFacts('subtraction', 5);

            for (const card of cards) {
                const { operand1, operand2, correctAnswer } = card.problem;
                expect(correctAnswer).toBe(operand1 - operand2);
            }
        });

        it('generates subtraction facts with enabled numbers filter', () => {
            const cards = generateAllFacts('subtraction', 3, [2, 3]);

            // Verify all cards have at least one operand in enabled set
            for (const card of cards) {
                const { operand1, operand2 } = card.problem;
                const hasEnabledOperand = [2, 3].includes(operand1) || [2, 3].includes(operand2);
                expect(hasEnabledOperand).toBe(true);
            }

            // Verify no negative results
            for (const card of cards) {
                expect(card.problem.correctAnswer).toBeGreaterThanOrEqual(0);
            }
        });

        it('has fewer facts than addition for same maxNumber', () => {
            const additionCards = generateAllFacts('addition', 5);
            const subtractionCards = generateAllFacts('subtraction', 5);

            // Addition: 6x6 = 36 facts
            // Subtraction: (5+1)(5+2)/2 = 21 facts
            expect(subtractionCards.length).toBeLessThan(additionCards.length);
            expect(additionCards).toHaveLength(36);
            expect(subtractionCards).toHaveLength(21);
        });
    });

    describe('card IDs', () => {
        it('includes operation in card ID', () => {
            const addCards = generateAllFacts('addition', 2);
            const subCards = generateAllFacts('subtraction', 2);

            expect(addCards[0].problem.id).toMatch(/^addition-/);
            expect(subCards[0].problem.id).toMatch(/^subtraction-/);
        });
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
