import { useState } from 'react';
import type { EnabledFacts, MathFactCard, PracticeOperation } from '../types/game';
import { getMasteryColor, MASTERY_LEVELS, type MasteryColor } from '../utils/mastery';
import { FactChart } from './FactChart';

interface ProgressPageProps {
    /** Cards for every chart fact of both operations, with saved progress merged in. */
    cards: MathFactCard[];
    enabledFacts: EnabledFacts;
    initialOperation: PracticeOperation;
    onClose: () => void;
}

const OPERATIONS: { operation: PracticeOperation; label: string }[] = [
    { operation: 'addition', label: 'Addition' },
    { operation: 'subtraction', label: 'Subtraction' },
];

const MASTERY_LABELS = Object.fromEntries(
    MASTERY_LEVELS.map(({ color, label }) => [color, label])
) as Record<MasteryColor, string>;

export function ProgressPage({ cards, enabledFacts, initialOperation, onClose }: ProgressPageProps) {
    const [operation, setOperation] = useState<PracticeOperation>(initialOperation);

    const cardsById = new Map(cards.map(card => [card.problem.id, card]));
    const colorOf = (factId: string): MasteryColor => {
        const card = cardsById.get(factId);
        return card ? getMasteryColor(card) : 'grey';
    };

    const selectedFacts = enabledFacts[operation];
    const selectedSet = new Set(selectedFacts);
    const masteredCount = selectedFacts.filter(id => colorOf(id) === 'blue').length;
    const masteredPercent = selectedFacts.length > 0
        ? Math.round((masteredCount / selectedFacts.length) * 100)
        : 0;

    return (
        <div className="progress-overlay">
            <div className="progress-panel">
                <h1>Your Progress</h1>

                <div className="operation-toggle" role="group" aria-label="Operation">
                    {OPERATIONS.map(({ operation: op, label }) => (
                        <button
                            key={op}
                            type="button"
                            className={`operation-toggle-button ${operation === op ? 'active' : ''}`}
                            aria-pressed={operation === op}
                            onClick={() => setOperation(op)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="progress-section">
                    <div
                        className="mastery-progress-bar"
                        role="progressbar"
                        aria-label="Selected facts mastered"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={masteredPercent}
                    >
                        <div className="mastery-progress-fill" style={{ width: `${masteredPercent}%` }} />
                    </div>
                    <p className="mastery-progress-text">
                        {selectedFacts.length > 0
                            ? `${masteredCount} of ${selectedFacts.length} selected facts mastered (${masteredPercent}%)`
                            : 'No facts selected for practice'}
                    </p>
                </div>

                <div className="progress-section">
                    <FactChart
                        operation={operation}
                        getCellClassName={(problem) => [
                            `mastery-${colorOf(problem.id)}`,
                            selectedSet.has(problem.id) ? '' : 'fact-not-practicing',
                        ].filter(Boolean).join(' ')}
                        getCellDescription={(problem) => {
                            const label = MASTERY_LABELS[colorOf(problem.id)];
                            return selectedSet.has(problem.id) ? label : `${label} (not practicing)`;
                        }}
                    />

                    <ul className="mastery-legend" aria-label="Color key">
                        {MASTERY_LEVELS.map(({ color, label }) => (
                            <li key={color} className="mastery-legend-item">
                                <span className={`mastery-swatch mastery-${color}`} aria-hidden="true" />
                                {label}
                            </li>
                        ))}
                        <li className="mastery-legend-item">
                            <span className="mastery-swatch mastery-grey fact-not-practicing" aria-hidden="true" />
                            Faded: not practicing
                        </li>
                    </ul>
                </div>

                <button onClick={onClose} className="start-button">
                    Back to Practice
                </button>
            </div>
        </div>
    );
}
