import type { SunshineDialogueType } from '../types/game';

interface SunshineDialogueProps {
    dialogue: string;
    type: SunshineDialogueType;
}

export function SunshineDialogue({ dialogue, type }: SunshineDialogueProps) {
    return (
        <div className="sunshine-container">
            <div className="sunshine-cat"></div>
            <div className={`sunshine-dialogue dialogue-${type}`}>
                {dialogue}
            </div>
        </div>
    );
}
