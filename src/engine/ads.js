import { ADS, SAMPLE_ADS } from '../data/ads.js';

// Sample partners show on the local dev server only, never in production.
const POOL = import.meta.env.DEV ? [...ADS, ...SAMPLE_ADS] : ADS;

const norm = (s) => (s || '').toLowerCase();

/** Everything the trip says about where it goes, as one searchable string. */
function placeText(trip) {
  return (trip.stops || [])
    .flatMap((s) => [s.name, s.region, s.country])
    .map(norm)
    .join(' | ');
}

/**
 * Pick the sponsored cards for a trip: up to `limit`, most specific first.
 * A destination match outranks an activity-only match. Returns an empty
 * list when no partner matches, and the page then shows no ad at all.
 */
export function matchAds(ctx, limit = 3) {
  const trip = ctx.trip;
  const text = placeText(trip);
  const acts = new Set(ctx.activities || []);

  const scored = [];
  for (const ad of POOL) {
    const placeHit = (ad.places || []).some((p) => text.includes(norm(p)));
    const actHit = (ad.activities || []).some((a) => acts.has(a));
    if (!placeHit && !actHit) continue;
    // A place-restricted ad should not show on an activity match alone.
    if ((ad.places || []).length && !placeHit) continue;
    scored.push({ ad, score: (placeHit ? 2 : 0) + (actHit ? 1 : 0) });
  }
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.ad);
}
