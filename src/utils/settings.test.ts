import { describe, it, expect } from 'vitest';
import { createDefaultSettings, normalizeSettings } from './settings';

describe('createDefaultSettings', () => {
    it('selects every chart fact for both operations', () => {
        const settings = createDefaultSettings();
        expect(settings.enabledFacts.addition).toHaveLength(121);
        expect(settings.enabledFacts.subtraction).toHaveLength(121);
    });
});

describe('normalizeSettings', () => {
    it('keeps current settings as they are', () => {
        const settings = {
            operation: 'subtraction' as const,
            cardsPerSession: 10,
            targetTime: 3000,
            enabledFacts: { addition: ['addition-1-2'], subtraction: [] },
        };
        expect(normalizeSettings(settings)).toEqual(settings);
    });

    it('drops unknown fact IDs', () => {
        const result = normalizeSettings({
            enabledFacts: { addition: ['addition-1-2', 'addition-11-1'], subtraction: [] },
        });
        expect(result.enabledFacts.addition).toEqual(['addition-1-2']);
    });

    it('converts old default settings (all numbers, max 12) to the facts they practiced', () => {
        const result = normalizeSettings({
            operation: 'addition',
            maxNumber: 12,
            enabledNumbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            cardsPerSession: 10,
            targetTime: 5000,
        });
        // Every addition chart fact was included
        expect(result.enabledFacts.addition).toHaveLength(121);
        // Old subtraction never started above 12, so 13 − 3 through 20 − 10 stay off
        expect(result.enabledFacts.subtraction).toHaveLength(85);
        expect(result.enabledFacts.subtraction).toContain('subtraction-12-2');
        expect(result.enabledFacts.subtraction).not.toContain('subtraction-13-3');
        expect(result).not.toHaveProperty('maxNumber');
        expect(result).not.toHaveProperty('enabledNumbers');
    });

    it('converts old checkbox settings to the same facts inside the chart', () => {
        // Old settings: 0s and 5s, combined with 0 through 5 → 20 addition facts
        const result = normalizeSettings({ maxNumber: 5, enabledNumbers: [0, 5] });
        const addition = result.enabledFacts.addition;

        expect(addition).toHaveLength(20);
        expect(addition).toContain('addition-5-3');
        expect(addition).toContain('addition-3-0');
        expect(addition).not.toContain('addition-3-4'); // neither 3 nor 4 was checked
    });

    it('converts old subtraction settings using the same rule', () => {
        // Old subtraction with 2s, combined with 0 through 4: a − b with a ≥ b
        const result = normalizeSettings({ maxNumber: 4, enabledNumbers: [2] });
        expect(result.enabledFacts.subtraction.sort()).toEqual([
            'subtraction-2-0', 'subtraction-2-1', 'subtraction-2-2',
            'subtraction-3-2', 'subtraction-4-2',
        ]);
    });

    it('fills in missing fields with defaults', () => {
        const result = normalizeSettings({});
        expect(result).toEqual(createDefaultSettings());
    });
});
