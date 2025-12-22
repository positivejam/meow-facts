import type { FeedbackType } from '../utils/feedback';

interface FeedbackProps {
    feedbackType: FeedbackType;
    onContinue: () => void;
}

export function Feedback({ feedbackType, onContinue }: FeedbackProps) {
    return (
        <div className={`feedback ${feedbackType}`}>
            <button onClick={onContinue} className="continue-button" autoFocus>
                Continue
            </button>
        </div>
    );
}
