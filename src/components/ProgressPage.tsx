import { useState } from 'react';
import type { MathFactCard } from '../types/game';
import { MAX_LEVEL } from '../constants';
import { calculateOverallProgress } from '../utils/levelProgress';

interface ProgressPageProps {
    cards: MathFactCard[];
    enabledNumbers?: number[];
    onClose: () => void;
}

export function ProgressPage({ cards, enabledNumbers, onClose }: ProgressPageProps) {
    const progress = calculateOverallProgress(cards, MAX_LEVEL);
    const { completedLevels, currentLevel, allLevelProgress } = progress;

    // Handle case where all levels are complete
    const isAllComplete = currentLevel > MAX_LEVEL;
    const displayCurrentLevel = isAllComplete ? 12 : currentLevel;

    // State for selected level (defaults to current working level)
    const [selectedLevel, setSelectedLevel] = useState(displayCurrentLevel);

    // Get mastery for selected level
    const selectedLevelProgress = allLevelProgress[selectedLevel];

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
                            const isSelected = levelProgress.level === selectedLevel;
                            const isEnabled = !enabledNumbers || enabledNumbers.includes(levelProgress.level);

                            let className = 'primary-progress-segment';
                            if (isCompleted) className += ' completed';
                            if (isCurrent) className += ' current';
                            if (isSelected) className += ' selected';
                            if (!isEnabled) className += ' disabled';

                            return (
                                <div
                                    key={levelProgress.level}
                                    className={className}
                                    title={`Level ${levelProgress.level}: ${Math.round(levelProgress.masteryPercent)}%${!isEnabled ? ' (not practicing)' : ''}`}
                                    onClick={() => setSelectedLevel(levelProgress.level)}
                                >
                                    {levelProgress.level}
                                </div>
                            );
                        })}
                    </div>
                    <p>
                        {isAllComplete
                            ? 'All levels complete!'
                            : `Level ${currentLevel} of ${MAX_LEVEL}`}
                    </p>
                </div>

                <div className="progress-section">
                    <h3>Level {selectedLevel}: {selectedLevel}s</h3>
                    <div className="progress-markers">
                        <div className="progress-marker red" style={{ left: '0%' }}>▼</div>
                        <div className="progress-marker orange" style={{ left: '25%' }}>▼</div>
                        <div className="progress-marker green" style={{ left: '50%' }}>▼</div>
                        <div className="progress-marker blue" style={{ left: '75%' }}>▼</div>
                    </div>
                    <div className="secondary-progress-bar">
                        <div className="progress-bar-marker-line orange" style={{ left: '25%' }} />
                        <div className="progress-bar-marker-line green" style={{ left: '50%' }} />
                        <div className="progress-bar-marker-line blue" style={{ left: '75%' }} />
                        <div
                            className={`secondary-progress-fill ${selectedLevelProgress.color}`}
                            style={{ width: `${Math.max(selectedLevelProgress.masteryPercent, 2)}%` }}
                        />
                    </div>
                    <p>
                        {Math.round(selectedLevelProgress.masteryPercent)}% mastered
                        ({selectedLevelProgress.masteredFacts}/{selectedLevelProgress.totalFacts} facts)
                    </p>
                </div>

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
