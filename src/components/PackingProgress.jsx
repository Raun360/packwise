import { CATEGORY_MAP } from '../data/catalog.js';

const message = (packed, total) => {
  if (total === 0) return 'Nothing to pack yet.';
  if (packed === 0) return 'Start anywhere — the essentials are marked.';
  const left = total - packed;
  if (left === 0) return "That's everything. Have a good trip.";
  if (left === 1) return 'One thing left.';
  const pct = packed / total;
  if (pct >= 0.8) return "You're almost ready.";
  if (pct >= 0.5) return 'Over halfway.';
  return `${left} still to go.`;
};

export default function PackingProgress({ stats, packedCount, weight }) {
  const total = stats.total;
  const pct = total ? Math.round((packedCount / total) * 100) : 0;
  const complete = total > 0 && packedCount === total;

  return (
    <div className="card progress-card">
      <div className="eyebrow" style={{ marginBottom: 'var(--s-3)' }}>Packing progress</div>
      <div className="progress-top">
        <div className="progress-count tnum">
          {packedCount}<small> / {total} packed</small>
        </div>
        <div className="progress-pct">{pct}%</div>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={packedCount}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Items packed"
      >
        <div className={`progress-fill${complete ? ' complete' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="progress-msg">{message(packedCount, total)}</p>

      <div className="stat-split">
        <div className="stat-cell">
          <div className="n tnum">{stats.essential}</div>
          <div className="l"><span className="dot essential" />Essential</div>
        </div>
        <div className="stat-cell">
          <div className="n tnum">{stats.recommended}</div>
          <div className="l"><span className="dot recommended" />Recommended</div>
        </div>
        <div className="stat-cell">
          <div className="n tnum">{stats.optional}</div>
          <div className="l"><span className="dot optional" />Optional</div>
        </div>
      </div>
    </div>
  );
}
