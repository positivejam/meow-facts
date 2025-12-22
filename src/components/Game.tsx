import { useState, useEffect } from 'react';
import type { MathFactCard, GameSettings, ProblemAttempt } from '../types/game';
import { generateAllFacts } from '../utils/cardGenerator';
import { selectCards, updateCard } from '../utils/spacedRepetition';
import { saveProgress, loadProgress } from '../utils/storage';
import { getFeedbackMessage, determineFeedbackType, type FeedbackType } from '../utils/feedback';
import { ProblemDisplay } from './ProblemDisplay';
import { AnswerInput } from './AnswerInput';
import { Feedback } from './Feedback';
import { StatsDisplay } from './StatsDisplay';

const DEFAULT_SETTINGS: GameSettings = {
    operation: 'addition',
    maxNumber: 12,
    cardsPerSession: 10,
};

export function Game() {
    const [allCards, setAllCards] = useState<MathFactCard[]>([]);
    const [sessionCards, setSessionCards] = useState<MathFactCard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [attempts, setAttempts] = useState<ProblemAttempt[]>([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackType, setFeedbackType] = useState<FeedbackType>('correct-fast');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [problemStartTime, setProblemStartTime] = useState(Date.now());
    const [sessionComplete, setSessionComplete] = useState(false);

    // Initialize cards on mount
    useEffect(() => {
        const stored = loadProgress();

        if (stored && stored.cards.length > 0) {
            // Load existing progress
            setAllCards(stored.cards);
            const selected = selectCards(stored.cards, DEFAULT_SETTINGS.cardsPerSession);
            setSessionCards(selected);
        } else {
            // Generate new card deck
            const newCards = generateAllFacts(DEFAULT_SETTINGS.operation, DEFAULT_SETTINGS.maxNumber);
            setAllCards(newCards);
            const selected = selectCards(newCards, DEFAULT_SETTINGS.cardsPerSession);
            setSessionCards(selected);
        }

        setProblemStartTime(Date.now());
    }, []);

    const handleAnswer = (userAnswer: number) => {
        if (currentCardIndex >= sessionCards.length) return;

        const currentCard = sessionCards[currentCardIndex];
        const responseTime = Date.now() - problemStartTime;
        const isCorrect = userAnswer === currentCard.problem.correctAnswer;

        // Determine feedback type and get message
        const fbType = determineFeedbackType(isCorrect, responseTime);
        setFeedbackType(fbType);
        setFeedbackMessage(
            getFeedbackMessage(fbType, currentCard.problem.correctAnswer)
        );

        // Record the attempt
        const attempt: ProblemAttempt = {
            card: currentCard,
            userAnswer,
            isCorrect,
            responseTime,
            timestamp: Date.now(),
        };
        setAttempts([...attempts, attempt]);

        // Update the card with spaced repetition
        const updatedCard = updateCard(currentCard, isCorrect, responseTime);

        // Update all cards
        const updatedAllCards = allCards.map(card =>
            card.problem.id === updatedCard.problem.id ? updatedCard : card
        );
        setAllCards(updatedAllCards);

        // Update session cards
        const updatedSessionCards = [...sessionCards];
        updatedSessionCards[currentCardIndex] = updatedCard;
        setSessionCards(updatedSessionCards);

        // Save progress
        saveProgress(updatedAllCards, []);

        // Show feedback
        setShowFeedback(true);
    };

    const handleContinue = () => {
        setShowFeedback(false);

        if (currentCardIndex + 1 >= sessionCards.length) {
            // Session complete
            setSessionComplete(true);
        } else {
            // Move to next card
            setCurrentCardIndex(currentCardIndex + 1);
            setProblemStartTime(Date.now());
        }
    };

    const handleNewSession = () => {
        const selected = selectCards(allCards, DEFAULT_SETTINGS.cardsPerSession);
        setSessionCards(selected);
        setCurrentCardIndex(0);
        setAttempts([]);
        setSessionComplete(false);
        setProblemStartTime(Date.now());
    };

    if (allCards.length === 0) {
        return <div className="loading">Loading...</div>;
    }

    if (sessionComplete) {
        return (
            <div className="session-complete">
                <h2>Great job!</h2>
                <StatsDisplay attempts={attempts} />
                <button onClick={handleNewSession} className="new-session-button">
                    Practice More
                </button>
            </div>
        );
    }

    const currentCard = sessionCards[currentCardIndex];

    if (!currentCard) {
        return <div className="loading">Loading problem...</div>;
    }

    return (
        <div className="game">
            <h1>Meow Facts</h1>

            {!showFeedback ? (
                <>
                    <ProblemDisplay
                        problem={currentCard.problem}
                        problemNumber={currentCardIndex + 1}
                        totalProblems={sessionCards.length}
                    />
                    <AnswerInput onSubmit={handleAnswer} />
                </>
            ) : (
                <Feedback
                    feedbackType={feedbackType}
                    message={feedbackMessage}
                    onContinue={handleContinue}
                />
            )}
        </div>
    );
}
