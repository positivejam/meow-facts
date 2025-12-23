import { useState, useEffect } from 'react';
import type { MathFactCard, GameSettings, ProblemAttempt, RescueMission, SparklesData, SunshineDialogueType } from '../types/game';
import { generateAllFacts } from '../utils/cardGenerator';
import { selectCards, updateCard } from '../utils/spacedRepetition';
import { saveProgress, loadProgress } from '../utils/storage';
import { determineFeedbackType, type FeedbackType } from '../utils/feedback';
import { createNewMission, isMissionComplete, isMissionSuccessful, getMissionIntroDialogue, getMissionCompleteDialogue } from '../utils/rescue';
import { getSunshineDialogue } from '../utils/sunshine';
import { MissionIntro } from './MissionIntro';
import { loadSparkles, saveSparkles, awardSparkles, SPARKLES_PER_FAST_CORRECT } from '../utils/sparkles';
import { loadRescueProgress, saveRescueProgress } from '../utils/rescueStorage';
import { ProblemDisplay } from './ProblemDisplay';
import { AnswerInput } from './AnswerInput';
import { Feedback } from './Feedback';
import { StatsDisplay } from './StatsDisplay';
import { Settings } from './Settings';
import { AnimalDisplay } from './AnimalDisplay';
import { SunshineDialogue } from './SunshineDialogue';
import { SparklesCounter } from './SparklesCounter';

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
    // eslint-disable-next-line react-hooks/purity
    const [problemStartTime, setProblemStartTime] = useState(Date.now());
    const [showSettings, setShowSettings] = useState(false);

    // Rescue game state
    const [currentMission, setCurrentMission] = useState<RescueMission | null>(null);
    const [showMissionIntro, setShowMissionIntro] = useState(true);
    const [sparkles, setSparkles] = useState<SparklesData>({ total: 0, earnedThisSession: 0 });
    const [sunshineDialogue, setSunshineDialogue] = useState<string>('');
    const [sunshineDialogueType, setSunshineDialogueType] = useState<SunshineDialogueType>('intro');
    const [recentlyEarnedSparkles, setRecentlyEarnedSparkles] = useState(0);

    // Initialize cards and mission when settings change
    useEffect(() => {
        const stored = loadProgress();

        if (stored && stored.cards.length > 0) {
            // Filter existing cards based on enabled numbers
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

        // Load sparkles
        const loadedSparkles = loadSparkles();
        setSparkles(loadedSparkles);

        // Start a new mission
        // eslint-disable-next-line react-hooks/immutability
        startNewMission();
    }, [settings]);

    const startNewMission = () => {
        const mission = createNewMission('kitten', 'living-room');
        setCurrentMission(mission);
        setCurrentCardIndex(0);
        setAttempts([]);
        setShowFeedback(false);
        setShowMissionIntro(true);

        // Save mission
        saveRescueProgress({ currentMission: mission });
    };

    const handleAcceptMission = () => {
        setShowMissionIntro(false);
        setProblemStartTime(Date.now());
    };

    const handleAnswer = (userAnswer: number) => {
        if (currentCardIndex >= sessionCards.length || !currentMission) return;

        const currentCard = sessionCards[currentCardIndex];
        const responseTime = Date.now() - problemStartTime;
        const isCorrect = userAnswer === currentCard.problem.correctAnswer;

        // Determine feedback type
        const fbType = determineFeedbackType(isCorrect, responseTime, settings.targetTime);
        setFeedbackType(fbType);

        // Determine if this is a fast+correct answer
        const isFastCorrect = isCorrect && responseTime < settings.targetTime;

        // Calculate progress increment: +2 for fast+correct, +1 for slow+correct, +0 for incorrect
        const progressIncrement = isFastCorrect ? 2 : (isCorrect ? 1 : 0);

        // Update mission progress
        const updatedMission: RescueMission = {
            ...currentMission,
            progress: Math.min(10, currentMission.progress + progressIncrement),
            correctAnswers: currentMission.correctAnswers + (isCorrect ? 1 : 0),
            fastCorrectAnswers: currentMission.fastCorrectAnswers + (isFastCorrect ? 1 : 0),
            totalAttempts: currentMission.totalAttempts + 1,
            problemsInMission: [...currentMission.problemsInMission, currentCard.problem.id],
        };

        // Check if rescue is complete
        if (isMissionSuccessful(updatedMission.progress)) {
            updatedMission.completedAt = Date.now();
        }

        setCurrentMission(updatedMission);

        // Award sparkles for fast+correct answers
        if (isFastCorrect) {
            const newSparkles = awardSparkles(sparkles, SPARKLES_PER_FAST_CORRECT);
            setSparkles(newSparkles);
            saveSparkles(newSparkles);
            setRecentlyEarnedSparkles(SPARKLES_PER_FAST_CORRECT);
        } else {
            setRecentlyEarnedSparkles(0);
        }

        // Select appropriate Sunshine dialogue
        let dialogueType: SunshineDialogueType;
        if (!isCorrect) {
            dialogueType = 'incorrect';
        } else if (isFastCorrect) {
            dialogueType = 'fast-correct';
        } else {
            dialogueType = 'slow-correct';
        }
        setSunshineDialogueType(dialogueType);
        setSunshineDialogue(getSunshineDialogue(dialogueType, currentCard.problem.correctAnswer));

        // Record the attempt
        const attempt: ProblemAttempt = {
            card: currentCard,
            userAnswer,
            isCorrect,
            responseTime,
            timestamp: Date.now(),
        };
        setAttempts([...attempts, attempt]);

        // Update the card with spaced repetition (existing SM-2 logic)
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
        saveRescueProgress({ currentMission: updatedMission });

        // Show feedback
        setShowFeedback(true);
    };

    const handleContinue = () => {
        setShowFeedback(false);

        if (!currentMission) return;

        // Check if mission is complete
        if (isMissionComplete(currentMission.progress, currentMission.totalAttempts)) {
            // Mission complete - will be handled by render
            return;
        }

        // Move to next card
        if (currentCardIndex + 1 < sessionCards.length) {
            setCurrentCardIndex(currentCardIndex + 1);
            setProblemStartTime(Date.now());
        }
    };

    const handleMissionComplete = () => {
        if (!currentMission) return;

        const successful = isMissionSuccessful(currentMission.progress);

        if (successful) {
            // Save completed mission
            const rescueData = loadRescueProgress();
            saveRescueProgress({
                completedMissions: [...rescueData.completedMissions, currentMission],
                currentMission: null,
            });
        }

        // Show appropriate dialogue
        if (successful) {
            setSunshineDialogueType('rescue-complete');
            setSunshineDialogue(getSunshineDialogue('rescue-complete'));
        }
    };

    const handleRetryMission = () => {
        if (!currentMission) return;

        // Reset mission attempts but keep the same animal
        const resetMission: RescueMission = {
            ...currentMission,
            progress: 0,
            correctAnswers: 0,
            fastCorrectAnswers: 0,
            totalAttempts: 0,
            problemsInMission: [],
        };

        setCurrentMission(resetMission);
        saveRescueProgress({ currentMission: resetMission });

        // Restart session
        const selected = selectCards(allCards, settings.cardsPerSession);
        setSessionCards(selected);
        setCurrentCardIndex(0);
        setAttempts([]);
        setShowFeedback(false);
        setShowMissionIntro(true);
        setProblemStartTime(Date.now());
    };

    const handleSettingsChange = (newSettings: GameSettings) => {
        setSettings(newSettings);
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    };

    const handleCloseSettings = () => {
        setShowSettings(false);
        // Settings change will trigger useEffect to reset session
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

    if (allCards.length === 0 || !currentMission) {
        return <div className="loading">Loading...</div>;
    }

    // Check if mission is complete
    const missionComplete = isMissionComplete(
        currentMission.progress,
        currentMission.totalAttempts
    );

    const missionSuccessful = isMissionSuccessful(currentMission.progress);

    if (missionComplete) {
        // Call complete handler if not already called
        if (missionSuccessful && !currentMission.completedAt) {
            handleMissionComplete();
        }

        const completeDialogue = missionSuccessful
            ? getMissionCompleteDialogue(currentMission)
            : `Great effort! ${currentMission.animalName} appreciates your help. Ready to try again?`;

        return (
            <div className="session-complete">
                <h2>{missionSuccessful ? 'Mission Complete!' : "Let's Try Again!"}</h2>

                <div className="mission-complete-characters">
                    <AnimalDisplay
                        animalType={currentMission.animalType}
                        progress={currentMission.progress}
                        animalName={currentMission.animalName}
                    />
                    <SunshineDialogue
                        dialogue={completeDialogue}
                        type={missionSuccessful ? 'rescue-complete' : 'intro'}
                    />
                </div>

                {missionSuccessful && (
                    <>
                        <StatsDisplay attempts={attempts} targetTime={settings.targetTime} />
                        <div className="sparkles-earned">
                            ✨ Earned {sparkles.earnedThisSession} sparkles this session!
                        </div>
                    </>
                )}

                {!missionSuccessful && (
                    <p>You made good progress! Keep practicing and you'll get there.</p>
                )}

                <div className="session-actions">
                    <button onClick={startNewMission} className="new-session-button">
                        Help Another Animal
                    </button>
                    {!missionSuccessful && (
                        <button onClick={handleRetryMission} className="retry-button">
                            Try with {currentMission.animalName} Again
                        </button>
                    )}
                    <button onClick={() => setShowSettings(true)} className="settings-link-button">
                        Settings
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
                <SparklesCounter sparkles={sparkles.total} recentlyEarned={recentlyEarnedSparkles} />
                <button onClick={() => setShowSettings(true)} className="settings-button">
                    ⚙️
                </button>
            </div>

            {showMissionIntro ? (
                <MissionIntro
                    mission={currentMission}
                    introDialogue={getMissionIntroDialogue(currentMission)}
                    onAccept={handleAcceptMission}
                />
            ) : !showFeedback ? (
                <>
                    <AnimalDisplay
                        animalType={currentMission.animalType}
                        progress={currentMission.progress}
                        animalName={currentMission.animalName}
                    />
                    <ProblemDisplay
                        problem={currentCard.problem}
                        problemNumber={currentCardIndex + 1}
                        totalProblems={sessionCards.length}
                    />
                    <AnswerInput onSubmit={handleAnswer} />
                </>
            ) : (
                <>
                    <div className="feedback-animals-container">
                        <AnimalDisplay
                            animalType={currentMission.animalType}
                            progress={currentMission.progress}
                            animalName={currentMission.animalName}
                        />
                        <SunshineDialogue dialogue={sunshineDialogue} type={sunshineDialogueType} />
                    </div>
                    <Feedback
                        feedbackType={feedbackType}
                        onContinue={handleContinue}
                    />
                </>
            )}
        </div>
    );
}
