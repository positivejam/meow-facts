import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressPage } from './ProgressPage';
import type { MathFactCard } from '../types/game';

// Helper to create a minimal card for testing
function createCard(operand1: number, operand2: number, mastered = false): MathFactCard {
    const now = Date.now();
    return {
        problem: {
            id: `addition-${operand1}-${operand2}`,
            operand1,
            operand2,
            operation: 'addition',
            correctAnswer: operand1 + operand2,
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
function generateFullCardSet(): MathFactCard[] {
    const cards: MathFactCard[] = [];
    for (let i = 0; i <= 12; i++) {
        for (let j = 0; j <= 12; j++) {
            cards.push(createCard(i, j));
        }
    }
    return cards;
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

            // All 13 levels should be visible
            for (let level = 0; level <= 12; level++) {
                expect(screen.getByText(level.toString())).toBeInTheDocument();
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

            const segments = document.querySelectorAll('.primary-progress-segment');
            expect(segments).toHaveLength(13);

            // Levels 0, 1, 2 should NOT have disabled class
            expect(segments[0]).not.toHaveClass('disabled');
            expect(segments[1]).not.toHaveClass('disabled');
            expect(segments[2]).not.toHaveClass('disabled');

            // Levels 3-12 should have disabled class
            for (let i = 3; i <= 12; i++) {
                expect(segments[i]).toHaveClass('disabled');
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
});
