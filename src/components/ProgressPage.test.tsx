import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressPage } from './ProgressPage';
import type { MathFactCard, Operation } from '../types/game';

// Helper to create a minimal card for testing
function createCard(operand1: number, operand2: number, mastered = false, operation: Operation = 'addition'): MathFactCard {
    const now = Date.now();
    const correctAnswer = operation === 'addition' ? operand1 + operand2 : operand1 - operand2;
    return {
        problem: {
            id: `${operation}-${operand1}-${operand2}`,
            operand1,
            operand2,
            operation,
            correctAnswer,
        },
        easeFactor: 2.5,
        interval: mastered ? 30 : 0,
        repetitions: mastered ? 5 : 0,
        nextReview: mastered ? now + 30 * 24 * 60 * 60 * 1000 : now,
        lastReviewed: mastered ? now - 24 * 60 * 60 * 1000 : undefined,
        totalAttempts: mastered ? 5 : 0,
        correctAttempts: mastered ? 5 : 0,
        averageResponseTime: mastered ? 2000 : 0,
    };
}

// Generate all cards for levels 0-12 (full set for progress display)
function generateFullCardSet(operation: Operation = 'addition'): MathFactCard[] {
    const cards: MathFactCard[] = [];
    for (let i = 0; i <= 12; i++) {
        for (let j = 0; j <= 12; j++) {
            cards.push(createCard(i, j, false, operation));
        }
    }
    return cards;
}

// Generate cards for both operations
function generateDualOperationCardSet(): MathFactCard[] {
    return [...generateFullCardSet('addition'), ...generateFullCardSet('subtraction')];
}

