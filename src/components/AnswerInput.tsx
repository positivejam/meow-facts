import { useState, useEffect, useRef } from 'react';
import { useIsTouchDevice } from '../hooks/useIsTouchDevice';
import { NumericKeypad } from './NumericKeypad';

interface AnswerInputProps {
  onSubmit: (answer: number) => void;
  disabled?: boolean;
}

export function AnswerInput({ onSubmit, disabled = false }: AnswerInputProps) {
  const [answer, setAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isTouchDevice = useIsTouchDevice();

  // Auto-focus input when component mounts or when it becomes enabled
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAnswer();
  };

  const submitAnswer = () => {
    const numAnswer = parseInt(answer, 10);

    if (!isNaN(numAnswer)) {
      onSubmit(numAnswer);
      setAnswer(''); // Clear input for next problem
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow negative numbers
    const value = e.target.value;
    if (value === '' || value === '-' || /^-?\d+$/.test(value)) {
      setAnswer(value);
    }
  };

  const handleDigitPress = (digit: string) => {
    setAnswer((prev) => prev + digit);
    // Keep focus on input so physical keyboard still works
    inputRef.current?.focus();
  };

  const handleBackspace = () => {
    setAnswer((prev) => prev.slice(0, -1));
    inputRef.current?.focus();
  };

  const handleKeypadSubmit = () => {
    submitAnswer();
    inputRef.current?.focus();
  };

  const canSubmit = answer !== '' && answer !== '-';

  return (
    <form onSubmit={handleSubmit} className={`answer-input${isTouchDevice ? ' touch-mode' : ''}`}>
      <div className="answer-input-row">
        <input
          ref={inputRef}
          type="text"
          inputMode={isTouchDevice ? 'none' : 'numeric'}
          value={answer}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Your answer"
          className="answer-field"
        />
        {!isTouchDevice && (
          <button type="submit" disabled={disabled || !canSubmit} className="submit-button">
            Submit
          </button>
        )}
      </div>
      {isTouchDevice && (
        <NumericKeypad
          onDigitPress={handleDigitPress}
          onBackspace={handleBackspace}
          onSubmit={handleKeypadSubmit}
          disabled={disabled}
          canSubmit={canSubmit}
        />
      )}
    </form>
  );
}
