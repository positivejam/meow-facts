export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface MathProblem {
  id: string;
  operand1: number;
  operand2: number;
  operation: Operation;
  correctAnswer: number;
}

export interface MathFactCard {
  problem: MathProblem;
  // Spaced repetition data
  easeFactor: number; // How "easy" this fact is (higher = easier)
  interval: number; // Days until next review
  repetitions: number; // Number of consecutive correct answers
  nextReview: number; // Timestamp when this should be reviewed next
  lastReviewed?: number; // Timestamp when last reviewed
  totalAttempts: number;
  correctAttempts: number;
  averageResponseTime: number; // In milliseconds
}

/** Operations that have a fact chart and can be practiced. */
export type PracticeOperation = 'addition' | 'subtraction';

/** Card IDs (e.g. 'addition-3-5') selected for practice, per operation. */
export type EnabledFacts = Record<PracticeOperation, string[]>;

export interface GameSettings {
  operation: PracticeOperation;
  cardsPerSession: number;
  enabledFacts: EnabledFacts; // Which chart facts to practice, chosen in Settings
  targetTime: number; // Target response time in milliseconds for "fast" answers
}

export interface ProblemAttempt {
  card: MathFactCard;
  userAnswer: number;
  isCorrect: boolean;
  responseTime: number; // In milliseconds
  timestamp: number;
}

export interface GameSession {
  id: string;
  settings: GameSettings;
  attempts: ProblemAttempt[];
  startTime: number;
  endTime?: number;
}

// Rescue Game Types
export type AnimalState = 'needs-help' | 'improving' | 'rescued';
export type AnimalType = 'kitten' | 'puppy' | 'snail';

export interface RescueMission {
  id: string;
  animalType: AnimalType;
  animalName: string;
  animalPronoun: 'she' | 'he';
  animalProblem: 'cold' | 'hungry' | 'lonely' | 'tired';
  location: 'living-room';
  progress: number; // 0 to MISSION_LIMITS.progressTarget (fast+correct = +2, slow+correct = +1)
  correctAnswers: number;
  fastCorrectAnswers: number;
  totalAttempts: number;
  problemsInMission: string[];
  startTime: number;
  completedAt?: number;
}

export interface SparklesData {
  total: number;
  earnedThisSession: number;
}

export type SunshineDialogueType =
  | 'intro'
  | 'fast-correct'
  | 'slow-correct'
  | 'incorrect'
  | 'rescue-complete'
  | 'facts-mastered';

export interface SunshineDialogue {
  type: SunshineDialogueType;
  text: string;
}

export interface UnlockStatus {
  unlockedAnimalTypes: string[];
  unlockedLocations: string[];
  masteredFactGroups: string[];
}
