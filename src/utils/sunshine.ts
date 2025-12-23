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
        "Oops! {equation}. Let's keep helping!",
        "No worries! {equation}. You're doing great!",
        "It happens! {equation}. The kitten is still happy you're here!",
        "That one was tricky! {equation}. You've got this!",
    ],
    'rescue-complete': [
        "You did it! The kitten is cozy and happy!",
        "Amazing work! Look how happy the kitten is now!",
        "Perfect! The kitten is rescued and feeling great!",
        "Wonderful! The kitten is all warmed up thanks to you!",
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
    problem?: MathProblem
): string {
    const phrases = SUNSHINE_PHRASES[type];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    if (type === 'incorrect' && problem !== undefined) {
        const equation = formatProblemEquation(problem);
        return phrase.replace('{equation}', equation);
    }

    return phrase;
}
