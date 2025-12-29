import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Game } from './Game';
import { db } from '../utils/db';

// Helper to clear the database before each test
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
            // The mission completes at progress 10 (5 fast correct or 10 correct total)
            for (let i = 0; i < 12; i++) {
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

        it('should display fact count of 169 when all numbers are checked and max number is set to 12', async () => {
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
            await user.click(screen.getByRole('button', { name: /clear all/i }));

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
            await user.click(screen.getByRole('button', { name: /clear all/i }));

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
            // Answer until mission completes (5 fast correct or 10 correct total)
            for (let i = 0; i < 5; i++) {
                // Wait for problem
                await waitFor(() => {
                    expect(screen.getByText(/= \?/)).toBeInTheDocument();
                });

                // Answer is always 0 for 0+0
                const input = screen.getByPlaceholderText('Your answer');
                await user.clear(input);
                await user.type(input, '0');
                await user.click(screen.getByRole('button', { name: /submit/i }));

                // Check if mission is complete
                const missionComplete = await screen.findByText(/all caught up/i, {}, { timeout: 500 })
                    .then(() => true)
                    .catch(() => false);

                if (missionComplete) {
                    break;
                }

                // Click continue
                const continueButton = await screen.findByRole('button', { name: /continue/i });
                await user.click(continueButton);
            }

            // Should see all caught up
            await waitFor(() => {
                expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
            });

            // Should see bonus practice button
            expect(screen.getByRole('button', { name: /practice/i })).toBeInTheDocument();

            // Should see ready for new challenges button (goes to settings)
            expect(screen.getByRole('button', { name: /challenges/i })).toBeInTheDocument();
        });
    });
});
