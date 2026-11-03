import type { EnabledFacts, GameSettings, PracticeOperation } from '../types/game';
import { getAllFactIds, getChartProblems } from './factChart';

const PRACTICE_OPERATIONS: PracticeOperation[] = ['addition', 'subtraction'];

/** New players start with every chart fact selected for both operations. */
export function createDefaultSettings(): GameSettings {
    return {
        operation: 'addition',
        cardsPerSession: 10,
        enabledFacts: {
            addition: getAllFactIds('addition'),
            subtraction: getAllFactIds('subtraction'),
        },
        targetTime: 5000, // 5 seconds
    };
}

/**
 * Fields from settings saved before the fact charts existed. Practice was chosen with
 * number checkboxes (enabledNumbers) combined with 0 through maxNumber.
 */
interface LegacySettingsFields {
    maxNumber?: number;
    enabledNumbers?: number[];
}

export type StoredSettings = Partial<Omit<GameSettings, 'operation'>> & LegacySettingsFields & {
    operation?: string;
};

const LEGACY_DEFAULT_MAX_NUMBER = 12;

/**
 * Whether the old checkbox settings included the pair (a, b): both numbers had to be
 * in 0..maxNumber or checked, and at least one of them had to be checked.
 */
function legacySettingsInclude(a: number, b: number, legacy: LegacySettingsFields): boolean {
    const maxNumber = legacy.maxNumber ?? LEGACY_DEFAULT_MAX_NUMBER;
    const range = Array.from({ length: maxNumber + 1 }, (_, i) => i);
    const checked = legacy.enabledNumbers && legacy.enabledNumbers.length > 0
        ? legacy.enabledNumbers
        : range;
    const allowed = new Set([...range, ...checked]);
    return allowed.has(a) && allowed.has(b) && (checked.includes(a) || checked.includes(b));
}

/** Converts old checkbox settings into the chart facts they would have practiced. */
function enabledFactsFromLegacy(operation: PracticeOperation, legacy: LegacySettingsFields): string[] {
    return getChartProblems(operation)
        .filter(problem => legacySettingsInclude(problem.operand1, problem.operand2, legacy))
        .map(problem => problem.id);
}

/**
 * Turns whatever is stored into valid current settings: fills in missing fields,
 * converts pre-chart settings (keeping the selection for facts inside the 0–10 charts),
 * and drops the old fields.
 */
export function normalizeSettings(stored: StoredSettings): GameSettings {
    const defaults = createDefaultSettings();
    const hasLegacyFields = stored.enabledNumbers !== undefined || stored.maxNumber !== undefined;

    const enabledFacts = {} as EnabledFacts;
    for (const operation of PRACTICE_OPERATIONS) {
        const validIds = new Set(defaults.enabledFacts[operation]);
        const storedIds = stored.enabledFacts?.[operation];
        if (Array.isArray(storedIds)) {
            enabledFacts[operation] = storedIds.filter(id => validIds.has(id));
        } else if (hasLegacyFields) {
            enabledFacts[operation] = enabledFactsFromLegacy(operation, stored);
        } else {
            enabledFacts[operation] = defaults.enabledFacts[operation];
        }
    }

    return {
        operation: stored.operation === 'subtraction' ? 'subtraction' : 'addition',
        cardsPerSession: stored.cardsPerSession ?? defaults.cardsPerSession,
        targetTime: stored.targetTime ?? defaults.targetTime,
        enabledFacts,
    };
}
