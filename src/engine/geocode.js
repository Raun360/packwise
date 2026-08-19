/**
 * Place search.
 *
 * Real geographic lookup via Open-Meteo's geocoding service (no API key).
 * Results carry coordinates, elevation, region and country — the facts that
 * distance, altitude and climate reasoning all depend on. A typed string is
 * never enough: "Pelling" has to become 27.30 N, 88.24 E at 2,150 m before we
 * can say anything useful about it.
 *
 * Curated profiles are merged in ahead of remote hits so the destinations we
 * know well keep their richer data, and so search still works offline.
 */

import { DESTINATIONS } from '../data/destinations.js';
import { CURATED_PLACES } from '../data/places.js';

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const TIMEOUT_MS = 5000;

const cache = new Map();

/* ------------------------------------------------------------------ */
/*  Feature classification                                             */
/* ------------------------------------------------------------------ */

/**
 * GeoNames feature codes, grouped into the handful of kinds that actually
 * change how we treat a place. Populated places are somewhere you stay;
 * lakes, passes and peaks are somewhere you go for the day.
 */
const FEATURE_KIND = {
  PPLC: 'city', PPLA: 'city', PPLA2: 'city', PPLA3: 'city', PPLA4: 'city',
  PPL: 'town', PPLX: 'town', PPLL: 'village', PPLS: 'town', PPLW: 'town',
  ADM1: 'region', ADM2: 'region', ADM3: 'region', ADMD: 'region',
  ISL: 'island', ISLS: 'island',
  LK: 'lake', LKS: 'lake', RSV: 'lake',
  MT: 'mountain', PK: 'peak', PASS: 'pass', VAL: 'valley', RDGE: 'mountain',
  GLCR: 'glacier',
  BCH: 'beach', CAPE: 'coast', BAY: 'coast',
  PRK: 'park', RESN: 'park', RESF: 'park',
  TMPL: 'landmark', MSQE: 'landmark', CH: 'landmark', MSTY: 'landmark',
  FT: 'landmark', PAL: 'landmark', CSTL: 'landmark', ANS: 'landmark',
  WTRF: 'waterfall', CAVE: 'cave', SPNG: 'spring',
  AIRP: 'transit', RSTN: 'transit',
};

/** Kinds you would normally stay in, versus visit from somewhere else. */
const STAYABLE = new Set(['city', 'town', 'village', 'region', 'island']);

export const kindLabel = (kind) => ({
  city: 'City', town: 'Town', village: 'Village', region: 'Region',
  island: 'Island', lake: 'Lake', mountain: 'Mountain', peak: 'Peak',
  pass: 'Mountain pass', valley: 'Valley', glacier: 'Glacier', beach: 'Beach',
  coast: 'Coast', park: 'National park', landmark: 'Landmark',
  waterfall: 'Waterfall', cave: 'Cave', spring: 'Hot spring', transit: 'Transport hub',
}[kind] || 'Place');

/** What a place should default to when the traveller adds it. */
export const defaultStopType = (kind) =>
  STAYABLE.has(kind) ? 'destination' : 'point_of_interest';

/* ------------------------------------------------------------------ */
/*  Normalisation                                                      */
/* ------------------------------------------------------------------ */

/** A single shape for search results, whether curated or geocoded. */
function makeResult({
  id, name, latitude, longitude, elevation, region, country, countryCode,
  kind, profileId, source, population, permit,
}) {
  return {
    id,
    name,
    latitude: typeof latitude === 'number' ? latitude : null,
    longitude: typeof longitude === 'number' ? longitude : null,
    elevation: typeof elevation === 'number' ? Math.round(elevation) : null,
    region: region || null,
    country: country || null,
    countryCode: countryCode || null,
    kind: kind || 'town',
    profileId: profileId || null,
    source,
    population: population || 0,
    permit: !!permit,
    /** Human label: "Pelling, Sikkim, India" */
    label: [name, region, country].filter(Boolean).join(', '),
  };
}

/** Curated destination → search result. */
export function curatedToResult(d) {
  return makeResult({
    id: `curated:${d.id}`,
    name: d.name,
    latitude: d.lat,
    longitude: d.lon,
    elevation: d.elevation,
    region: d.region,
    country: d.country,
    kind: d.terrain?.includes('beach') ? 'beach' : 'city',
    profileId: d.id,
    source: 'curated',
    population: 1e6, // curated places sort first
  });
}

