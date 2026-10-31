interface NumericKeypadProps {
  onDigitPress: (digit: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled: boolean;
  canSubmit: boolean;
}

export function NumericKeypad({
  onDigitPress,
  onBackspace,
  onSubmit,
  disabled,
  canSubmit,
}: NumericKeypadProps) {
  return (
    <div className="numeric-keypad">
      <div className="keypad-digits">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
          <button
            key={digit}
            type="button"
            className="keypad-button"
            disabled={disabled}
            onClick={() => onDigitPress(digit)}
          >
            {digit}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="keypad-button special"
        disabled={disabled}
        onClick={onBackspace}
      >
        &#9003;
      </button>
      <button
        type="button"
        className="keypad-button submit"
        disabled={disabled || !canSubmit}
        onClick={onSubmit}
      >
        Submit
      </button>
    </div>
  );
}
