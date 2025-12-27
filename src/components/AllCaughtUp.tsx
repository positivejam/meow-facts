interface AllCaughtUpProps {
    nextDueTime: number | null;
    onBonusPractice: () => void;
    onSettings: () => void;
}

export function AllCaughtUp({ nextDueTime, onBonusPractice, onSettings }: AllCaughtUpProps) {
    const formatNextDue = (timestamp: number): string => {
        const now = Date.now();
        const diffMs = timestamp - now;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays >= 2) {
            return `in ${diffDays} days`;
        } else if (diffDays === 1) {
            return 'tomorrow';
        } else if (diffHours >= 1) {
            return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
        } else if (diffMinutes >= 1) {
            return `in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
        } else {
            return 'very soon';
        }
    };

    return (
        <div className="all-caught-up">
            <h2>🎉 All Caught Up!</h2>
            <p className="caught-up-message">
                Amazing work! All your friends are happy and safe right now.
            </p>

            {nextDueTime && (
                <p className="next-due">
                    Your next friend will need help {formatNextDue(nextDueTime)}
                </p>
            )}

            <div className="caught-up-actions">
                <button onClick={onBonusPractice} className="bonus-button">
                    Want to practice more anyway?
                </button>
                <button onClick={onSettings} className="settings-link-button">
                    Ready for new challenges?
                </button>
            </div>

            <p className="bonus-hint">
                Bonus practice is just for fun - come back later for the most effective learning!
            </p>
        </div>
    );
}
