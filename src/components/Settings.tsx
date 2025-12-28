import type { GameSettings } from '../types/game';

interface SettingsProps {
    settings: GameSettings;
    onSettingsChange: (settings: GameSettings) => void;
    onClose: () => void;
}

export function Settings({ settings, onSettingsChange, onClose }: SettingsProps) {
    // Fixed range for checkboxes - independent of maxNumber setting
    const MAX_CHECKBOX_NUMBER = 12;
    const allNumbers = Array.from({ length: MAX_CHECKBOX_NUMBER + 1 }, (_, i) => i);

    const toggleNumber = (num: number) => {
        const currentEnabled = settings.enabledNumbers || allNumbers;
        const newEnabled = currentEnabled.includes(num)
            ? currentEnabled.filter(n => n !== num)
            : [...currentEnabled, num].sort((a, b) => a - b);

        // Ensure at least one number is selected
        if (newEnabled.length === 0) return;

        onSettingsChange({
            ...settings,
            enabledNumbers: newEnabled,
        });
    };

    const selectAll = () => {
        onSettingsChange({
            ...settings,
            enabledNumbers: allNumbers,
        });
    };

    const clearAll = () => {
        // Keep at least 0 selected
        onSettingsChange({
            ...settings,
            enabledNumbers: [0],
        });
    };

    const handleTargetTimeChange = (seconds: number) => {
        onSettingsChange({
            ...settings,
            targetTime: seconds * 1000, // Convert to milliseconds
        });
    };

    const handleMaxNumberChange = (maxNumber: number) => {
        onSettingsChange({
            ...settings,
            maxNumber,
        });
    };

    const currentEnabled = settings.enabledNumbers || allNumbers;
    const targetTimeSeconds = settings.targetTime / 1000;

    // Calculate number of facts: for k selected numbers and max M,
    // we get k * (2 * (M + 1) - k) facts
    const k = currentEnabled.length;
    const M = settings.maxNumber;
    const factCount = k * (2 * (M + 1) - k);

    return (
        <div className="settings-overlay">
            <div className="settings-panel">
                <h2>Settings</h2>

                <p className="settings-description">
                    Select which numbers to practice. You'll get facts involving those numbers.
                </p>

                <div className="settings-section">
                    <label htmlFor="maxNumber" className="settings-label">
                        Maximum Number to Combine With:
                    </label>
                    <select
                        id="maxNumber"
                        value={settings.maxNumber}
                        onChange={(e) => handleMaxNumberChange(Number(e.target.value))}
                        className="max-number-select"
                    >
                        {Array.from({ length: 13 }, (_, i) => (
                            <option key={i} value={i}>{i}</option>
                        ))}
                    </select>
                    <p className="settings-hint">
                        Selected numbers below will be combined with 0 through {settings.maxNumber}
                    </p>
                </div>

                <div className="checkbox-grid">
                    {allNumbers.map(num => (
                        <label key={num} className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={currentEnabled.includes(num)}
                                onChange={() => toggleNumber(num)}
                            />
                            <span className="checkbox-label">{num}</span>
                        </label>
                    ))}
                </div>

                <div className="settings-actions">
                    <button onClick={selectAll} className="action-button">
                        Select All
                    </button>
                    <button onClick={clearAll} className="action-button">
                        Clear All
                    </button>
                </div>

                <div className="settings-info">
                    <p className="facts-count">
                        {factCount} math facts selected
                    </p>
                    <p className="selected-numbers">
                        Selected numbers: {currentEnabled.join(', ')}
                    </p>
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

                <button onClick={onClose} className="start-button">
                    Start Practice
                </button>
            </div>
        </div>
    );
}
