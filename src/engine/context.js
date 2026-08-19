/**
 * Trip context.
 *
 * Turns a route into the physical facts the rules reason about. Everything is
 * derived across the *whole* journey: the coldest night anywhere on the route,
 * the highest ground you stand on, the wettest stop, how much moving you do.
 * A rule asking "is it cold?" is asking about the trip, not the last stop.
 *
 * Rules should read from context, never from raw form fields.
 */

import { demandsOf, analysePlace } from '../data/activities.js';
import { destinationsOf, routeLabel } from '../data/trip.js';
import { analyseRoute, routeContrast } from './route.js';
import { classifyEnvironment } from './climate.js';
import { DESTINATIONS } from '../data/destinations.js';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const dayCount = (start, end) => {
  if (!start || !end) return 0;
  const a = new Date(start + 'T00:00:00');
  const b = new Date(end + 'T00:00:00');
  const nights = Math.round((b - a) / 86400000);
  return nights >= 0 ? nights + 1 : 0;
};

/** Months the trip touches, as 0-indexed month numbers. */
export function monthsSpanned(start, end) {
  if (!start || !end) return [];
  const a = new Date(start + 'T00:00:00');
  const b = new Date(end + 'T00:00:00');
  const out = new Set();
  const cur = new Date(a);
  let guard = 0;
  while (cur <= b && guard++ < 400) {
    out.add(cur.getMonth());
    cur.setDate(cur.getDate() + 1);
  }
  return [...out];
}

/** Temperature falls roughly 6.5 °C per 1,000 m of elevation gain. */
export const LAPSE_RATE = 6.5 / 1000;

export function tempAtAltitude(baseTemp, baseElevation, targetElevation) {
  const gain = Math.max(0, (targetElevation || 0) - (baseElevation || 0));
  return baseTemp - gain * LAPSE_RATE;
}

/**
 * Build the trip context.
 *
 * @param {object} trip            the route
 * @param {object[]} [stopClimates] per-stop observations from engine/weather.js
 */
