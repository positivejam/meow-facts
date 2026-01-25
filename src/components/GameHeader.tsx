import { SparklesCounter } from './SparklesCounter';

interface GameHeaderProps {
    sparklesTotal: number;
    recentlyEarned: number;
    isBonusMode?: boolean;
    onSettingsClick: () => void;
    onProgressClick: () => void;
}

export function GameHeader({
    sparklesTotal,
    recentlyEarned,
    isBonusMode = false,
    onSettingsClick,
    onProgressClick
}: GameHeaderProps) {
    return (
        <div className="game-header">
            <h1>Meow Facts{isBonusMode && <span className="bonus-badge">Bonus Practice!</span>}</h1>
            <SparklesCounter sparkles={sparklesTotal} recentlyEarned={recentlyEarned} />
            <button onClick={onProgressClick} className="progress-button">
                📊
            </button>
            <button onClick={onSettingsClick} className="settings-button">
                ⚙️
            </button>
        </div>
    );
}
