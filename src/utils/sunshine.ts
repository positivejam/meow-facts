import type { SunshineDialogueType, MathProblem, Operation } from '../types/game';

export const SUNSHINE_PHRASES = {
    intro: [
        "This little kitten needs our help. Ready?",
        "Let's help this sweet kitten feel cozy!",
        "A kitten is feeling a bit cold. Want to help?",
        "I found a kitten who could use some warmth!",
    ],
    'fast-correct': [
        "Wow! You knew that so fast!",
        "Amazing! The kitten is feeling better!",
        "Perfect! Your quick thinking is helping!",
        "Incredible! You're making such a difference!",
    ],
    'slow-correct': [
        "Nice work! You figured it out!",
        "Good thinking! Every bit helps!",
        "You got it! The kitten appreciates your help!",
        "Well done! Keep going!",
    ],
    incorrect: [
        "Oops!\n{equation}\nLet's keep helping!",
        "No worries!\n{equation}\nYou're doing great!",
        "Ah, chicken nugget!\n{equation}\nThe kitten is still happy you're here!",
        "That one was tricky!\n{equation}\nYou've got this!",
    ],
    'rescue-complete': [
        "You did it! The kitten is cozy and happy!",
        "Amazing work! Look how happy the kitten is now!",
        "Perfect! The kitten is rescued and feeling great!",
        "Wonderful! The kitten is all warmed up thanks to you!",
    ],
    'milestone-orange': [
        "You're making progress on your {level}s! Keep it up!",
        "Nice! Your {level}s facts are getting stronger!",
        "You're building momentum with those {level}s!",
    ],
    'milestone-green': [
        "Halfway there on your {level}s! You're doing amazing!",
        "Wow! You've reached 50% mastery on your {level}s!",
        "Your {level}s facts are really clicking now!",
    ],
    'milestone-blue': [
        "You're almost a {level}s expert! 75% mastered!",
        "Incredible progress on your {level}s! Nearly there!",
        "Your {level}s facts are becoming second nature!",
    ],
    'milestone-mastered': [
        "You've MASTERED your {level}s facts! Amazing!",
        "100% on your {level}s! You're a math superstar!",
        "Perfect mastery of your {level}s! Incredible work!",
    ],
} as const;

function getOperationSymbol(operation: Operation): string {
    switch (operation) {
        case 'addition': return '+';
        case 'subtraction': return '−';
        case 'multiplication': return '×';
        case 'division': return '÷';
    }
}

function formatProblemEquation(problem: MathProblem): string {
    const symbol = getOperationSymbol(problem.operation);
    return `${problem.operand1} ${symbol} ${problem.operand2} = ${problem.correctAnswer}`;
}

export function getSunshineDialogue(
    type: SunshineDialogueType,
    problem?: MathProblem,
    level?: number
): string {
    const phrases = SUNSHINE_PHRASES[type];
    let phrase: string = phrases[Math.floor(Math.random() * phrases.length)];

    if (type === 'incorrect' && problem !== undefined) {
        const equation = formatProblemEquation(problem);
        phrase = phrase.replace('{equation}', equation);
    }

    if (level !== undefined) {
        phrase = phrase.replace('{level}', String(level));
    }

    return phrase;
}
