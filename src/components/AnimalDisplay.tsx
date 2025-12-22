import type { AnimalState } from '../types/game';

interface AnimalDisplayProps {
    animalType: 'kitten' | 'puppy' | 'snail';
    state: AnimalState;
    animalName?: string;
}

export function AnimalDisplay({ animalType, state, animalName }: AnimalDisplayProps) {
    return (
        <div className={`animal-display animal-state-${state}`}>
            <div className={`animal-shape animal-${animalType}`}></div>
            {animalName && <div className="animal-name">{animalName}</div>}
        </div>
    );
}
