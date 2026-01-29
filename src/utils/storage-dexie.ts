import { db } from './db';
import type { MathFactCard, GameSession, RescueMission, UnlockStatus, GameSettings, SparklesData } from '../types/game';

// Singleton ID for single-row tables
const SINGLETON_ID = 'singleton';

// ============================================================================
// Cards & Sessions (replaces storage.ts)
// ============================================================================

export interface StoredData {
    cards: MathFactCard[];
    sessions: GameSession[];
    lastUpdated: number;
}

export async function saveProgress(cards: MathFactCard[], sessions: GameSession[]): Promise<void> {
    try {
        // Save all cards (bulkPut will update existing or insert new)
        await db.cards.bulkPut(cards);

        // Save sessions (you might want to limit this to recent sessions)
        if (sessions.length > 0) {
            await db.sessions.bulkPut(sessions);
        }
    } catch (error) {
        console.error('Failed to save progress:', error);
    }
}

export async function loadProgress(): Promise<StoredData | null> {
    try {
        const cards = await db.cards.toArray();
        const sessions = await db.sessions.orderBy('startTime').reverse().limit(100).toArray();

        if (cards.length === 0) {
            return null;
        }

        return {
            cards,
            sessions,
            lastUpdated: Date.now()
        };
    } catch (error) {
        console.error('Failed to load progress:', error);
        return null;
    }
}

export async function clearProgress(): Promise<void> {
    try {
        await db.cards.clear();
        await db.sessions.clear();
    } catch (error) {
        console.error('Failed to clear progress:', error);
    }
}

// ============================================================================
// Rescue Progress (replaces rescueStorage.ts)
// ============================================================================

export interface RescueProgressData {
    completedMissions: RescueMission[];
    currentMission: RescueMission | null;
    unlockStatus: UnlockStatus;
    lastUpdated: number;
}

const DEFAULT_UNLOCK_STATUS: UnlockStatus = {
    unlockedAnimalTypes: ['kitten'],
    unlockedLocations: ['living-room'],
    masteredFactGroups: [],
};

export async function loadRescueProgress(): Promise<RescueProgressData> {
    try {
        // Load completed missions
        const completedMissions = await db.missions
            .where('completedAt')
            .above(0)
            .toArray();

        // Load current mission from singleton table
        const currentMission = (await db.currentMissionData.get(SINGLETON_ID)) ?? null;

        // Load unlock status from singleton table
        const unlockStatus = (await db.unlockStatusData.get(SINGLETON_ID)) ?? DEFAULT_UNLOCK_STATUS;

        return {
            completedMissions,
            currentMission,
            unlockStatus,
            lastUpdated: Date.now()
        };
    } catch (error) {
        console.error('Failed to load rescue progress:', error);
        return {
            completedMissions: [],
            currentMission: null,
            unlockStatus: DEFAULT_UNLOCK_STATUS,
            lastUpdated: Date.now()
        };
    }
}

export async function saveRescueProgress(data: Partial<RescueProgressData>): Promise<void> {
    try {
        const updates = [];

        // Update completed missions
        if (data.completedMissions) {
            updates.push(db.missions.bulkPut(data.completedMissions));
        }

        // Update current mission (delete if null, put if exists)
        if (data.currentMission !== undefined) {
            if (data.currentMission === null) {
                updates.push(db.currentMissionData.delete(SINGLETON_ID));
            } else {
                updates.push(
                    db.currentMissionData.put({
                        ...data.currentMission,
                        id: SINGLETON_ID
                    })
                );
            }
        }

        // Update unlock status
        if (data.unlockStatus) {
            updates.push(
                db.unlockStatusData.put({
                    ...data.unlockStatus,
                    id: SINGLETON_ID
                })
            );
        }

        await Promise.all(updates);
    } catch (error) {
        console.error('Failed to save rescue progress:', error);
    }
}

export async function clearRescueProgress(): Promise<void> {
    try {
        await db.missions.clear();
        await db.currentMissionData.delete(SINGLETON_ID);
        await db.unlockStatusData.delete(SINGLETON_ID);
    } catch (error) {
        console.error('Failed to clear rescue progress:', error);
    }
}

// ============================================================================
// Sparkles (replaces sparkles.ts storage)
// ============================================================================

export async function loadSparkles(): Promise<SparklesData> {
    try {
        const stored = await db.sparklesData.get(SINGLETON_ID);
        if (stored) {
            return { total: stored.total || 0, earnedThisSession: 0 };
        }
    } catch (error) {
        console.error('Failed to load sparkles:', error);
    }
    return { total: 0, earnedThisSession: 0 };
}

export async function saveSparkles(sparkles: SparklesData): Promise<void> {
    try {
        await db.sparklesData.put({
            id: SINGLETON_ID,
            total: sparkles.total,
            lastUpdated: Date.now()
        });
    } catch (error) {
        console.error('Failed to save sparkles:', error);
    }
}

// ============================================================================
// Settings (replaces localStorage settings in Game.tsx)
// ============================================================================

export async function loadSettings(): Promise<GameSettings | null> {
    try {
        return (await db.settings.get(SINGLETON_ID)) ?? null;
    } catch (error) {
        console.error('Failed to load settings:', error);
        return null;
    }
}

export async function saveSettings(settings: GameSettings): Promise<void> {
    try {
        await db.settings.put({
            ...settings,
            id: SINGLETON_ID
        });
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

// Clear all data (useful for reset/debugging)
export async function clearAllData(): Promise<void> {
    try {
        await Promise.all([
            db.cards.clear(),
            db.sessions.clear(),
            db.missions.clear(),
            db.settings.clear(),
            db.sparklesData.clear(),
            db.currentMissionData.clear(),
            db.unlockStatusData.clear(),
        ]);
    } catch (error) {
        console.error('Failed to clear all data:', error);
        throw error; // Re-throw so UI can handle it
    }
}

// Get database stats (useful for debugging)
export async function getDatabaseStats() {
    try {
        return {
            cards: await db.cards.count(),
            sessions: await db.sessions.count(),
            missions: await db.missions.count(),
            settings: await db.settings.count(),
            sparkles: await db.sparklesData.count(),
            currentMission: await db.currentMissionData.count(),
            unlockStatus: await db.unlockStatusData.count()
        };
    } catch (error) {
        console.error('Failed to get database stats:', error);
        return null;
    }
}
