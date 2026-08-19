import { useMemo } from 'react';
import { dayCount } from '../engine/context.js';

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return iso(d);
};

const fmt = (s) =>
  s ? new Date(s + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';

const QUICK = [
  { label: 'Weekend', nights: 2 },
  { label: '4 days', nights: 3 },
  { label: 'A week', nights: 6 },
  { label: '10 days', nights: 9 },
];

export default function DateSelector({ startDate, endDate, onChange }) {
  const today = useMemo(() => iso(new Date()), []);
  const days = dayCount(startDate, endDate);
  const nights = Math.max(0, days - 1);

  const setStart = (v) => {
    // Keep the range coherent: pull the return date along if it falls behind.
    const next = { startDate: v, endDate };
    if (v && (!endDate || new Date(endDate) < new Date(v))) {
      next.endDate = addDays(v, Math.max(1, nights || 3));
    }
    onChange(next);
  };

  const applyQuick = (nightCount) => {
    const start = startDate || today;
    onChange({ startDate: start, endDate: addDays(start, nightCount) });
  };

  return (
    <div>
      <div className="date-grid">
        <div className="date-field">
          <label className="label" htmlFor="start-date">Leaving</label>
          <input
            id="start-date"
            className="field"
            type="date"
            value={startDate || ''}
            min={today}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="date-field">
          <label className="label" htmlFor="end-date">Coming back</label>
          <input
            id="end-date"
            className="field"
            type="date"
            value={endDate || ''}
            min={startDate || today}
            onChange={(e) => onChange({ startDate, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="quick-dur" role="group" aria-label="Common trip lengths">
        {QUICK.map((q) => (
          <button
            key={q.label}
            type="button"
            className="chip-suggest"
            onClick={() => applyQuick(q.nights)}
          >
            {q.label}
          </button>
        ))}
      </div>

      {days > 0 && (
        <div className="duration-readout" role="status">
          <div>
            <div className="big tnum">
              {days} <span style={{ fontSize: '1rem' }}>{days === 1 ? 'Day' : 'Days'}</span>
              {nights > 0 && (
                <>
                  {' · '}
                  {nights} <span style={{ fontSize: '1rem' }}>{nights === 1 ? 'Night' : 'Nights'}</span>
                </>
              )}
            </div>
            <div className="sub">
              {days >= 8 ? 'Long enough that laundry changes what you carry.' : 'We will size everything to this.'}
            </div>
          </div>
          <div className="dates">
            {fmt(startDate)}<br />→ {fmt(endDate)}
          </div>
        </div>
      )}
    </div>
  );
}
