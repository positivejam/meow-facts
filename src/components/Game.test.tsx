import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Game } from './Game';
import { db } from '../utils/db';
import { MISSION_LIMITS } from '../constants';

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
        it('should persist settings changes to IndexedDB', async () => {
            const user = userEvent.setup({ delay: null });
            render(<Game />);

            // Open settings
            await waitFor(() => {
                const settingsButton = screen.getByRole('button', { name: /⚙️|settings/i });
                expect(settingsButton).toBeInTheDocument();
            });

            await user.click(screen.getByRole('button', { name: /⚙️|settings/i }));

            // Should see settings screen
            await waitFor(() => {
                expect(screen.getByText(/settings/i)).toBeInTheDocument();
            });

            // Change a setting (e.g., max number)
            const maxNumberSelect = screen.getByLabelText(/maximum number/i);
            await user.selectOptions(maxNumberSelect, '10');

            // Close settings
            await user.click(screen.getByRole('button', { name: /start practice/i }));

            // Verify setting was saved to IndexedDB
            await waitFor(async () => {
                const savedSettings = await db.settings.get('singleton');
                expect(savedSettings?.maxNumber).toBe(10);
            });
        });

        it('should display fact count of 169 when all numbers are checked and max number is set to 12 (addition)', async () => {
            const user = userEvent.setup({ delay: null });
            render(<Game />);

            // Open settings
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /⚙️|settings/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /⚙️|settings/i }));

            // Wait for settings screen
            await waitFor(() => {
                expect(screen.getByText(/settings/i)).toBeInTheDocument();
            });

            // Select all numbers)
            await user.click(screen.getByRole('button', { name: /select all/i }));

            // Verify checkboxes 0 and 5 are checked
            await waitFor(() => {
                const checkbox0 = screen.getByLabelText('0') as HTMLInputElement;
                const checkbox1 = screen.getByLabelText('1') as HTMLInputElement;
                const checkbox2 = screen.getByLabelText('2') as HTMLInputElement;
                const checkbox3 = screen.getByLabelText('3') as HTMLInputElement;
                const checkbox4 = screen.getByLabelText('4') as HTMLInputElement;
                const checkbox5 = screen.getByLabelText('5') as HTMLInputElement;
                const checkbox6 = screen.getByLabelText('6') as HTMLInputElement;
                const checkbox7 = screen.getByLabelText('7') as HTMLInputElement;
                const checkbox8 = screen.getByLabelText('8') as HTMLInputElement;
                const checkbox9 = screen.getByLabelText('9') as HTMLInputElement;
                const checkbox10 = screen.getByLabelText('10') as HTMLInputElement;
                const checkbox11 = screen.getByLabelText('11') as HTMLInputElement;
                const checkbox12 = screen.getByLabelText('12') as HTMLInputElement;
                expect(checkbox0.checked).toBe(true);
                expect(checkbox1.checked).toBe(true);
                expect(checkbox2.checked).toBe(true);
                expect(checkbox3.checked).toBe(true);
                expect(checkbox4.checked).toBe(true);
                expect(checkbox5.checked).toBe(true);
                expect(checkbox6.checked).toBe(true);
                expect(checkbox7.checked).toBe(true);
                expect(checkbox8.checked).toBe(true);
                expect(checkbox9.checked).toBe(true);
                expect(checkbox10.checked).toBe(true);
                expect(checkbox11.checked).toBe(true);
                expect(checkbox12.checked).toBe(true);
            });

            // Set max number to 12
            const maxNumberSelect = screen.getByLabelText(/maximum number/i);
            await user.selectOptions(maxNumberSelect, '12');

            // Should see "169 math facts selected"
            await waitFor(() => {
                expect(screen.getByText('169 math facts selected')).toBeInTheDocument();
            });
        });

        it('should display fact count of 91 when all numbers are checked and max number is set to 12 (subtraction)', async () => {
            const user = userEvent.setup({ delay: null });
            render(<Game />);

            // Open settings
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /⚙️|settings/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /⚙️|settings/i }));

            // Wait for settings screen
            await waitFor(() => {
                expect(screen.getByText(/settings/i)).toBeInTheDocument();
            });

            // Select subtraction operation
            await user.click(screen.getByLabelText('Subtraction (−)'));

            // Verify subtraction is selected
            await waitFor(() => {
                const subtractionRadio = screen.getByLabelText('Subtraction (−)') as HTMLInputElement;
                expect(subtractionRadio.checked).toBe(true);
            });

            // Select all numbers
            await user.click(screen.getByRole('button', { name: /select all/i }));

            // Verify all checkboxes are checked
            await waitFor(() => {
                for (let i = 0; i <= 12; i++) {
                    const checkbox = screen.getByLabelText(i.toString()) as HTMLInputElement;
                    expect(checkbox.checked).toBe(true);
                }
            });

            // Set max number to 12
            const maxNumberSelect = screen.getByLabelText(/maximum number/i);
            await user.selectOptions(maxNumberSelect, '12');

            // Subtraction has 91 facts (only where operand1 >= operand2 to avoid negatives)
            // This is different from addition's 169 facts
            await waitFor(() => {
                expect(screen.getByText('91 math facts selected')).toBeInTheDocument();
            });
        });

        it('should display correct fact count based on selected numbers and max number', async () => {
            const user = userEvent.setup({ delay: null });
            render(<Game />);

            // Open settings
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /⚙️|settings/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /⚙️|settings/i }));

            // Wait for settings screen
            await waitFor(() => {
                expect(screen.getByText(/settings/i)).toBeInTheDocument();
            });

            // Clear all numbers (this will set to [0])
            await user.click(screen.getByRole('button', { name: /^clear all$/i }));

            // Check the checkbox for 5
            const checkbox5 = screen.getByLabelText('5') as HTMLInputElement;
            await user.click(checkbox5);

            // Verify checkboxes 0 and 5 are checked
            await waitFor(() => {
                const checkbox0 = screen.getByLabelText('0') as HTMLInputElement;
                expect(checkbox0.checked).toBe(true);
                expect(checkbox5.checked).toBe(true);
            });

            // Set max number to 5
            const maxNumberSelect = screen.getByLabelText(/maximum number/i);
            await user.selectOptions(maxNumberSelect, '5');

            // Should see "20 math facts selected"
            await waitFor(() => {
                expect(screen.getByText('20 math facts selected')).toBeInTheDocument();
            });
        });
    });

    describe('Milestone Celebrations', () => {
        it('should show milestone badge when mastery threshold is crossed during a mission', async () => {
            const user = userEvent.setup({ delay: null });

            // Pre-seed cards to set up a near-threshold state for level 0.
            // Level 0 with maxNumber 12 has totalFacts = 2*12+1 = 25.
            // Pre-seed 6 as mastered (24%), need 1 more to reach 7 (28%) → crosses 25%.
            const now = Date.now();
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

            // 6 mastered cards for level 0 (nextReview far in the future)
            const masteredCardIds = [
                'addition-0-0', 'addition-0-1', 'addition-0-2',
                'addition-0-3', 'addition-0-4', 'addition-0-5',
            ];
            const masteredCards = masteredCardIds.map(id => {
                const parts = id.split('-');
                const op1 = Number(parts[1]);
                const op2 = Number(parts[2]);
                return {
                    problem: {
                        id,
                        operand1: op1,
                        operand2: op2,
                        operation: 'addition' as const,
                        correctAnswer: op1 + op2,
                    },
                    easeFactor: 2.5,
                    interval: 30,
                    repetitions: 5,
                    nextReview: now + THIRTY_DAYS_MS,
                    lastReviewed: now - 24 * 60 * 60 * 1000,
                    totalAttempts: 5,
                    correctAttempts: 5,
                    averageResponseTime: 2000,
                };
            });

            // 7 cards at rep=2, interval=6 — ready to become mastered on next fast correct.
            // After fast correct: rep=3, interval=round(6*2.6)=16 days → nextReview > now+14d → mastered!
            //
            // Why 7? selectCards builds a 10-card session: up to 7 review cards + 3 new.
            // After the final random shuffle, 7/10 cards are ready-to-master, so the
            // first 5 answered (enough for mission completion) MUST include at least 2
            // ready cards (pigeonhole: only 3 non-ready cards exist). This eliminates
            // flakiness from random card ordering.
            const readyToMasterIds = [
                'addition-0-6', 'addition-0-7', 'addition-0-8',
                'addition-0-9', 'addition-0-10', 'addition-0-11',
                'addition-0-12',
            ];
            const readyToMasterCards = readyToMasterIds.map(id => {
                const parts = id.split('-');
                const op1 = Number(parts[1]);
                const op2 = Number(parts[2]);
                return {
                    problem: {
                        id,
                        operand1: op1,
                        operand2: op2,
                        operation: 'addition' as const,
                        correctAnswer: op1 + op2,
                    },
                    easeFactor: 2.5,
                    interval: 6,
                    repetitions: 2,
                    nextReview: now - 1000, // overdue → will be selected for session
                    lastReviewed: now - 7 * 24 * 60 * 60 * 1000,
                    totalAttempts: 2,
                    correctAttempts: 2,
                    averageResponseTime: 3000,
                };
            });

            // Seed the database before rendering
            await db.cards.bulkPut([...masteredCards, ...readyToMasterCards]);

            render(<Game />);

            // Accept the mission
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /help \w+!/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /help \w+!/i }));

            // Answer problems correctly until mission completes
            for (let i = 0; i < MISSION_LIMITS.maxAttempts; i++) {
                await waitFor(() => {
                    expect(screen.getByText(/= \?/)).toBeInTheDocument();
                }, { timeout: 3000 });

                const problemText = screen.getByText(/\d+\s*[+\-×÷]\s*\d+/).textContent || '';
                const match = problemText.match(/(\d+)\s*\+\s*(\d+)/);
                if (!match) throw new Error('Could not parse problem');

                const correctAnswer = parseInt(match[1]) + parseInt(match[2]);
                const input = screen.getByPlaceholderText('Your answer');
                await user.clear(input);
                await user.type(input, correctAnswer.toString());
                await user.click(screen.getByRole('button', { name: /submit/i }));

                const missionComplete = await screen.findByText(/mission complete/i, {}, { timeout: 500 })
                    .then(() => true)
                    .catch(() => false);

                if (missionComplete) break;

                const continueButton = await screen.findByRole('button', { name: /continue/i });
                await user.click(continueButton);
            }

            // Should see mission complete
            await waitFor(() => {
                expect(screen.getByText(/mission complete/i)).toBeInTheDocument();
            }, { timeout: 5000 });

            // Should see milestone celebration (crossing 25% on level 0)
            await waitFor(() => {
                expect(screen.getByText(/milestone.*reached/i)).toBeInTheDocument();
            });

            // Should show it was level 0
            expect(screen.getByText('Level 0')).toBeInTheDocument();
        });

        it('should not repeat milestone celebrations across missions', async () => {
            const user = userEvent.setup({ delay: null });

            // Pre-seed level 0 cards to set up a near-50% threshold state.
            // Level 0 with maxNumber 12 has totalFacts = 2*12+1 = 25.
            // Pre-seed 12 as mastered (48%), need 1 more to reach 13 (52%) → crosses 50%.
            const now = Date.now();
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

            // 12 mastered cards for level 0 (nextReview far in the future)
            // Using ONLY level 0 cards to avoid triggering other level milestones
            const masteredCardIds = [
                'addition-0-0', 'addition-0-1', 'addition-0-2', 'addition-0-3',
                'addition-0-4', 'addition-0-5', 'addition-0-6', 'addition-0-7',
                'addition-0-8', 'addition-0-9', 'addition-0-10', 'addition-0-11',
            ];
            const masteredCards = masteredCardIds.map(id => {
                const parts = id.split('-');
                const op1 = Number(parts[1]);
                const op2 = Number(parts[2]);
                return {
                    problem: {
                        id,
                        operand1: op1,
                        operand2: op2,
                        operation: 'addition' as const,
                        correctAnswer: op1 + op2,
                    },
                    easeFactor: 2.5,
                    interval: 30,
                    repetitions: 5,
                    nextReview: now + THIRTY_DAYS_MS,
                    lastReviewed: now - 24 * 60 * 60 * 1000,
                    totalAttempts: 5,
                    correctAttempts: 5,
                    averageResponseTime: 2000,
                };
            });

            // 10 cards at rep=2, interval=6 — ALL are level 0 cards (remaining ones)
            // This ensures we stay in level 0 and don't trigger level 1 milestones
            // Level 0 cards remaining: 0-12, 1-0, 2-0, 3-0, 4-0, 5-0, 6-0, 7-0, 8-0, 9-0, 10-0, 11-0, 12-0
            const readyToMasterIds = [
                'addition-0-12', 'addition-1-0', 'addition-2-0', 'addition-3-0',
                'addition-4-0', 'addition-5-0', 'addition-6-0', 'addition-7-0',
                'addition-8-0', 'addition-9-0',
            ];
            const readyToMasterCards = readyToMasterIds.map(id => {
                const parts = id.split('-');
                const op1 = Number(parts[1]);
                const op2 = Number(parts[2]);
                return {
                    problem: {
                        id,
                        operand1: op1,
                        operand2: op2,
                        operation: 'addition' as const,
                        correctAnswer: op1 + op2,
                    },
                    easeFactor: 2.5,
                    interval: 6,
                    repetitions: 2,
                    nextReview: now - 1000, // overdue → will be selected for session
                    lastReviewed: now - 7 * 24 * 60 * 60 * 1000,
                    totalAttempts: 2,
                    correctAttempts: 2,
                    averageResponseTime: 3000,
                };
            });

            // Seed the database before rendering
            await db.cards.bulkPut([...masteredCards, ...readyToMasterCards]);

            render(<Game />);

            // Accept the first mission
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /help \w+!/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /help \w+!/i }));

            // Complete mission 1 - answer problems correctly until mission completes
            for (let i = 0; i < MISSION_LIMITS.maxAttempts; i++) {
                await waitFor(() => {
                    expect(screen.getByText(/= \?/)).toBeInTheDocument();
                }, { timeout: 3000 });

                const problemText = screen.getByText(/\d+\s*[+\-×÷]\s*\d+/).textContent || '';
                const match = problemText.match(/(\d+)\s*\+\s*(\d+)/);
                if (!match) throw new Error('Could not parse problem');

                const correctAnswer = parseInt(match[1]) + parseInt(match[2]);
                const input = screen.getByPlaceholderText('Your answer');
                await user.clear(input);
                await user.type(input, correctAnswer.toString());
                await user.click(screen.getByRole('button', { name: /submit/i }));

                const missionComplete = await screen.findByText(/mission complete/i, {}, { timeout: 500 })
                    .then(() => true)
                    .catch(() => false);

                if (missionComplete) break;

                const continueButton = await screen.findByRole('button', { name: /continue/i });
                await user.click(continueButton);
            }

            // Should see mission complete
            await waitFor(() => {
                expect(screen.getByText(/mission complete/i)).toBeInTheDocument();
            }, { timeout: 5000 });

            // Should see GREEN milestone celebration (crossing 50% on level 0)
            await waitFor(() => {
                expect(screen.getByText(/milestone.*reached/i)).toBeInTheDocument();
            });
            expect(screen.getByText('Level 0')).toBeInTheDocument();
            // Verify it's the green (50%) milestone
            expect(screen.getByText(/50% Mastery/)).toBeInTheDocument();

            // Click "Help Another Animal" to start mission 2
            await user.click(screen.getByRole('button', { name: /help another animal/i }));

            // Accept mission 2
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /help \w+!/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /help \w+!/i }));

            // Complete mission 2
            for (let i = 0; i < MISSION_LIMITS.maxAttempts; i++) {
                await waitFor(() => {
                    expect(screen.getByText(/= \?/)).toBeInTheDocument();
                }, { timeout: 3000 });

                const problemText = screen.getByText(/\d+\s*[+\-×÷]\s*\d+/).textContent || '';
                const match = problemText.match(/(\d+)\s*\+\s*(\d+)/);
                if (!match) throw new Error('Could not parse problem');

                const correctAnswer = parseInt(match[1]) + parseInt(match[2]);
                const input = screen.getByPlaceholderText('Your answer');
                await user.clear(input);
                await user.type(input, correctAnswer.toString());
                await user.click(screen.getByRole('button', { name: /submit/i }));

                const missionComplete = await screen.findByText(/mission complete/i, {}, { timeout: 500 })
                    .then(() => true)
                    .catch(() => false);

                if (missionComplete) break;

                const continueButton = await screen.findByRole('button', { name: /continue/i });
                await user.click(continueButton);
            }

            // Should see mission complete again
            await waitFor(() => {
                expect(screen.getByText(/mission complete/i)).toBeInTheDocument();
            }, { timeout: 5000 });

            // Should NOT see the green 50% milestone again on mission 2
            // The key assertion: 50% Mastery should NOT appear on mission 2
            const hasFiftyPercentAgain = screen.queryByText(/50% Mastery/);
            expect(hasFiftyPercentAgain).toBeNull();
        }, 30000);

        it('should not repeat milestone after page reload', async () => {
            const user = userEvent.setup({ delay: null });

            // Pre-seed level 0 cards to set up a near-50% threshold state.
            const now = Date.now();
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

            // 12 mastered cards for level 0 (48%)
            const masteredCardIds = [
                'addition-0-0', 'addition-0-1', 'addition-0-2', 'addition-0-3',
                'addition-0-4', 'addition-0-5', 'addition-0-6', 'addition-0-7',
                'addition-0-8', 'addition-0-9', 'addition-0-10', 'addition-0-11',
            ];
            const masteredCards = masteredCardIds.map(id => {
                const parts = id.split('-');
                const op1 = Number(parts[1]);
                const op2 = Number(parts[2]);
                return {
                    problem: {
                        id,
                        operand1: op1,
                        operand2: op2,
                        operation: 'addition' as const,
                        correctAnswer: op1 + op2,
                    },
                    easeFactor: 2.5,
                    interval: 30,
                    repetitions: 5,
                    nextReview: now + THIRTY_DAYS_MS,
                    lastReviewed: now - 24 * 60 * 60 * 1000,
                    totalAttempts: 5,
                    correctAttempts: 5,
                    averageResponseTime: 2000,
                };
            });

            // 10 ready-to-master Level 0 cards
            const readyToMasterIds = [
                'addition-0-12', 'addition-1-0', 'addition-2-0', 'addition-3-0',
                'addition-4-0', 'addition-5-0', 'addition-6-0', 'addition-7-0',
                'addition-8-0', 'addition-9-0',
            ];
            const readyToMasterCards = readyToMasterIds.map(id => {
                const parts = id.split('-');
                const op1 = Number(parts[1]);
                const op2 = Number(parts[2]);
                return {
                    problem: {
                        id,
                        operand1: op1,
                        operand2: op2,
                        operation: 'addition' as const,
                        correctAnswer: op1 + op2,
                    },
                    easeFactor: 2.5,
                    interval: 6,
                    repetitions: 2,
                    nextReview: now - 1000,
                    lastReviewed: now - 7 * 24 * 60 * 60 * 1000,
                    totalAttempts: 2,
                    correctAttempts: 2,
                    averageResponseTime: 3000,
                };
            });

            await db.cards.bulkPut([...masteredCards, ...readyToMasterCards]);

            // FIRST SESSION
            const { unmount } = render(<Game />);

            // Accept and complete mission 1
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /help \w+!/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /help \w+!/i }));

            for (let i = 0; i < MISSION_LIMITS.maxAttempts; i++) {
                await waitFor(() => {
                    expect(screen.getByText(/= \?/)).toBeInTheDocument();
                }, { timeout: 3000 });

                const problemText = screen.getByText(/\d+\s*[+\-×÷]\s*\d+/).textContent || '';
                const match = problemText.match(/(\d+)\s*\+\s*(\d+)/);
                if (!match) throw new Error('Could not parse problem');

                const correctAnswer = parseInt(match[1]) + parseInt(match[2]);
                const input = screen.getByPlaceholderText('Your answer');
                await user.clear(input);
                await user.type(input, correctAnswer.toString());
                await user.click(screen.getByRole('button', { name: /submit/i }));

                const missionComplete = await screen.findByText(/mission complete/i, {}, { timeout: 500 })
                    .then(() => true)
                    .catch(() => false);

                if (missionComplete) break;

                const continueButton = await screen.findByRole('button', { name: /continue/i });
                await user.click(continueButton);
            }

            // Verify mission 1 shows 50% milestone
            await waitFor(() => {
                expect(screen.getByText(/mission complete/i)).toBeInTheDocument();
            });
            expect(screen.getByText(/50% Mastery/)).toBeInTheDocument();

            // Simulate page refresh by unmounting and remounting
            unmount();
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for cleanup

            // SECOND SESSION (simulating page reload)
            render(<Game />);

            // Accept and complete a new mission
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /help \w+!/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /help \w+!/i }));

            for (let i = 0; i < MISSION_LIMITS.maxAttempts; i++) {
                await waitFor(() => {
                    expect(screen.getByText(/= \?/)).toBeInTheDocument();
                }, { timeout: 3000 });

                const problemText = screen.getByText(/\d+\s*[+\-×÷]\s*\d+/).textContent || '';
                const match = problemText.match(/(\d+)\s*\+\s*(\d+)/);
                if (!match) throw new Error('Could not parse problem');

                const correctAnswer = parseInt(match[1]) + parseInt(match[2]);
                const input = screen.getByPlaceholderText('Your answer');
                await user.clear(input);
                await user.type(input, correctAnswer.toString());
                await user.click(screen.getByRole('button', { name: /submit/i }));

                const missionComplete = await screen.findByText(/mission complete/i, {}, { timeout: 500 })
                    .then(() => true)
                    .catch(() => false);

                if (missionComplete) break;

                const continueButton = await screen.findByRole('button', { name: /continue/i });
                await user.click(continueButton);
            }

            await waitFor(() => {
                expect(screen.getByText(/mission complete/i)).toBeInTheDocument();
            });

            // After page reload, 50% should NOT appear again
            const hasFiftyPercentAgain = screen.queryByText(/50% Mastery/);
            expect(hasFiftyPercentAgain).toBeNull();
        }, 30000);

        it('should capture correct pre-mission state when starting new mission', async () => {
            const user = userEvent.setup({ delay: null });

            // This test specifically checks that capturePreMissionState receives
            // the UPDATED cards after mission 1, not stale cards
            const now = Date.now();
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

            // 12 mastered cards for level 0 (48%)
            const masteredCardIds = [
                'addition-0-0', 'addition-0-1', 'addition-0-2', 'addition-0-3',
                'addition-0-4', 'addition-0-5', 'addition-0-6', 'addition-0-7',
                'addition-0-8', 'addition-0-9', 'addition-0-10', 'addition-0-11',
            ];
            const masteredCards = masteredCardIds.map(id => {
                const parts = id.split('-');
                const op1 = Number(parts[1]);
                const op2 = Number(parts[2]);
                return {
                    problem: {
                        id,
                        operand1: op1,
                        operand2: op2,
                        operation: 'addition' as const,
                        correctAnswer: op1 + op2,
                    },
                    easeFactor: 2.5,
                    interval: 30,
                    repetitions: 5,
                    nextReview: now + THIRTY_DAYS_MS,
                    lastReviewed: now - 24 * 60 * 60 * 1000,
                    totalAttempts: 5,
                    correctAttempts: 5,
                    averageResponseTime: 2000,
                };
            });

            const readyToMasterIds = [
                'addition-0-12', 'addition-1-0', 'addition-2-0', 'addition-3-0',
                'addition-4-0', 'addition-5-0', 'addition-6-0', 'addition-7-0',
                'addition-8-0', 'addition-9-0',
            ];
            const readyToMasterCards = readyToMasterIds.map(id => {
                const parts = id.split('-');
                const op1 = Number(parts[1]);
                const op2 = Number(parts[2]);
                return {
                    problem: {
                        id,
                        operand1: op1,
                        operand2: op2,
                        operation: 'addition' as const,
                        correctAnswer: op1 + op2,
                    },
                    easeFactor: 2.5,
                    interval: 6,
                    repetitions: 2,
                    nextReview: now - 1000,
                    lastReviewed: now - 7 * 24 * 60 * 60 * 1000,
                    totalAttempts: 2,
                    correctAttempts: 2,
                    averageResponseTime: 3000,
                };
            });

            await db.cards.bulkPut([...masteredCards, ...readyToMasterCards]);

            render(<Game />);

            // Complete mission 1
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /help \w+!/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /help \w+!/i }));

            for (let i = 0; i < MISSION_LIMITS.maxAttempts; i++) {
                await waitFor(() => {
                    expect(screen.getByText(/= \?/)).toBeInTheDocument();
                }, { timeout: 3000 });

                const problemText = screen.getByText(/\d+\s*[+\-×÷]\s*\d+/).textContent || '';
                const match = problemText.match(/(\d+)\s*\+\s*(\d+)/);
                if (!match) throw new Error('Could not parse problem');

                const correctAnswer = parseInt(match[1]) + parseInt(match[2]);
                const input = screen.getByPlaceholderText('Your answer');
                await user.clear(input);
                await user.type(input, correctAnswer.toString());
                await user.click(screen.getByRole('button', { name: /submit/i }));

                const missionComplete = await screen.findByText(/mission complete/i, {}, { timeout: 500 })
                    .then(() => true)
                    .catch(() => false);

                if (missionComplete) break;

                const continueButton = await screen.findByRole('button', { name: /continue/i });
                await user.click(continueButton);
            }

            await waitFor(() => {
                expect(screen.getByText(/mission complete/i)).toBeInTheDocument();
            });
            expect(screen.getByText(/50% Mastery/)).toBeInTheDocument();

            // KEY CHECK: After mission 1 shows 50%, clicking "Help Another Animal"
            // should capture the UPDATED mastery (>50%), not 48%
            //
            // If there's a stale closure bug, capturePreMissionState would receive
            // cards with 48% mastery (from before mission 1), causing 50% to trigger again.

            await user.click(screen.getByRole('button', { name: /help another animal/i }));

            // The console log from capturePreMissionState should show >50%
            // If it shows 48%, we have a stale closure bug

            // Accept mission 2
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /help \w+!/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /help \w+!/i }));

            // Complete mission 2
            for (let i = 0; i < MISSION_LIMITS.maxAttempts; i++) {
                await waitFor(() => {
                    expect(screen.getByText(/= \?/)).toBeInTheDocument();
                }, { timeout: 3000 });

                const problemText = screen.getByText(/\d+\s*[+\-×÷]\s*\d+/).textContent || '';
                const match = problemText.match(/(\d+)\s*\+\s*(\d+)/);
                if (!match) throw new Error('Could not parse problem');

                const correctAnswer = parseInt(match[1]) + parseInt(match[2]);
                const input = screen.getByPlaceholderText('Your answer');
                await user.clear(input);
                await user.type(input, correctAnswer.toString());
                await user.click(screen.getByRole('button', { name: /submit/i }));

                const missionComplete = await screen.findByText(/mission complete/i, {}, { timeout: 500 })
                    .then(() => true)
                    .catch(() => false);

                if (missionComplete) break;

                const continueButton = await screen.findByRole('button', { name: /continue/i });
                await user.click(continueButton);
            }

            await waitFor(() => {
                expect(screen.getByText(/mission complete/i)).toBeInTheDocument();
            });

            // If capturePreMissionState received correct (updated) cards,
            // this will NOT show 50% again
            const hasFiftyPercent = screen.queryByText(/50% Mastery/);
            expect(hasFiftyPercent).toBeNull();
        }, 30000);

        it('should not repeat milestone when starting from All Caught Up screen', async () => {
            const user = userEvent.setup({ delay: null });

            // This test reproduces the bug: starting from "All Caught Up" doesn't
            // call capturePreMissionState, so stale pre-mission mastery is used.
            //
            // Setup: All cards are already caught up (no due cards), mastery at 100%.
            // When user clicks "Bonus Practice" from All Caught Up screen,
            // handleBonusPractice is called but it DOESN'T call capturePreMissionState.
            // The preMissionMastery ref still has 0% (initial empty map state).
            // After completing bonus mission, getMilestonesAchieved compares 0% vs 100%,
            // which triggers ALL milestones even though we've already passed them all.

            const now = Date.now();
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

            // Generate ALL possible cards for addition with maxNumber=12
            // and make them all caught up (nextReview in future)
            // This guarantees we see the "All Caught Up" screen immediately
            const allCards: { id: string; op1: number; op2: number }[] = [];
            for (let op1 = 0; op1 <= 12; op1++) {
                for (let op2 = 0; op2 <= 12; op2++) {
                    allCards.push({ id: `addition-${op1}-${op2}`, op1, op2 });
                }
            }

            const caughtUpCards = allCards.map(({ id, op1, op2 }) => ({
                problem: {
                    id,
                    operand1: op1,
                    operand2: op2,
                    operation: 'addition' as const,
                    correctAnswer: op1 + op2,
                },
                easeFactor: 2.5,
                interval: 30,
                repetitions: 5,
                nextReview: now + THIRTY_DAYS_MS, // Not due = all caught up
                lastReviewed: now - 24 * 60 * 60 * 1000,
                totalAttempts: 5,
                correctAttempts: 5,
                averageResponseTime: 2000,
            }));

            await db.cards.bulkPut(caughtUpCards);

            render(<Game />);

            // Should immediately see "All Caught Up" screen
            await waitFor(() => {
                expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
            });

            // Click bonus practice button
            const bonusButton = screen.getByRole('button', { name: /practice/i });
            await user.click(bonusButton);

            // Accept the bonus mission
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /help \w+!/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /help \w+!/i }));

            // Complete the bonus mission
            for (let i = 0; i < MISSION_LIMITS.maxAttempts; i++) {
                await waitFor(() => {
                    expect(screen.getByText(/= \?/)).toBeInTheDocument();
                }, { timeout: 3000 });

                const problemText = screen.getByText(/\d+\s*[+\-×÷]\s*\d+/).textContent || '';
                const match = problemText.match(/(\d+)\s*\+\s*(\d+)/);
                if (!match) throw new Error('Could not parse problem');

                const correctAnswer = parseInt(match[1]) + parseInt(match[2]);
                const input = screen.getByPlaceholderText('Your answer');
                await user.clear(input);
                await user.type(input, correctAnswer.toString());
                await user.click(screen.getByRole('button', { name: /submit/i }));

                const missionComplete = await screen.findByText(/mission complete/i, {}, { timeout: 500 })
                    .then(() => true)
                    .catch(() => false);

                if (missionComplete) break;

                const continueButton = await screen.findByRole('button', { name: /continue/i });
                await user.click(continueButton);
            }

            await waitFor(() => {
                expect(screen.getByText(/mission complete/i)).toBeInTheDocument();
            });

            // BUG: We're at 100% mastery for level 0, so no milestone should appear.
            // But due to missing capturePreMissionState in handleBonusPractice,
            // the preMissionMastery is empty/stale (0%), compared against 100%,
            // which triggers EVERY milestone: 25%, 50%, 75%, 100%!
            //
            // Check that NO milestones appear (we're already at 100%)
            const milestoneContainer = document.querySelector('.milestone-celebration');
            expect(milestoneContainer).toBeNull();
        });
    });

    describe('Progress Page Synchronization', () => {
        it('should show updated mastery on ProgressPage after answering questions', async () => {
            const user = userEvent.setup({ delay: null });

            // Pre-seed some already-mastered cards and some ready-to-master cards.
            // This tests that after answering a question, progressCards is updated to reflect
            // the new mastery state (regression test for stale progressCards bug).
            const now = Date.now();
            const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

            // 6 already-mastered cards for level 0 (nextReview far in future = mastered)
            const alreadyMasteredIds = [
                'addition-0-0', 'addition-0-1', 'addition-0-2',
                'addition-0-3', 'addition-0-4', 'addition-0-5',
            ];
            const alreadyMasteredCards = alreadyMasteredIds.map(id => {
                const parts = id.split('-');
                const op1 = Number(parts[1]);
                const op2 = Number(parts[2]);
                return {
                    problem: {
                        id,
                        operand1: op1,
                        operand2: op2,
                        operation: 'addition' as const,
                        correctAnswer: op1 + op2,
                    },
                    easeFactor: 2.6,
                    interval: 30,
                    repetitions: 5,
                    nextReview: now + THIRTY_DAYS_MS, // Far in future = mastered
                    lastReviewed: now - 24 * 60 * 60 * 1000,
                    totalAttempts: 5,
                    correctAttempts: 5,
                    averageResponseTime: 2000,
                };
            });

            // 7 ready-to-master cards - after fast correct they become mastered
            // (rep=2, interval=6 -> rep=3, interval=~16 days which is >14 days)
            const readyToMasterIds = [
                'addition-0-6', 'addition-0-7', 'addition-0-8',
                'addition-0-9', 'addition-0-10', 'addition-0-11',
                'addition-0-12',
            ];
            const readyToMasterCards = readyToMasterIds.map(id => {
                const parts = id.split('-');
                const op1 = Number(parts[1]);
                const op2 = Number(parts[2]);
                return {
                    problem: {
                        id,
                        operand1: op1,
                        operand2: op2,
                        operation: 'addition' as const,
                        correctAnswer: op1 + op2,
                    },
                    easeFactor: 2.5,
                    interval: 6,
                    repetitions: 2,
                    nextReview: now - 1000, // Overdue = will be selected for session
                    lastReviewed: now - 7 * 24 * 60 * 60 * 1000,
                    totalAttempts: 2,
                    correctAttempts: 2,
                    averageResponseTime: 3000,
                };
            });

            await db.cards.bulkPut([...alreadyMasteredCards, ...readyToMasterCards]);

            render(<Game />);

            // First, verify the progress page shows the initial 6 mastered cards
            // Open Progress page before answering any questions
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /📊|progress/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /📊|progress/i }));

            await waitFor(() => {
                expect(screen.getByText(/your progress/i)).toBeInTheDocument();
            });

            // Initially should show 6/25 mastered (24%)
            await waitFor(() => {
                expect(screen.getByText(/6\/25 facts/)).toBeInTheDocument();
            });

            // Close progress page
            await user.click(screen.getByRole('button', { name: /back to practice/i }));

            // Accept mission
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /help \w+!/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /help \w+!/i }));

            // Wait for first problem
            await waitFor(() => {
                expect(screen.getByText(/= \?/)).toBeInTheDocument();
            });

            // Answer the question correctly (fast) - this should master a 7th card
            const problemText = screen.getByText(/\d+\s*[+\-×÷]\s*\d+/).textContent || '';
            const match = problemText.match(/(\d+)\s*\+\s*(\d+)/);
            if (!match) throw new Error('Could not parse problem');

            const correctAnswer = parseInt(match[1]) + parseInt(match[2]);
            const input = screen.getByPlaceholderText('Your answer');
            await user.clear(input);
            await user.type(input, correctAnswer.toString());
            await user.click(screen.getByRole('button', { name: /submit/i }));

            // Wait for feedback
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
            });

            // Open Progress page again (📊 button)
            await user.click(screen.getByRole('button', { name: /📊|progress/i }));

            await waitFor(() => {
                expect(screen.getByText(/your progress/i)).toBeInTheDocument();
            });

            // After answering, should show MORE than 6 mastered cards
            // The bug was that progressCards wasn't updated, so it still showed 6/25
            // After the fix, it should show 7/25 or more (depending on which card was answered)
            await waitFor(() => {
                const factsText = screen.getByText(/\/25 facts/).textContent || '';
                const masteredMatch = factsText.match(/(\d+)\/25 facts/);
                expect(masteredMatch).not.toBeNull();
                const masteredCount = parseInt(masteredMatch![1]);
                expect(masteredCount).toBeGreaterThan(6);
            });
        });
    });

    describe('All Caught Up Screen', () => {
        it('should show "All Caught Up" when no cards are due', async () => {
            const user = userEvent.setup({ delay: null });
            render(<Game />);

            // Open settings
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /⚙️|settings/i })).toBeInTheDocument();
            });
            await user.click(screen.getByRole('button', { name: /⚙️|settings/i }));

            // Wait for settings screen
            await waitFor(() => {
                expect(screen.getByText(/settings/i)).toBeInTheDocument();
            });

            // Clear all numbers and enable only 0
            await user.click(screen.getByRole('button', { name: /^clear all$/i }));

            // Set max number to 0 so range is only [0-0]
            const maxNumberSelect = document.querySelector('.max-number-select') as HTMLSelectElement;
            await user.selectOptions(maxNumberSelect, '0');

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
