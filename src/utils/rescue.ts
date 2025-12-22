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
        animalPronoun: Math.random() < 0.5 ? 'she' : 'he',
        animalProblem: generateAnimalProblem(),
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

function generateAnimalProblem(): 'cold' | 'hungry' | 'lonely' | 'tired' {
    const problems: ('cold' | 'hungry' | 'lonely' | 'tired')[] = ['cold', 'hungry', 'lonely', 'tired'];
    return problems[Math.floor(Math.random() * problems.length)];
}

export function getMissionIntroDialogue(mission: RescueMission): string {
    const problemDescriptions = {
        cold: `is feeling a bit cold`,
        hungry: `is feeling hungry`,
        lonely: `is feeling lonely`,
        tired: `is feeling sleepy and tired`,
    };

    const pronoun = mission.animalPronoun === 'she' ? 'She' : 'He';

    return `I found ${mission.animalName} the ${mission.animalType}! ${pronoun} ${problemDescriptions[mission.animalProblem]}. Do you want to help?`;
}

export function getMissionCompleteDialogue(mission: RescueMission): string {
    const resolutions = {
        cold: `is warm and cozy now`,
        hungry: `has a full belly now`,
        lonely: `feels happy and loved now`,
        tired: `is well-rested now`,
    };

    return `You did it! ${mission.animalName} ${resolutions[mission.animalProblem]}. Thank you for helping!`;
}
