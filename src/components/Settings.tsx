import { useState } from 'react';
import type { GameSettings, PracticeOperation } from '../types/game';
import { clearAllData } from '../utils/storage-dexie';
import { getAllFactIds } from '../utils/factChart';
import { FactChart } from './FactChart';

interface SettingsProps {
    settings: GameSettings;
    onSettingsChange: (settings: GameSettings) => void;
    onClose: () => void;
}

export function Settings({ settings, onSettingsChange, onClose }: SettingsProps) {
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const operation = settings.operation;
    const selectedFacts = settings.enabledFacts[operation];
    const selectedSet = new Set(selectedFacts);
    const factCount = selectedFacts.length;
    const isSubtraction = operation === 'subtraction';

    const handleClearAllData = async () => {
        setIsClearing(true);
        try {
            await clearAllData();
            // Reload the page to reset all app state
            window.location.reload();
        } catch (error) {
            console.error('Failed to clear data:', error);
            setIsClearing(false);
            setShowClearConfirm(false);
        }
    };

    const setSelectedFacts = (factIds: string[]) => {
        onSettingsChange({
            ...settings,
            enabledFacts: { ...settings.enabledFacts, [operation]: factIds },
        });
    };

    const handleTargetTimeChange = (seconds: number) => {
        onSettingsChange({
            ...settings,
            targetTime: seconds * 1000, // Convert to milliseconds
        });
    };

    const handleOperationChange = (newOperation: PracticeOperation) => {
        onSettingsChange({
            ...settings,
            operation: newOperation,
        });
    };

    const targetTimeSeconds = settings.targetTime / 1000;

    return (
        <div className="settings-overlay">
            <div className="settings-panel">
                <h2>Settings</h2>

                <div className="settings-section">
                    <h3>Operation</h3>
                    <div className="operation-selector">
                        <label className="operation-option">
                            <input
                                type="radio"
                                name="operation"
                                value="addition"
                                checked={operation === 'addition'}
                                onChange={() => handleOperationChange('addition')}
                            />
                            <span>Addition (+)</span>
                        </label>
                        <label className="operation-option">
                            <input
                                type="radio"
                                name="operation"
                                value="subtraction"
                                checked={operation === 'subtraction'}
                                onChange={() => handleOperationChange('subtraction')}
                            />
                            <span>Subtraction (−)</span>
                        </label>
                    </div>
                </div>

                <div className="settings-section">
                    <h3>Facts to Practice</h3>
                    <p className="settings-description">
                        Tap a fact to turn it on or off. Double-tap to turn its whole diagonal on or off:
                        every fact that {isSubtraction ? 'starts from' : 'adds up to'} the same number.
                    </p>
                    <p className="settings-hint">
                        Keyboard: Enter toggles a fact, Shift+Enter toggles its diagonal.
                    </p>

                    <FactChart
                        operation={operation}
                        getCellClassName={(problem) =>
                            selectedSet.has(problem.id) ? 'fact-selected' : 'fact-unselected'
                        }
                        selection={{ selected: selectedFacts, onChange: setSelectedFacts }}
                    />

                    <div className="settings-actions chart-actions">
                        <button onClick={() => setSelectedFacts(getAllFactIds(operation))} className="action-button">
                            Select All
                        </button>
                        <button onClick={() => setSelectedFacts([])} className="action-button">
                            Clear All
                        </button>
                    </div>
                </div>

                <div className="settings-info">
                    <p className="facts-count">
                        {factCount} math facts selected
                    </p>
                    {factCount === 0 && (
                        <p className="facts-warning">Select at least one fact to start practicing.</p>
                    )}
                </div>

                <div className="settings-section">
                    <h3>Speed Target</h3>
                    <p className="settings-hint">
                        How fast should answers be to count as "fast"?
                    </p>
                    <div className="slider-control">
                        <input
                            type="range"
                            min="2"
                            max="10"
                            step="1"
                            value={targetTimeSeconds}
                            onChange={(e) => handleTargetTimeChange(Number(e.target.value))}
                            className="time-slider"
                        />
                        <div className="slider-value">
                            {targetTimeSeconds} second{targetTimeSeconds !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                <button onClick={onClose} className="start-button" disabled={factCount === 0}>
                    Start Practice
                </button>

                <div className="settings-section danger-section">
                    <h3>Caution Zone</h3>
                    {!showClearConfirm ? (
                        <button
                            onClick={() => setShowClearConfirm(true)}
                            className="danger-button"
                        >
                            Clear All Data
                        </button>
                    ) : (
                        <div className="confirm-clear">
                            <p>This will delete all your progress, settings, and rescue missions. This cannot be undone.</p>
                            <div className="confirm-buttons">
                                <button
                                    onClick={handleClearAllData}
                                    className="danger-button"
                                    disabled={isClearing}
                                >
                                    {isClearing ? 'Clearing...' : 'Yes, Clear Everything'}
                                </button>
                                <button
                                    onClick={() => setShowClearConfirm(false)}
                                    className="action-button"
                                    disabled={isClearing}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
