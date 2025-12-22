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
import { Settings } from './Settings';

const DEFAULT_SETTINGS: GameSettings = {
    operation: 'addition',
    maxNumber: 12,
    cardsPerSession: 10,
    enabledNumbers: Array.from({ length: 13 }, (_, i) => i), // All numbers 0-12
    targetTime: 5000, // 5 seconds
};

const SETTINGS_STORAGE_KEY = 'meow-facts-settings';

export function Game() {
    const [settings, setSettings] = useState<GameSettings>(() => {
        // Load settings from localStorage
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    });
    const [allCards, setAllCards] = useState<MathFactCard[]>([]);
    const [sessionCards, setSessionCards] = useState<MathFactCard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [attempts, setAttempts] = useState<ProblemAttempt[]>([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackType, setFeedbackType] = useState<FeedbackType>('correct-fast');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [problemStartTime, setProblemStartTime] = useState(Date.now());
    const [sessionComplete, setSessionComplete] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Initialize cards when settings change
    useEffect(() => {
        const stored = loadProgress();

        if (stored && stored.cards.length > 0) {
            // Filter existing cards based on enabled numbers
            // Include cards where AT LEAST ONE operand is in the enabled set
            const filtered = stored.cards.filter(card =>
                settings.enabledNumbers.includes(card.problem.operand1) ||
                settings.enabledNumbers.includes(card.problem.operand2)
            );

            if (filtered.length > 0) {
                setAllCards(filtered);
                const selected = selectCards(filtered, settings.cardsPerSession);
                setSessionCards(selected);
            } else {
                // No matching cards in storage, generate new ones
                const newCards = generateAllFacts(
                    settings.operation,
                    settings.maxNumber,
                    settings.enabledNumbers
                );
                setAllCards(newCards);
                const selected = selectCards(newCards, settings.cardsPerSession);
                setSessionCards(selected);
            }
        } else {
            // Generate new card deck
            const newCards = generateAllFacts(
                settings.operation,
                settings.maxNumber,
                settings.enabledNumbers
            );
            setAllCards(newCards);
            const selected = selectCards(newCards, settings.cardsPerSession);
            setSessionCards(selected);
        }

        setProblemStartTime(Date.now());
    }, [settings]);

    const handleAnswer = (userAnswer: number) => {
        if (currentCardIndex >= sessionCards.length) return;

        const currentCard = sessionCards[currentCardIndex];
        const responseTime = Date.now() - problemStartTime;
        const isCorrect = userAnswer === currentCard.problem.correctAnswer;

        // Determine feedback type and get message
        const fbType = determineFeedbackType(isCorrect, responseTime, settings.targetTime);
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
        const updatedCard = updateCard(currentCard, isCorrect, responseTime, settings.targetTime);

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
        const selected = selectCards(allCards, settings.cardsPerSession);
        setSessionCards(selected);
        setCurrentCardIndex(0);
        setAttempts([]);
        setSessionComplete(false);
        setProblemStartTime(Date.now());
    };

    const handleSettingsChange = (newSettings: GameSettings) => {
        setSettings(newSettings);
        // Save to localStorage
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    };

    const handleCloseSettings = () => {
        setShowSettings(false);
        // Reset session when closing settings
        setCurrentCardIndex(0);
        setAttempts([]);
        setSessionComplete(false);
        setProblemStartTime(Date.now());
    };

    if (showSettings) {
        return (
            <Settings
                settings={settings}
                onSettingsChange={handleSettingsChange}
                onClose={handleCloseSettings}
            />
        );
    }

    if (allCards.length === 0) {
        return <div className="loading">Loading...</div>;
    }

    if (sessionComplete) {
        return (
            <div className="session-complete">
                <h2>Great job!</h2>
                <StatsDisplay attempts={attempts} targetTime={settings.targetTime} />
                <div className="session-actions">
                    <button onClick={handleNewSession} className="new-session-button">
                        Practice More
                    </button>
                    <button onClick={() => setShowSettings(true)} className="settings-link-button">
                        Change Numbers
                    </button>
                </div>
            </div>
        );
    }

    const currentCard = sessionCards[currentCardIndex];

    if (!currentCard) {
        return <div className="loading">Loading problem...</div>;
    }

    return (
        <div className="game">
            <div className="game-header">
                <h1>Meow Facts</h1>
                <button onClick={() => setShowSettings(true)} className="settings-button">
                    ⚙️
                </button>
            </div>

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
