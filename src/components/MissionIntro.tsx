import type { RescueMission } from '../types/game';
import { AnimalDisplay } from './AnimalDisplay';
import { SunshineSVG } from './SunshineSVG';

interface MissionIntroProps {
    mission: RescueMission;
    introDialogue: string;
    onAccept: () => void;
}

export function MissionIntro({ mission, introDialogue, onAccept }: MissionIntroProps) {
    return (
        <div className="mission-intro">
            <h2>A New Friend Needs Help!</h2>

            <div className="mission-intro-characters">
                <div className="sunshine-dialogue dialogue-intro">
                    {introDialogue}
                </div>
                <AnimalDisplay
                    animalType={mission.animalType}
                    progress={0}
                    animalName={mission.animalName}
                />
                <SunshineSVG />
            </div>

            <button onClick={onAccept} className="help-button" autoFocus>
                Help {mission.animalName}!
            </button>
        </div>
    );
}
