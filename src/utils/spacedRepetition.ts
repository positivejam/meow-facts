import type { MathFactCard } from '../types/game';

/**
 * Update a card's spaced repetition data based on the attempt
 * Based on the SM-2 algorithm with modifications for response time
 */
export function updateCard(
    card: MathFactCard,
    isCorrect: boolean,
    responseTime: number,
    targetTime: number = 5000
): MathFactCard {
    const now = Date.now();
    const newTotalAttempts = card.totalAttempts + 1;
    const newCorrectAttempts = card.correctAttempts + (isCorrect ? 1 : 0);

    // Update average response time
    const newAverageResponseTime =
        (card.averageResponseTime * card.totalAttempts + responseTime) / newTotalAttempts;

    // Quality of response (0-5 scale)
    // Consider both correctness and speed
    let quality: number;
    if (!isCorrect) {
        quality = 0;
    } else {
        // Fast correct answer = higher quality
        // Slow correct answer = lower quality
        if (responseTime < targetTime) {
            quality = 5; // Perfect
        } else if (responseTime < targetTime * 1.5) {
            quality = 4; // Good
        } else if (responseTime < targetTime * 2) {
            quality = 3; // Okay
        } else {
            quality = 2; // Slow but correct
        }
    }

    let newEaseFactor = card.easeFactor;
    let newInterval = card.interval;
    let newRepetitions = card.repetitions;

    if (quality >= 3) {
        // Correct answer
        newRepetitions += 1;

        // Update ease factor (SM-2 formula)
        newEaseFactor = Math.max(
            1.3,
            card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        );

        // Calculate new interval
        if (newRepetitions === 1) {
            newInterval = 1; // 1 day
        } else if (newRepetitions === 2) {
            newInterval = 6; // 6 days
        } else {
            newInterval = Math.round(card.interval * newEaseFactor);
        }
    } else {
        // Incorrect or very slow answer
        newRepetitions = 0;
        newInterval = 0; // Show again soon
        // Reduce ease factor slightly
        newEaseFactor = Math.max(1.3, card.easeFactor - 0.2);
    }

    // Convert interval from days to milliseconds and calculate next review time
    const intervalMs = newInterval * 24 * 60 * 60 * 1000;
    const nextReview = now + intervalMs;

    return {
        ...card,
        easeFactor: newEaseFactor,
        interval: newInterval,
        repetitions: newRepetitions,
        nextReview,
        lastReviewed: now,
        totalAttempts: newTotalAttempts,
        correctAttempts: newCorrectAttempts,
        averageResponseTime: newAverageResponseTime,
    };
}

/**
 * Select cards for the current session
 * Prioritizes cards that are due for review, with focus on struggling cards
 */
export function selectCards(
    allCards: MathFactCard[],
    cardsPerSession: number
): MathFactCard[] {
    const now = Date.now();

    // Separate cards into categories
    const dueCards = allCards.filter(card => card.nextReview <= now);
    const newCards = dueCards.filter(card => card.totalAttempts === 0);
    const reviewCards = dueCards.filter(card => card.totalAttempts > 0);

    // Sort review cards by priority (lower ease factor = higher priority)
    reviewCards.sort((a, b) => {
        // First priority: cards that are overdue
        const aOverdue = now - a.nextReview;
        const bOverdue = now - b.nextReview;

        if (aOverdue > 0 && bOverdue > 0) {
            // Both overdue: prioritize by ease factor (struggling cards first)
            if (Math.abs(a.easeFactor - b.easeFactor) > 0.1) {
                return a.easeFactor - b.easeFactor;
            }
            // If ease factors similar, prioritize more overdue
            return bOverdue - aOverdue;
        }

        // One is overdue, one isn't
        if (aOverdue > 0) return -1;
        if (bOverdue > 0) return 1;

        // Neither overdue
        return a.easeFactor - b.easeFactor;
    });

    // Build session: prioritize review cards, then add new cards
    const selected: MathFactCard[] = [];

    // Add review cards (struggling facts first)
    const reviewCount = Math.min(reviewCards.length, Math.floor(cardsPerSession * 0.7));
    selected.push(...reviewCards.slice(0, reviewCount));

    // Fill remaining slots with new cards
    const remainingSlots = cardsPerSession - selected.length;
    if (remainingSlots > 0 && newCards.length > 0) {
        // Shuffle new cards to avoid always starting with 0+0
        const shuffledNew = [...newCards].sort(() => Math.random() - 0.5);
        selected.push(...shuffledNew.slice(0, remainingSlots));
    }

    // If still need more cards and have more review cards, add them
    const stillRemaining = cardsPerSession - selected.length;
    if (stillRemaining > 0 && reviewCards.length > reviewCount) {
        selected.push(...reviewCards.slice(reviewCount, reviewCount + stillRemaining));
    }

    // Shuffle the selected cards so they're not always in the same order
    return selected.sort(() => Math.random() - 0.5);
}

/**
 * Select cards for bonus practice when no cards are due
 * Prioritizes cards closest to being due, mixed with least-recently-practiced
 */
export function selectBonusCards(
    allCards: MathFactCard[],
    cardsPerSession: number
): MathFactCard[] {
    const now = Date.now();

    // Get cards that aren't due yet, sorted by how close they are to being due
    const notDueCards = allCards
        .filter(card => card.nextReview > now)
        .sort((a, b) => a.nextReview - b.nextReview); // Soonest first

    // Get least-recently-practiced cards (cards that have been practiced)
    const practicedCards = [...allCards]
        .filter(card => card.lastReviewed && card.lastReviewed > 0)
        .sort((a, b) => (a.lastReviewed || 0) - (b.lastReviewed || 0)); // Oldest first

    // Combine: mostly soonest-due, some least-recent
    const selected: MathFactCard[] = [];
    const soonestCount = Math.floor(cardsPerSession * 0.7);

    // Add soonest-due cards
    selected.push(...notDueCards.slice(0, soonestCount));

    // Fill remaining with least-recent cards that aren't already selected
    if (selected.length < cardsPerSession && practicedCards.length > 0) {
        const remaining = practicedCards
            .filter(card => !selected.includes(card))
            .slice(0, cardsPerSession - selected.length);
        selected.push(...remaining);
    }

    // If still need more, just take any cards
    if (selected.length < cardsPerSession) {
        const remaining = allCards
            .filter(card => !selected.includes(card))
            .slice(0, cardsPerSession - selected.length);
        selected.push(...remaining);
    }

    // Shuffle so they're not always in the same order
    return selected.sort(() => Math.random() - 0.5);
}

/**
 * Get the timestamp of when the next card will be due
 * Returns null if no cards or all cards are currently due
 */
export function getNextDueTime(allCards: MathFactCard[]): number | null {
    const now = Date.now();
    const futureCards = allCards.filter(card => card.nextReview > now);

    if (futureCards.length === 0) return null;

    return Math.min(...futureCards.map(card => card.nextReview));
}

