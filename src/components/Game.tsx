import { useState, useEffect, useCallback } from 'react';
import type { MathFactCard, GameSettings, ProblemAttempt, RescueMission, SparklesData, SunshineDialogueType } from '../types/game';
import { MAX_LEVEL } from '../constants';
import { generateAllFacts } from '../utils/cardGenerator';
import { selectCards, selectBonusCards, getNextDueTime } from '../utils/spacedRepetition';
import { saveProgress, loadProgress, saveRescueProgress, loadRescueProgress, loadSettings, saveSettings, loadSparkles as loadSparklesFromDB, saveSparkles as saveSparklesToDB } from '../utils/storage-dexie';
import type { FeedbackType } from '../utils/feedback';
import { createNewMission, isMissionComplete, isMissionSuccessful, getMissionIntroDialogue, getMissionCompleteDialogue } from '../utils/rescue';
import { getSunshineDialogue } from '../utils/sunshine';
import { processAnswer } from '../utils/answerProcessor';
import { MissionIntro } from './MissionIntro';
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
    // --- Settings & Card Data ---
    const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
    const [allCards, setAllCards] = useState<MathFactCard[]>([]);
    const [progressCards, setProgressCards] = useState<MathFactCard[]>([]);

    // --- Session Flow ---
    const [sessionCards, setSessionCards] = useState<MathFactCard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [attempts, setAttempts] = useState<ProblemAttempt[]>([]);
    // eslint-disable-next-line react-hooks/purity
    const [problemStartTime, setProblemStartTime] = useState(Date.now());

    // --- Feedback & Dialogue ---
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackType, setFeedbackType] = useState<FeedbackType>('correct-fast');
    const [sunshineDialogue, setSunshineDialogue] = useState<string>('');
    const [sunshineDialogueType, setSunshineDialogueType] = useState<SunshineDialogueType>('intro');
    const [recentlyEarnedSparkles, setRecentlyEarnedSparkles] = useState(0);

    // --- Mission State ---
    const [currentMission, setCurrentMission] = useState<RescueMission | null>(null);
    const [showMissionIntro, setShowMissionIntro] = useState(true);
    const [displayedProgress, setDisplayedProgress] = useState(0);

    // --- Sparkles & Milestones ---
    const [sparkles, setSparkles] = useState<SparklesData>({ total: 0, earnedThisSession: 0 });
    const [achievedMilestones, setAchievedMilestones] = useState<MasteryMilestone[]>([]);
    const [previouslyMasteredLevels, setPreviouslyMasteredLevels] = useState<Set<number>>(new Set());
    const { capturePreMissionState, getMilestonesAchieved } = useMasteryMilestones();

    // --- UI Visibility ---
    const [showSettings, setShowSettings] = useState(false);
    const [showProgress, setShowProgress] = useState(false);
    const [isBonusMode, setIsBonusMode] = useState(false);
    const [showAllCaughtUp, setShowAllCaughtUp] = useState(false);

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

            // Generate full card set for progress display (all levels, no filter)
            const fullCards = generateAllFacts(settings.operation, settings.maxNumber);
            if (stored && stored.cards.length > 0) {
                const storedMap = new Map(
                    stored.cards.map(card => [card.problem.id, card])
                );
                setProgressCards(fullCards.map(card => storedMap.get(card.problem.id) || card));
            } else {
                setProgressCards(fullCards);
            }

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

        // eslint-disable-next-line react-hooks/purity
        const now = Date.now();
        const result = processAnswer(
            sessionCards[currentCardIndex],
            userAnswer,
            currentMission,
            settings.targetTime,
            sparkles,
            problemStartTime,
            now,
        );

        // Update all cards with the new spaced repetition data
        const updatedAllCards = allCards.map(card =>
            card.problem.id === result.updatedCard.problem.id ? result.updatedCard : card
        );
        const updatedSessionCards = [...sessionCards];
        updatedSessionCards[currentCardIndex] = result.updatedCard;

        // --- Synchronous state updates (batched by React) ---
        setCurrentMission(result.updatedMission);
        setAllCards(updatedAllCards);
        // Also update progressCards so ProgressPage shows current mastery
        setProgressCards(prevProgressCards =>
            prevProgressCards.map(card =>
                card.problem.id === result.updatedCard.problem.id
                    ? result.updatedCard
                    : card
            )
        );
        setSessionCards(updatedSessionCards);
        setFeedbackType(result.feedbackType);
        setSunshineDialogueType(result.dialogueType);
        setSunshineDialogue(result.dialogue);
        setAttempts([...attempts, result.attempt]);
        setRecentlyEarnedSparkles(result.recentlyEarnedSparkles);
        if (result.newSparkles) {
            setSparkles(result.newSparkles);
        }
        if (result.justCompleted) {
            handleMissionComplete(result.updatedMission, updatedAllCards);
        }
        setShowFeedback(true);

        // Animate progress after celebration completes (600ms pop animation)
        setTimeout(() => {
            setDisplayedProgress(result.updatedMission.progress);
        }, 600);

        // --- Async persistence (does not affect render) ---
        if (result.newSparkles) {
            await saveSparklesToDB(result.newSparkles);
        }
        await saveProgress(updatedAllCards, []);
        await saveRescueProgress({ currentMission: result.updatedMission });
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
                cards={progressCards}
                enabledNumbers={settings.enabledNumbers}
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