describe('ProgressPage', () => {
    describe('Disabled Level Indicators', () => {
        it('should show all 13 levels (0-12) regardless of enabledNumbers', () => {
            const cards = generateFullCardSet();
            const onClose = vi.fn();

            render(
                <ProgressPage
                    cards={cards}
                    enabledNumbers={[0, 1, 2]}
                    onClose={onClose}
                />
            );

            // All 13 levels should be visible (twice - once for addition, once for subtraction)
            for (let level = 0; level <= 12; level++) {
                const elements = screen.getAllByText(level.toString());
                expect(elements.length).toBeGreaterThanOrEqual(2); // At least in both operation bars
            }
        });

        it('should add disabled class to levels not in enabledNumbers', () => {
            const cards = generateFullCardSet();
            const onClose = vi.fn();

            render(
                <ProgressPage
                    cards={cards}
                    enabledNumbers={[0, 1, 2]}
                    onClose={onClose}
                />
            );

            // There should be 26 total segments (13 for addition + 13 for subtraction)
            const segments = document.querySelectorAll('.primary-progress-segment');
            expect(segments).toHaveLength(26);

            // First 13 segments are the Addition bar
            const additionSegments = Array.from(segments).slice(0, 13);

            // Levels 0, 1, 2 should NOT have disabled class
            expect(additionSegments[0]).not.toHaveClass('disabled');
            expect(additionSegments[1]).not.toHaveClass('disabled');
            expect(additionSegments[2]).not.toHaveClass('disabled');

            // Levels 3-12 should have disabled class
            for (let i = 3; i <= 12; i++) {
                expect(additionSegments[i]).toHaveClass('disabled');
            }
        });

        it('should show "(not practicing)" in tooltip for disabled levels', () => {
            const cards = generateFullCardSet();
            const onClose = vi.fn();

            render(
                <ProgressPage
                    cards={cards}
                    enabledNumbers={[0, 5]}
                    onClose={onClose}
                />
            );

            const segments = document.querySelectorAll('.primary-progress-segment');

            // Level 0 (enabled) should not have "(not practicing)" in title
            expect(segments[0].getAttribute('title')).not.toContain('(not practicing)');

            // Level 3 (disabled) should have "(not practicing)" in title
            expect(segments[3].getAttribute('title')).toContain('(not practicing)');

            // Level 5 (enabled) should not have "(not practicing)" in title
            expect(segments[5].getAttribute('title')).not.toContain('(not practicing)');
        });

        it('should not add disabled class when enabledNumbers is undefined', () => {
            const cards = generateFullCardSet();
            const onClose = vi.fn();

            render(
                <ProgressPage
                    cards={cards}
                    onClose={onClose}
                />
            );

            const segments = document.querySelectorAll('.primary-progress-segment');

            // No segments should have disabled class when enabledNumbers is undefined
            segments.forEach(segment => {
                expect(segment).not.toHaveClass('disabled');
            });
        });

        it('should preserve historical progress percentages for disabled levels', () => {
            // Create cards where level 5 has some mastered cards
            const cards = generateFullCardSet();
            // Mark some level 5 cards as mastered (5+0, 5+1, 5+2 = 3 mastered out of 25 total for level 5)
            const masteredIds = ['addition-5-0', 'addition-5-1', 'addition-5-2'];
            const cardsWithProgress = cards.map(card => {
                if (masteredIds.includes(card.problem.id)) {
                    return createCard(card.problem.operand1, card.problem.operand2, true);
                }
                return card;
            });

            const onClose = vi.fn();

            render(
                <ProgressPage
                    cards={cardsWithProgress}
                    enabledNumbers={[0, 1, 2]} // Level 5 is disabled
                    onClose={onClose}
                />
            );

            const segments = document.querySelectorAll('.primary-progress-segment');

            // Level 5 should be disabled but still show progress percentage
            expect(segments[5]).toHaveClass('disabled');
            const title = segments[5].getAttribute('title') || '';
            // Should show some percentage (not 0%) because we have mastered cards
            expect(title).toMatch(/Level 5: \d+%/);
            expect(title).not.toMatch(/Level 5: 0%/);
            expect(title).toContain('(not practicing)');
        });
    });

    describe('Dual Operation Progress Bars', () => {
        it('should display both Addition and Subtraction labels', () => {
            const cards = generateDualOperationCardSet();
            const onClose = vi.fn();

            render(
                <ProgressPage
                    cards={cards}
                    onClose={onClose}
                />
            );

            expect(screen.getByText('Addition')).toBeInTheDocument();
            expect(screen.getByText('Subtraction')).toBeInTheDocument();
        });

        it('should show subtraction bar with correct disabled classes', () => {
            const cards = generateDualOperationCardSet();
            const onClose = vi.fn();

            render(
                <ProgressPage
                    cards={cards}
                    enabledNumbers={[0, 1, 2]}
                    onClose={onClose}
                />
            );

            const segments = document.querySelectorAll('.primary-progress-segment');
            // Last 13 segments are the Subtraction bar
            const subtractionSegments = Array.from(segments).slice(13, 26);

            // Levels 0, 1, 2 should NOT have disabled class
            expect(subtractionSegments[0]).not.toHaveClass('disabled');
            expect(subtractionSegments[1]).not.toHaveClass('disabled');
            expect(subtractionSegments[2]).not.toHaveClass('disabled');

            // Levels 3-12 should have disabled class
            for (let i = 3; i <= 12; i++) {
                expect(subtractionSegments[i]).toHaveClass('disabled');
            }
        });

        it('should select subtraction operation when clicking subtraction bar segment', async () => {
            const user = userEvent.setup({ delay: null });
            const cards = generateDualOperationCardSet();
            const onClose = vi.fn();

            render(
                <ProgressPage
                    cards={cards}
                    onClose={onClose}
                />
            );

            const segments = document.querySelectorAll('.primary-progress-segment');
            // Click on subtraction level 5 (index 13 + 5 = 18)
            await user.click(segments[18]);

            // Secondary bar header should show subtraction symbol
            expect(screen.getByText(/Level 5: 5s \(−\)/)).toBeInTheDocument();
        });

        it('should show active class on the selected operation bar', async () => {
            const user = userEvent.setup({ delay: null });
            const cards = generateDualOperationCardSet();
            const onClose = vi.fn();

            render(
                <ProgressPage
                    cards={cards}
                    onClose={onClose}
                />
            );

            const progressBars = document.querySelectorAll('.primary-progress-bar');
            const additionBar = progressBars[0];
            const subtractionBar = progressBars[1];

            // Initially, addition bar should be active
            expect(additionBar).toHaveClass('active');
            expect(subtractionBar).not.toHaveClass('active');

            // Click on a subtraction segment
            const segments = document.querySelectorAll('.primary-progress-segment');
            await user.click(segments[15]); // subtraction level 2

            // Now subtraction bar should be active
            expect(subtractionBar).toHaveClass('active');
            expect(additionBar).not.toHaveClass('active');
        });

        it('should show addition symbol when addition level is selected', async () => {
            const user = userEvent.setup({ delay: null });
            const cards = generateDualOperationCardSet();
            const onClose = vi.fn();

            render(
                <ProgressPage
                    cards={cards}
                    onClose={onClose}
                />
            );

            // Click on addition level 3 (index 3)
            const segments = document.querySelectorAll('.primary-progress-segment');
            await user.click(segments[3]);

            // Secondary bar header should show addition symbol
            expect(screen.getByText(/Level 3: 3s \(\+\)/)).toBeInTheDocument();
        });

        it('should track progress separately for each operation', () => {
            // Create cards with some mastered addition cards but no mastered subtraction cards
            const additionCards = generateFullCardSet('addition').map((card) => {
                // Master all level 0 addition cards
                if (card.problem.operand1 === 0 || card.problem.operand2 === 0) {
                    return createCard(card.problem.operand1, card.problem.operand2, true, 'addition');
                }
                return card;
            });
            const subtractionCards = generateFullCardSet('subtraction');
            const cards = [...additionCards, ...subtractionCards];

            const onClose = vi.fn();

            render(
                <ProgressPage
                    cards={cards}
                    onClose={onClose}
                />
            );

            const segments = document.querySelectorAll('.primary-progress-segment');

            // Addition level 0 should have progress (some completed class indicators)
            const additionLevel0Title = segments[0].getAttribute('title') || '';
            expect(additionLevel0Title).not.toMatch(/Level 0: 0%/);

            // Subtraction level 0 should have 0% (no progress)
            const subtractionLevel0Title = segments[13].getAttribute('title') || '';
            expect(subtractionLevel0Title).toMatch(/Level 0: 0%/);
        });
    });
});
