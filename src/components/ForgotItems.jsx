import { AlertTriangle, ArrowRight } from 'lucide-react';
import { PRIORITY } from '../engine/rules.js';

/**
 * Surfaces unpacked items that matter most, weighted by priority and by how
 * commonly they are the thing people actually leave behind.
 */
const OFTEN_FORGOTTEN = new Set([
  'phone-charger', 'power-bank', 'lip-balm', 'sunscreen', 'permit-docs',
  'universal-adapter', 'prescription-meds', 'house-keys', 'booking-confirmations',
  'passport', 'cash', 'offline-maps', 'reusable-bottle', 'toothbrush',
  'thermal-gloves', 'wool-cap', 'swimwear', 'mosquito-repellent', 'altitude-meds',
]);

export function pickForgotten(items, limit = 4) {
  return items
    .filter((i) => !i.packed)
    .map((i) => ({
      item: i,
      score: PRIORITY[i.priority] * 10 + (OFTEN_FORGOTTEN.has(i.id) ? 5 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);
}

export default function ForgotItems({ items, onJump }) {
  const picks = pickForgotten(items);
  if (!picks.length) return null;

  const packedAny = items.some((i) => i.packed);
  if (!packedAny) return null; // only useful once they have started

  return (
    <div className="card forgot-card">
      <h3><AlertTriangle aria-hidden="true" />Don't forget these</h3>
      <p>
        {picks.length} {picks.length === 1 ? 'thing' : 'things'} still unticked that would be
        awkward to be without.
      </p>
      <div className="forgot-list">
        {picks.map((i) => (
          <button key={i.id} type="button" className="forgot-item" onClick={() => onJump(i)}>
            <span className={`dot ${i.priority}`} aria-hidden="true" />
            <span className="nm">{i.name}</span>
            <ArrowRight aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
