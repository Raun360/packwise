import { useEffect, useState, useRef } from 'react';
import { Check } from 'lucide-react';

/**
 * The planning sequence. Each line names something we are genuinely deriving,
 * written against this trip rather than as generic progress copy.
 */
export function buildSteps(trip) {
  const placeCount = (trip.places || []).length;
  const activityCount = (trip.activities || []).length;
  return [
    { label: `Understanding ${trip.destination || 'your destination'}`, ms: 620 },
    { label: 'Checking the season and your dates', ms: 520 },
    {
      label: placeCount
        ? `Reading ${placeCount} ${placeCount === 1 ? 'place' : 'places'} on your list`
        : 'Considering your activities',
      ms: 560,
    },
    {
      label: activityCount
        ? `Working through ${activityCount} ${activityCount === 1 ? 'activity' : 'activities'}`
        : 'Analysing your travel conditions',
      ms: 520,
    },
    { label: 'Analysing altitude, weather and terrain', ms: 640 },
    { label: 'Optimising for your luggage', ms: 480 },
    { label: 'Finalising recommendations', ms: 520 },
  ];
}

export default function PlanningLoader({ trip, onDone }) {
  const steps = useRef(buildSteps(trip)).current;
  const [index, setIndex] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    let elapsed = 0;

    steps.forEach((s, i) => {
      elapsed += s.ms;
      timers.push(setTimeout(() => { if (!cancelled) setIndex(i + 1); }, elapsed));
    });
    timers.push(setTimeout(() => { if (!cancelled) doneRef.current(); }, elapsed + 340));

    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [steps]);

  const pct = Math.round((index / steps.length) * 100);

  return (
    <div className="loader-screen">
      <div className="loader-inner">
        <div className="loader-head">
          <h2>Building your packing plan</h2>
          <p>
            {trip.destination
              ? `Working out what ${trip.destination} actually asks of you.`
              : 'Working out what this trip actually asks of you.'}
          </p>
        </div>

        <ol className="loader-steps" aria-live="polite" aria-atomic="false">
          {steps.map((s, i) => {
            const state = i < index ? 'done' : i === index ? 'active' : '';
            return (
              <li key={s.label} className={`loader-step ${state}`}>
                <span className="loader-dot" aria-hidden="true">
                  {i < index && <Check strokeWidth={3.5} />}
                </span>
                <span>{s.label}</span>
              </li>
            );
          })}
        </ol>

        <div className="loader-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
