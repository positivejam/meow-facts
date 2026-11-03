import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from './Settings';
import type { GameSettings } from '../types/game';
import { createDefaultSettings } from '../utils/settings';

/** Renders Settings with real state, so selection changes show up like in the app. */
function renderSettings(initial: Partial<GameSettings> = {}) {
    const onClose = vi.fn();
    let latest: GameSettings = { ...createDefaultSettings(), ...initial };

    function Wrapper() {
        const [settings, setSettings] = useState(latest);
        return (
            <Settings
                settings={settings}
                onSettingsChange={(next) => {
                    latest = next;
                    setSettings(next);
                }}
                onClose={onClose}
            />
        );
    }

    render(<Wrapper />);
    return { onClose, getSettings: () => latest };
}

const fact = (name: string) => screen.getByRole('button', { name });
const isOn = (name: string) => fact(name).getAttribute('aria-pressed') === 'true';

describe('Settings fact chart', () => {
    it('shows all 121 addition facts selected by default', () => {
        renderSettings();
        expect(screen.getByText('121 math facts selected')).toBeInTheDocument();
        expect(isOn('7 plus 8')).toBe(true);
    });

    it('toggles a single fact with a tap', async () => {
        const user = userEvent.setup({ delay: null });
        const { getSettings } = renderSettings();

        await user.click(fact('7 plus 8'));

        expect(isOn('7 plus 8')).toBe(false);
        expect(isOn('8 plus 7')).toBe(true);
        expect(screen.getByText('120 math facts selected')).toBeInTheDocument();
        expect(getSettings().enabledFacts.addition).not.toContain('addition-7-8');
    });

    it('turns a fully on diagonal off with a double tap', async () => {
        const user = userEvent.setup({ delay: null });
        renderSettings();

        await user.dblClick(fact('3 plus 1'));

        // Every fact that adds up to 4 is off; others are untouched
        for (const name of ['0 plus 4', '1 plus 3', '2 plus 2', '3 plus 1', '4 plus 0']) {
            expect(isOn(name)).toBe(false);
        }
        expect(isOn('3 plus 2')).toBe(true);
        expect(screen.getByText('116 math facts selected')).toBeInTheDocument();
    });

    it('turns a fully off or partially on diagonal fully on with a double tap', async () => {
        const user = userEvent.setup({ delay: null });
        renderSettings({ enabledFacts: { addition: ['addition-2-2'], subtraction: [] } });

        await user.dblClick(fact('3 plus 1'));

        for (const name of ['0 plus 4', '1 plus 3', '2 plus 2', '3 plus 1', '4 plus 0']) {
            expect(isOn(name)).toBe(true);
        }
        expect(screen.getByText('5 math facts selected')).toBeInTheDocument();
    });

    it('toggles a diagonal with Shift+Enter', () => {
        renderSettings();

        fireEvent.keyDown(fact('9 plus 4'), { key: 'Enter', shiftKey: true });

        // Sum 13: 3 + 10 through 10 + 3 (8 facts)
        expect(isOn('9 plus 4')).toBe(false);
        expect(isOn('3 plus 10')).toBe(false);
        expect(screen.getByText('113 math facts selected')).toBeInTheDocument();
    });

    it('shows the subtraction chart, organized by starting number', async () => {
        const user = userEvent.setup({ delay: null });
        renderSettings();

        await user.click(screen.getByLabelText('Subtraction (−)'));
        await user.dblClick(fact('13 minus 4'));

        // Every fact starting from 13 is off
        expect(isOn('13 minus 3')).toBe(false);
        expect(isOn('13 minus 10')).toBe(false);
        expect(isOn('12 minus 4')).toBe(true);
        expect(screen.getByText('113 math facts selected')).toBeInTheDocument();
    });

    it('keeps a separate selection for each operation', async () => {
        const user = userEvent.setup({ delay: null });
        const { getSettings } = renderSettings();

        await user.click(screen.getByRole('button', { name: /^clear all$/i }));
        await user.click(screen.getByLabelText('Subtraction (−)'));

        expect(screen.getByText('121 math facts selected')).toBeInTheDocument();
        expect(getSettings().enabledFacts.addition).toEqual([]);
    });

    it('disables Start Practice when no facts are selected', async () => {
        const user = userEvent.setup({ delay: null });
        renderSettings();

        await user.click(screen.getByRole('button', { name: /^clear all$/i }));

        expect(screen.getByText('0 math facts selected')).toBeInTheDocument();
        expect(screen.getByText(/select at least one fact/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /start practice/i })).toBeDisabled();

        await user.click(screen.getByRole('button', { name: /^select all$/i }));
        expect(screen.getByRole('button', { name: /start practice/i })).toBeEnabled();
    });
});
