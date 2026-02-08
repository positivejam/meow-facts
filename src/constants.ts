/**
 * The maximum level/number in the game.
 * Corresponds to fact tables 0s through 12s (13 total levels).
 */
export const MAX_LEVEL = 12;

/**
 * Mission limits for rescue game mechanics.
 * These can be adjusted to change the difficulty/length of missions.
 */
export const MISSION_LIMITS = {
    /** Progress needed to complete mission successfully (e.g., 5 fast correct at +2 each, or 10 slow correct at +1 each) */
    progressTarget: 16,
    /** Progress at which animal state changes from "needs-help" to "improving" */
    improvingThreshold: 4,
    /** Mission ends after this many attempts, even if not successful */
    maxAttempts: 20,
} as const;

export type MissionLimits = typeof MISSION_LIMITS;
