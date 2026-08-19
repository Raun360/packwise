/**
 * Route analysis.
 *
 * Turns an ordered list of stops into the facts about the journey itself:
 * how far, how many transfers, how much the ground rises and falls, how
 * different the stops are from each other, and how hard the whole thing is
 * on the traveller.
 *
 * Travel intensity is the headline output. A week in one place and a week
 * across four places need different bags even when the weather is identical.
 */

import { roadDistance, legBand, legEffort, haversine } from './geocode.js';
import { destinationsOf, poisFor, distributeNights } from '../data/trip.js';

export const INTENSITY = {
  low: {
    id: 'low',
    label: 'Low',
    blurb: 'Mostly staying in one place.',
    detail: 'You unpack once, so a little bulk costs you nothing.',
  },
  moderate: {
    id: 'moderate',
    label: 'Moderate',
    blurb: 'A few changes of base.',
    detail: 'Worth keeping the bag tidy and the essentials near the top.',
  },
  high: {
    id: 'high',
    label: 'High',
    blurb: 'Frequent transfers and long travel days.',
    detail: 'Every item gets carried, loaded and unloaded repeatedly — versatility beats variety.',
  },
};

/**
 * @param {object} trip
 * @param {number} totalNights
 * @returns {object} route analysis
 */
export function analyseRoute(trip, totalNights) {
  const destinations = destinationsOf(trip);
  const nightsByStop = distributeNights(trip, totalNights);

  destinations.forEach((d) => { d._nights = nightsByStop.get(d.id) ?? 0; });

  /* ---- Legs ---- */
  const waypoints = [];
  if (trip.origin) waypoints.push({ stop: trip.origin, role: 'origin' });
  destinations.forEach((d) => waypoints.push({ stop: d, role: 'destination' }));
  if (trip.returnToOrigin && trip.origin && destinations.length) {
    waypoints.push({ stop: trip.origin, role: 'return' });
  }

  const legs = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const hasCoords = from.stop.latitude != null && to.stop.latitude != null;
    legs.push({
      from: from.stop,
      to: to.stop,
      // Legs between two bases are the ones that define travel intensity;
      // getting there and home again is unavoidable on any trip.
      inter: from.role === 'destination' && to.role === 'destination',
      km: hasCoords ? roadDistance(from.stop, to.stop) : null,
      straightKm: hasCoords ? Math.round(haversine(from.stop, to.stop)) : null,
      band: hasCoords ? legBand(from.stop, to.stop) : null,
      effort: hasCoords ? legEffort(from.stop, to.stop) : 0.5,
      climb: (to.stop.elevation ?? 0) - (from.stop.elevation ?? 0),
    });
  }

  const interLegs = legs.filter((l) => l.inter);
  const knownKm = legs.filter((l) => typeof l.km === 'number');
  const totalKm = knownKm.reduce((sum, l) => sum + l.km, 0);
  const interEffort = interLegs.reduce((sum, l) => sum + l.effort, 0);

  /* ---- Elevation across everything the traveller will stand on ----
     The origin is deliberately excluded: you do not pack for the city you
     live in, and including it makes every trip look like a climate swing. */
  const allStops = [...trip.stops];
  const elevations = allStops
    .map((s) => s.elevation)
    .filter((e) => typeof e === 'number');

  const minElevation = elevations.length ? Math.min(...elevations) : 0;
  const maxElevation = elevations.length ? Math.max(...elevations) : 0;
  const elevationRange = maxElevation - minElevation;

  const highest = allStops.reduce(
    (best, s) => ((s.elevation ?? -1) > (best?.elevation ?? -1) ? s : best),
    null
  );

  /* ---- Travel days: roughly how much of the trip is spent moving ---- */
  const bandDays = { short: 0.25, half: 0.5, long: 0.8, full: 1, flight: 1 };
  const travelDays = Math.round(
    legs.reduce((sum, l) => sum + (l.band ? bandDays[l.band.id] : 0.5), 0) * 10
  ) / 10;

  const destinationChanges = Math.max(0, destinations.length - 1);
  const days = Math.max(1, totalNights + 1);

  /* ---- Intensity ---- */
  let score = 0;
  score += destinationChanges * 1.4;
  score += interEffort * 1.6;
  score += (destinationChanges / days) * 3;
  if (elevationRange >= 2000) score += 1;
  if (interLegs.some((l) => l.band?.id === 'full')) score += 1;
  // A single base with very short stays still churns if the trip is short.
  if (destinations.some((d) => d._nights === 1) && destinationChanges >= 2) score += 0.6;

  const intensityId = destinations.length <= 1 || score < 1.5 ? 'low'
    : score < 4.5 ? 'moderate' : 'high';

  /* ---- Points of interest ---- */
  const poiCount = trip.stops.filter((s) => s.type === 'point_of_interest').length;
  const highPois = trip.stops.filter(
    (s) => s.type === 'point_of_interest' && (s.elevation ?? 0) >= 3000
  );
  const permitStops = allStops.filter((s) => s.permit);
  const originElevation = trip.origin?.elevation ?? null;

  return {
    destinations: destinations.map((d) => ({
      ...d,
      nights: nightsByStop.get(d.id) ?? 0,
      pois: poisFor(trip, d.id),
    })),
    waypoints,
    legs,
    interLegs,
    destinationCount: destinations.length,
    destinationChanges,
    poiCount,
    highPois,
    permitStops,

    totalKm: totalKm || null,
    longestLeg: knownKm.length
      ? knownKm.reduce((a, b) => (b.km > a.km ? b : a), knownKm[0])
      : null,
    travelDays,
    days,

    minElevation,
    maxElevation,
    elevationRange,
    highest,
    originElevation,
    /** Climb from home to the highest point you will stand on. */
    ascentFromOrigin: originElevation == null ? null : maxElevation - originElevation,

    intensity: INTENSITY[intensityId],
    intensityScore: Math.round(score * 10) / 10,

    multiStop: destinations.length > 1,
  };
}

/**
 * How different the stops are from one another. A route that stays in one
 * climate can pack for that climate; one that swings 20 °C cannot.
 */
export function routeContrast(stopClimates) {
  const valid = (stopClimates || []).filter(Boolean);
  if (valid.length < 2) return null;

  const mins = valid.map((c) => c.tempMin);
  const maxs = valid.map((c) => c.tempMax);
  const coldest = valid.reduce((a, b) => (b.tempMin < a.tempMin ? b : a), valid[0]);
  const hottest = valid.reduce((a, b) => (b.tempMax > a.tempMax ? b : a), valid[0]);
  const wettest = valid.reduce(
    (a, b) => ((b.precipMmPerDay ?? -1) > (a.precipMmPerDay ?? -1) ? b : a), valid[0]
  );

  const zones = new Set();
  valid.forEach((c) => zones.add(c.environment?.primary));

  return {
    tempSpread: Math.max(...maxs) - Math.min(...mins),
    coldest,
    hottest,
    wettest,
    zones: [...zones].filter(Boolean),
    /** True when the route crosses genuinely different environments. */
    mixedEnvironments: zones.size > 1,
  };
}
