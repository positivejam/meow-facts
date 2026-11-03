import type { MathFactCard, MathProblem, Operation, PracticeOperation } from '../types/game';
import { getChartProblems } from './factChart';

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

/**
 * Creates fresh cards (no progress yet) for an operation's chart facts.
 * When enabledFactIds is given, only those facts are included.
 */
export function generateCards(
    operation: PracticeOperation,
    enabledFactIds?: string[]
): MathFactCard[] {
    const enabled = enabledFactIds ? new Set(enabledFactIds) : null;
    return getChartProblems(operation)
        .filter(problem => !enabled || enabled.has(problem.id))
        .map(createCard);
}

function createCard(problem: MathProblem): MathFactCard {
    return {
        problem,
        easeFactor: 2.5, // Default ease factor
        interval: 0, // New cards have 0 interval
        repetitions: 0,
        nextReview: Date.now(), // Available immediately
        totalAttempts: 0,
        correctAttempts: 0,
        averageResponseTime: 0,
    };
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
