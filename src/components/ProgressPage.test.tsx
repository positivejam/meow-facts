import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressPage } from './ProgressPage';
import type { EnabledFacts, MathFactCard } from '../types/game';
import { generateCards } from '../utils/cardGenerator';
import { getAllFactIds } from '../utils/factChart';

/** Fresh cards for both operations, with some facts given a review interval. */
function cardsWith(progress: Record<string, { interval: number }> = {}): MathFactCard[] {
    return [...generateCards('addition'), ...generateCards('subtraction')].map(card => {
        const update = progress[card.problem.id];
        return update ? { ...card, interval: update.interval, totalAttempts: 3 } : card;
    });
}

const ALL_FACTS: EnabledFacts = {
    addition: getAllFactIds('addition'),
    subtraction: getAllFactIds('subtraction'),
};

function renderProgress(cards: MathFactCard[], enabledFacts: EnabledFacts = ALL_FACTS, initialOperation: 'addition' | 'subtraction' = 'addition') {
    render(
        <ProgressPage
            cards={cards}
            enabledFacts={enabledFacts}
            initialOperation={initialOperation}
            onClose={vi.fn()}
        />
    );
}

const cell = (name: RegExp) => screen.getByRole('img', { name });

describe('ProgressPage', () => {
    it('shows every fact of the chart colored by mastery', () => {
        renderProgress(cardsWith({
            'addition-1-1': { interval: 0 },
            'addition-1-2': { interval: 3 },
            'addition-1-3': { interval: 8 },
            'addition-1-4': { interval: 20 },
        }));

        expect(screen.getAllByRole('img')).toHaveLength(121);
        expect(cell(/^0 plus 0: /)).toHaveClass('mastery-grey');
        expect(cell(/^1 plus 1: /)).toHaveClass('mastery-red');
        expect(cell(/^1 plus 2: /)).toHaveClass('mastery-yellow');
        expect(cell(/^1 plus 3: /)).toHaveClass('mastery-green');
        expect(cell(/^1 plus 4: Mastered$/)).toHaveClass('mastery-blue');
    });

    it('shows the percentage of selected facts that are mastered', () => {
        renderProgress(
            cardsWith({
                'addition-1-1': { interval: 20 },
                'addition-2-2': { interval: 20 },
                'addition-3-3': { interval: 20 }, // mastered but not selected: doesn't count
            }),
            { ...ALL_FACTS, addition: ['addition-1-1', 'addition-2-2', 'addition-4-4', 'addition-5-5'] }
        );

        expect(screen.getByText('2 of 4 selected facts mastered (50%)')).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    });

    it('fades facts that are not selected for practice', () => {
        renderProgress(cardsWith(), { ...ALL_FACTS, addition: ['addition-1-1'] });

        expect(cell(/^1 plus 1: /)).not.toHaveClass('fact-not-practicing');
        expect(cell(/^2 plus 2: .*not practicing/)).toHaveClass('fact-not-practicing');
    });

    it('switches between the addition and subtraction charts', async () => {
        const user = userEvent.setup({ delay: null });
        renderProgress(cardsWith({ 'subtraction-13-4': { interval: 20 } }));

        expect(screen.getByRole('button', { name: 'Addition' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText('0 of 121 selected facts mastered (0%)')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Subtraction' }));

        expect(cell(/^13 minus 4: Mastered$/)).toHaveClass('mastery-blue');
        expect(screen.getByText('1 of 121 selected facts mastered (1%)')).toBeInTheDocument();
    });

    it('starts on the operation currently being practiced', () => {
        renderProgress(cardsWith(), ALL_FACTS, 'subtraction');

        expect(screen.getByRole('button', { name: 'Subtraction' })).toHaveAttribute('aria-pressed', 'true');
        expect(cell(/^20 minus 10: /)).toBeInTheDocument();
    });

    it('explains when no facts are selected', () => {
        renderProgress(cardsWith(), { ...ALL_FACTS, addition: [] });

        expect(screen.getByText('No facts selected for practice')).toBeInTheDocument();
    });
});
