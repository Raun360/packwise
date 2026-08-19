import { Check } from 'lucide-react';
import { ACTIVITIES } from '../data/activities.js';

export default function ActivitySelector({ selected = [], onToggle }) {
  return (
    <div className="activity-grid" role="group" aria-label="Activities">
      {ACTIVITIES.map((a) => {
        const on = selected.includes(a.id);
        return (
          <button
            key={a.id}
            type="button"
            className="activity-card"
            aria-pressed={on}
            onClick={() => onToggle(a.id)}
          >
            {on && (
              <span className="activity-tick" aria-hidden="true">
                <Check strokeWidth={3.5} />
              </span>
            )}
            <span className="emoji" aria-hidden="true">{a.emoji}</span>
            <span className="name">{a.label}</span>
            <span className="hint">{a.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