function remoteToResult(r) {
  const kind = FEATURE_KIND[r.feature_code] || 'town';
  return makeResult({
    id: `geo:${r.id}`,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    elevation: r.elevation,
    region: r.admin1,
    country: r.country,
    countryCode: r.country_code,
    kind,
    source: 'geocode',
    population: r.population || 0,
  });
}

const norm = (s) => (s || '').toLowerCase().trim();

/**
 * How well a place name answers the query. Relevance has to dominate
 * population, or "Pelling" returns Pellingen in Germany before the town in
 * Sikkim, and "Kaza" returns Kazan in Tatarstan before the village in Spiti.
 */
export function nameScore(name, query) {
  const h = norm(name);
  const q = norm(query);
  if (!h || !q) return 0;
  if (h === q) return 100;
  if (h.startsWith(q + ' ') || h.startsWith(q + ',')) return 92;
  if (h.startsWith(q)) return 78;
  if (q.startsWith(h) && h.length >= 4) return 70;
  if (h.includes(' ' + q)) return 60;
  if (h.includes(q) && q.length >= 3) return 45;
  return 0;
}

/** Best score across a place's name and its aliases. */
const bestScore = (names, query) =>
  names.filter(Boolean).reduce((best, n) => Math.max(best, nameScore(n, query)), 0);

function gazetteerToResult(g) {
  return makeResult({
    id: `place:${norm(g.name).replace(/\W+/g, '-')}`,
    name: g.name,
    latitude: g.lat,
    longitude: g.lon,
    elevation: g.elevation,
    region: g.region,
    country: g.country,
    kind: g.kind,
    source: 'curated',
    permit: g.permit,
  });
}

/** Curated destinations and gazetteer entries matching the query. */
function curatedMatches(query, limit = 5) {
  const scored = [];

  for (const d of DESTINATIONS) {
    const score = bestScore([d.name, ...(d.aliases || [])], query)
      || bestScore([d.region], query) * 0.6;
    if (score) scored.push({ score: score + 6, result: curatedToResult(d) });
  }

  for (const g of CURATED_PLACES) {
    const score = bestScore([g.name, ...(g.aliases || [])], query);
    if (score) scored.push({ score, result: gazetteerToResult(g) });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => ({ ...x.result, _score: x.score }));
}

/* ------------------------------------------------------------------ */
/*  Search                                                             */
/* ------------------------------------------------------------------ */

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

/**
 * Search for a place.
 *
 * Never throws. If the network is unavailable the curated set still answers,
 * and `remote: false` lets the UI say so honestly.
 *
 * @returns {Promise<{results: object[], remote: boolean}>}
 */
export async function searchPlaces(query, { limit = 7, signal } = {}) {
  const q = (query || '').trim();
  if (q.length < 2) return { results: [], remote: true };

  const key = norm(q);
  if (cache.has(key)) return cache.get(key);

  const curated = curatedMatches(q);
  let remoteResults = [];
  let remote = true;

  const fetchRemote = async (term) => {
    const url = `${GEOCODE_URL}?name=${encodeURIComponent(term)}&count=10&language=en&format=json`;
    const res = await withTimeout(fetch(url, { signal }), TIMEOUT_MS);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return (data?.results || []).map(remoteToResult);
  };

  try {
    if (typeof fetch !== 'function') throw new Error('unsupported');
    remoteResults = await fetchRemote(q);

    // Geocoders index single tokens far better than phrases: "Tsomgo Lake"
    // returns nothing where "Tsomgo" resolves. Retry on the leading words.
    const words = q.split(/\s+/);
    if (!remoteResults.length && words.length > 1) {
      remoteResults = await fetchRemote(words.slice(0, -1).join(' '));
    }
  } catch {
    remote = false;
  }

  // Drop remote duplicates of curated entries — same name within ~25 km.
  const deduped = remoteResults.filter((r) => !curated.some((c) =>
    norm(c.name) === norm(r.name)
    && (c.latitude == null || r.latitude == null || haversine(c, r) < 25)
  ));

  /**
   * Rank on how well the name answers the query first. Population only breaks
   * ties between comparably good matches, and somewhere you can stay outranks
   * a landmark of the same name.
   */
  const rank = (r) => {
    const relevance = r._score ?? bestScore([r.name], q);
    const popBonus = Math.min(8, Math.log10((r.population || 0) + 1) * 1.6);
    const stayBonus = STAYABLE.has(r.kind) ? 3 : 0;
    // Places in the gazetteer are there because travellers go to them, which
    // is a better signal for this product than raw population.
    const travelBonus = r.source === 'curated' ? 12 : 0;
    return relevance + popBonus + stayBonus + travelBonus;
  };

  const merged = [...curated, ...deduped]
    .sort((a, b) => rank(b) - rank(a))
    .slice(0, limit)
    .map(({ _score, ...r }) => r);

  const out = { results: merged, remote };
  if (out.results.length) cache.set(key, out);
  return out;
}

