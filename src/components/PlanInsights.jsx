import {
  Mountain, Snowflake, CloudRain, FileCheck, Sun, Waves, Route, Globe, Bug,
  ThermometerSun, Compass,
} from 'lucide-react';
import { deriveInsights } from '../engine/insights.js';

const ICONS = {
  Mountain, Snowflake, CloudRain, FileCheck, Sun, Waves, Route, Globe, Bug,
  ThermometerSun,
};

/**
 * Insights name their icon as a string so the engine stays free of UI imports.
 * The fallback matters: without it, adding a new insight with an unmapped icon
 * name renders `undefined` as a component and takes the whole results page
 * down — a copy change should never be able to do that.
 */
const iconFor = (name) => ICONS[name] || Compass;

export default function PlanInsights({ ctx }) {
  const insights = deriveInsights(ctx);
  if (!insights.length) return null;

  return (
    <section className="insights no-print" aria-labelledby="insights-h">
      <h2 className="eyebrow" id="insights-h">What shaped this list</h2>
      <div className="insight-grid">
        {insights.map(({ icon, title, body }) => {
          const Icon = iconFor(icon);
          return (
            <div className="insight" key={title}>
              <span className="insight-ico" aria-hidden="true"><Icon /></span>
              <div>
                <strong>{title}</strong>
                <p>{body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
