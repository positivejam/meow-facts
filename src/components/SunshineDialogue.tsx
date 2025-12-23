import type { SunshineDialogueType } from '../types/game';
import { SunshineSVG } from './SunshineSVG';

interface SunshineDialogueProps {
    dialogue: string;
    type: SunshineDialogueType;
}

export function SunshineDialogue({ dialogue, type }: SunshineDialogueProps) {
    return (
        <div className="sunshine-container">
            <SunshineSVG />
            <div className={`sunshine-dialogue dialogue-${type}`}>
                {dialogue}
            </div>
        </div>
    );
}
