import { useState, useEffect, useCallback } from 'react';
import type { MathFactCard, GameSettings, ProblemAttempt, RescueMission, SparklesData, SunshineDialogueType } from '../types/game';
import { MAX_LEVEL } from '../constants';
import { generateAllFacts } from '../utils/cardGenerator';
import { selectCards, updateCard, selectBonusCards, getNextDueTime } from '../utils/spacedRepetition';
import { saveProgress, loadProgress, saveRescueProgress, loadRescueProgress, loadSettings, saveSettings, loadSparkles as loadSparklesFromDB, saveSparkles as saveSparklesToDB } from '../utils/storage-dexie';
import { determineFeedbackType, type FeedbackType } from '../utils/feedback';
import { createNewMission, isMissionComplete, isMissionSuccessful, getMissionIntroDialogue, getMissionCompleteDialogue } from '../utils/rescue';
import { getSunshineDialogue } from '../utils/sunshine';
import { MissionIntro } from './MissionIntro';
import { awardSparkles, SPARKLES_PER_FAST_CORRECT } from '../utils/sparkles';
import { ProblemDisplay } from './ProblemDisplay';
import { AnswerInput } from './AnswerInput';
import { Feedback } from './Feedback';
import { StatsDisplay } from './StatsDisplay';
import { Settings } from './Settings';
import { AnimalDisplay } from './AnimalDisplay';
import { CompanionScene } from './CompanionScene';
import { AllCaughtUp } from './AllCaughtUp';
import { GameHeader } from './GameHeader';
import { ProgressPage } from './ProgressPage';
import { MilestoneBadge } from './MilestoneBadge';
import { useMasteryMilestones, type MasteryMilestone } from '../hooks/useMasteryMilestones';

const DEFAULT_SETTINGS: GameSettings = {
    operation: 'addition',
    maxNumber: MAX_LEVEL,
    cardsPerSession: 10,
    enabledNumbers: Array.from({ length: MAX_LEVEL + 1 }, (_, i) => i), // All numbers 0-MAX_LEVEL
    targetTime: 5000, // 5 seconds
};

