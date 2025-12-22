import type { MathFactCard, GameSession } from '../types/game';

const STORAGE_KEY = 'meow-facts-progress';

export interface StoredData {
    cards: MathFactCard[];
    sessions: GameSession[];
    lastUpdated: number;
}

export function saveProgress(cards: MathFactCard[], sessions: GameSession[]): void {
    const data: StoredData = {
        cards,
        sessions,
        lastUpdated: Date.now(),
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save progress:', error);
    }
}

export function loadProgress(): StoredData | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const data: StoredData = JSON.parse(stored);
        return data;
    } catch (error) {
        console.error('Failed to load progress:', error);
        return null;
    }
}

export function clearProgress(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear progress:', error);
    }
}
