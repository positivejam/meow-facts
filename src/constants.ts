/**
 * The largest number on each side of the fact charts (0–10).
 * Each operation's chart is an 11×11 grid of 121 facts:
 * addition 0 + 0 through 10 + 10, subtraction 0 − 0 through 20 − 10.
 */
export const CHART_MAX = 10;

/**
 * Review-interval thresholds (in days) for a fact's mastery color.
 * Never attempted = grey; interval below `yellow` = red;
 * then yellow, green, and blue (mastered) at or above each threshold.
 */
export const MASTERY_INTERVAL_DAYS = {
    yellow: 1,
    green: 6,
    blue: 14,
} as const;

/**
 * Longest review interval (in days) a fact can reach. Even well-mastered facts
 * come back about twice a year, so a mistaken or stale interval can't hide a fact for years.
 */
export const MAX_INTERVAL_DAYS = 180;

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
