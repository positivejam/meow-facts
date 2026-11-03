import { describe, it, expect } from 'vitest';
import {
    getAllFactIds,
    getChartPosition,
    getChartProblem,
    getChartProblems,
    getDiagonal,
    toggleDiagonal,
    toggleFact,
} from './factChart';

describe('fact charts', () => {
    it('has 121 facts per operation', () => {
        expect(getChartProblems('addition')).toHaveLength(121);
        expect(getChartProblems('subtraction')).toHaveLength(121);
    });

    it('places addition fact r + c at row r, column c', () => {
        const problem = getChartProblem('addition', 3, 4);
        expect(problem).toMatchObject({ id: 'addition-3-4', operand1: 3, operand2: 4, correctAnswer: 7 });
        expect(getChartPosition(problem)).toEqual({ row: 3, col: 4 });
    });

    it('places subtraction fact (r + c) − c at row r, column c, matching its addition partner', () => {
        const problem = getChartProblem('subtraction', 3, 4);
        expect(problem).toMatchObject({ id: 'subtraction-7-4', operand1: 7, operand2: 4, correctAnswer: 3 });
        expect(getChartPosition(problem)).toEqual({ row: 3, col: 4 });
    });

    it('spans 0 + 0 to 10 + 10 and 0 − 0 to 20 − 10', () => {
        const additionIds = getAllFactIds('addition');
        const subtractionIds = getAllFactIds('subtraction');
        expect(additionIds[0]).toBe('addition-0-0');
        expect(additionIds[120]).toBe('addition-10-10');
        expect(subtractionIds).toContain('subtraction-20-10');
        expect(subtractionIds).not.toContain('subtraction-11-0'); // answer would be 11
    });

    it('numbers diagonals by sum (addition) or minuend (subtraction)', () => {
        expect(getDiagonal(getChartProblem('addition', 3, 4))).toBe(7);
        expect(getDiagonal(getChartProblem('subtraction', 3, 4))).toBe(7); // 7 − 4
        const diagonal13 = getChartProblems('subtraction').filter(p => getDiagonal(p) === 13);
        expect(diagonal13.every(p => p.operand1 === 13)).toBe(true);
        expect(diagonal13).toHaveLength(8); // 13 − 3 through 13 − 10
    });
});

describe('toggleFact', () => {
    it('turns a fact on and off', () => {
        const on = toggleFact('addition', [], 'addition-2-3');
        expect(on).toEqual(['addition-2-3']);
        expect(toggleFact('addition', on, 'addition-2-3')).toEqual([]);
    });

    it('keeps the selection in chart order', () => {
        expect(toggleFact('addition', ['addition-5-5'], 'addition-0-1')).toEqual(['addition-0-1', 'addition-5-5']);
    });
});

describe('toggleDiagonal', () => {
    const diagonal2 = ['addition-0-2', 'addition-1-1', 'addition-2-0'];

    it('turns a fully off diagonal fully on', () => {
        expect(toggleDiagonal('addition', [], 2)).toEqual(diagonal2);
    });

    it('turns a partially on diagonal fully on', () => {
        expect(toggleDiagonal('addition', ['addition-1-1'], 2)).toEqual(diagonal2);
    });

    it('turns a fully on diagonal fully off', () => {
        expect(toggleDiagonal('addition', diagonal2, 2)).toEqual([]);
    });

    it('leaves other facts alone', () => {
        expect(toggleDiagonal('addition', ['addition-9-9', ...diagonal2], 2)).toEqual(['addition-9-9']);
    });
});
