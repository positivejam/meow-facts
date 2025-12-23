import { AnimalSVG } from './AnimalSVG';
import { getAnimalStateFromProgress } from '../utils/rescue';

interface AnimalDisplayProps {
    animalType: 'kitten' | 'puppy' | 'snail';
    progress: number; // 0-10 scale
    animalName?: string;
    animate?: boolean; // Whether to show celebration animation
}

export function AnimalDisplay({ animalType, progress, animalName, animate = false }: AnimalDisplayProps) {
    // Convert 0-10 progress to 0-1 for SVG
    const svgProgress = Math.min(1, progress / 10);

    // Derive state from progress for CSS classes
    const state = getAnimalStateFromProgress(progress);

    return (
        <div className={`animal-display animal-state-${state}`}>
            <div className={`animal-container ${animate ? 'animal-container-animated' : ''}`}>
                <AnimalSVG animalType={animalType} progress={svgProgress} />
                {animate && progress > 0 && (
                    <div className="celebration-sparkles">
                        <span className="sparkle sparkle-1">✨</span>
                        <span className="sparkle sparkle-2">✨</span>
                        <span className="sparkle sparkle-3">✨</span>
                        <span className="sparkle sparkle-4">✨</span>
                    </div>
                )}
            </div>
            {animalName && <div className="animal-name">{animalName}</div>}
        </div>
    );
}
