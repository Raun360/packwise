import { useState, useId } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import PriorityBadge from './PriorityBadge.jsx';

export default function PackingItem({ item, onToggle, isTarget }) {
  const [showWhy, setShowWhy] = useState(false);
  const whyId = useId();

  const qtyLabel = item.quantity > 1
    ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''}`
    : item.unit === 'pairs' ? '1 pair' : null;

  return (
    <li
      className={`item${item.packed ? ' packed' : ''}${isTarget ? ' is-target' : ''}`}
      id={`item-${item.id}`}
      // The whole row toggles — on a phone, aiming for a 24px box while
      // standing over a suitcase is not a reasonable ask.
      onClick={(e) => {
        if (e.target.closest('.why-btn, .why-body')) return;
        onToggle(item.id);
      }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={item.packed}
        className="checkbox"
        // No handler of its own: the click — whether from a pointer or from
        // Space/Enter on this button — bubbles to the row, which toggles once.
        aria-label={`${item.packed ? 'Mark as not packed' : 'Mark as packed'}: ${item.name}`}
      >
        {item.packed && <Check aria-hidden="true" />}
      </button>

      <div className="item-main">
        <div className="item-line">
          <span className="item-name">{item.name}</span>
          {qtyLabel && <span className="item-qty">— {qtyLabel}</span>}
          <PriorityBadge priority={item.priority} />
        </div>

        {item.reason && (
          <div className={`why-panel${showWhy ? ' open' : ''}`}>
            <div>
              <div className="why-body" id={whyId} role="region" aria-label={`Why ${item.name} is recommended`}>
                <span className="why-label">Why we're recommending this</span>
                {item.reason}
              </div>
            </div>
          </div>
        )}
      </div>

      {item.reason && (
        <div className="item-actions">
          <button
            type="button"
            className="why-btn"
            aria-expanded={showWhy}
            aria-controls={whyId}
            onClick={() => setShowWhy((v) => !v)}
          >
            Why<ChevronDown aria-hidden="true" />
          </button>
        </div>
      )}
    </li>
  );
}
