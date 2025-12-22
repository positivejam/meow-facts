import type { AnimalState, RescueMission } from '../types/game';

export function determineAnimalState(
    correctAnswers: number,
    fastCorrectAnswers: number
): AnimalState {
    // Rescued criteria
    if (fastCorrectAnswers >= 5 || correctAnswers >= 10) {
        return 'rescued';
    }

    // Improving after 3 correct
    if (correctAnswers >= 3) {
        return 'improving';
    }

    return 'needs-help';
}

export function isMissionComplete(
    correctAnswers: number,
    fastCorrectAnswers: number,
    totalAttempts: number
): boolean {
    // Success conditions
    if (fastCorrectAnswers >= 5 || correctAnswers >= 10) {
        return true;
    }

    // Max attempts reached
    if (totalAttempts >= 15) {
        return true;
    }

    return false;
}

export function isMissionSuccessful(
    correctAnswers: number,
    fastCorrectAnswers: number
): boolean {
    return fastCorrectAnswers >= 5 || correctAnswers >= 10;
}

export function createNewMission(
    animalType: 'kitten' | 'puppy' | 'snail' = 'kitten',
    location: 'living-room' = 'living-room'
): RescueMission {
    return {
        id: `mission-${Date.now()}`,
        animalType,
        animalName: generateAnimalName(animalType),
        location,
        state: 'needs-help',
        correctAnswers: 0,
        fastCorrectAnswers: 0,
        totalAttempts: 0,
        problemsInMission: [],
        startTime: Date.now(),
    };
}

function generateAnimalName(type: 'kitten' | 'puppy' | 'snail'): string {
    const names = {
        kitten: ['Whiskers', 'Mittens', 'Luna', 'Shadow'],
        puppy: ['Buddy', 'Max', 'Bella', 'Charlie'],
        snail: ['Speedy', 'Shelly', 'Gary', 'Turbo'],
    };
    const nameList = names[type];
    return nameList[Math.floor(Math.random() * nameList.length)];
}
