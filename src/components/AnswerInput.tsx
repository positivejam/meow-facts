import { useState, useEffect, useRef } from 'react';

interface AnswerInputProps {
  onSubmit: (answer: number) => void;
  disabled?: boolean;
}

export function AnswerInput({ onSubmit, disabled = false }: AnswerInputProps) {
  const [answer, setAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when component mounts or when it becomes enabled
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <form onSubmit={handleSubmit} className="answer-input">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={answer}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Your answer"
        className="answer-field"
      />
      <button type="submit" disabled={disabled || answer === '' || answer === '-'} className="submit-button">
        Submit
      </button>
    </form>
  );
}
