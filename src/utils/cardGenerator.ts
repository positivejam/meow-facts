import type { MathFactCard, MathProblem, Operation } from '../types/game';

export function generateAllFacts(operation: Operation, maxNumber: number): MathFactCard[] {
    const cards: MathFactCard[] = [];

    for (let operand1 = 0; operand1 <= maxNumber; operand1++) {
        for (let operand2 = 0; operand2 <= maxNumber; operand2++) {
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
