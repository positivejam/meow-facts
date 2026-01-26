import type { MilestoneType, MasteryMilestone } from '../hooks/useMasteryMilestones';

interface MilestoneBadgeProps {
  milestones: MasteryMilestone[];
}

const MILESTONE_CONFIG: Record<MilestoneType, { emoji: string; label: string; className: string }> = {
  orange: { emoji: '🟠', label: 'Started', className: 'milestone-orange' },
  green: { emoji: '🟢', label: '50% Mastery', className: 'milestone-green' },
  blue: { emoji: '🔵', label: '75% Mastery', className: 'milestone-blue' },
  mastered: { emoji: '⭐', label: 'MASTERED!', className: 'milestone-mastered' },
};

export function MilestoneBadge({ milestones }: MilestoneBadgeProps) {
  if (milestones.length === 0) return null;

  return (
    <div className="milestone-celebration">
      <h3>Milestone{milestones.length > 1 ? 's' : ''} Reached!</h3>
      <div className="milestone-badges">
        {milestones.map((m) => {
          const config = MILESTONE_CONFIG[m.milestone];
          return (
            <div key={`${m.level}-${m.milestone}`} className={`milestone-badge ${config.className}`}>
              <span className="milestone-emoji">{config.emoji}</span>
              <span className="milestone-level">Level {m.level}</span>
              <span className="milestone-label">{config.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
