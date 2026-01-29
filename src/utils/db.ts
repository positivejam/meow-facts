import Dexie, { type Table } from 'dexie';
import type { MathFactCard, GameSession, RescueMission, GameSettings, UnlockStatus } from '../types/game';

// Singleton data storage types (single row per table with fixed id: 'singleton')
export interface SparklesRecord {
    id: string;
    total: number;
    lastUpdated: number;
}

export class MeowFactsDatabase extends Dexie {
    // Tables
    cards!: Table<MathFactCard, string>; // Keyed by problem.id
    sessions!: Table<GameSession, string>; // Keyed by id
    missions!: Table<RescueMission, string>; // Keyed by id (completed missions)

    // Singleton tables (one row each with id: 'singleton')
    settings!: Table<GameSettings & { id: string }, string>;
    sparklesData!: Table<SparklesRecord, string>;
    currentMissionData!: Table<RescueMission & { id: string }, string>;
    unlockStatusData!: Table<UnlockStatus & { id: string }, string>;

    constructor() {
        super('MeowFactsDB');

        this.version(1).stores({
            // Index by problem.id, nextReview (for finding due cards), easeFactor
            cards: 'problem.id, nextReview, easeFactor, lastReviewed',

            // Index by id and startTime
            sessions: 'id, startTime',

            // Index by id, completedAt (for finding completed missions)
            missions: 'id, completedAt, startTime',

            // Singleton tables for app-level data
            settings: 'id',
            sparklesData: 'id',
            currentMissionData: 'id',
            unlockStatusData: 'id'
        });
    }
}

// Export singleton instance
export const db = new MeowFactsDatabase();

declare global {
    interface Window {
        db?: typeof db;
    }
}

// Attach to window object for console debugging in development
if (import.meta.env.DEV) {
    window.db = db;
}