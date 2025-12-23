import type { RescueMission } from '../types/game';
import { SunshineScene } from './SunshineScene';

interface MissionIntroProps {
    mission: RescueMission;
    introDialogue: string;
    onAccept: () => void;
}

export function MissionIntro({ mission, introDialogue, onAccept }: MissionIntroProps) {
    return (
        <div className="mission-intro">
            <h2>A New Friend Needs Help!</h2>

            <SunshineScene
                containerClassName="mission-intro-characters"
                dialogue={introDialogue}
                dialogueType="intro"
                animalType={mission.animalType}
                animalProgress={0}
                animalName={mission.animalName}
            />

            <button onClick={onAccept} className="help-button" autoFocus>
                Help {mission.animalName}!
            </button>
        </div>
    );
}