export function buildContext(trip, stopClimates = null) {
  const days = dayCount(trip.startDate, trip.endDate) || 3;
  const nights = Math.max(0, days - 1);

  const months = monthsSpanned(trip.startDate, trip.endDate);
  const primaryMonth = months.length ? months[0] : new Date().getMonth();
  const monthLabel = months.length > 1
    ? `${MONTHS[months[0]].slice(0, 3)}–${MONTHS[months[months.length - 1]].slice(0, 3)}`
    : MONTHS[primaryMonth];

  const route = analyseRoute(trip, nights);
  const destinations = destinationsOf(trip);
  const primary = destinations[destinations.length - 1] || destinations[0] || null;

  /* ---- Climate across every stop ----------------------------------
     Readings for the origin are kept for reference but excluded from what we
     pack for — nobody packs for their own city. */
  const allClimates = (stopClimates || []).filter(Boolean);
  const byStop = new Map(allClimates.map((c) => [c.stopId, c]));
  const originId = trip.origin?.id;
  const climates = allClimates.filter((c) => c.stopId !== originId);

  // Fall back to a classification from geography alone when we have no reading.
  const stopEnvs = trip.stops
    .filter((s) => s.type === 'destination')
    .map((s) => byStop.get(s.id)?.environment
      || classifyEnvironment({ lat: s.latitude, elevation: s.elevation }));

  const haveReadings = climates.length > 0;
  const tempMin = haveReadings ? Math.min(...climates.map((c) => c.tempMin)) : 15;
  const tempMax = haveReadings ? Math.max(...climates.map((c) => c.tempMax)) : 25;

  const precipValues = climates
    .map((c) => c.precipMmPerDay)
    .filter((n) => typeof n === 'number');
  const precipMmPerDay = precipValues.length ? Math.max(...precipValues) : null;

  const contrast = routeContrast(climates);

  /* ---- Environment zones across the route ------------------------- */
  const zones = new Set();
  stopEnvs.forEach((e) => (e?.zones || []).forEach((z) => zones.add(z)));
  climates.forEach((c) => (c.environment?.zones || []).forEach((z) => zones.add(z)));

  const primaryEnv = byStop.get(primary?.id)?.environment
    || (primary ? classifyEnvironment({ lat: primary.latitude, elevation: primary.elevation }) : null);

  /* ---- Rain: driven by measured precipitation, not by the month ---- */
  const rainLikely = precipMmPerDay != null
    ? precipMmPerDay >= 2
    : zones.has('wet');
  const rainIntensity = !rainLikely ? 'none'
    : precipMmPerDay >= 12 ? 'extreme'
      : precipMmPerDay >= 5 ? 'heavy' : 'light';

  /* ---- Altitude --------------------------------------------------- */
  const baseElevation = primary?.elevation ?? route.minElevation ?? 0;
  const highPoint = route.maxElevation || baseElevation;
  const goesHigh = highPoint > baseElevation + 400;

  const highPointTempMin = goesHigh
    ? Math.round(tempAtAltitude(tempMin, baseElevation, highPoint))
    : tempMin;
  const highPointTempMax = goesHigh
    ? Math.round(tempAtAltitude(tempMax, baseElevation, highPoint))
    : tempMax;

  /* ---- Places and activities -------------------------------------- */
  const poiStops = trip.stops.filter((s) => s.type === 'point_of_interest');
  const places = poiStops.map((s) => {
    const analysed = analysePlace(s.name);
    return {
      ...analysed,
      stop: s,
      // Real geography beats keyword inference whenever we have it.
      altitude: s.elevation ?? analysed.altitude,
      permit: s.permit || analysed.signals.includes('permit-required'),
    };
  });

  const placeSignals = new Set();
  places.forEach((p) => p.signals.forEach((s) => placeSignals.add(s)));
  if (route.permitStops.length) placeSignals.add('permit-required');
  // Very high ground implies its own conditions regardless of the name typed.
  places.forEach((p) => {
    if ((p.altitude ?? 0) >= 4000) {
      placeSignals.add('extreme-altitude');
      placeSignals.add('intense-uv');
      placeSignals.add('wind-exposure');
    } else if ((p.altitude ?? 0) >= 3000) {
      placeSignals.add('high-altitude');
      placeSignals.add('intense-uv');
    }
  });

  const activities = trip.activities || [];
  const demands = demandsOf(activities);
  placeSignals.forEach((s) => demands.add(s));

  // The journey itself creates demands, the same way an activity does.
  if (route.intensity.id === 'high') {
    demands.add('frequent-transfers');
    demands.add('long-transit');
  } else if (route.intensity.id === 'moderate') {
    demands.add('some-transfers');
  }
  if (route.legs.some((l) => l.band?.id === 'full' || l.band?.id === 'long')) {
    demands.add('long-transit');
  }
  if (route.multiStop) demands.add('multi-base');

  /* ---- Traveller preferences -------------------------------------- */
  const style = trip.travelStyle || 'balanced';
  const luggage = trip.luggageType || 'suitcase';
  const notes = (trip.notes || '').toLowerCase();

  const noteSignals = {
    hatesWeight: /light|heavy|weight|minimal|less|lug|carry less/.test(notes),
    hasLaundry: /laundry|wash|washing machine/.test(notes),
    coldSensitive: /cold|freez|chilly|shiver/.test(notes),
    heatSensitive: /heat|hot|sweat|humid/.test(notes),
    medication: /medic|prescription|tablet|insulin|inhaler|asthma|diabet/.test(notes),
    photography: /camera|photo|lens|dslr|mirrorless/.test(notes),
    contactLenses: /contact lens|lenses|spectacles|glasses/.test(notes),
    period: /period|menstru|tampon|pad/.test(notes),
  };

  const laundryAvailable = noteSignals.hasLaundry || days >= 8;
  const wearDays = laundryAvailable ? Math.min(days, 7) : days;

  const countries = new Set(
    [trip.origin, ...trip.stops].map((s) => s?.country).filter(Boolean)
  );
  const originCountry = trip.origin?.country || null;
  const international = [...countries].some((c) => originCountry && c !== originCountry)
    || (!originCountry && countries.size > 1);
  const foreignCountry = [...countries].find((c) => c !== originCountry) || null;

  /* ---- Curated profile knowledge ----------------------------------
     Where a stop matches a destination we have researched, its practical tags
     (steep streets, temple etiquette, patchy signal) still apply. */
  const profileTags = new Set();
  const profileNotes = [];
  for (const stop of [trip.origin, ...trip.stops].filter(Boolean)) {
    if (!stop.profileId) continue;
    const profile = DESTINATIONS.find((d) => d.id === stop.profileId);
    if (!profile) continue;
    (profile.tags || []).forEach((t) => profileTags.add(t));
    (profile.terrain || []).forEach((t) => profileTags.add(t));
    (profile.notes || []).forEach((n) => profileNotes.push({ stop: stop.name, note: n }));
    if (profile.permits) placeSignals.add('permit-required');
  }

  /* ---- Terrain ---------------------------------------------------- */
  const terrain = new Set();
  zones.forEach((z) => {
    if (z === 'mountain' || z === 'high-altitude' || z === 'cold-desert') terrain.add('mountain');
    if (z === 'coastal') terrain.add('coastal');
    if (z === 'desert') terrain.add('desert');
    if (z === 'tropical') terrain.add('tropical');
  });
  profileTags.forEach((t) => {
    if (['beach', 'coastal', 'mountain', 'desert', 'forest', 'island', 'urban',
      'river', 'backwater', 'hill-station', 'tea-country'].includes(t)) terrain.add(t);
  });
  trip.stops.forEach((s) => {
    if (s.kind === 'beach') { terrain.add('beach'); terrain.add('coastal'); }
    if (['mountain', 'peak', 'pass', 'glacier'].includes(s.kind)) terrain.add('mountain');
    if (s.kind === 'island') { terrain.add('island'); terrain.add('coastal'); }
    if (s.kind === 'park') terrain.add('forest');
  });

  const thermal = tempMin <= 0 ? 'freezing'
    : tempMin <= 8 ? 'cold'
      : tempMax <= 20 ? 'cool'
        : tempMax <= 28 ? 'mild'
          : tempMax <= 35 ? 'warm' : 'hot';

  return {
    trip,
    route,
    contrast,

    destinations,
    primary,
    destinationName: primary?.name || 'your destination',
    destinationLabel: primary?.label || primary?.name || 'your destination',
    origin: trip.origin?.name || '',
    routeLabel: routeLabel(trip),

    days,
    nights,
    wearDays,
    laundryAvailable,
    months,
    primaryMonth,
    monthLabel,

    tempMin,
    tempMax,
    thermal,
    season: thermal,
    precipMmPerDay,
    climates,
    climateByStop: byStop,
    haveReadings,
    tempSource: climates[0]?.source || 'estimated',

    zones,
    environment: primaryEnv,

    baseElevation,
    highPoint,
    goesHigh,
    highPointTempMin,
    highPointTempMax,

    rainLikely,
    rainIntensity,

    activities,
    demands,
    places,
    placeNames: places.map((p) => p.name),
    placeSignals,

    style,
    luggage,
    notes: trip.notes || '',
    noteSignals,
    international,
    foreignCountry,

    terrain,
    profileTags,
    profileNotes,
    // Zones and researched tags together, so a rule can ask about either.
    tags: new Set([...zones, ...profileTags]),
    intensity: route.intensity.id,
  };
}

/* ---------------- Small helpers rules use constantly ---------------- */

export const has = (set, key) => (set instanceof Set ? set.has(key) : !!set?.[key]);
export const anyOf = (set, ...keys) => keys.some((k) => has(set, k));
export const tempRange = (min, max) => `${Math.round(min)}° to ${Math.round(max)}°C`;
