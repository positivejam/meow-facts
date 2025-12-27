import { SparklesCounter } from './SparklesCounter';

interface GameHeaderProps {
    sparklesTotal: number;
    recentlyEarned: number;
    isBonusMode?: boolean;
    onSettingsClick: () => void;
}

export function GameHeader({
    sparklesTotal,
    recentlyEarned,
    isBonusMode = false,
    onSettingsClick
}: GameHeaderProps) {
    return (
        <div className="game-header">
            <h1>Meow Facts{isBonusMode && <span className="bonus-badge">Bonus Practice!</span>}</h1>
            <SparklesCounter sparkles={sparklesTotal} recentlyEarned={recentlyEarned} />
            <button onClick={onSettingsClick} className="settings-button">
                ⚙️
            </button>
        </div>
    );
}
