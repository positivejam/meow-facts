export type FeedbackType = 'correct-fast' | 'correct-slow' | 'incorrect';

const FEEDBACK_MESSAGES: Record<FeedbackType, string[]> = {
  "correct-fast": [
    "Amazing! You're so fast!",
    "Wow! Lightning quick!",
    "Fantastic! You knew that instantly!",
    "Perfect! Super speedy!",
    "Incredible! You're a math whiz!",
  ],
  "correct-slow": [
    "That's right! Let's see if you can answer even faster next time!",
    "Correct! Keep practicing to get even quicker!",
    "You got it! Try to answer a bit faster!",
    "Nice work! Speed up a little and you'll be unstoppable!",
    "Good job! With more practice, you'll get faster!",
  ],
  "incorrect": [
    "Oops! The correct answer is {answer}.",
    "Not quite! The answer is {answer}.",
    "Almost! The right answer is {answer}.",
    "Nice try! It's actually {answer}.",
    "Good effort! The correct answer is {answer}.",
  ],
};

export function getFeedbackMessage(type: FeedbackType, correctAnswer?: number): string {
  const messages = FEEDBACK_MESSAGES[type];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  if (type === 'incorrect' && correctAnswer !== undefined) {
    return randomMessage.replace('{answer}', correctAnswer.toString());
  }

  return randomMessage;
}

export function determineFeedbackType(
  isCorrect: boolean,
  responseTime: number,
  targetTime: number = 3000
): FeedbackType {
  if (!isCorrect) {
    return 'incorrect';
  }

  if (responseTime <= targetTime) {
    return 'correct-fast';
  }

  return 'correct-slow';
}
