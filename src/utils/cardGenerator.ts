import type { MathFactCard, MathProblem, Operation } from '../types/game';

/**
 * Mapping of operation names to their display symbols.
 * Uses proper Unicode characters for mathematical operators.
 */
export const OPERATION_SYMBOLS: Record<Operation, string> = {
    addition: '+',
    subtraction: '\u2212', // −
    multiplication: '\u00D7', // ×
    division: '\u00F7', // ÷
};

export function getOperationSymbol(operation: Operation): string {
    return OPERATION_SYMBOLS[operation];
}

export function generateAllFacts(
    operation: Operation,
    maxNumber: number,
    enabledNumbers?: number[]
): MathFactCard[] {
    const cards: MathFactCard[] = [];

    // If no filter specified, enable all numbers
    const numbersToUse = enabledNumbers && enabledNumbers.length > 0
        ? enabledNumbers
        : Array.from({ length: maxNumber + 1 }, (_, i) => i);

    // Create set of all possible operands: union of enabledNumbers and 0-maxNumber
    // This allows enabled numbers to be outside the 0-maxNumber range
    const rangeNumbers = Array.from({ length: maxNumber + 1 }, (_, i) => i);
    const allPossibleOperands = Array.from(new Set([...numbersToUse, ...rangeNumbers])).sort((a, b) => a - b);

    for (const operand1 of allPossibleOperands) {
        for (const operand2 of allPossibleOperands) {
            // Skip if NEITHER operand is in the enabled set
            // (we want facts where AT LEAST ONE operand is enabled)
            if (!numbersToUse.includes(operand1) && !numbersToUse.includes(operand2)) {
                continue;
            }

            let correctAnswer: number;

            switch (operation) {
                case 'addition':
                    correctAnswer = operand1 + operand2;
                    break;
                case 'subtraction':
                    if (operand1 < operand2) continue; // Skip negative results
                    correctAnswer = operand1 - operand2;
                    break;
                case 'multiplication':
                    correctAnswer = operand1 * operand2;
                    break;
                case 'division':
                    if (operand2 === 0) continue; // Skip division by zero
                    if (operand1 % operand2 !== 0) continue; // Skip non-whole number results
                    correctAnswer = operand1 / operand2;
                    break;
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            const problem: MathProblem = {
                id: `${operation}-${operand1}-${operand2}`,
                operand1,
                operand2,
                operation,
                correctAnswer,
            };

            const card: MathFactCard = {
                problem,
                easeFactor: 2.5, // Default ease factor
                interval: 0, // New cards have 0 interval
                repetitions: 0,
                nextReview: Date.now(), // Available immediately
                totalAttempts: 0,
                correctAttempts: 0,
                averageResponseTime: 0,
            };

            cards.push(card);
        }
    }

    return cards;
}

export function formatProblem(problem: MathProblem): string {
    return `${problem.operand1} ${OPERATION_SYMBOLS[problem.operation]} ${problem.operand2}`;
}

/**
 * Merges freshly generated cards with stored spaced repetition progress.
 * For each generated card, if a stored card with the same problem ID exists,
 * the stored card (with its progress data) is used instead.
 */
export function mergeCardsWithStoredProgress(
    generatedCards: MathFactCard[],
    storedCards: MathFactCard[]
): MathFactCard[] {
    if (storedCards.length === 0) {
        return generatedCards;
    }
    const storedCardMap = new Map(
        storedCards.map(card => [card.problem.id, card])
    );
    return generatedCards.map(card => storedCardMap.get(card.problem.id) || card);
}
