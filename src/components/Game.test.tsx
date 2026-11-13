import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Game } from './Game';
import { db } from '../utils/db';
import { MISSION_LIMITS } from '../constants';
import { getAllFactIds } from '../utils/factChart';
import type { MathFactCard } from '../types/game';

// Clean up DOM and close db after each test to prevent race conditions.
// cleanup() unmounts synchronously, but useEffect async operations (loadSparkles,
// loadRescueProgress) are already in flight as microtasks. The setTimeout(0) delays
// db.close() until after those microtasks complete, preventing "DatabaseClosedError".
afterEach(async () => {
    cleanup();
    await new Promise(resolve => setTimeout(resolve, 0));
    await db.close();
});

// Clear and reopen database before each test
beforeEach(async () => {
    await db.delete();
    await db.open();
});

type User = ReturnType<typeof userEvent.setup>;

const DAY_MS = 24 * 60 * 60 * 1000;

function seededCard(id: string, progress: Partial<MathFactCard>): MathFactCard {
    const [, a, b] = id.split('-').map(Number);
    return {
        problem: { id, operand1: a, operand2: b, operation: 'addition', correctAnswer: a + b },
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: Date.now(),
        totalAttempts: 0,
        correctAttempts: 0,
        averageResponseTime: 0,
        ...progress,
    };
}

/** Already blue (interval ≥ 14 days) and not due, so not in the session. */
const ALREADY_MASTERED_IDS = [
    'addition-1-0', 'addition-1-1', 'addition-1-2', 'addition-1-3', 'addition-1-4', 'addition-1-5',
];
const masteredCard = (id: string) => seededCard(id, {
    interval: 30, repetitions: 5, nextReview: Date.now() + 30 * DAY_MS,
    lastReviewed: Date.now() - DAY_MS, totalAttempts: 5, correctAttempts: 5, averageResponseTime: 2000,
});

/**
 * Overdue cards at rep 2 / interval 6: one fast correct answer makes them blue
 * (rep 3, interval round(6 × 2.6) = 16 days).
 *
 * Why 7? selectCards builds a 10-card session: up to 7 review cards + 3 new. After the
 * shuffle, 7/10 cards are ready to master, so the first 5 answered must include at least
 * 2 of them (only 3 other cards exist). This keeps random card order from causing flakiness.
 */
const READY_TO_MASTER_IDS = [
    'addition-0-4', 'addition-0-5', 'addition-0-6', 'addition-0-7',
    'addition-0-8', 'addition-0-9', 'addition-0-10',
];
const READY_TO_MASTER_LABELS = READY_TO_MASTER_IDS.map(id => {
    const [, a, b] = id.split('-').map(Number);
    return `${a} + ${b} = ${a + b}`;
});
const readyToMasterCard = (id: string) => seededCard(id, {
    interval: 6, repetitions: 2, nextReview: Date.now() - 1000,
    lastReviewed: Date.now() - 7 * DAY_MS, totalAttempts: 2, correctAttempts: 2, averageResponseTime: 3000,
});

async function openSettings(user: User) {
    await user.click(await screen.findByRole('button', { name: /🪄|settings/i }));
    await screen.findByText('Facts to Practice');
}

async function acceptMission(user: User) {
    await user.click(await screen.findByRole('button', { name: /help \w+!/i }));
}

/** Answers the current addition problem correctly. */
async function answerCurrentProblem(user: User) {
    await waitFor(() => {
        expect(screen.getByText(/= \?/)).toBeInTheDocument();
    }, { timeout: 3000 });

    const problemText = screen.getByText(/\d+\s*[+\-×÷]\s*\d+/).textContent || '';
    const match = problemText.match(/(\d+)\s*\+\s*(\d+)/);
    if (!match) throw new Error('Could not parse problem');

    const input = screen.getByPlaceholderText('Your answer');
    await user.clear(input);
    await user.type(input, String(parseInt(match[1]) + parseInt(match[2])));
    await user.click(screen.getByRole('button', { name: /submit/i }));
}

async function answerUntilMissionComplete(user: User) {
    for (let i = 0; i < MISSION_LIMITS.maxAttempts; i++) {
        await answerCurrentProblem(user);

        const missionComplete = await screen.findByText(/mission complete/i, {}, { timeout: 500 })
            .then(() => true)
            .catch(() => false);
        if (missionComplete) return;

        await user.click(await screen.findByRole('button', { name: /continue/i }));
    }
    await screen.findByText(/mission complete/i, {}, { timeout: 5000 });
}

