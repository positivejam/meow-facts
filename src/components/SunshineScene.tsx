import type { AnimalType, SunshineDialogueType } from '../types/game';
import { AnimalDisplay } from './AnimalDisplay';
import { SunshineSVG } from './SunshineSVG';

interface SunshineSceneProps {
    containerClassName: string;
    dialogue: string;
    dialogueType: SunshineDialogueType;
    animalType: AnimalType;
    animalProgress: number;
    animalName: string;
}

export function SunshineScene({
    containerClassName,
    dialogue,
    dialogueType,
    animalType,
    animalProgress,
    animalName,
}: SunshineSceneProps) {
    return (
        <div className={containerClassName}>
            <div className={`sunshine-dialogue dialogue-${dialogueType}`}>
                {dialogue}
            </div>
            <AnimalDisplay
                animalType={animalType}
                progress={animalProgress}
                animalName={animalName}
            />
            <SunshineSVG />
        </div>
    );
}
