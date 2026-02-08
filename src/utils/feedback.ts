export type FeedbackType = 'correct-fast' | 'correct-slow' | 'incorrect';

export function determineFeedbackType(
  isCorrect: boolean,
  responseTime: number,
  targetTime: number = 5000
): FeedbackType {
  if (!isCorrect) {
    return 'incorrect';
  }

  if (responseTime <= targetTime) {
    return 'correct-fast';
  }

  return 'correct-slow';
}
