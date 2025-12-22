import type { SunshineDialogueType } from '../types/game';

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
        "That's okay! It's {answer}. Let's keep helping!",
        "No worries! The answer is {answer}. You're doing great!",
        "It happens! It's {answer}. The kitten is still happy you're here!",
        "That one was tricky! It's {answer}. You've got this!",
    ],
    'rescue-complete': [
        "You did it! The kitten is cozy and happy!",
        "Amazing work! Look how happy the kitten is now!",
        "Perfect! The kitten is rescued and feeling great!",
        "Wonderful! The kitten is all warmed up thanks to you!",
    ],
} as const;

export function getSunshineDialogue(
    type: SunshineDialogueType,
    correctAnswer?: number
): string {
    const phrases = SUNSHINE_PHRASES[type];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    if (type === 'incorrect' && correctAnswer !== undefined) {
        return phrase.replace('{answer}', correctAnswer.toString());
    }

    return phrase;
}
