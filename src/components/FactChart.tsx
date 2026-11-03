import { useRef, useState } from 'react';
import type { MathProblem, PracticeOperation } from '../types/game';
import { getOperationSymbol } from '../utils/cardGenerator';
import {
    CHART_SIZE,
    getChartPosition,
    getChartProblems,
    getDiagonal,
    toggleDiagonal,
    toggleFact,
} from '../utils/factChart';

/** Two taps on the same fact within this window count as a double tap. */
const DOUBLE_TAP_MS = 350;

const chartRange = Array.from({ length: CHART_SIZE }, (_, i) => i);

interface FactChartSelection {
    selected: string[];
    onChange: (selected: string[]) => void;
}

interface FactChartProps {
    operation: PracticeOperation;
    /** Extra class names for a fact's cell (e.g. selection or mastery color). */
    getCellClassName: (problem: MathProblem) => string;
    /** Text appended to a fact's accessible name (e.g. its mastery level). */
    getCellDescription?: (problem: MathProblem) => string;
    /** Makes the chart editable: tap toggles a fact, double tap toggles its diagonal. */
    selection?: FactChartSelection;
}

function spokenFact(problem: MathProblem): string {
    const verb = problem.operation === 'subtraction' ? 'minus' : 'plus';
    return `${problem.operand1} ${verb} ${problem.operand2}`;
}

/**
 * An operation's 121 facts as an 11×11 chart. Wide charts show each full fact,
 * stacked; narrow ones (phones) show one number per cell with row and column headers:
 * the sum for addition, the starting number (minuend) for subtraction.
 */
export function FactChart({ operation, getCellClassName, getCellDescription, selection }: FactChartProps) {
    const [hoveredDiagonal, setHoveredDiagonal] = useState<number | null>(null);
    // The first tap of a possible double tap, with the selection from before that tap
    const lastTap = useRef<{ id: string; time: number; selectedBefore: string[] } | null>(null);

    const symbol = getOperationSymbol(operation);
    const isSubtraction = operation === 'subtraction';

    const handleClick = (event: React.MouseEvent, problem: MathProblem) => {
        if (!selection) return;
        const { selected, onChange } = selection;

        // detail 0 = activated from the keyboard (Enter/Space): always a single toggle
        if (event.detail === 0) {
            lastTap.current = null;
            onChange(toggleFact(operation, selected, problem.id));
            return;
        }

        const previous = lastTap.current;
        if (previous && previous.id === problem.id && event.timeStamp - previous.time < DOUBLE_TAP_MS) {
            // Double tap: apply the diagonal rule to the selection from before the first
            // tap, which also overrides that tap's single-fact toggle
            lastTap.current = null;
            onChange(toggleDiagonal(operation, previous.selectedBefore, getDiagonal(problem)));
        } else {
            lastTap.current = { id: problem.id, time: event.timeStamp, selectedBefore: selected };
            onChange(toggleFact(operation, selected, problem.id));
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent, problem: MathProblem) => {
        if (!selection || event.key !== 'Enter' || !event.shiftKey) return;
        event.preventDefault();
        lastTap.current = null;
        selection.onChange(toggleDiagonal(operation, selection.selected, getDiagonal(problem)));
    };

    const selectedSet = selection ? new Set(selection.selected) : null;

    return (
        <div className="fact-chart">
            <div
                className={`fact-chart-grid ${selection ? 'editable' : ''}`}
                role="group"
                aria-label={`${isSubtraction ? 'Subtraction' : 'Addition'} facts`}
            >
                <div className="chart-header chart-corner" style={{ gridRow: 1, gridColumn: 1 }} aria-hidden="true">
                    {symbol}
                </div>

                {chartRange.map(col => (
                    <div
                        key={`col-${col}`}
                        className="chart-header chart-col-header"
                        style={{ gridRow: 1, gridColumn: col + 2 }}
                        aria-hidden="true"
                    >
                        {isSubtraction ? `${symbol}${col}` : (
                            <>
                                <span className="chart-full-only">{symbol}&nbsp;</span>{col}
                            </>
                        )}
                    </div>
                ))}

                {chartRange.map(row => (
                    <div
                        key={`row-${row}`}
                        className="chart-header chart-row-header"
                        style={{ gridRow: row + 2, gridColumn: 1 }}
                        aria-hidden="true"
                    >
                        {isSubtraction ? `=${row}` : row}
                    </div>
                ))}

                {getChartProblems(operation).map(problem => {
                    const { row, col } = getChartPosition(problem);
                    const diagonal = getDiagonal(problem);
                    const description = getCellDescription?.(problem);
                    const label = description ? `${spokenFact(problem)}: ${description}` : spokenFact(problem);
                    const className = [
                        'fact-cell',
                        getCellClassName(problem),
                        hoveredDiagonal === diagonal ? 'in-hovered-diagonal' : '',
                    ].filter(Boolean).join(' ');
                    const style = { gridRow: row + 2, gridColumn: col + 2 };
                    const content = (
                        <>
                            <span className="fact-full" aria-hidden="true">
                                <span>{problem.operand1}</span>
                                <span>{symbol} {problem.operand2}</span>
                            </span>
                            <span className="fact-compact" aria-hidden="true">
                                {isSubtraction ? problem.operand1 : problem.correctAnswer}
                            </span>
                        </>
                    );

                    if (!selection) {
                        return (
                            <div key={problem.id} className={className} style={style} role="img" aria-label={label} title={label}>
                                {content}
                            </div>
                        );
                    }

                    return (
                        <button
                            key={problem.id}
                            type="button"
                            className={className}
                            style={style}
                            aria-label={label}
                            aria-pressed={selectedSet!.has(problem.id)}
                            onClick={(event) => handleClick(event, problem)}
                            onKeyDown={(event) => handleKeyDown(event, problem)}
                            onMouseEnter={() => setHoveredDiagonal(diagonal)}
                            onMouseLeave={() => setHoveredDiagonal(null)}
                        >
                            {content}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
