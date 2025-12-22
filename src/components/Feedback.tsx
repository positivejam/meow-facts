import type { FeedbackType } from '../utils/feedback';

interface FeedbackProps {
    feedbackType: FeedbackType;
    message: string;
    onContinue: () => void;
}

export function Feedback({ feedbackType, message, onContinue }: FeedbackProps) {
    const isCorrect = feedbackType !== 'incorrect';

    return (
        <div className={`feedback ${feedbackType}`}>
            <div className="feedback-message">
                <span className="feedback-icon">
                    {isCorrect ? '✓' : '✗'}
                </span>
                <span>{message}</span>
            </div>
            <button onClick={onContinue} className="continue-button" autoFocus>
                Continue
            </button>
        </div>
    );
}
