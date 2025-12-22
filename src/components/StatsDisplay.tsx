import type { ProblemAttempt } from '../types/game';

interface StatsDisplayProps {
    attempts: ProblemAttempt[];
}

export function StatsDisplay({ attempts }: StatsDisplayProps) {
    if (attempts.length === 0) {
        return null;
    }

    const correct = attempts.filter(a => a.isCorrect).length;
    const total = attempts.length;
    const accuracy = Math.round((correct / total) * 100);

    const avgTime = attempts.reduce((sum, a) => sum + a.responseTime, 0) / total;
    const avgTimeSec = (avgTime / 1000).toFixed(1);

    const fastCorrect = attempts.filter(
        a => a.isCorrect && a.responseTime <= 3000
    ).length;

    return (
        <div className="stats-display">
            <div className="stat">
                <div className="stat-value">{accuracy}%</div>
                <div className="stat-label">Accuracy</div>
            </div>
            <div className="stat">
                <div className="stat-value">{correct}/{total}</div>
                <div className="stat-label">Correct</div>
            </div>
            <div className="stat">
                <div className="stat-value">{fastCorrect}</div>
                <div className="stat-label">Fast & Correct</div>
            </div>
            <div className="stat">
                <div className="stat-value">{avgTimeSec}s</div>
                <div className="stat-label">Avg Time</div>
            </div>
        </div>
    );
}
