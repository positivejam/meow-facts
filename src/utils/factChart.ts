import { CHART_MAX } from '../constants';
import type { MathProblem, PracticeOperation } from '../types/game';

/**
 * Fact charts: each operation's facts laid out on an 11×11 grid (0–10).
 *
 * Row r, column c holds:
 *   addition:    r + c        (e.g. row 3, column 4 → 3 + 4)
 *   subtraction: (r + c) − c  (e.g. row 3, column 4 → 7 − 4)
 *
 * So each addition fact sits in the same cell as its subtraction partner, and
 * every "↙" diagonal (constant r + c) holds the facts with the same sum (addition)
 * or the same minuend (subtraction). Diagonals are numbered 0–20 by that sum.
 */

export const CHART_SIZE = CHART_MAX + 1;

const chartRange = Array.from({ length: CHART_SIZE }, (_, i) => i);

function createProblem(
    operation: PracticeOperation,
    operand1: number,
    operand2: number,
    correctAnswer: number
): MathProblem {
    return {
        id: `${operation}-${operand1}-${operand2}`,
        operand1,
        operand2,
        operation,
        correctAnswer,
    };
}

/** The fact at a chart position. */
export function getChartProblem(operation: PracticeOperation, row: number, col: number): MathProblem {
    return operation === 'addition'
        ? createProblem('addition', row, col, row + col)
        : createProblem('subtraction', row + col, col, row);
}

/** All 121 chart facts for an operation, in row-major order. */
export function getChartProblems(operation: PracticeOperation): MathProblem[] {
    return chartRange.flatMap(row => chartRange.map(col => getChartProblem(operation, row, col)));
}

/** All chart fact IDs for an operation, in row-major order. */
export function getAllFactIds(operation: PracticeOperation): string[] {
    return getChartProblems(operation).map(problem => problem.id);
}

/** Where a chart fact sits on its chart. */
export function getChartPosition(problem: MathProblem): { row: number; col: number } {
    return problem.operation === 'subtraction'
        ? { row: problem.correctAnswer, col: problem.operand2 }
        : { row: problem.operand1, col: problem.operand2 };
}

/** The diagonal a fact belongs to: its sum (addition) or minuend (subtraction), 0–20. */
export function getDiagonal(problem: MathProblem): number {
    const { row, col } = getChartPosition(problem);
    return row + col;
}

/** Returns the selected IDs in chart order, so stored selections are stable and readable. */
function inChartOrder(operation: PracticeOperation, selected: Set<string>): string[] {
    return getAllFactIds(operation).filter(id => selected.has(id));
}

/** Turns one fact on or off. */
export function toggleFact(operation: PracticeOperation, selected: string[], factId: string): string[] {
    const next = new Set(selected);
    if (next.has(factId)) {
        next.delete(factId);
    } else {
        next.add(factId);
    }
    return inChartOrder(operation, next);
}

/**
 * Toggles a whole diagonal: if every fact on it is selected, turns them all off;
 * otherwise (none or only some selected) turns them all on.
 */
export function toggleDiagonal(operation: PracticeOperation, selected: string[], diagonal: number): string[] {
    const diagonalIds = getChartProblems(operation)
        .filter(problem => getDiagonal(problem) === diagonal)
        .map(problem => problem.id);
    const next = new Set(selected);
    const allSelected = diagonalIds.every(id => next.has(id));
    for (const id of diagonalIds) {
        if (allSelected) {
            next.delete(id);
        } else {
            next.add(id);
        }
    }
    return inChartOrder(operation, next);
}
