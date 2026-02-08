import type { SunshineDialogueType, MathProblem } from '../types/game';
import { getOperationSymbol } from './cardGenerator';

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
        "You passed the orange level on your {level}s!",
    ],
    'milestone-green': [
        "You passed the green level on your {level}s!",
    ],
    'milestone-blue': [
        "You passed the blue level on your {level}s!",
    ],
    'milestone-mastered': [
        "You've MASTERED your {level}s facts! Amazing!",
        "100% on your {level}s! You're a math superstar!",
        "Perfect mastery of your {level}s! Incredible work!",
    ],
} as const;

function formatProblemEquation(problem: MathProblem): string {
    return `${problem.operand1} ${getOperationSymbol(problem.operation)} ${problem.operand2} = ${problem.correctAnswer}`;
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
