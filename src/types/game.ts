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

export interface GameSettings {
  operation: Operation;
  maxNumber: number;
  cardsPerSession: number;
  enabledNumbers: number[]; // Which numbers to include in practice (e.g., [0, 1, 2])
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

export interface GameStats {
  totalAttempts: number;
  correctAnswers: number;
  averageTime: number;
  accuracy: number;
  mastered: number; // Number of facts with easeFactor > 2.5
  learning: number; // Number of facts being actively learned
  new: number; // Number of facts never attempted
}

export interface ProgressData {
  cards: Map<string, MathFactCard>;
  sessions: GameSession[];
  lastUpdated: number;
}
