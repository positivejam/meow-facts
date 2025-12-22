import { AnimalSVG } from './AnimalSVG';
import { getAnimalStateFromProgress } from '../utils/rescue';

interface AnimalDisplayProps {
    animalType: 'kitten' | 'puppy' | 'snail';
    progress: number; // 0-10 scale
    animalName?: string;
}

export function AnimalDisplay({ animalType, progress, animalName }: AnimalDisplayProps) {
    // Convert 0-10 progress to 0-1 for SVG
    const svgProgress = Math.min(1, progress / 10);

    // Derive state from progress for CSS classes
    const state = getAnimalStateFromProgress(progress);

    return (
        <div className={`animal-display animal-state-${state}`}>
            <AnimalSVG animalType={animalType} progress={svgProgress} />
            {animalName && <div className="animal-name">{animalName}</div>}
        </div>
    );
}
