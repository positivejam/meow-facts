import { useRef, useCallback } from 'react';
import type { MathFactCard, MathProblem } from '../types/game';
import { isMastered } from '../utils/mastery';

/**
 * Tracks which facts turn blue (mastered) during a mission.
 *
 * Usage:
 * 1. Call capturePreMissionState(cards) before the mission starts
 * 2. Call getNewlyMasteredFacts(cards) when it completes
 *
 * A fact that falls out of mastery and earns it back in a later mission counts again.
 */
export function useNewlyMasteredFacts() {
    const masteredBeforeMission = useRef<Set<string>>(new Set());

    const capturePreMissionState = useCallback((cards: MathFactCard[]) => {
        masteredBeforeMission.current = new Set(
            cards.filter(isMastered).map(card => card.problem.id)
        );
    }, []);

    const getNewlyMasteredFacts = useCallback((cards: MathFactCard[]): MathProblem[] => {
        return cards
            .filter(card => isMastered(card) && !masteredBeforeMission.current.has(card.problem.id))
            .map(card => card.problem);
    }, []);

    return { capturePreMissionState, getNewlyMasteredFacts };
}
