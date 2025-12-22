import type { RescueMission, UnlockStatus } from '../types/game';

const RESCUE_STORAGE_KEY = 'meow-facts-rescues';

export interface RescueProgressData {
    completedMissions: RescueMission[];
    currentMission: RescueMission | null;
    unlockStatus: UnlockStatus;
    lastUpdated: number;
}

export function loadRescueProgress(): RescueProgressData {
    try {
        const stored = localStorage.getItem(RESCUE_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Failed to load rescue progress:', error);
    }

    // Default data for first-time users
    return {
        completedMissions: [],
        currentMission: null,
        unlockStatus: {
            unlockedAnimalTypes: ['kitten'],
            unlockedLocations: ['living-room'],
            masteredFactGroups: [],
        },
        lastUpdated: Date.now(),
    };
}

export function saveRescueProgress(data: Partial<RescueProgressData>): void {
    try {
        const current = loadRescueProgress();
        const updated = {
            ...current,
            ...data,
            lastUpdated: Date.now(),
        };
        localStorage.setItem(RESCUE_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Failed to save rescue progress:', error);
    }
}

export function clearRescueProgress(): void {
    try {
        localStorage.removeItem(RESCUE_STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear rescue progress:', error);
    }
}
