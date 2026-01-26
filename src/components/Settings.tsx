import type { GameSettings } from '../types/game';
import { MAX_LEVEL } from '../constants';

interface SettingsProps {
    settings: GameSettings;
    onSettingsChange: (settings: GameSettings) => void;
    onClose: () => void;
}

export function Settings({ settings, onSettingsChange, onClose }: SettingsProps) {
    // Fixed range for checkboxes - all levels 0 through MAX_LEVEL
    const allNumbers = Array.from({ length: MAX_LEVEL + 1 }, (_, i) => i);

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

    function cartesianProduct(setA: number[], setB: number[]): number[][] {
        return setA.flatMap(a => setB.map(b => [a, b]));
    }

    /**
     * The symmetrical Cartesian product of 2 sets creates a set of sets where every number from each
     * set is paired with every number from the other set, including reverse order of each, but w/o duplicates
     */
    function symmetricCartesianProduct(setA: number[], setB: number[]): number[][] {
        const axb = cartesianProduct(setA, setB);
        const bxa = cartesianProduct(setB, setA);

        // Remove duplicates
        const unique = new Map();
        [...axb, ...bxa].forEach(pair => {
            unique.set(JSON.stringify(pair), pair);
        });

        return Array.from(unique.values());
    }

    const targetTimeSeconds = settings.targetTime / 1000;

    // Calculate number of facts
    // Ex. if maxNumber select list is set to '5', zeroToMaxNumArray = [0,1,2,3,4,5]
    const zeroToMaxNumArray = Array.from({ length: settings.maxNumber + 1 }, (_, i) => i);
    const currentChecked = settings.enabledNumbers || allNumbers;
    const facts = symmetricCartesianProduct(zeroToMaxNumArray, currentChecked);
    const factCount = facts.length;

    return (
        <div className="settings-overlay">
            <div className="settings-panel">
                <h2>Settings</h2>

                <div className="settings-section">
                    <h3>Numbers to Practice</h3>
                    <p className="settings-description">
                        Select which numbers to practice. You'll get facts involving those numbers.
                    </p>

                    <div className="checkbox-grid">
                        {allNumbers.map(num => (
                            <label key={num} className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={currentChecked.includes(num)}
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
                </div>

                <div className="settings-section">
                    <h3>Maximum Number to Combine With</h3>
                    <p className="settings-hint">
                        Selected numbers will be combined with 0 through {settings.maxNumber}
                    </p>
                    <select
                        id="maxNumber"
                        value={settings.maxNumber}
                        onChange={(e) => handleMaxNumberChange(Number(e.target.value))}
                        className="max-number-select"
                        aria-label="Maximum number"
                    >
                        {Array.from({ length: 13 }, (_, i) => (
                            <option key={i} value={i}>{i}</option>
                        ))}
                    </select>
                </div>

                <div className="settings-info">
                    <p className="facts-count">
                        {factCount} math facts selected
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
