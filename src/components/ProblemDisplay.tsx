import type { MathProblem } from '../types/game';
import { formatProblem } from '../utils/cardGenerator';

interface ProblemDisplayProps {
    problem: MathProblem;
    problemNumber: number;
    totalProblems: number;
}

export function ProblemDisplay({ problem, problemNumber, totalProblems }: ProblemDisplayProps) {
    return (
        <div className="problem-display">
            <div className="problem-counter">
                Problem {problemNumber} of {totalProblems}
            </div>
            <div className="problem-text">
                {formatProblem(problem)} = ?
            </div>
        </div>
    );
}
