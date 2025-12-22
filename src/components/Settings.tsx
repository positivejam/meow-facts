import type { GameSettings } from '../types/game';

interface SettingsProps {
    settings: GameSettings;
    onSettingsChange: (settings: GameSettings) => void;
    onClose: () => void;
}

export function Settings({ settings, onSettingsChange, onClose }: SettingsProps) {
    const allNumbers = Array.from({ length: settings.maxNumber + 1 }, (_, i) => i);

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

    const currentEnabled = settings.enabledNumbers || allNumbers;

    // Calculate number of facts: for k selected numbers and max M,
    // we get k * (2 * (M + 1) - k) facts
    const k = currentEnabled.length;
    const M = settings.maxNumber;
    const factCount = k * (2 * (M + 1) - k);

    return (
        <div className="settings-overlay">
            <div className="settings-panel">
                <h2>Choose Numbers to Practice</h2>

                <p className="settings-description">
                    Select which numbers to practice. You'll get facts involving those numbers.
                    For example, selecting "1" gives you 1+0, 1+1, ..., 1+12, plus 0+1, 2+1, ..., 12+1.
                </p>

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

                <button onClick={onClose} className="start-button">
                    Start Practice
                </button>
            </div>
        </div>
    );
}