export function Game() {
    const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
    const [allCards, setAllCards] = useState<MathFactCard[]>([]);
    const [sessionCards, setSessionCards] = useState<MathFactCard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [attempts, setAttempts] = useState<ProblemAttempt[]>([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackType, setFeedbackType] = useState<FeedbackType>('correct-fast');
    // eslint-disable-next-line react-hooks/purity
    const [problemStartTime, setProblemStartTime] = useState(Date.now());
    const [showSettings, setShowSettings] = useState(false);
    const [showProgress, setShowProgress] = useState(false);

    // Rescue game state
    const [currentMission, setCurrentMission] = useState<RescueMission | null>(null);
    const [showMissionIntro, setShowMissionIntro] = useState(true);
    const [sparkles, setSparkles] = useState<SparklesData>({ total: 0, earnedThisSession: 0 });
    const [sunshineDialogue, setSunshineDialogue] = useState<string>('');
    const [sunshineDialogueType, setSunshineDialogueType] = useState<SunshineDialogueType>('intro');
    const [recentlyEarnedSparkles, setRecentlyEarnedSparkles] = useState(0);
    const [displayedProgress, setDisplayedProgress] = useState(0); // For animated progress changes
    const [isBonusMode, setIsBonusMode] = useState(false);
    const [showAllCaughtUp, setShowAllCaughtUp] = useState(false);
    const [achievedMilestones, setAchievedMilestones] = useState<MasteryMilestone[]>([]);
    const [previouslyMasteredLevels, setPreviouslyMasteredLevels] = useState<Set<number>>(new Set());
    const { capturePreMissionState, getMilestonesAchieved } = useMasteryMilestones();

    // Load settings from Dexie on mount
    useEffect(() => {
        const loadInitialSettings = async () => {
            const stored = await loadSettings();
            if (stored) {
                setSettings(stored);
            }
        };
        loadInitialSettings();
    }, []);

    // Helper function to initialize a new mission with fresh state
    const initializeMissionState = useCallback(async () => {
        // Randomly select animal type
        const animalTypes: ('kitten' | 'puppy')[] = ['kitten', 'puppy'];
        const randomAnimalType = animalTypes[Math.floor(Math.random() * animalTypes.length)];
        const mission = createNewMission(randomAnimalType, 'living-room');
        setCurrentMission(mission);
        setCurrentCardIndex(0);
        setAttempts([]);
        setShowFeedback(false);
        setShowMissionIntro(true);
        setDisplayedProgress(0);
        await saveRescueProgress({ currentMission: mission });
    }, []);

    const startNewMission = useCallback(async (selectNewCards = false) => {
        // Clear previous milestones
        setAchievedMilestones([]);

        // Select new cards only when starting a new mission after completing one
        // (not on initial load, since useEffect already selects cards)
        if (selectNewCards) {
            const selected = selectCards(allCards, settings.cardsPerSession);
            if (selected.length === 0) {
                // No due cards - show "all caught up" screen
                setSessionCards([]);
                setShowAllCaughtUp(true);
                setIsBonusMode(false);
                setCurrentMission(null);
                return;
            }
            setSessionCards(selected);
        }

        // Capture mastery state before mission for milestone detection
        capturePreMissionState(allCards);

        await initializeMissionState();
    }, [allCards, settings, initializeMissionState, capturePreMissionState]);

    // Initialize cards and mission when settings change
    useEffect(() => {
        const initializeCards = async () => {
            // Always generate fresh cards based on current settings
            // Then merge in spaced repetition data from storage for matching cards
            const newCards = generateAllFacts(
                settings.operation,
                settings.maxNumber,
                settings.enabledNumbers
            );

            // Load stored progress and merge spaced repetition data
            const stored = await loadProgress();
            let cardsToUse: MathFactCard[];
            if (stored && stored.cards.length > 0) {
                // Create a map of stored card data by problem ID
                const storedCardMap = new Map(
                    stored.cards.map(card => [card.problem.id, card])
                );

                // Merge stored data into new cards where IDs match
                const mergedCards = newCards.map(newCard => {
                    const storedCard = storedCardMap.get(newCard.problem.id);
                    return storedCard || newCard; // Use stored data if exists, otherwise new card
                });

                cardsToUse = mergedCards;
            } else {
                cardsToUse = newCards;
            }

            setAllCards(cardsToUse);
            const selected = selectCards(cardsToUse, settings.cardsPerSession);

            // Check if we have enough due cards
            if (selected.length === 0) {
                // No due cards - show "all caught up" screen
                setSessionCards([]);
                setShowAllCaughtUp(true);
                setIsBonusMode(false);
                setShowMissionIntro(false);
            } else {
                // Have due cards - proceed normally
                setSessionCards(selected);
                setShowAllCaughtUp(false);
                setIsBonusMode(false);

                // Capture mastery state before mission for milestone detection
                capturePreMissionState(cardsToUse);

                // Initialize a new mission
                await initializeMissionState();
            }

            // Load sparkles
            const loadedSparkles = await loadSparklesFromDB();
            setSparkles(loadedSparkles);

            // Load previously mastered levels from unlock status
            const rescueData = await loadRescueProgress();
            setPreviouslyMasteredLevels(new Set(
                rescueData.unlockStatus.masteredFactGroups.map(s => parseInt(s, 10))
            ));
        };

        initializeCards();
    }, [settings, initializeMissionState, capturePreMissionState]);

    const handleAcceptMission = () => {
        setShowMissionIntro(false);
        setProblemStartTime(Date.now());
    };

    const handleBonusPractice = async () => {
        // Select bonus cards
        const bonusCards = selectBonusCards(allCards, settings.cardsPerSession);
        setSessionCards(bonusCards);
        setIsBonusMode(true);
        setShowAllCaughtUp(false);

        // Start a new mission for bonus practice
        await initializeMissionState();
    };

    const handleAnswer = async (userAnswer: number) => {
        if (currentCardIndex >= sessionCards.length || !currentMission) return;

        const currentCard = sessionCards[currentCardIndex];
        const responseTime = Date.now() - problemStartTime;
        const isCorrect = userAnswer === currentCard.problem.correctAnswer;

        // Determine feedback type
        const fbType = determineFeedbackType(isCorrect, responseTime, settings.targetTime);

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
        const justCompleted = isMissionSuccessful(updatedMission.progress) && !currentMission.completedAt;
        if (justCompleted) {
            updatedMission.completedAt = Date.now();
        }

        // Update the card with spaced repetition (existing SM-2 logic)
        const updatedCard = updateCard(currentCard, isCorrect, responseTime, settings.targetTime);

        // Update all cards
        const updatedAllCards = allCards.map(card =>
            card.problem.id === updatedCard.problem.id ? updatedCard : card
        );

        // Update session cards
        const updatedSessionCards = [...sessionCards];
        updatedSessionCards[currentCardIndex] = updatedCard;

        // Award sparkles for fast+correct answers
        const newSparkles = isFastCorrect
            ? awardSparkles(sparkles, SPARKLES_PER_FAST_CORRECT)
            : null;

        // Select appropriate Sunshine dialogue
        let dialogueType: SunshineDialogueType;
        if (!isCorrect) {
            dialogueType = 'incorrect';
        } else if (isFastCorrect) {
            dialogueType = 'fast-correct';
        } else {
            dialogueType = 'slow-correct';
        }

        // Record the attempt
        const attempt: ProblemAttempt = {
            card: currentCard,
            userAnswer,
            isCorrect,
            responseTime,
            // eslint-disable-next-line react-hooks/purity
            timestamp: Date.now(),
        };

        // --- All state updates (batched before any await) ---
        setCurrentMission(updatedMission);
        setAllCards(updatedAllCards);
        setSessionCards(updatedSessionCards);
        setFeedbackType(fbType);
        setSunshineDialogueType(dialogueType);
        setSunshineDialogue(getSunshineDialogue(dialogueType, currentCard.problem));
        setAttempts([...attempts, attempt]);
        if (newSparkles) {
            setSparkles(newSparkles);
            setRecentlyEarnedSparkles(SPARKLES_PER_FAST_CORRECT);
        } else {
            setRecentlyEarnedSparkles(0);
        }
        if (justCompleted) {
            handleMissionComplete(updatedMission, updatedAllCards);
        }
        setShowFeedback(true);

        // Animate progress after celebration completes (600ms pop animation)
        setTimeout(() => {
            setDisplayedProgress(updatedMission.progress);
        }, 600);

        // --- Async persistence (does not affect render) ---
        if (newSparkles) {
            await saveSparklesToDB(newSparkles);
        }
        await saveProgress(updatedAllCards, []);
        await saveRescueProgress({ currentMission: updatedMission });
    };

    const handleContinue = () => {
        setShowFeedback(false);

        if (!currentMission) return;

        // Check if mission is complete
        if (isMissionComplete(currentMission.progress, currentMission.totalAttempts)) {
            // Mission complete - will be handled by render
            return;
        }

        // Move to next card (loop back to start if at end)
        const nextIndex = (currentCardIndex + 1) % sessionCards.length;
        setCurrentCardIndex(nextIndex);
        setProblemStartTime(Date.now());
    };

    const handleMissionComplete = async (completedMission: RescueMission, currentCards: MathFactCard[]) => {
        // Calculate milestones synchronously BEFORE any await, so state updates
        // are batched with the caller's updates in the same render cycle
        const milestones = getMilestonesAchieved(currentCards, previouslyMasteredLevels);
        setAchievedMilestones(milestones);

        // Save completed mission (async, happens in background)
        const rescueData = await loadRescueProgress();
        await saveRescueProgress({
            completedMissions: [...rescueData.completedMissions, completedMission],
            currentMission: null,
        });

        // Save newly mastered levels (first time reaching 100%)
        const newlyMastered = milestones
            .filter(m => m.milestone === 'mastered')
            .map(m => m.level);

        if (newlyMastered.length > 0) {
            // Update local state
            const updatedSet = new Set(previouslyMasteredLevels);
            newlyMastered.forEach(level => updatedSet.add(level));
            setPreviouslyMasteredLevels(updatedSet);

            // Persist to database
            const updatedGroups = [...updatedSet].map(String);
            await saveRescueProgress({
                unlockStatus: {
                    ...rescueData.unlockStatus,
                    masteredFactGroups: updatedGroups,
                }
            });
        }
    };

    const handleRetryMission = async () => {
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
        await saveRescueProgress({ currentMission: resetMission });

        // Restart session
        const selected = selectCards(allCards, settings.cardsPerSession);
        setSessionCards(selected);
        setCurrentCardIndex(0);
        setAttempts([]);
        setShowFeedback(false);
        setShowMissionIntro(true);
        setDisplayedProgress(0);
        setProblemStartTime(Date.now());
    };

    const handleSettingsChange = async (newSettings: GameSettings) => {
        setSettings(newSettings);
        await saveSettings(newSettings);
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

    if (showProgress) {
        return (
            <ProgressPage
                cards={allCards}
                onClose={() => setShowProgress(false)}
            />
        );
    }

    if (showAllCaughtUp) {
        const nextDue = getNextDueTime(allCards);
        return (
            <div className="game">
                <GameHeader
                    sparklesTotal={sparkles.total}
                    recentlyEarned={0}
                    onSettingsClick={() => setShowSettings(true)}
                    onProgressClick={() => setShowProgress(true)}
                />
                <AllCaughtUp
                    nextDueTime={nextDue}
                    onBonusPractice={handleBonusPractice}
                    onSettings={() => setShowSettings(true)}
                />
            </div>
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
        const completeDialogue = missionSuccessful
            ? (achievedMilestones.length > 0
                ? getSunshineDialogue(`milestone-${achievedMilestones[0].milestone}` as SunshineDialogueType, undefined, achievedMilestones[0].level)
                : getMissionCompleteDialogue(currentMission))
            : `Great effort! ${currentMission.animalName} appreciates your help. Ready to try again?`;

        return (
            <div className="game">
                <div className="session-complete">
                    <h2>{missionSuccessful ? 'Mission Complete!' : "Let's Try Again!"}</h2>

                    <CompanionScene
                        containerClassName="mission-complete-characters"
                        dialogue={completeDialogue}
                        dialogueType={missionSuccessful ? 'rescue-complete' : 'intro'}
                        animalType={currentMission.animalType}
                        animalProgress={currentMission.progress}
                        animalName={currentMission.animalName}
                    />

                    {missionSuccessful && (
                        <>
                            <MilestoneBadge milestones={achievedMilestones} />
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
                        <button onClick={() => startNewMission(true)} className="new-session-button">
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
            </div>
        );
    }

    const currentCard = sessionCards[currentCardIndex];

    if (!currentCard) {
        return <div className="loading">Loading problem...</div>;
    }

    return (
        <div className="game">
            <GameHeader
                sparklesTotal={sparkles.total}
                recentlyEarned={recentlyEarnedSparkles}
                isBonusMode={isBonusMode}
                onSettingsClick={() => setShowSettings(true)}
                onProgressClick={() => setShowProgress(true)}
            />

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
                        problemNumber={currentMission.totalAttempts + 1}
                        totalProblems={sessionCards.length}
                    />
                    <AnswerInput onSubmit={handleAnswer} />
                </>
            ) : (
                <>
                    <CompanionScene
                        containerClassName="feedback-animals-container"
                        dialogue={sunshineDialogue}
                        dialogueType={sunshineDialogueType}
                        animalType={currentMission.animalType}
                        animalProgress={displayedProgress}
                        animalName={currentMission.animalName}
                        animate={feedbackType === 'correct-fast'}
                    />
                    <Feedback
                        feedbackType={feedbackType}
                        onContinue={handleContinue}
                    />
                </>
            )}
        </div>
    );
}
