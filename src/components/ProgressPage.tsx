import type { MathFactCard } from '../types/game';
import { calculateOverallProgress } from '../utils/levelProgress';

interface ProgressPageProps {
    cards: MathFactCard[];
    onClose: () => void;
}

export function ProgressPage({ cards, onClose }: ProgressPageProps) {
    const progress = calculateOverallProgress(cards, 12);
    const { completedLevels, currentLevel, currentLevelProgress, allLevelProgress } = progress;

    // Handle case where all levels are complete
    const isAllComplete = currentLevel > 12;
    const displayCurrentLevel = isAllComplete ? 12 : currentLevel;

    return (
        <div className="progress-overlay">
            <div className="progress-panel">
                <h1>Your Progress</h1>

                <div className="progress-section">
                    <h3>Level Progress</h3>
                    <div className="primary-progress-bar">
                        {allLevelProgress.map((levelProgress) => {
                            const isCompleted = completedLevels.includes(levelProgress.level);
                            const isCurrent = levelProgress.level === displayCurrentLevel && !isAllComplete;

                            let className = 'primary-progress-segment';
                            if (isCompleted) className += ' completed';
                            if (isCurrent) className += ' current';

                            return (
                                <div
                                    key={levelProgress.level}
                                    className={className}
                                    title={`Level ${levelProgress.level}: ${Math.round(levelProgress.masteryPercent)}%`}
                                >
                                    {levelProgress.level}
                                </div>
                            );
                        })}
                    </div>
                    <p>
                        {isAllComplete
                            ? 'All levels complete!'
                            : `Level ${currentLevel} of 12`}
                    </p>
                </div>

                {!isAllComplete && (
                    <div className="progress-section">
                        <h3>Current Level: {currentLevel}s</h3>
                        <div className="secondary-progress-bar">
                            <div
                                className={`secondary-progress-fill ${currentLevelProgress.color}`}
                                style={{ width: `${Math.max(currentLevelProgress.masteryPercent, 2)}%` }}
                            />
                        </div>
                        <p>
                            {Math.round(currentLevelProgress.masteryPercent)}% mastered
                            ({currentLevelProgress.masteredFacts}/{currentLevelProgress.totalFacts} facts)
                        </p>
                    </div>
                )}

                {isAllComplete && (
                    <div className="progress-section">
                        <p style={{ fontSize: '1.2rem', color: '#667eea' }}>
                            Congratulations! You've mastered all levels!
                        </p>
                    </div>
                )}

                <button onClick={onClose} className="start-button">
                    Back to Practice
                </button>
            </div>
        </div>
    );
}
