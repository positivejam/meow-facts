import { useEffect, useState } from 'react';

interface SparklesCounterProps {
    sparkles: number;
    recentlyEarned?: number;
}

export function SparklesCounter({ sparkles, recentlyEarned }: SparklesCounterProps) {
    const [showAnimation, setShowAnimation] = useState(false);

    useEffect(() => {
        if (recentlyEarned && recentlyEarned > 0) {
            setShowAnimation(true);
            const timer = setTimeout(() => setShowAnimation(false), 300);
            return () => clearTimeout(timer);
        }
    }, [recentlyEarned]);

    return (
        <div className={`sparkles-counter ${showAnimation ? 'earned' : ''}`}>
            <span className="sparkles-icon">✨</span>
            <span className="sparkles-count">{sparkles}</span>
        </div>
    );
}
