import type { MathFactCard, RescueMission, SparklesData, SunshineDialogueType, ProblemAttempt } from '../types/game';
import type { FeedbackType } from './feedback';
import { determineFeedbackType } from './feedback';
import { updateCard } from './spacedRepetition';
import { isMissionSuccessful } from './rescue';
import { awardSparkles, SPARKLES_PER_FAST_CORRECT } from './sparkles';
import { getSunshineDialogue } from './sunshine';
import { MISSION_LIMITS } from '../constants';

export interface AnswerResult {
    updatedMission: RescueMission;
    updatedCard: MathFactCard;
    feedbackType: FeedbackType;
    dialogueType: SunshineDialogueType;
    dialogue: string;
    newSparkles: SparklesData | null;
    recentlyEarnedSparkles: number;
    attempt: ProblemAttempt;
    justCompleted: boolean;
}

/**
 * Pure function that computes all results of answering a math problem.
 * Does not perform any state updates or persistence — the caller is
 * responsible for applying the returned values.
 */
export function processAnswer(
    currentCard: MathFactCard,
    userAnswer: number,
    currentMission: RescueMission,
    targetTime: number,
    sparkles: SparklesData,
    problemStartTime: number,
    responseTimestamp: number,
): AnswerResult {
    const responseTime = responseTimestamp - problemStartTime;
    const isCorrect = userAnswer === currentCard.problem.correctAnswer;
    const feedbackType = determineFeedbackType(isCorrect, responseTime, targetTime);
    const isFastCorrect = isCorrect && responseTime < targetTime;

    // Progress: +2 for fast+correct, +1 for slow+correct, +0 for incorrect
    const progressIncrement = isFastCorrect ? 2 : (isCorrect ? 1 : 0);

    const updatedMission: RescueMission = {
        ...currentMission,
        progress: Math.min(MISSION_LIMITS.progressTarget, currentMission.progress + progressIncrement),
        correctAnswers: currentMission.correctAnswers + (isCorrect ? 1 : 0),
        fastCorrectAnswers: currentMission.fastCorrectAnswers + (isFastCorrect ? 1 : 0),
        totalAttempts: currentMission.totalAttempts + 1,
        problemsInMission: [...currentMission.problemsInMission, currentCard.problem.id],
    };

    const justCompleted = isMissionSuccessful(updatedMission.progress) && !currentMission.completedAt;
    if (justCompleted) {
        updatedMission.completedAt = responseTimestamp;
    }

    const updatedCard = updateCard(currentCard, isCorrect, responseTime, targetTime);

    const newSparkles = isFastCorrect ? awardSparkles(sparkles, SPARKLES_PER_FAST_CORRECT) : null;

    let dialogueType: SunshineDialogueType;
    if (!isCorrect) {
        dialogueType = 'incorrect';
    } else if (isFastCorrect) {
        dialogueType = 'fast-correct';
    } else {
        dialogueType = 'slow-correct';
    }

    const attempt: ProblemAttempt = {
        card: currentCard,
        userAnswer,
        isCorrect,
        responseTime,
        timestamp: responseTimestamp,
    };

    return {
        updatedMission,
        updatedCard,
        feedbackType,
        dialogueType,
        dialogue: getSunshineDialogue(dialogueType, currentCard.problem),
        newSparkles,
        recentlyEarnedSparkles: isFastCorrect ? SPARKLES_PER_FAST_CORRECT : 0,
        attempt,
        justCompleted,
    };
}