describe('Game - Critical User Flows', () => {
    describe('Mission Start and Completion', () => {
        it('should show mission intro when starting a new mission', async () => {
            render(<Game />);

            // Wait for the mission intro to appear
            await waitFor(() => {
                expect(screen.getByText(/new friend needs help/i)).toBeInTheDocument();
            });

            // Should see "Help {AnimalName}!" button
            expect(screen.getByRole('button', { name: /help \w+!/i })).toBeInTheDocument();
        });

        it('should start showing problems after accepting mission', async () => {
            const user = userEvent.setup({ delay: null });
            render(<Game />);

            // Wait for and accept the mission
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /help \w+!/i })).toBeInTheDocument();
            });

            await user.click(screen.getByRole('button', { name: /help \w+!/i }));

            // Should see a math problem
            await waitFor(() => {
                expect(screen.getByText(/= \?/)).toBeInTheDocument();
            });
        });
    });

    describe('Answer Feedback', () => {
        it('should show encouraging feedback for incorrect answers', async () => {
            const user = userEvent.setup({ delay: null });
            render(<Game />);

            // Accept mission
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /help \w+!/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /help \w+!/i }));

            // Wait for problem to appear and get the equation
            await waitFor(() => {
                expect(screen.getByText(/= \?/)).toBeInTheDocument();
            });

            // Submit a wrong answer (999 is unlikely to be correct for simple addition)
            const input = screen.getByPlaceholderText('Your answer')
            await user.clear(input);
            await user.type(input, '9999');
            await user.click(screen.getByRole('button', { name: /submit/i }));

            // Should see Sunshine's encouraging dialogue
            await waitFor(() => {
                expect(screen.getByText(/Oops!|No worries!|Ah, chicken nugget!|That one was tricky!/i)).toBeInTheDocument();
            });

            // Should see Continue button
            expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
        });

        it('should award sparkles for fast correct answers', async () => {
            const user = userEvent.setup({ delay: null });
            render(<Game />);

            // Accept mission
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /help \w+!/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /help \w+!/i }));

            // Wait for problem
            await waitFor(() => {
                expect(screen.getByText(/= \?/)).toBeInTheDocument();
            });

            // Get the problem text and calculate correct answer
            const problemText = screen.getByText(/\d+\s*[+\-×÷]\s*\d+/).textContent || '';
            const match = problemText.match(/(\d+)\s*\+\s*(\d+)/);
            if (!match) throw new Error('Could not parse problem');

            const correctAnswer = parseInt(match[1]) + parseInt(match[2]);

            // Submit correct answer quickly
            const input = screen.getByPlaceholderText('Your answer');
            await user.clear(input);
            await user.type(input, correctAnswer.toString());
            await user.click(screen.getByRole('button', { name: /submit/i }));

            // Should see sparkles counter increase to 1
            await waitFor(() => {
                const counter = document.querySelector('.sparkles-count');
                expect(counter?.textContent).toBe('1');
            });
        });
    });

    describe('Mission Completion', () => {
        it('should show mission complete screen after enough correct answers', async () => {
            const user = userEvent.setup({ delay: null });
            render(<Game />);

            // Accept mission
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /help \w+!/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /help \w+!/i }));

            // Answer problems correctly until mission completes
            // The mission completes at MISSION_LIMITS.progressTarget (see src/constants.ts)
            for (let i = 0; i < MISSION_LIMITS.maxAttempts; i++) {
                // Wait for problem
                await waitFor(() => {
                    expect(screen.getByText(/= \?/)).toBeInTheDocument();
                }, { timeout: 3000 });

                // Parse and answer the problem
                const problemText = screen.getByText(/\d+\s*[+\-×÷]\s*\d+/).textContent || '';
                const match = problemText.match(/(\d+)\s*\+\s*(\d+)/);

                if (match) {
                    const correctAnswer = parseInt(match[1]) + parseInt(match[2]);
                    const input = screen.getByPlaceholderText('Your answer');
                    await user.clear(input);
                    await user.type(input, correctAnswer.toString());
                    await user.click(screen.getByRole('button', { name: /submit/i }));

                    // Wait for either Continue button or Mission Complete screen
                    const missionComplete = await screen.findByText(/mission complete|rescued/i, {}, { timeout: 500 })
                        .then(() => true)
                        .catch(() => false);

                    if (missionComplete) {
                        break; // Mission is complete, exit loop
                    }

                    // Otherwise, click Continue to move to next problem
                    const continueButton = await screen.findByRole('button', { name: /continue/i });
                    await user.click(continueButton);
                }
            }

            // Should eventually see mission complete message
            await waitFor(() => {
                expect(screen.getByText(/mission complete|rescued/i)).toBeInTheDocument();
            }, { timeout: 5000 });
        });
    });

    describe('Settings Page', () => {
        it('should persist fact chart changes to IndexedDB', async () => {
            const user = userEvent.setup({ delay: null });
            render(<Game />);

            await openSettings(user);

            // Turn off one fact in the addition chart
            await user.click(screen.getByRole('button', { name: '7 plus 8' }));
            await user.click(screen.getByRole('button', { name: /start practice/i }));

            await waitFor(async () => {
                const saved = await db.settings.get('singleton');
                expect(saved?.enabledFacts.addition).toHaveLength(120);
                expect(saved?.enabledFacts.addition).not.toContain('addition-7-8');
                expect(saved?.enabledFacts.subtraction).toHaveLength(121);
            });
        });

        it('should show 121 facts selected for each operation by default', async () => {
            const user = userEvent.setup({ delay: null });
            render(<Game />);

            await openSettings(user);
            expect(screen.getByText('121 math facts selected')).toBeInTheDocument();

            await user.click(screen.getByLabelText('Subtraction (−)'));
            expect(screen.getByText('121 math facts selected')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: '20 minus 10' })).toBeInTheDocument();
        });

        it('should convert settings saved before the fact charts existed', async () => {
            // Old settings: only the 0s and 5s, combined with 0 through 5 (20 addition facts)
            await db.settings.put({
                id: 'singleton',
                operation: 'addition',
                maxNumber: 5,
                enabledNumbers: [0, 5],
                cardsPerSession: 10,
                targetTime: 5000,
            } as never);

            const user = userEvent.setup({ delay: null });
            render(<Game />);
            await openSettings(user);

            await waitFor(() => {
                expect(screen.getByText('20 math facts selected')).toBeInTheDocument();
            });
        });
    });

    describe('Mastery Celebrations', () => {
        it('should celebrate facts that turned blue during the mission', async () => {
            const user = userEvent.setup({ delay: null });
            await db.cards.bulkPut([...ALREADY_MASTERED_IDS.map(masteredCard), ...READY_TO_MASTER_IDS.map(readyToMasterCard)]);

            render(<Game />);
            await acceptMission(user);
            await answerUntilMissionComplete(user);

            const masteredFacts = await screen.findByRole('list', { name: /facts mastered this mission/i });
            expect(screen.getByText(/⭐ \d+ facts? mastered!/)).toBeInTheDocument();

            // Only the ready-to-master facts can be newly mastered; already-blue ones aren't celebrated
            const celebrated = Array.from(masteredFacts.querySelectorAll('li')).map(li => li.textContent);
            expect(celebrated.length).toBeGreaterThanOrEqual(2);
            for (const text of celebrated) {
                expect(READY_TO_MASTER_LABELS).toContain(text);
            }
        }, 30000);

        it('should not celebrate the same facts again in the next mission', async () => {
            const user = userEvent.setup({ delay: null });
            await db.cards.bulkPut(READY_TO_MASTER_IDS.map(readyToMasterCard));

            render(<Game />);
            await acceptMission(user);
            await answerUntilMissionComplete(user);

            const firstList = await screen.findByRole('list', { name: /facts mastered this mission/i });
            const firstCelebrated = Array.from(firstList.querySelectorAll('li')).map(li => li.textContent);
            expect(firstCelebrated.length).toBeGreaterThan(0);

            // Mission 2: the pre-mission snapshot must include mission 1's newly mastered facts
            await user.click(screen.getByRole('button', { name: /help another animal/i }));
            await acceptMission(user);
            await answerUntilMissionComplete(user);

            const secondList = screen.queryByRole('list', { name: /facts mastered this mission/i });
            const secondCelebrated = secondList
                ? Array.from(secondList.querySelectorAll('li')).map(li => li.textContent)
                : [];
            for (const text of firstCelebrated) {
                expect(secondCelebrated).not.toContain(text);
            }
        }, 30000);
    });

    describe('Missions with few due facts', () => {
        it('mixes in other facts and does not cram the one due fact to mastery', async () => {
            const user = userEvent.setup({ delay: null });
            // Every addition fact is scheduled in the future except 9 + 3
            const notDueCards = getAllFactIds('addition')
                .filter(id => id !== 'addition-9-3')
                .map((id, i) => seededCard(id, {
                    interval: 6, repetitions: 2, nextReview: Date.now() + (i + 1) * DAY_MS,
                    lastReviewed: Date.now() - DAY_MS, totalAttempts: 2, correctAttempts: 2,
                }));
            const dueCard = seededCard('addition-9-3', {
                interval: 0, repetitions: 0, nextReview: Date.now() - 1000,
                lastReviewed: Date.now() - DAY_MS, totalAttempts: 3, correctAttempts: 1,
            });
            await db.cards.bulkPut([...notDueCards, dueCard]);

            render(<Game />);
            await acceptMission(user);

            const seen = new Set<string>();
            for (let i = 0; i < 6; i++) {
                await waitFor(() => expect(screen.getByText(/= \?/)).toBeInTheDocument());
                seen.add(screen.getByText(/\d+\s*\+\s*\d+/).textContent || '');
                await answerCurrentProblem(user);
                await user.click(await screen.findByRole('button', { name: /continue/i }));
            }
            expect(seen.size).toBeGreaterThan(1);

            await answerUntilMissionComplete(user);
            const stored = await db.cards.get('addition-9-3');
            expect(stored!.interval).toBeLessThanOrEqual(1);
        }, 30000);
    });

    describe('Progress Page Synchronization', () => {
        it('should show updated mastery on ProgressPage after answering questions', async () => {
            const user = userEvent.setup({ delay: null });

            // Regression test for stale progressCards: the Progress page must reflect
            // answers given since the page was last opened
            await db.cards.bulkPut([...ALREADY_MASTERED_IDS.map(masteredCard), ...READY_TO_MASTER_IDS.map(readyToMasterCard)]);

            render(<Game />);

            // Initially 6 of the 121 selected addition facts are mastered
            await user.click(await screen.findByRole('button', { name: /🐾|progress/i }));
            await waitFor(() => {
                expect(screen.getByText(/^6 of 121 selected facts mastered/)).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /back to practice/i }));

            // Answer 4 questions correctly. The session has 7 ready-to-master cards and
            // 3 new cards, so by pigeonhole at least 1 of the first 4 becomes mastered
            // (interval jumps from 6 to 16 days, past the 14-day blue threshold).
            await acceptMission(user);
            for (let i = 0; i < 4; i++) {
                await answerCurrentProblem(user);
                await user.click(await screen.findByRole('button', { name: /continue/i }));
            }

            await user.click(screen.getByRole('button', { name: /🐾|progress/i }));
            await waitFor(() => {
                const text = screen.getByText(/selected facts mastered/).textContent || '';
                const mastered = parseInt(text.match(/^(\d+) of 121/)![1]);
                expect(mastered).toBeGreaterThan(6);
            });
        }, 30000);
    });

    describe('All Caught Up Screen', () => {
        it('should show "All Caught Up" when no cards are due', async () => {
            const user = userEvent.setup({ delay: null });
            render(<Game />);

            // Open settings
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /🪄|settings/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /🪄|settings/i }));

            // Wait for settings screen
            await waitFor(() => {
                expect(screen.getByText(/settings/i)).toBeInTheDocument();
            });

            // Clear the chart and select only 0 + 0
            await user.click(screen.getByRole('button', { name: /^clear all$/i }));
            await user.click(screen.getByRole('button', { name: '0 plus 0' }));

            // Start practice
            await user.click(screen.getByRole('button', { name: /start practice/i }));

            // Accept the mission
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /help \w+!/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /help \w+!/i }));

            // Complete the mission - only one card (0+0), answer is always 0
            // Answer until mission completes (see MISSION_LIMITS in src/constants.ts)
            for (let i = 0; i < MISSION_LIMITS.maxAttempts; i++) {
                // Wait for problem
                await waitFor(() => {
                    expect(screen.getByText(/= \?/)).toBeInTheDocument();
                });

                // Answer is always 0 for 0+0
                const input = screen.getByPlaceholderText('Your answer');
                await user.clear(input);
                await user.type(input, '0');
                await user.click(screen.getByRole('button', { name: /submit/i }));

                // Check if mission complete screen shows
                const missionComplete = await screen.findByText(/mission complete/i, {}, { timeout: 500 })
                    .then(() => true)
                    .catch(() => false);

                if (missionComplete) {
                    break;
                }

                // Click continue
                const continueButton = await screen.findByRole('button', { name: /continue/i });
                await user.click(continueButton);
            }

            // Should see mission complete screen first
            await waitFor(() => {
                expect(screen.getByText(/mission complete/i)).toBeInTheDocument();
            });

            // Click "Help Another Animal" to trigger AllCaughtUp detection
            await user.click(screen.getByRole('button', { name: /help another animal/i }));

            // Should see all caught up
            await waitFor(() => {
                expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
            });

            // Should see bonus practice button
            expect(screen.getByRole('button', { name: /practice/i })).toBeInTheDocument();

            // Should see ready for new challenges button (goes to settings)
            expect(screen.getByRole('button', { name: /challenges/i })).toBeInTheDocument();
        }, 30000);
    });
});
