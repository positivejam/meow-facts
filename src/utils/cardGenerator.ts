import type { MathFactCard, MathProblem, Operation } from '../types/game';

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
    const symbols: Record<Operation, string> = {
        addition: '+',
        subtraction: '-',
        multiplication: '×',
        division: '÷',
    };

    return `${problem.operand1} ${symbols[problem.operation]} ${problem.operand2}`;
}
