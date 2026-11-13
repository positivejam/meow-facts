import { describe, it, expect } from 'vitest';
import type { MathFactCard, RescueMission, SparklesData } from '../types/game';
import { processAnswer } from './answerProcessor';
import { MISSION_LIMITS } from '../constants';

function createTestCard(operand1: number, operand2: number): MathFactCard {
    return {
        problem: {
            id: `addition-${operand1}-${operand2}`,
            operand1,
            operand2,
            operation: 'addition',
            correctAnswer: operand1 + operand2,
        },
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: 0,
        totalAttempts: 0,
        correctAttempts: 0,
        averageResponseTime: 0,
    };
}

function createTestMission(overrides: Partial<RescueMission> = {}): RescueMission {
    return {
        id: 'mission-1',
        animalType: 'kitten',
        animalName: 'Whiskers',
        animalPronoun: 'she',
        animalProblem: 'cold',
        location: 'living-room',
        progress: 0,
        correctAnswers: 0,
        fastCorrectAnswers: 0,
        totalAttempts: 0,
        problemsInMission: [],
        startTime: 1000,
        ...overrides,
    };
}

const BASE_SPARKLES: SparklesData = { total: 5, earnedThisSession: 2 };
const TARGET_TIME = 5000;

describe('processAnswer', () => {
    describe('incorrect answer', () => {
        it('does not increment progress or sparkles', () => {
            const card = createTestCard(3, 5); // correctAnswer = 8
            const mission = createTestMission();

            const result = processAnswer(card, 99, mission, TARGET_TIME, BASE_SPARKLES, 1000, 3000);

            expect(result.updatedMission.progress).toBe(0);
            expect(result.updatedMission.correctAnswers).toBe(0);
            expect(result.updatedMission.fastCorrectAnswers).toBe(0);
            expect(result.updatedMission.totalAttempts).toBe(1);
            expect(result.newSparkles).toBeNull();
            expect(result.recentlyEarnedSparkles).toBe(0);
        });

        it('returns incorrect feedback and dialogue type', () => {
            const card = createTestCard(3, 5);
            const mission = createTestMission();

            const result = processAnswer(card, 99, mission, TARGET_TIME, BASE_SPARKLES, 1000, 3000);

            expect(result.feedbackType).toBe('incorrect');
            expect(result.dialogueType).toBe('incorrect');
        });

        it('records the attempt correctly', () => {
            const card = createTestCard(3, 5);
            const mission = createTestMission();

            const result = processAnswer(card, 99, mission, TARGET_TIME, BASE_SPARKLES, 1000, 4000);

            expect(result.attempt.isCorrect).toBe(false);
            expect(result.attempt.userAnswer).toBe(99);
            expect(result.attempt.responseTime).toBe(3000);
            expect(result.attempt.timestamp).toBe(4000);
        });
    });

    describe('slow correct answer (response time >= targetTime)', () => {
        it('increments progress by 1 and does not award sparkles', () => {
            const card = createTestCard(3, 5);
            const mission = createTestMission();

            // Response time = 6000ms, targetTime = 5000ms
            const result = processAnswer(card, 8, mission, TARGET_TIME, BASE_SPARKLES, 1000, 7000);

            expect(result.updatedMission.progress).toBe(1);
            expect(result.updatedMission.correctAnswers).toBe(1);
            expect(result.updatedMission.fastCorrectAnswers).toBe(0);
            expect(result.newSparkles).toBeNull();
            expect(result.recentlyEarnedSparkles).toBe(0);
        });

        it('returns slow-correct feedback and dialogue type', () => {
            const card = createTestCard(3, 5);
            const mission = createTestMission();

            const result = processAnswer(card, 8, mission, TARGET_TIME, BASE_SPARKLES, 1000, 7000);

            expect(result.feedbackType).toBe('correct-slow');
            expect(result.dialogueType).toBe('slow-correct');
        });
    });

    describe('fast correct answer (response time < targetTime)', () => {
        it('increments progress by 2 and awards sparkles', () => {
            const card = createTestCard(3, 5);
            const mission = createTestMission();

            // Response time = 2000ms, targetTime = 5000ms
            const result = processAnswer(card, 8, mission, TARGET_TIME, BASE_SPARKLES, 1000, 3000);

            expect(result.updatedMission.progress).toBe(2);
            expect(result.updatedMission.correctAnswers).toBe(1);
            expect(result.updatedMission.fastCorrectAnswers).toBe(1);
            expect(result.newSparkles).toEqual({ total: 6, earnedThisSession: 3 });
            expect(result.recentlyEarnedSparkles).toBe(1);
        });

        it('returns fast-correct feedback and dialogue type', () => {
            const card = createTestCard(3, 5);
            const mission = createTestMission();

            const result = processAnswer(card, 8, mission, TARGET_TIME, BASE_SPARKLES, 1000, 3000);

            expect(result.feedbackType).toBe('correct-fast');
            expect(result.dialogueType).toBe('fast-correct');
        });
    });

    describe('mission completion', () => {
        it('sets justCompleted when progress reaches progressTarget', () => {
            const card = createTestCard(3, 5);
            const mission = createTestMission({ progress: MISSION_LIMITS.progressTarget - 1 });

            // Slow correct = +1, bringing progress to progressTarget
            const result = processAnswer(card, 8, mission, TARGET_TIME, BASE_SPARKLES, 1000, 7000);

            expect(result.updatedMission.progress).toBe(MISSION_LIMITS.progressTarget);
            expect(result.justCompleted).toBe(true);
            expect(result.updatedMission.completedAt).toBe(7000);
        });

        it('caps progress at progressTarget', () => {
            const card = createTestCard(3, 5);
            const mission = createTestMission({ progress: MISSION_LIMITS.progressTarget - 1 });

            // Fast correct = +2, but progress should cap at progressTarget
            const result = processAnswer(card, 8, mission, TARGET_TIME, BASE_SPARKLES, 1000, 3000);

            expect(result.updatedMission.progress).toBe(MISSION_LIMITS.progressTarget);
        });

        it('does not set justCompleted if mission was already completed', () => {
            const card = createTestCard(3, 5);
            const mission = createTestMission({ progress: MISSION_LIMITS.progressTarget, completedAt: 5000 });

            const result = processAnswer(card, 8, mission, TARGET_TIME, BASE_SPARKLES, 1000, 3000);

            expect(result.justCompleted).toBe(false);
        });
    });

    describe('card update', () => {
        it('returns an updated card with spaced repetition data', () => {
            const card = createTestCard(3, 5);
            const mission = createTestMission();

            const result = processAnswer(card, 8, mission, TARGET_TIME, BASE_SPARKLES, 1000, 3000);

            // The card should have updated totalAttempts
            expect(result.updatedCard.totalAttempts).toBe(1);
            expect(result.updatedCard.correctAttempts).toBe(1);
        });

        it('lengthens the interval on the first answer of a fact in the mission', () => {
            const card = createTestCard(3, 5);
            const mission = createTestMission({ problemsInMission: ['addition-1-2'] });

            const result = processAnswer(card, 8, mission, TARGET_TIME, BASE_SPARKLES, 1000, 2000);

            expect(result.updatedCard.repetitions).toBe(1);
            expect(result.updatedCard.interval).toBe(1);
        });

        it('does not lengthen the interval when the fact was already answered this mission', () => {
            const card = { ...createTestCard(3, 5), repetitions: 1, interval: 1, totalAttempts: 1, correctAttempts: 1 };
            const mission = createTestMission({ problemsInMission: ['addition-3-5'], progress: 2 });

            const result = processAnswer(card, 8, mission, TARGET_TIME, BASE_SPARKLES, 1000, 2000);

            expect(result.updatedCard.repetitions).toBe(1);
            expect(result.updatedCard.interval).toBe(1);
            expect(result.updatedCard.totalAttempts).toBe(2);
            // The repeat still helps the rescue
            expect(result.updatedMission.progress).toBe(4);
            expect(result.recentlyEarnedSparkles).toBe(1);
        });
    });

    describe('mission state tracking', () => {
        it('appends the problem ID to problemsInMission', () => {
            const card = createTestCard(3, 5);
            const mission = createTestMission({ problemsInMission: ['addition-1-2'] });

            const result = processAnswer(card, 8, mission, TARGET_TIME, BASE_SPARKLES, 1000, 3000);

            expect(result.updatedMission.problemsInMission).toEqual([
                'addition-1-2',
                'addition-3-5',
            ]);
        });

        it('increments totalAttempts', () => {
            const card = createTestCard(3, 5);
            const mission = createTestMission({ totalAttempts: 7 });

            const result = processAnswer(card, 99, mission, TARGET_TIME, BASE_SPARKLES, 1000, 3000);

            expect(result.updatedMission.totalAttempts).toBe(8);
        });
    });
});
