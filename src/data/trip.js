/**
 * Trip model.
 *
 * A trip is a route, not a destination. `stops` holds the whole journey in
 * order, and each stop declares whether it is somewhere you stay or somewhere
 * you visit from a stay. That distinction is the difference between "I am
 * going to Gangtok and Tsomgo Lake" (one base, one day trip) and "I am going
 * to Darjeeling then Pelling then Gangtok" (three bases, two transfers) —
 * journeys that need quite different bags.
 */

import { defaultStopType } from '../engine/geocode.js';

export const STOP_TYPES = {
  destination: {
    id: 'destination',
    label: 'Staying here',
    hint: 'Somewhere you sleep on this trip',
  },
  point_of_interest: {
    id: 'point_of_interest',
    label: 'Visiting from a base',
    hint: 'A day trip or sight, not an overnight stop',
  },
};

let seq = 0;
const nextId = () => `s${Date.now().toString(36)}${(seq++).toString(36)}`;

/**
 * Build a stop from a place-search result.
 *
 * @param {object} place  a result from engine/geocode.js
 * @param {object} [opts] { type, parentId, nights }
 */
export function createStop(place, opts = {}) {
  return {
    id: nextId(),
    placeId: place.id || null,
    name: place.name,
    label: place.label || place.name,
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    elevation: place.elevation ?? null,
    region: place.region ?? null,
    country: place.country ?? null,
    kind: place.kind || 'town',
    profileId: place.profileId || null,
    permit: !!place.permit,

    type: opts.type || defaultStopType(place.kind),
    /** For a point of interest: the destination it is visited from. */
    parentId: opts.parentId ?? null,

    nights: opts.nights ?? null,
    arrivalDate: null,
    departureDate: null,
    activities: [],
  };
}

/** A stop for a place we could not geocode — free text, no coordinates. */
export function createTextStop(name, opts = {}) {
  return createStop(
    { id: null, name: name.trim(), label: name.trim(), kind: opts.kind || 'town' },
    opts
  );
}

/**
 * A fresh empty trip.
 *
 * This has to be a factory. A shared constant hands every caller the same
 * `stops` and `activities` arrays, so one trip's stops end up appended to the
 * next one's — a bug that only shows itself on the second trip of a session.
 */
export const createEmptyTrip = () => ({
  origin: null,          // a stop-shaped object, or null
  stops: [],             // ordered: destinations and their points of interest
  startDate: '',
  endDate: '',
  activities: [],
  travelStyle: 'balanced',
  luggageType: 'suitcase',
  notes: '',
  returnToOrigin: true,
});

/** Frozen reference copy. Never spread this to build a trip — call the factory. */
export const EMPTY_TRIP = Object.freeze(createEmptyTrip());

/* ------------------------------------------------------------------ */
/*  Selectors                                                          */
/* ------------------------------------------------------------------ */

export const destinationsOf = (trip) =>
  (trip.stops || []).filter((s) => s.type === 'destination');

export const poisOf = (trip) =>
  (trip.stops || []).filter((s) => s.type === 'point_of_interest');

/** Points of interest attached to a given destination. */
export const poisFor = (trip, destinationId) =>
  poisOf(trip).filter((p) => p.parentId === destinationId);

/** Points of interest with no valid parent — treated as belonging to the first stay. */
export function orphanPois(trip) {
  const ids = new Set(destinationsOf(trip).map((d) => d.id));
  return poisOf(trip).filter((p) => !p.parentId || !ids.has(p.parentId));
}

/**
 * Nights at each destination. Explicit values win; anything unset shares the
 * remaining nights evenly, with the remainder going to the earlier stops.
 */
export function distributeNights(trip, totalNights) {
  const dests = destinationsOf(trip);
  if (!dests.length) return new Map();

  const out = new Map();
  let assigned = 0;
  const unset = [];

  for (const d of dests) {
    if (typeof d.nights === 'number' && d.nights >= 0) {
      out.set(d.id, d.nights);
      assigned += d.nights;
    } else {
      unset.push(d);
    }
  }

  const remaining = Math.max(0, (totalNights || 0) - assigned);
  if (unset.length) {
    const base = Math.floor(remaining / unset.length);
    let extra = remaining - base * unset.length;
    for (const d of unset) {
      out.set(d.id, base + (extra-- > 0 ? 1 : 0));
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Mutations (pure — always return a new trip)                        */
/* ------------------------------------------------------------------ */

export const addStop = (trip, stop) => ({ ...trip, stops: [...trip.stops, stop] });

export const removeStop = (trip, id) => ({
  ...trip,
  // Removing a base takes its day trips with it, which is what the route implies.
  stops: trip.stops.filter((s) => s.id !== id && s.parentId !== id),
});

export const updateStop = (trip, id, patch) => ({
  ...trip,
  stops: trip.stops.map((s) => (s.id === id ? { ...s, ...patch } : s)),
});

/** Move a destination within the route, carrying its points of interest along. */
export function moveDestination(trip, id, direction) {
  const dests = destinationsOf(trip);
  const idx = dests.findIndex((d) => d.id === id);
  const target = idx + direction;
  if (idx < 0 || target < 0 || target >= dests.length) return trip;

  const order = dests.map((d) => d.id);
  [order[idx], order[target]] = [order[target], order[idx]];

  const rebuilt = [];
  for (const destId of order) {
    rebuilt.push(trip.stops.find((s) => s.id === destId));
    rebuilt.push(...poisFor(trip, destId));
  }
  // Anything unattached keeps its place at the end.
  const placed = new Set(rebuilt.map((s) => s.id));
  rebuilt.push(...trip.stops.filter((s) => !placed.has(s.id)));

  return { ...trip, stops: rebuilt };
}

/* ------------------------------------------------------------------ */
/*  Migration                                                          */
/* ------------------------------------------------------------------ */

/**
 * Upgrade a saved V1 trip (single `destination` string plus `places[]`) into
 * the route model, so an in-progress list is not lost on update.
 */
export function migrateTrip(saved) {
  if (!saved) return null;
  if (Array.isArray(saved.stops)) return { ...createEmptyTrip(), ...saved };

  const trip = createEmptyTrip();
  trip.startDate = saved.startDate || '';
  trip.endDate = saved.endDate || '';
  trip.activities = saved.activities || [];
  trip.travelStyle = saved.travelStyle || 'balanced';
  trip.luggageType = saved.luggageType || 'suitcase';
  trip.notes = saved.notes || '';

  if (saved.origin) trip.origin = createTextStop(saved.origin, { type: 'destination' });

  if (saved.destination) {
    const dest = createTextStop(saved.destination, { type: 'destination' });
    trip.stops.push(dest);
    for (const place of saved.places || []) {
      trip.stops.push(createTextStop(place, {
        type: 'point_of_interest',
        parentId: dest.id,
      }));
    }
  }
  return trip;
}

/** Short "Kolkata → Darjeeling → Gangtok" summary of the route. */
export function routeLabel(trip, { includeReturn = false } = {}) {
  const names = [];
  if (trip.origin) names.push(trip.origin.name);
  destinationsOf(trip).forEach((d) => names.push(d.name));
  if (includeReturn && trip.returnToOrigin && trip.origin) names.push(trip.origin.name);
  return names.join(' → ');
}
