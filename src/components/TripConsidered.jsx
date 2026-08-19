import { Check, ShieldAlert } from 'lucide-react';
import { altitudeNotice } from '../engine/insights.js';
import { ACTIVITY_MAP } from '../data/activities.js';

/**
 * Makes the reasoning visible.
 *
 * The whole V1.1 change is that the plan is built from the entire journey, not
 * from the last place typed. That is worthless if the traveller cannot see it,
 * so this states plainly what was taken into account.
 */
export default function TripConsidered({ ctx }) {
  const { route } = ctx;
  const notice = altitudeNotice(ctx);
  const activities = ctx.activities.map((a) => ACTIVITY_MAP[a]?.label).filter(Boolean);

  const facts = [
    `${route.destinationCount} ${route.destinationCount === 1 ? 'destination' : 'destinations'}`,
    `${ctx.days} ${ctx.days === 1 ? 'day' : 'days'}`,
  ];
  if (route.destinationChanges > 0) {
    facts.push(`${route.destinationChanges} ${route.destinationChanges === 1 ? 'change' : 'changes'} of base`);
  }
  if (route.poiCount > 0) {
    facts.push(`${route.poiCount} ${route.poiCount === 1 ? 'sight' : 'sights'}`);
  }
  if (route.elevationRange >= 500) {
    facts.push(`${route.elevationRange.toLocaleString()} m of elevation change`);
  }

  return (
    <section className="considered no-print" aria-labelledby="considered-h">
      <div className="considered-main">
        <span className="considered-tick" aria-hidden="true"><Check /></span>
        <div>
          <h2 className="eyebrow" id="considered-h">Trip considered</h2>
          <p className="considered-route">{ctx.routeLabel}</p>
          <p className="considered-facts">{facts.join(' · ')}</p>
          <p className="considered-note">
            These recommendations were generated from your complete route
            {activities.length ? `, your ${activities.length === 1 ? 'activity' : 'activities'}` : ''},
            your travel dates and your packing style — not from the final destination alone.
          </p>
        </div>
      </div>

      {notice && (
        <div className="safety-note" role="note">
          <ShieldAlert aria-hidden="true" />
          <div>
            <strong>{notice.title}</strong>
            <p>{notice.body} {notice.action}</p>
          </div>
        </div>
      )}
    </section>
  );
}
