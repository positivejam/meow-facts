import { useState } from 'react';
import type { MathFactCard, Operation } from '../types/game';
import { MAX_LEVEL } from '../constants';
import { calculateOverallProgress, type OverallProgressResult } from '../utils/levelProgress';

interface ProgressPageProps {
    cards: MathFactCard[];
    enabledNumbers?: number[];
    onClose: () => void;
}

interface OperationProgressBarProps {
    label: string;
    operation: Operation;
    progress: OverallProgressResult;
    selectedOperation: Operation;
    selectedLevel: number;
    enabledNumbers?: number[];
    onSegmentClick: (operation: Operation, level: number) => void;
}

function OperationProgressBar({
    label,
    operation,
    progress,
    selectedOperation,
    selectedLevel,
    enabledNumbers,
    onSegmentClick,
}: OperationProgressBarProps) {
    const allComplete = progress.currentLevel > MAX_LEVEL;
    const displayCurrentLevel = allComplete ? MAX_LEVEL : progress.currentLevel;

    return (
        <div className="operation-progress">
            <span className="operation-label">{label}</span>
            <div className={`primary-progress-bar ${selectedOperation === operation ? 'active' : ''}`}>
                {progress.allLevelProgress.map((levelProgress) => {
                    const isCompleted = progress.completedLevels.includes(levelProgress.level);
                    const isCurrent = levelProgress.level === displayCurrentLevel && !allComplete;
                    const isSelected = selectedOperation === operation && levelProgress.level === selectedLevel;
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
                            onClick={() => onSegmentClick(operation, levelProgress.level)}
                        >
                            {levelProgress.level}
                        </div>
                    );
                })}
            </div>
        </div>
    );
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
        return isAllComplete ? MAX_LEVEL : additionProgress.currentLevel;
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

                    <OperationProgressBar
                        label="Addition"
                        operation="addition"
                        progress={additionProgress}
                        selectedOperation={selectedOperation}
                        selectedLevel={selectedLevel}
                        enabledNumbers={enabledNumbers}
                        onSegmentClick={handleSegmentClick}
                    />

                    <OperationProgressBar
                        label="Subtraction"
                        operation="subtraction"
                        progress={subtractionProgress}
                        selectedOperation={selectedOperation}
                        selectedLevel={selectedLevel}
                        enabledNumbers={enabledNumbers}
                        onSegmentClick={handleSegmentClick}
                    />
                </div>

                <div className="progress-section">
                    <h3>Level {selectedLevel}: {selectedLevel}s ({selectedOperation === 'addition' ? '+' : '\u2212'})</h3>
                    <div className="progress-markers">
                        <div className="progress-marker red" style={{ left: '0%' }}>&#x25BC;</div>
                        <div className="progress-marker orange" style={{ left: '25%' }}>&#x25BC;</div>
                        <div className="progress-marker green" style={{ left: '50%' }}>&#x25BC;</div>
                        <div className="progress-marker blue" style={{ left: '75%' }}>&#x25BC;</div>
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
