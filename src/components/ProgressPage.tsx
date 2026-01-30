import { useState } from 'react';
import type { MathFactCard, Operation } from '../types/game';
import { MAX_LEVEL } from '../constants';
import { calculateOverallProgress } from '../utils/levelProgress';

interface ProgressPageProps {
    cards: MathFactCard[];
    enabledNumbers?: number[];
    onClose: () => void;
}

export function ProgressPage({ cards, enabledNumbers, onClose }: ProgressPageProps) {
    // Filter cards by operation
    const additionCards = cards.filter(c => c.problem.operation === 'addition');
    const subtractionCards = cards.filter(c => c.problem.operation === 'subtraction');

    // Calculate progress for each operation
    const additionProgress = calculateOverallProgress(additionCards, MAX_LEVEL);
    const subtractionProgress = calculateOverallProgress(subtractionCards, MAX_LEVEL);

    // State for selected operation and level
    const [selectedOperation, setSelectedOperation] = useState<Operation>('addition');
    const [selectedLevel, setSelectedLevel] = useState(() => {
        const isAllComplete = additionProgress.currentLevel > MAX_LEVEL;
        return isAllComplete ? 12 : additionProgress.currentLevel;
    });

    // Get progress for the selected operation
    const selectedProgress = selectedOperation === 'addition' ? additionProgress : subtractionProgress;
    const { currentLevel, allLevelProgress } = selectedProgress;

    // Handle case where all levels are complete
    const isAllComplete = currentLevel > MAX_LEVEL;

    // Get mastery for selected level
    const selectedLevelProgress = allLevelProgress[selectedLevel];

    // Handler for clicking a segment
    const handleSegmentClick = (operation: Operation, level: number) => {
        setSelectedOperation(operation);
        setSelectedLevel(level);
    };

    return (
        <div className="progress-overlay">
            <div className="progress-panel">
                <h1>Your Progress</h1>

                <div className="progress-section">
                    <h3>Level Progress</h3>

                    {/* Addition Progress Bar */}
                    <div className="operation-progress">
                        <span className="operation-label">Addition</span>
                        <div className={`primary-progress-bar ${selectedOperation === 'addition' ? 'active' : ''}`}>
                            {additionProgress.allLevelProgress.map((levelProgress) => {
                                const isCompleted = additionProgress.completedLevels.includes(levelProgress.level);
                                const additionAllComplete = additionProgress.currentLevel > MAX_LEVEL;
                                const displayAdditionCurrentLevel = additionAllComplete ? 12 : additionProgress.currentLevel;
                                const isCurrent = levelProgress.level === displayAdditionCurrentLevel && !additionAllComplete;
                                const isSelected = selectedOperation === 'addition' && levelProgress.level === selectedLevel;
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
                                        onClick={() => handleSegmentClick('addition', levelProgress.level)}
                                    >
                                        {levelProgress.level}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Subtraction Progress Bar */}
                    <div className="operation-progress">
                        <span className="operation-label">Subtraction</span>
                        <div className={`primary-progress-bar ${selectedOperation === 'subtraction' ? 'active' : ''}`}>
                            {subtractionProgress.allLevelProgress.map((levelProgress) => {
                                const isCompleted = subtractionProgress.completedLevels.includes(levelProgress.level);
                                const subtractionAllComplete = subtractionProgress.currentLevel > MAX_LEVEL;
                                const displaySubtractionCurrentLevel = subtractionAllComplete ? 12 : subtractionProgress.currentLevel;
                                const isCurrent = levelProgress.level === displaySubtractionCurrentLevel && !subtractionAllComplete;
                                const isSelected = selectedOperation === 'subtraction' && levelProgress.level === selectedLevel;
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
                                        onClick={() => handleSegmentClick('subtraction', levelProgress.level)}
                                    >
                                        {levelProgress.level}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="progress-section">
                    <h3>Level {selectedLevel}: {selectedLevel}s ({selectedOperation === 'addition' ? '+' : '−'})</h3>
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
