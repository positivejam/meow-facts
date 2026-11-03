import type { MathProblem } from '../types/game';
import { formatProblem } from '../utils/cardGenerator';

interface MasteredFactsBadgeProps {
    facts: MathProblem[];
}

/** Celebrates the facts that turned blue (mastered) during the mission. */
export function MasteredFactsBadge({ facts }: MasteredFactsBadgeProps) {
    if (facts.length === 0) return null;

    return (
        <div className="milestone-celebration">
            <h3>⭐ {facts.length} fact{facts.length === 1 ? '' : 's'} mastered!</h3>
            <ul className="mastered-facts" aria-label="Facts mastered this mission">
                {facts.map(problem => (
                    <li key={problem.id} className="mastered-fact">
                        {formatProblem(problem)} = {problem.correctAnswer}
                    </li>
                ))}
            </ul>
        </div>
    );
}
