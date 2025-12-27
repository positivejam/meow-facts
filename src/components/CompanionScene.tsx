import type { AnimalType, SunshineDialogueType } from '../types/game';
import { AnimalDisplay } from './AnimalDisplay';
import { SunshineSVG } from './SunshineSVG';

interface CompanionSceneProps {
    containerClassName: string;
    dialogue: string;
    dialogueType: SunshineDialogueType;
    animalType: AnimalType;
    animalProgress: number;
    animalName: string;
    animate?: boolean; // Whether to show celebration animation on the animal
}

export function CompanionScene({
    containerClassName,
    dialogue,
    dialogueType,
    animalType,
    animalProgress,
    animalName,
    animate = false,
}: CompanionSceneProps) {
    return (
        <div className={containerClassName}>
            <div className={`sunshine-dialogue dialogue-${dialogueType}`}>
                {dialogue}
            </div>
            <AnimalDisplay
                animalType={animalType}
                progress={animalProgress}
                animalName={animalName}
                animate={animate}
            />
            <div className="animal-display">
                <div className="animal-container">
                    <SunshineSVG />
                </div>
                <div className="animal-name">Sunshine</div>
            </div>
        </div>
    );
}
