import { PRIORITY_LABEL } from '../engine/rules.js';

/**
 * Colour is used as a semantic marker only — the label carries the meaning,
 * so the badge still reads without relying on hue.
 */
export default function PriorityBadge({ priority }) {
  return (
    <span className={`badge ${priority}`}>
      <span className={`dot ${priority}`} aria-hidden="true" />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