/* ------------------------------------------------------------------ */
/*  Geometry                                                           */
/* ------------------------------------------------------------------ */

const R_EARTH = 6371; // km
const rad = (d) => (d * Math.PI) / 180;

/** Great-circle distance in km between two {latitude, longitude} points. */
export function haversine(a, b) {
  if (!a || !b) return 0;
  const lat1 = a.latitude ?? a.lat;
  const lon1 = a.longitude ?? a.lon;
  const lat2 = b.latitude ?? b.lat;
  const lon2 = b.longitude ?? b.lon;
  if ([lat1, lon1, lat2, lon2].some((n) => typeof n !== 'number')) return 0;

  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Straight-line distance under-states road distance badly in mountains, where
 * the road switchbacks for every kilometre gained. This is a rough correction,
 * used only to describe a journey — never presented as an exact figure.
 */
/**
 * Approximate road distance in km.
 *
 * Straight-line distance understates driving badly in mountains and barely at
 * all on a highway, and the gap closes as legs get longer: a 30 km hop across
 * Sikkim ridges is 70 km of road, while Kolkata to Darjeeling is 570 km apart
 * and 620 km of driving. The correction therefore decays with distance.
 *
 * This is an estimate for describing a journey, never presented as exact.
 */
export function roadDistance(a, b) {
  const straight = haversine(a, b);
  if (!straight) return 0;

  const hi = Math.max(a.elevation || 0, b.elevation || 0);
  const climb = Math.abs((b.elevation || 0) - (a.elevation || 0));

  const roughness = hi > 1800 || climb > 1200 ? 1.5
    : hi > 900 || climb > 500 ? 0.8
      : 0.35;

  const factor = 1.1 + roughness * Math.exp(-straight / 150);
  return Math.round(straight * factor);
}

/**
 * Travel burden for one leg, as a coarse band. Bands rather than hours,
 * because an hours figure implies a precision we do not have — and because
 * "most of a day on the road" is what actually changes your packing.
 */
/** Beyond this, people fly rather than drive. */
const FLIGHT_THRESHOLD_KM = 1200;

export function legBand(a, b) {
  const straight = haversine(a, b);

  // Long legs, and any leg crossing to a different country far away, are
  // flights. Describing those in road terms is simply wrong.
  if (straight > FLIGHT_THRESHOLD_KM) {
    return { id: 'flight', label: 'a flight', hours: null, mode: 'air' };
  }

  const km = roadDistance(a, b);
  const hi = Math.max(a.elevation || 0, b.elevation || 0);
  // Mountain roads move at roughly half the pace of a highway.
  const effectiveKm = km * (hi > 3000 ? 2.1 : hi > 1800 ? 1.7 : hi > 900 ? 1.3 : 1);

  if (effectiveKm < 90) return { id: 'short', label: 'a short hop', hours: '1–2 hours', mode: 'road' };
  if (effectiveKm < 220) return { id: 'half', label: 'half a day', hours: '3–5 hours', mode: 'road' };
  if (effectiveKm < 480) return { id: 'long', label: 'most of a day', hours: '6–9 hours', mode: 'road' };
  return { id: 'full', label: 'a full travel day', hours: '10+ hours', mode: 'road' };
}

/** Burden score 0–1, used when classifying overall travel intensity. */
export function legEffort(a, b) {
  const band = legBand(a, b).id;
  return { short: 0.25, half: 0.5, long: 0.8, full: 1, flight: 0.9 }[band] ?? 0.5;
}
